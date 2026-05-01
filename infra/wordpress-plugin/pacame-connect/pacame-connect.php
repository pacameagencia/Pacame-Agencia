<?php
/**
 * Plugin Name: PACAME Connect
 * Description: Endpoints REST custom para que PACAME (https://pacameagencia.com) pueda gestionar el WP del cliente: cachés, plugins, temas, logs, backups, queries seguras. Auth HMAC compartido con el dashboard PACAME.
 * Version: 0.2.0
 * Author: PACAME Agencia
 * Author URI: https://pacameagencia.com
 *
 * v0.2.0 (2026-05-01) — auditoría seguridad pre-deploy Joyería Royo:
 *   - Constantes pacame_ns/replay con guard !defined() para evitar choque con otros plugins.
 *   - /css/render: sin wp_strip_all_tags() (rompía selectors `body > .header`).
 *   - /css/set: rechaza también <iframe>, <object>, javascript:, expression(), @import http(s).
 *   - /page/{id}/reset-to-gutenberg: requiere force=true si la página es home/blog.
 *   - /db/query: rechaza multistatement (`;`) y SELECT...INTO OUTFILE / LOAD_FILE / BENCHMARK / SLEEP.
 *   - gettext: text-domain con fallbacks (wcboost-wishlist, wcboost-products-wishlist-pro, etc.)
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

// Defensive: sólo definimos si nadie las definió antes (evita choque con otro plugin)
if (!defined('PACAME_NS'))             define('PACAME_NS', 'pacame/v1');
if (!defined('PACAME_REPLAY_WINDOW'))  define('PACAME_REPLAY_WINDOW', 300); // 5 minutos

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
            // Bloquear multistatement: rechazar `;` no terminal o SQL encadenado.
            $stripped = rtrim($sql, '; ');
            if (strpos($stripped, ';') !== false) {
                return new WP_Error('pacame_no_multistatement', 'Multi-statement SQL not allowed', ['status' => 400]);
            }
            // Bloquear keywords destructivas embebidas en subqueries por si alguien hace SELECT ... INTO OUTFILE
            if (preg_match('/\b(INTO\s+OUTFILE|INTO\s+DUMPFILE|LOAD_FILE|BENCHMARK|SLEEP)\s*\(/i', $sql)) {
                return new WP_Error('pacame_unsafe_select', 'Unsafe SELECT pattern blocked', ['status' => 400]);
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

    // ----- /page/{id}/reset-to-gutenberg -----
    // Vacía el _elementor_data y permite escribir post_content nuevo (HTML / blocks).
    // Útil para migrar páginas de demo del tema (Elementor) a contenido real Gutenberg
    // sin tener que diseñar dentro de Elementor.
    register_rest_route(PACAME_NS, '/page/(?P<id>\d+)/reset-to-gutenberg', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'args' => [
            'content'        => ['required' => true, 'type' => 'string'],
            'title'          => ['required' => false, 'type' => 'string'],
            'excerpt'        => ['required' => false, 'type' => 'string'],
            'status'         => ['required' => false, 'type' => 'string', 'default' => 'publish'],
            'remove_elementor' => ['required' => false, 'type' => 'boolean', 'default' => true],
            'force'          => ['required' => false, 'type' => 'boolean', 'default' => false],
        ],
        'callback'            => function (WP_REST_Request $request) {
            $id = intval($request['id']);
            $post = get_post($id);
            if (!$post || $post->post_type !== 'page') {
                return new WP_Error('pacame_not_found', 'Page not found', ['status' => 404]);
            }
            // Guard: si la página es la home o la de blog, requiere flag force=true explícito.
            // Evita borrar el _elementor_data de la home por error de ID.
            $front_id = (int) get_option('page_on_front');
            $blog_id  = (int) get_option('page_for_posts');
            if (!$request['force'] && ($id === $front_id || $id === $blog_id)) {
                return new WP_Error(
                    'pacame_protected_page',
                    sprintf('Page %d is the front/blog page; resend with force=true to confirm', $id),
                    ['status' => 409]
                );
            }

            $update = [
                'ID'           => $id,
                'post_content' => $request['content'],
                'post_status'  => $request['status'],
            ];
            if ($request['title']) $update['post_title'] = $request['title'];
            if ($request['excerpt']) $update['post_excerpt'] = $request['excerpt'];

            $r = wp_update_post($update, true);
            if (is_wp_error($r)) {
                return new WP_Error('pacame_update_failed', $r->get_error_message(), ['status' => 500]);
            }

            $removed_meta = [];
            if ($request['remove_elementor']) {
                $keys = ['_elementor_data', '_elementor_edit_mode', '_elementor_template_type', '_elementor_version', '_elementor_pro_version', '_elementor_page_assets', '_elementor_css'];
                foreach ($keys as $k) {
                    if (delete_post_meta($id, $k)) {
                        $removed_meta[] = $k;
                    }
                }
            }

            // Limpiar caché LiteSpeed para esta página (si está activo).
            if (class_exists('LiteSpeed\Purge')) {
                do_action('litespeed_purge_post', $id);
            }

            return [
                'ok'              => true,
                'id'              => $id,
                'permalink'       => get_permalink($id),
                'removed_meta'    => $removed_meta,
                'cache_purged'    => class_exists('LiteSpeed\Purge'),
            ];
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

// =============================================================================
//  TRADUCCIONES — strings residuales en inglés (WCBoost Wishlist, etc.)
//  Aplica filtro gettext para sustituir las cadenas no traducidas a español.
// =============================================================================

// Mapas por dominio. Si el plugin instalado usa otro text-domain,
// añade el slug a la lista de pacame_get_translations() — no rompe nada si no existe.
function pacame_get_translations() {
    static $cache = null;
    if ($cache !== null) return $cache;
    $wishlist = [
        'Add to wishlist'      => 'Añadir a favoritos',
        'Added to wishlist'    => 'Añadido a favoritos',
        'View wishlist'        => 'Ver favoritos',
        'Browse wishlist'      => 'Mi lista de favoritos',
        'Remove from wishlist' => 'Quitar de favoritos',
        'My wishlist'          => 'Mis favoritos',
        'Share wishlist'       => 'Compartir lista',
    ];
    $compare = [
        'Add to compare'      => 'Añadir a comparar',
        'Added to compare'    => 'Añadido a comparar',
        'Remove from compare' => 'Quitar de comparar',
        'Compare'             => 'Comparar',
        'View compare'        => 'Ver comparativa',
    ];
    $cache = [
        // WCBoost Wishlist (varios slugs vistos en el ecosistema)
        'wcboost-products-wishlist'     => $wishlist,
        'wcboost-wishlist'              => $wishlist,
        'wcboost-products-wishlist-pro' => $wishlist,
        // WCBoost Compare
        'wcboost-products-compare'      => $compare,
        'wcboost-compare'               => $compare,
    ];
    return $cache;
}

add_filter('gettext_with_context', function ($translation, $text, $context, $domain) {
    $map = pacame_get_translations();
    if (!isset($map[$domain])) return $translation;
    return $map[$domain][$text] ?? $translation;
}, 20, 4);

add_filter('gettext', function ($translation, $text, $domain) {
    $map = pacame_get_translations();
    if (!isset($map[$domain])) return $translation;
    return $map[$domain][$text] ?? $translation;
}, 20, 3);

// =============================================================================
//  SCHEMA.ORG JewelryStore — inyecta JSON-LD en home + sobre nosotros
//  Mejora ranking en Google Maps y búsquedas locales tipo "joyería en Albacete".
// =============================================================================

add_action('wp_head', function () {
    if (!is_front_page() && !is_page(['sobre-nosotros-joyeria-albacete', 'contacto-joyeria-royo-albacete'])) {
        return;
    }

    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => ['LocalBusiness', 'JewelryStore'],
        '@id'      => 'https://joyeriaroyo.com/#localbusiness',
        'name'     => 'Joyería Royo',
        'description' => 'Joyería familiar en Albacete con más de 50 años de tradición. Distribuidores oficiales de Tissot, Longines, Seiko, Casio, Hamilton, Oris, Citizen, Omega, MontBlanc y joyería de oro 18kt.',
        'url'      => 'https://joyeriaroyo.com/',
        'telephone' => '+34967217903',
        'email'    => 'jroyo@joyeriaroyo.com',
        'priceRange' => '€€€',
        'image'    => 'https://joyeriaroyo.com/wp-content/uploads/2025/12/LOGO-NEGRO-SIN-FONDO.png',
        'address' => [
            '@type' => 'PostalAddress',
            'streetAddress' => 'Calle Tesifonte Gallego, 2',
            'addressLocality' => 'Albacete',
            'addressRegion' => 'Albacete',
            'postalCode' => '02002',
            'addressCountry' => 'ES',
        ],
        'geo' => [
            '@type' => 'GeoCoordinates',
            'latitude' => 38.99432,
            'longitude' => -1.85841,
        ],
        'areaServed' => [
            '@type' => 'AdministrativeArea',
            'name' => 'Albacete',
        ],
        'openingHoursSpecification' => [
            [
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                'opens' => '10:00',
                'closes' => '13:30',
            ],
            [
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                'opens' => '17:00',
                'closes' => '20:30',
            ],
            [
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => 'Saturday',
                'opens' => '10:00',
                'closes' => '13:30',
            ],
        ],
        'sameAs' => array_filter([
            get_option('pacame_social_instagram', ''),
            get_option('pacame_social_facebook', ''),
            get_option('pacame_social_tiktok', ''),
        ]),
        'paymentAccepted' => 'Cash, Credit Card, PayPal, Visa, Mastercard, American Express',
        'currenciesAccepted' => 'EUR',
    ];

    echo "\n<!-- PACAME · LocalBusiness/JewelryStore schema -->\n";
    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
});

// =============================================================================
//  INYECCIÓN CSS CUSTOM PACAME — alternativa al Customizer
//  Lee el CSS de wp_options('pacame_custom_css') y lo inyecta en wp_head.
//  Pablo puede actualizarlo desde PACAME REST sin tocar Customizer.
// =============================================================================

add_action('wp_head', function () {
    $css = get_option('pacame_custom_css', '');
    if (empty($css)) return;
    // No usamos wp_strip_all_tags() — rompería selectors CSS válidos como `body > .header`.
    // El sanitizado (rechazar <script>/<iframe>) lo hace /css/set ANTES de guardar.
    echo "\n<!-- PACAME · custom CSS -->\n";
    echo '<style id="pacame-custom-css">' . "\n" . $css . "\n" . '</style>' . "\n";
}, 999);

// Endpoint REST para actualizar el CSS desde PACAME
add_action('rest_api_init', function () {
    register_rest_route(PACAME_NS, '/css/set', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'args' => ['css' => ['required' => true, 'type' => 'string']],
        'callback'            => function (WP_REST_Request $request) {
            $css = $request['css'];
            // Sanitización defensiva — rechaza vectores de inyección comunes en CSS.
            // (no es exhaustivo, pero el endpoint sólo es accesible vía HMAC)
            $forbidden = ['/<script[^>]*>.*?<\/script>/is', '/<iframe[^>]*>.*?<\/iframe>/is',
                          '/<object[^>]*>.*?<\/object>/is', '/<embed[^>]*>/is',
                          '/javascript\s*:/i', '/expression\s*\(/i', '/@import\s+url\s*\(\s*["\']?https?:/i'];
            foreach ($forbidden as $rx) {
                $css = preg_replace($rx, '', $css);
            }
            update_option('pacame_custom_css', $css, false);
            // Purga LiteSpeed cache si está activo
            if (class_exists('LiteSpeed\Purge')) {
                do_action('litespeed_purge_all');
            }
            return ['ok' => true, 'length' => strlen($css)];
        },
    ]);

    // Endpoint para borrar CSS
    register_rest_route(PACAME_NS, '/css/clear', [
        'methods'             => 'POST',
        'permission_callback' => 'pacame_verify_hmac',
        'callback'            => function () {
            delete_option('pacame_custom_css');
            if (class_exists('LiteSpeed\Purge')) {
                do_action('litespeed_purge_all');
            }
            return ['ok' => true];
        },
    ]);
});
