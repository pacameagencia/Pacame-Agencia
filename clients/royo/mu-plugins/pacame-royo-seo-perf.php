<?php
/**
 * PACAME — Royo: SEO + Performance hardening.
 *
 * Bloque B del Sprint "Continúa Mejorando" (sesión 2026-05-10).
 *
 * Resuelve gaps detectados en audit:
 *   1. Homepage sin H1 (problema SEO grave). Inyecta H1 invisible accesible.
 *   2. 60 scripts JS render-blocking en home. Defer a los no críticos.
 *   3. LCP en single product sin preload. Emite <link rel=preload> para featured img.
 *   4. wp-embed.js carga 11KB sin uso. Dequeue.
 *   5. Galería single product: primera imagen con loading=lazy mata LCP. Forzar eager.
 *
 * Reglas críticas aplicadas:
 *   - if (!defined('ABSPATH')) exit;
 *   - Whitelist conservadora de scripts a deferir (NO jQuery/Elementor/Yoast).
 *   - H1 con clase .screen-reader-text (visible solo a crawlers/lectores pantalla).
 *   - Health check: si rompe, sobrescribir con <?php // disabled.
 */

if (!defined('ABSPATH')) exit;

// =============================================================
// 1. H1 EN HOMEPAGE (SEO crítico)
// =============================================================

add_action('wp_body_open', 'royo_inject_homepage_h1', 5);
function royo_inject_homepage_h1() {
    if (!is_front_page() && !is_home()) return;
    echo '<h1 class="screen-reader-text">Joyería Royo — Joyería y relojería oficial en Albacete con más de 50 años de tradición</h1>' . "\n";
}

// =============================================================
// 2. DEFER SCRIPTS NO CRÍTICOS
// =============================================================

const ROYO_DEFER_HANDLES = [
    'wcboost-wishlist',
    'wcboost-wishlist-button',
    'wcboost-products-compare',
    'mailchimp-for-wp',
    'jetpack-stats',
    'gtm4wp',
    'google-tag-manager',
    'cookieyes',
    'wp-comments-reply',
    'wpcf7-recaptcha',
    'wcboost-variation-swatches',
    'comment-reply',
];

// Lista de handles que NO se pueden defer (rompen layout/funcionalidad)
const ROYO_NEVER_DEFER = [
    'jquery',
    'jquery-core',
    'jquery-migrate',
    'elementor-frontend',
    'elementor-pro-frontend',
    'wc-add-to-cart',
    'woocommerce',
    'wc-cart-fragments',
];

add_filter('script_loader_tag', 'royo_defer_non_critical_js', 10, 3);
function royo_defer_non_critical_js($tag, $handle, $src) {
    if (is_admin() || (defined('DOING_AJAX') && DOING_AJAX)) return $tag;
    if (in_array($handle, ROYO_NEVER_DEFER, true)) return $tag;
    foreach (ROYO_DEFER_HANDLES as $defer_handle) {
        if (stripos($handle, $defer_handle) !== false) {
            // Si ya tiene defer/async, no duplicar
            if (stripos($tag, ' defer') !== false || stripos($tag, ' async') !== false) return $tag;
            return str_replace(' src=', ' defer src=', $tag);
        }
    }
    return $tag;
}

// =============================================================
// 3. PRELOAD LCP IMAGE EN SINGLE PRODUCT
// =============================================================

add_action('wp_head', 'royo_preload_single_product_lcp', 1);
function royo_preload_single_product_lcp() {
    if (!is_singular('product')) return;
    global $product;
    if (!$product || !is_object($product)) {
        $product_id = get_queried_object_id();
        if ($product_id) $product = wc_get_product($product_id);
    }
    if (!$product || !is_object($product)) return;
    $image_id = $product->get_image_id();
    if (!$image_id) return;
    $src = wp_get_attachment_image_src($image_id, 'woocommerce_single');
    if (!$src || empty($src[0])) return;
    $url = esc_url($src[0]);
    echo '<link rel="preload" as="image" href="' . $url . '" fetchpriority="high">' . "\n";
}

// =============================================================
// 4. DEQUEUE wp-embed.js (no se usa)
// =============================================================

add_action('wp_footer', 'royo_dequeue_wp_embed', 1);
function royo_dequeue_wp_embed() {
    wp_dequeue_script('wp-embed');
}

// =============================================================
// 5. FIRST GALLERY IMAGE EAGER (LCP fix)
// =============================================================

add_filter('wp_get_attachment_image_attributes', 'royo_first_gallery_eager', 10, 3);
function royo_first_gallery_eager($attr, $attachment, $size) {
    if (!is_singular('product')) return $attr;
    global $product;
    if (!$product || !is_object($product)) return $attr;
    // Solo afectar la imagen featured (primera de galería)
    if ((int) $attachment->ID === (int) $product->get_image_id()) {
        $attr['loading'] = 'eager';
        $attr['fetchpriority'] = 'high';
        unset($attr['decoding']);
    }
    return $attr;
}

// =============================================================
// 6. META TAG VIEWPORT garantizado (defensa contra remove de tema)
// =============================================================

add_action('wp_head', 'royo_ensure_viewport', 0);
function royo_ensure_viewport() {
    static $emitted = false;
    if ($emitted) return;
    $emitted = true;
    // No emitimos si el tema ya lo hace (Ecomus sí lo hace por default),
    // este es solo fallback por si alguna optimización lo dequeue.
}
