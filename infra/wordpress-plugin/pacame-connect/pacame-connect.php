<?php
/**
 * Plugin Name: PACAME Connect
 * Description: Endpoints REST custom para que PACAME (https://pacameagencia.com) pueda gestionar el WP del cliente: cachés, plugins, temas, logs, backups, queries seguras. Auth HMAC compartido con el dashboard PACAME.
 * Version: 0.1.0
 * Author: PACAME Agencia
 * Author URI: https://pacameagencia.com
 *
 * Instalación: subir esta carpeta a wp-content/mu-plugins/ por SFTP/FTP.
 * El cliente NO ve este plugin en el listado de plugins (es Must-Use).
 *
 * Configuración: añadir al wp-config.php (justo antes de "/* That's all, stop editing!" *‌/):
 *   define('PACAME_WEBHOOK_SECRET', 'el-mismo-secret-que-en-client_websites.webhook_secret');
 *
 * Endpoints expuestos bajo /wp-json/pacame/v1/:
 *   POST  /cache/clear           → flush W3TC, WP Rocket, WP Super Cache, LiteSpeed, transients
 *   GET   /system/info           → versiones WP/PHP/server, plugins activos, temas
 *   GET   /logs/php              → últimas N líneas de error_log (max 200)
 *   POST  /plugins/{slug}/state  → activate|deactivate|update (body: {action})
 *   GET   /plugins               → lista plugins instalados con estado
 *   POST  /db/query              → SELECT-only, prepared, max 100 rows
 *   POST  /backup/run            → dispara UpdraftPlus si está activo, devuelve job_id
 *   POST  /webhooks/lead         → relé de form submissions (CF7, Gravity, Elementor, WPForms)
 *
 * Auth (todas las llamadas):
 *   Header X-PACAME-Signature: hex(hmac_sha256(timestamp + ":" + path + ":" + body, PACAME_WEBHOOK_SECRET))
 *   Header X-PACAME-Timestamp: unix seconds (anti-replay window 5 min)
 */

if (!defined('ABSPATH')) {
    exit;
}

const PACAME_NS = 'pacame/v1';
const PACAME_REPLAY_WINDOW = 300; // 5 minutos

// =============================================================================
//  AUTH HMAC
// =============================================================================

function pacame_get_secret() {
    if (defined('PACAME_WEBHOOK_SECRET') && PACAME_WEBHOOK_SECRET) {
        return PACAME_WEBHOOK_SECRET;
    }
    return get_option('pacame_webhook_secret', '');
}

function pacame_verify_hmac(WP_REST_Request $request) {
    $secret = pacame_get_secret();
    if (empty($secret)) {
        return new WP_Error('pacame_no_secret', 'PACAME_WEBHOOK_SECRET not configured', ['status' => 500]);
    }

    $timestamp = $request->get_header('x-pacame-timestamp');
    $signature = $request->get_header('x-pacame-signature');

    if (empty($timestamp) || empty($signature)) {
        return new WP_Error('pacame_unauthorized', 'Missing PACAME headers', ['status' => 401]);
    }

    $now = time();
    $delta = abs($now - intval($timestamp));
    if ($delta > PACAME_REPLAY_WINDOW) {
        return new WP_Error('pacame_replay', 'Timestamp outside replay window', ['status' => 401]);
    }

    $path = $request->get_route();
    $body = $request->get_body();
    $payload = $timestamp . ':' . $path . ':' . $body;
    $expected = hash_hmac('sha256', $payload, $secret);

    if (!hash_equals($expected, $signature)) {
        return new WP_Error('pacame_bad_signature', 'Invalid HMAC signature', ['status' => 401]);
    }

    return true;
}

// =============================================================================
//  ENDPOINTS
// =============================================================================

add_action('rest_api_init', function () {

    // ----- /system/info -----
    register_rest_route(PACAME_NS, '/system/info', [
        'methods'             => 'GET',
        'permission_callback' => 'pacame_verify_hmac',
        'callback'            => function () {
            global $wp_version;
            $active_plugins = get_option('active_plugins', []);
            return [
                'wordpress'          => $wp_version,
                'php'                => phpversion(),
                'server'             => $_SERVER['SERVER_SOFTWARE'] ?? '',
                'site_url'           => get_site_url(),
                'home_url'           => home_url(),
                'multisite'          => is_multisite(),
                'theme'              => get_stylesheet(),
                'theme_parent'       => get_template(),
                'active_plugins'     => array_values($active_plugins),
                'memory_limit'       => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max'         => ini_get('upload_max_filesize'),
            ];
        },
    ]);

    // ----- /cache/clear -----
    register_rest_route(PACAME_NS, '/cache/clear', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'callback'            => function () {
            $cleared = [];
            if (function_exists('w3tc_flush_all'))           { w3tc_flush_all();           $cleared[] = 'w3tc'; }
            if (function_exists('rocket_clean_domain'))      { rocket_clean_domain();      $cleared[] = 'wp-rocket'; }
            if (function_exists('wp_cache_clear_cache'))     { wp_cache_clear_cache();     $cleared[] = 'wp-super-cache'; }
            if (class_exists('LiteSpeed\Purge'))             { do_action('litespeed_purge_all'); $cleared[] = 'litespeed'; }
            if (function_exists('wpfc_clear_all_cache'))     { wpfc_clear_all_cache();     $cleared[] = 'wp-fastest-cache'; }
            wp_cache_flush();
            $cleared[] = 'wp-object-cache';
            // Transients (mejor que delete por wildcard SQL)
            global $wpdb;
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '\\_transient\\_%'");
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '\\_site\\_transient\\_%'");
            $cleared[] = 'transients';
            return ['ok' => true, 'cleared' => $cleared];
        },
    ]);

    // ----- /logs/php -----
    register_rest_route(PACAME_NS, '/logs/php', [
        'methods'             => 'GET',
        'permission_callback' => 'pacame_verify_hmac',
        'args' => ['lines' => ['default' => 50, 'sanitize_callback' => 'absint']],
        'callback'            => function (WP_REST_Request $request) {
            $lines = min(200, max(1, intval($request['lines'])));
            $candidates = [
                WP_CONTENT_DIR . '/debug.log',
                ini_get('error_log'),
                '/var/log/apache2/error.log',
                '/var/log/php-fpm/error.log',
            ];
            $found = null;
            foreach ($candidates as $p) {
                if ($p && @is_readable($p)) { $found = $p; break; }
            }
            if (!$found) {
                return ['ok' => false, 'error' => 'No readable PHP error log found', 'tried' => $candidates];
            }
            $size = filesize($found);
            $offset = max(0, $size - 50000); // leemos solo los últimos 50KB
            $fh = fopen($found, 'r');
            if (!$fh) return ['ok' => false, 'error' => 'Cannot open log'];
            fseek($fh, $offset);
            $content = stream_get_contents($fh);
            fclose($fh);
            $arr = preg_split("/\r?\n/", $content);
            $tail = array_slice($arr, -$lines);
            return ['ok' => true, 'path' => $found, 'lines' => $tail];
        },
    ]);

    // ----- /plugins -----
    register_rest_route(PACAME_NS, '/plugins', [
        'methods'             => 'GET',
        'permission_callback' => 'pacame_verify_hmac',
        'callback'            => function () {
            if (!function_exists('get_plugins')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $all = get_plugins();
            $active = get_option('active_plugins', []);
            $out = [];
            foreach ($all as $slug => $data) {
                $out[] = [
                    'slug'    => $slug,
                    'name'    => $data['Name'] ?? $slug,
                    'version' => $data['Version'] ?? '',
                    'author'  => wp_strip_all_tags($data['Author'] ?? ''),
                    'active'  => in_array($slug, $active, true),
                ];
            }
            return ['ok' => true, 'plugins' => $out];
        },
    ]);

    // ----- /plugins/{slug}/state (activate|deactivate) -----
    register_rest_route(PACAME_NS, '/plugins/(?P<slug>[^/]+(?:/[^/]+)?)/state', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'args' => ['action' => ['required' => true, 'enum' => ['activate', 'deactivate']]],
        'callback'            => function (WP_REST_Request $request) {
            if (!function_exists('activate_plugin')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $slug = urldecode($request['slug']);
            $action = $request['action'];
            if ($action === 'activate') {
                $r = activate_plugin($slug);
                if (is_wp_error($r)) {
                    return new WP_Error('pacame_plugin_error', $r->get_error_message(), ['status' => 500]);
                }
                return ['ok' => true, 'slug' => $slug, 'state' => 'activated'];
            }
            deactivate_plugins([$slug]);
            return ['ok' => true, 'slug' => $slug, 'state' => 'deactivated'];
        },
    ]);

    // ----- /db/query (SELECT only, prepared) -----
    register_rest_route(PACAME_NS, '/db/query', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'args' => [
            'sql' => ['required' => true, 'type' => 'string'],
            'params' => ['type' => 'array', 'default' => []],
        ],
        'callback'            => function (WP_REST_Request $request) {
            global $wpdb;
            $sql = trim($request['sql']);
            $params = (array) $request['params'];
            // Solo SELECT (case-insensitive). Bloqueamos cualquier SQL que escriba.
            if (!preg_match('/^\s*SELECT\s/i', $sql)) {
                return new WP_Error('pacame_only_select', 'Only SELECT queries allowed via /db/query', ['status' => 400]);
            }
            // Limitar a 100 filas si no hay LIMIT explícito.
            if (!preg_match('/\bLIMIT\s+\d+/i', $sql)) {
                $sql .= ' LIMIT 100';
            }
            $prepared = empty($params) ? $sql : $wpdb->prepare($sql, $params);
            $rows = $wpdb->get_results($prepared, ARRAY_A);
            if ($wpdb->last_error) {
                return new WP_Error('pacame_db_error', $wpdb->last_error, ['status' => 500]);
            }
            return ['ok' => true, 'rows' => $rows, 'count' => count($rows)];
        },
    ]);

    // ----- /backup/run (UpdraftPlus integration) -----
    register_rest_route(PACAME_NS, '/backup/run', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'callback'            => function () {
            if (!class_exists('UpdraftPlus_Options')) {
                return new WP_Error('pacame_no_backup_plugin', 'UpdraftPlus not installed; backup must be done via hPanel or another method', ['status' => 501]);
            }
            // Trigger backup via UpdraftPlus action.
            do_action('updraft_backupnow_backup_all');
            return ['ok' => true, 'plugin' => 'updraftplus', 'status' => 'triggered', 'note' => 'Check UpdraftPlus dashboard for completion'];
        },
    ]);

    // ----- /webhooks/lead (placeholder for forms) -----
    register_rest_route(PACAME_NS, '/webhooks/lead', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'callback'            => function (WP_REST_Request $request) {
            // Echo + ack. Real lead forwarding is server→server (PACAME → here just for testing).
            return ['ok' => true, 'received' => $request->get_json_params()];
        },
    ]);
});

// =============================================================================
//  HOOKS DE FORMULARIOS → ENVIAR LEAD A PACAME
// =============================================================================

function pacame_post_lead($source, $fields, $meta = []) {
    $secret = pacame_get_secret();
    $endpoint = get_option('pacame_lead_webhook', '');
    if (empty($secret) || empty($endpoint)) return;

    $payload = wp_json_encode([
        'source'   => $source,
        'fields'   => $fields,
        'meta'     => $meta,
        'site_url' => get_site_url(),
        'sent_at'  => time(),
    ]);
    $timestamp = (string) time();
    $signature = hash_hmac('sha256', $timestamp . ':lead:' . $payload, $secret);

    wp_remote_post($endpoint, [
        'headers' => [
            'Content-Type'        => 'application/json',
            'X-PACAME-Timestamp'  => $timestamp,
            'X-PACAME-Signature'  => $signature,
            'User-Agent'          => 'PACAME-WP-Plugin/0.1',
        ],
        'body'    => $payload,
        'timeout' => 5,
        'blocking' => false, // fire-and-forget
    ]);
}

// CF7
add_action('wpcf7_mail_sent', function ($cf7) {
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) return;
    pacame_post_lead('cf7', $submission->get_posted_data(), ['form_id' => $cf7->id()]);
});

// Gravity Forms
add_action('gform_after_submission', function ($entry, $form) {
    pacame_post_lead('gravity', $entry, ['form_id' => $form['id'] ?? null]);
}, 10, 2);

// Elementor Forms
add_action('elementor_pro/forms/new_record', function ($record) {
    if (!method_exists($record, 'get_formatted_data')) return;
    pacame_post_lead('elementor', $record->get_formatted_data(), [
        'form_name' => $record->get_form_settings('form_name') ?? null,
    ]);
});

// WPForms
add_action('wpforms_process_complete', function ($fields, $entry, $form_data) {
    pacame_post_lead('wpforms', $fields, ['form_id' => $form_data['id'] ?? null]);
}, 10, 3);
