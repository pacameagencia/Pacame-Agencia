<?php
/**
 * PACAME — Royo: forzar qty=1 + arreglar mini-cart drawer.
 *
 * Decisión negocio (08-may-2026): Royo vende high-ticket (relojes 295€-15k€,
 * joyería diamantes). El selector de cantidad sobra y rompe la estética luxury,
 * además de que el tema Ecomus no actualizaba subtotal del mini-cart al cambiar.
 *
 * Este plugin:
 *   1. Fuerza cantidad máxima=1 en cart_item_quantity HTML del mini-cart drawer.
 *      Ecomus mete `<div class="quantity">` con +/- dentro de
 *      `.elementor-menu-cart__product-price`, lo cual escondemos por CSS sec 25.
 *      Pero el `__product-price` quedaba vacío. Aquí inyectamos el PRECIO REAL
 *      (cart_item_subtotal) en su lugar, conservando el wrapper.
 *   2. Limita add-to-cart desde single-product a max 1 unidad (server-side).
 *
 * Si quieres revertir: borrar este archivo y volver a CSS sec 25 viejo.
 */

if (!defined('ABSPATH')) exit;

// 1. Reemplazar el HTML de cantidad en mini-cart drawer por el precio del producto.
add_filter('woocommerce_widget_cart_item_quantity', 'royo_minicart_show_price_instead_of_qty', 100, 3);
function royo_minicart_show_price_instead_of_qty($html, $cart_item, $cart_item_key) {
    if (!is_array($cart_item) || !isset($cart_item['data'])) return $html;
    $product = $cart_item['data'];
    if (!is_object($product)) return $html;

    $qty = isset($cart_item['quantity']) ? intval($cart_item['quantity']) : 1;
    $line_subtotal = WC()->cart->get_product_subtotal($product, $qty);

    // HTML simple sin qty controls: sólo precio premium con tipografía cuidada.
    return sprintf(
        '<span class="royo-minicart-price quantity">%s</span>',
        $line_subtotal
    );
}

// 2. Forzar cantidad máxima 1 en single product (server-side validation).
add_filter('woocommerce_quantity_input_max', 'royo_force_max_qty_1', 10, 2);
function royo_force_max_qty_1($max, $product) {
    return 1;
}

add_filter('woocommerce_quantity_input_args', 'royo_force_qty_args_1', 10, 2);
function royo_force_qty_args_1($args, $product) {
    $args['max_value'] = 1;
    $args['min_value'] = 1;
    $args['input_value'] = 1;
    return $args;
}

// 3. Si el cliente añade más de 1 (vía URL ?quantity=N), reducir a 1.
add_filter('woocommerce_add_to_cart_quantity', 'royo_clamp_add_to_cart_qty', 10, 2);
function royo_clamp_add_to_cart_qty($qty, $product_id) {
    return 1;
}

// 4. Si ya hay 1 unidad del mismo producto en carrito y se intenta añadir otro,
//    avisar y no duplicar (vez de dar 2 unidades).
add_filter('woocommerce_add_to_cart_validation', 'royo_block_duplicate_in_cart', 10, 4);
function royo_block_duplicate_in_cart($passed, $product_id, $quantity, $variation_id = 0) {
    if (!function_exists('WC') || !WC()->cart) return $passed;
    foreach (WC()->cart->get_cart() as $cart_item) {
        if ((int) $cart_item['product_id'] === (int) $product_id) {
            wc_add_notice(__('Este producto ya está en tu carrito. Si necesitas más unidades, contáctanos por WhatsApp.', 'royo'), 'notice');
            return false;
        }
    }
    return $passed;
}
