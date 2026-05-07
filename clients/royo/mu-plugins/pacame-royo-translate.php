<?php
/**
 * PACAME — Traducciones Royo (override gettext)
 *
 * Traduce strings hardcodeados del tema Ecomus y plugins WooCommerce
 * que quedan en inglés a pesar de tener la web en español.
 *
 * No modifica .mo/.po del tema. Usa filtro gettext que actúa solo
 * en runtime. Reversible: borrar este archivo.
 */

if (!defined('ABSPATH')) exit;

add_filter('gettext', 'pacame_royo_translate_strings', 20, 3);
add_filter('gettext_with_context', 'pacame_royo_translate_strings_ctx', 20, 4);

// Reemplazo final hard-coded en el HTML del front (cubre strings que no pasan por gettext,
// como el footer "All Rights Reserved" hard-codeado en widgets Elementor).
add_action('template_redirect', 'pacame_royo_start_buffer');

function pacame_royo_start_buffer() {
  // Solo en frontend, no admin ni AJAX
  if (is_admin() || (defined('DOING_AJAX') && DOING_AJAX) || (defined('REST_REQUEST') && REST_REQUEST)) return;
  ob_start('pacame_royo_replace_hardcoded');
}

function pacame_royo_replace_hardcoded($html) {
  $replacements = array(
    'All Rights Reserved'           => 'Todos los derechos reservados',
    'all rights reserved'           => 'todos los derechos reservados',
    // Texto visible (no en atributos): >Texto< o >Texto:< etc.
    '>Product<'                     => '>Producto<',
    '>Quantity<'                    => '>Cantidad<',
    '>Quantity:<'                   => '>Cantidad:<',
    'Quantity:</div>'               => 'Cantidad:</div>',
    '>Reviews<'                     => '>Valoraciones<',
    '>Description<'                 => '>Descripción<',
    'Sale!'                         => '¡Oferta!',
    // Mini-cart drawer (Elementor menu cart widget)
    '>Shopping Cart<'               => '>Tu carrito<',
    'Shopping Cart'                 => 'Tu carrito',
    '>Subtotal:<'                   => '>Subtotal:<',
    '>Cart<'                        => '>Carrito<',
    '>View Cart<'                   => '>Ver carrito<',
    '>Checkout<'                    => '>Finalizar compra<',
    '>No products in the cart.<'    => '>No hay productos en el carrito.<',
    'No products in the cart'       => 'No hay productos en el carrito',
  );
  return strtr($html, $replacements);
}

function pacame_royo_translate_strings($translated, $original, $domain) {
  $map = pacame_royo_translation_map();
  if (isset($map[$original])) {
    return $map[$original];
  }
  return $translated;
}

function pacame_royo_translate_strings_ctx($translated, $original, $context, $domain) {
  $map = pacame_royo_translation_map();
  if (isset($map[$original])) {
    return $map[$original];
  }
  return $translated;
}

function pacame_royo_translation_map() {
  static $map = null;
  if ($map !== null) return $map;
  $map = array(
    // Footer del tema
    'All Rights Reserved'        => 'Todos los derechos reservados',
    '© %1$s %2$s. All Rights Reserved'  => '© %1$s %2$s. Todos los derechos reservados',

    // Cart / WooCommerce
    'Product'                    => 'Producto',
    'Products'                   => 'Productos',
    'Quantity'                   => 'Cantidad',
    'Total'                      => 'Total',
    'Subtotal'                   => 'Subtotal',
    'Continue Shopping'          => 'Seguir comprando',
    'Update Cart'                => 'Actualizar carrito',
    'Apply'                      => 'Aplicar',
    'Coupon'                     => 'Cupón',
    'Coupon code'                => 'Código de cupón',
    'Apply coupon'               => 'Aplicar cupón',
    'Cart Totals'                => 'Totales del carrito',
    'Cart totals'                => 'Totales del carrito',
    'Free Shipping'              => 'Envío gratis',
    'Calculate Shipping'         => 'Calcular envío',
    'Update'                     => 'Actualizar',
    'Remove this item'           => 'Eliminar este artículo',
    'Sale!'                      => '¡Oferta!',
    'Read more'                  => 'Leer más',
    'Read More'                  => 'Leer más',
    'Sold out'                   => 'Agotado',
    'Out of stock'               => 'Agotado',
    'In stock'                   => 'En stock',
    'Add to cart'                => 'Añadir al carrito',
    'Add to Cart'                => 'Añadir al carrito',
    'Buy now'                    => 'Comprar ahora',

    // Single product
    'Description'                => 'Descripción',
    'Additional information'     => 'Información adicional',
    'Reviews'                    => 'Valoraciones',
    'Related products'           => 'Productos relacionados',
    'You may also like'          => 'También te puede interesar',
    'You may also like…'         => 'También te puede interesar…',

    // Category / shop
    'Default sorting'            => 'Orden por defecto',
    'Sort by popularity'         => 'Ordenar por popularidad',
    'Sort by average rating'     => 'Ordenar por valoración media',
    'Sort by latest'             => 'Ordenar por novedades',
    'Sort by price: low to high' => 'Ordenar por precio: bajo a alto',
    'Sort by price: high to low' => 'Ordenar por precio: alto a bajo',
    'Showing the single result'  => 'Mostrando el único resultado',
    'No products were found matching your selection.' => 'No se han encontrado productos que coincidan con tu selección.',

    // Wishlist / Compare (WCBoost)
    'Wishlist'                   => 'Favoritos',
    'Compare'                    => 'Comparador',
    'Add to wishlist'            => 'Añadir a favoritos',
    'Recently Viewed'            => 'Vistos recientemente',
    'Recently viewed'            => 'Vistos recientemente',

    // Account
    'My Account'                 => 'Mi cuenta',
    'My account'                 => 'Mi cuenta',
    'Login'                      => 'Acceder',
    'Logout'                     => 'Cerrar sesión',
    'Sign in'                    => 'Iniciar sesión',
    'Register'                   => 'Registrarse',

    // Misc
    'Search'                     => 'Buscar',
    'Search…'                    => 'Buscar…',
    'Close'                      => 'Cerrar',
    'Menu'                       => 'Menú',
    'New'                        => 'Novedad',
    'Featured'                   => 'Destacado',
    'Best Selling'               => 'Más vendido',
    'Best selling'               => 'Más vendido',
    'Latest'                     => 'Novedades',
    'Filters'                    => 'Filtros',
  );
  return $map;
}
