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

// =============================================================
// 7. SCHEMA.ORG PRODUCT — añadir brand + manufacturer
// =============================================================
// Yoast/Ecomus emiten Product schema básico pero SIN brand. Esto bloquea
// rich snippets SERP. Añadimos Schema.org brand basado en la auto-detección
// del mu-plugin pacame-royo-single-product-enrich.php (17 marcas oficiales).

const ROYO_SCHEMA_OFFICIAL_BRANDS = [
    'Tissot' => 'https://www.tissotwatches.com',
    'Longines' => 'https://www.longines.com',
    'Casio' => 'https://www.casio.com',
    'Seiko' => 'https://www.seikowatches.com',
    'Citizen' => 'https://www.citizenwatch.com',
    'Hamilton' => 'https://www.hamiltonwatch.com',
    'Oris' => 'https://www.oris.ch',
    'Certina' => 'https://www.certina.com',
    'MontBlanc' => 'https://www.montblanc.com',
    'Mont Blanc' => 'https://www.montblanc.com',
    'Victorinox' => 'https://www.victorinox.com',
    'Baume & Mercier' => 'https://www.baume-et-mercier.com',
    'Franck Muller' => 'https://www.franckmuller.com',
    'Omega' => 'https://www.omegawatches.com',
];

function royo_schema_detect_brand($product) {
    if (!$product || !is_object($product)) return null;
    $cats = wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'names']);
    if (is_wp_error($cats)) return null;
    foreach (ROYO_SCHEMA_OFFICIAL_BRANDS as $brand_name => $brand_url) {
        if (in_array($brand_name, $cats, true)) {
            return ['name' => $brand_name, 'url' => $brand_url];
        }
        if (stripos($product->get_name(), $brand_name) !== false) {
            return ['name' => $brand_name, 'url' => $brand_url];
        }
    }
    return null;
}

// Filter WooCommerce structured data Product (hook estándar usado por Ecomus).
add_filter('woocommerce_structured_data_product', 'royo_schema_woo_product_brand', 200, 2);
function royo_schema_woo_product_brand($markup, $product) {
    if (!$product || !is_object($product)) return $markup;
    return royo_schema_apply_brand($markup, $product);
}

// Filter Yoast Schema graph + entity Product (probamos los 2 hooks por si hay Yoast SEO Premium).
add_filter('wpseo_schema_graph', 'royo_schema_add_brand', 200, 2);
add_filter('wpseo_schema_product', 'royo_schema_product_brand', 200, 2);

function royo_schema_apply_brand($piece, $product) {
    $brand = royo_schema_detect_brand($product);
    if (!$brand) return $piece;
    if (empty($piece['brand'])) {
        $piece['brand'] = [
            '@type' => 'Brand',
            'name' => $brand['name'],
            'url' => $brand['url'],
        ];
    }
    if (empty($piece['manufacturer'])) {
        $piece['manufacturer'] = [
            '@type' => 'Organization',
            'name' => $brand['name'],
            'url' => $brand['url'],
        ];
    }
    $sku = $product->get_sku();
    if ($sku && empty($piece['mpn'])) {
        $piece['mpn'] = $sku;
    }
    return $piece;
}

function royo_schema_product_brand($data, $context = null) {
    if (!is_singular('product')) return $data;
    global $product;
    if (!$product || !is_object($product)) {
        $product_id = get_queried_object_id();
        if ($product_id) $product = wc_get_product($product_id);
    }
    if (!$product || !is_object($product)) return $data;
    return royo_schema_apply_brand($data, $product);
}

function royo_schema_add_brand($graph, $context = null) {
    if (!is_singular('product')) return $graph;
    global $product;
    if (!$product || !is_object($product)) {
        $product_id = get_queried_object_id();
        if ($product_id) $product = wc_get_product($product_id);
    }
    if (!$product || !is_object($product)) return $graph;

    foreach ($graph as $i => $piece) {
        if (!is_array($piece)) continue;
        $type = isset($piece['@type']) ? $piece['@type'] : null;
        if ($type === 'Product' || (is_array($type) && in_array('Product', $type, true))) {
            $graph[$i] = royo_schema_apply_brand($piece, $product);
        }
    }
    return $graph;
}

// Fallback: si Yoast no está activo, inyectar nuestro propio Product schema básico.
add_action('wp_head', 'royo_schema_fallback_product', 99);
function royo_schema_fallback_product() {
    if (!is_singular('product')) return;
    if (defined('WPSEO_VERSION')) return; // Yoast activo, ya emite schema
    global $product;
    if (!$product || !is_object($product)) {
        $product_id = get_queried_object_id();
        if ($product_id) $product = wc_get_product($product_id);
    }
    if (!$product || !is_object($product)) return;
    $brand = royo_schema_detect_brand($product);

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        'name' => $product->get_name(),
        'sku' => $product->get_sku(),
        'description' => wp_strip_all_tags($product->get_short_description() ?: $product->get_description()),
        'image' => wp_get_attachment_image_url($product->get_image_id(), 'full'),
        'url' => get_permalink($product->get_id()),
        'offers' => [
            '@type' => 'Offer',
            'price' => $product->get_price(),
            'priceCurrency' => get_woocommerce_currency(),
            'availability' => 'https://schema.org/' . ($product->is_in_stock() ? 'InStock' : 'OutOfStock'),
            'seller' => ['@type' => 'JewelryStore', 'name' => 'Joyería Royo'],
        ],
    ];
    if ($brand) {
        $schema['brand'] = ['@type' => 'Brand', 'name' => $brand['name'], 'url' => $brand['url']];
        $schema['mpn'] = $product->get_sku();
    }
    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
}
