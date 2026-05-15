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
    // 404 page (Ecomus theme template hard-coded strings)
    'Oops...That link is broken.'   => 'Lo sentimos, esta página no existe.',
    'Oops...That link is broken'    => 'Lo sentimos, esta página no existe',
    'Oops…That link is broken.'     => 'Lo sentimos, esta página no existe.',
    'Oops…That link is broken'      => 'Lo sentimos, esta página no existe',
    'Sorry for the inconvenience. Go to our homepage or check out our latest collections.' => 'Sigue navegando entre nuestras colecciones de relojería oficial y joyería de oro 18kt, o vuelve a la portada para descubrir el catálogo completo.',
    '>Shop now<'                    => '>Volver a la tienda<',
    'Shop now'                      => 'Volver a la tienda',
    // Search results page (Ecomus hardcoded)
    'Search Results for:'           => 'Resultados para:',
    'Search Results for'            => 'Resultados para',
    'Search results for'            => 'Resultados para',
    'Search Results'                => 'Resultados de búsqueda',
    'Nothing was found'             => 'No se han encontrado resultados',
    'Sorry, but nothing matched your search terms.' => 'Lo sentimos, no se han encontrado resultados que coincidan con tu búsqueda.',
    'Please try again with some different keywords.' => 'Intenta con otras palabras clave o navega por nuestras categorías.',
    // Archive filtro (Ecomus catalog toolbar + widget filtro WooCommerce)
    '</span> Filter</button>'       => '</span> Filtrar</button>',
    '> Filter</button>'             => '> Filtrar</button>',
    '<h6>Refine by</h6>'            => '<h6>Refinar por</h6>',
    '>Refine by<'                   => '>Refinar por<',
    'value="Filter"'                => 'value="Filtrar"',
    '>Filter</h5>'                  => '>Filtrar</h5>',
    '>Filter</span>'                => '>Filtrar</span>',
    'title="Filter"'                => 'title="Filtrar"',
    'aria-label="Filter"'           => 'aria-label="Filtrar"',
    '>Filter products<'             => '>Filtrar productos<',
    '>Filter Products<'             => '>Filtrar productos<',
    'Showing all'                   => 'Mostrando todos',
    'Showing the single result'     => 'Mostrando el único resultado',
    '>Sort by<'                     => '>Ordenar por<',
    '> Sort<'                       => '> Ordenar<',
    // Wishlist page hardcoded
    '>Wishlist<'                    => '>Favoritos<',
    'Your wishlist is currently empty.' => 'Tu lista de favoritos está vacía.',
    'Browse Products'               => 'Explorar productos',
    'Return to shop'                => 'Volver a la tienda',
    'Browse products'               => 'Explorar productos',
    // Bug encoding widget Elementor: escape Unicode JSON sin convertir
    'Polu00edticas De Joyeru00eda Royo' => 'Políticas de Joyería Royo',
    'Polu00edticas de Joyeru00eda Royo' => 'Políticas de Joyería Royo',
    'Joyeru00eda Royo'              => 'Joyería Royo',
    // Links footer rotos con encoding
    'Polu00edtica de Devoluciu00f3n' => 'Política de Devolución',
    'Polu00edtica de Privacidad'    => 'Política de Privacidad',
    'Polu00edtica de cookies'       => 'Política de cookies',
    'Polu00edtica de Cookies'       => 'Política de Cookies',
    'Tu00e9rminos y Condiciones'    => 'Términos y Condiciones',
    'Tu00e9rminos'                  => 'Términos',
    'Canal u00c9tico'               => 'Canal Ético',
    'u00c9tico'                     => 'Ético',
    'Devoluciu00f3n'                => 'Devolución',
    'devoluciu00f3n'                => 'devolución',
    // Otros encoding rotos comunes (escapes Unicode mal procesados)
    'Polu00edtica'                  => 'Política',
    'polu00edtica'                  => 'política',
    'pu00e1gina'                    => 'página',
    'Pu00e1gina'                    => 'Página',
    'au00f1os'                      => 'años',
    'Au00f1os'                      => 'Años',
    'mu00e1s'                       => 'más',
    'Mu00e1s'                       => 'Más',
    'au00fan'                       => 'aún',
    'Au00fan'                       => 'Aún',
    'tu00e9cnico'                   => 'técnico',
    'Tu00e9cnico'                   => 'Técnico',
    'garantu00eda'                  => 'garantía',
    'Garantu00eda'                  => 'Garantía',
    'tradicu00edon'                 => 'tradición',
    'Tradicu00edon'                 => 'Tradición',
    'u00f3'                         => 'ó',
    'u00e9'                         => 'é',
    'u00ed'                         => 'í',
    'u00fa'                         => 'ú',
    'u00e1'                         => 'á',
    'u00f1'                         => 'ñ',
    'u00c9'                         => 'É',
    'u00cd'                         => 'Í',
    'u00d3'                         => 'Ó',
    'u00da'                         => 'Ú',
    'u00c1'                         => 'Á',
    'u00d1'                         => 'Ñ',
    // Misc remaining
    'Pages'                         => 'Páginas',
    '>Pages<'                       => '>Páginas<',
    'Useful Links'                  => 'Enlaces útiles',
    'Quick Links'                   => 'Enlaces rápidos',
    'Subscribe to our newsletter'   => 'Suscríbete a nuestra newsletter',
    'Sign up to get the latest news and offers' => 'Recibe las novedades y ofertas',
    'Your email address'            => 'Tu correo electrónico',
    'Subscribe'                     => 'Suscribirse',
    // Login / Register form WC
    '>Email address&nbsp;<'         => '>Correo electrónico&nbsp;<',
    '>Email address<'               => '>Correo electrónico<',
    'Email address'                 => 'Correo electrónico',
    '>Username or email&nbsp;<'     => '>Usuario o correo&nbsp;<',
    'Username or email'             => 'Usuario o correo',
    '>Username&nbsp;<'              => '>Usuario&nbsp;<',
    '>Password&nbsp;<'              => '>Contraseña&nbsp;<',
    '>Password<'                    => '>Contraseña<',
    '>Lost your password?<'         => '>¿Has olvidado tu contraseña?<',
    '>Register<'                    => '>Registrarse<',
    '>LOG IN<'                      => '>Acceder<',
    '>Log in<'                      => '>Acceder<',
    '>LOGIN<'                       => '>ACCEDER<',
    '>Sign in<'                     => '>Acceder<',
    '>Remember me<'                 => '>Recordarme<',
    'No account yet?'               => '¿Aún no tienes cuenta?',
    'Create an account'             => 'Crear cuenta',
    'Already have an account?'      => '¿Ya tienes cuenta?',
    '>Account<'                     => '>Mi cuenta<',
    'Dashboard'                     => 'Panel',
    'Orders'                        => 'Pedidos',
    'Downloads'                     => 'Descargas',
    'Addresses'                     => 'Direcciones',
    'Account details'               => 'Detalles de cuenta',
    'Account Details'               => 'Detalles de cuenta',
    'Edit address'                  => 'Editar dirección',
    'Edit Account'                  => 'Editar cuenta',
    'No order has been made yet.'   => 'Todavía no has realizado ningún pedido.',
    // WhatsApp: número correcto +34 639 18 51 28 (el teléfono fijo +34 967 21 79 03
    // se mantiene SOLO para llamadas tel:). Red de seguridad sobre páginas ya
    // publicadas (institucionales, servicios, archives de marca) sin re-ejecutar
    // scripts. strtr usa coincidencia más larga: los patrones con texto visible
    // tienen prioridad sobre el href genérico.
    'wa.me/34967217903" target="_blank" rel="noopener">+34 967 21 79 03</a>' => 'wa.me/34639185128" target="_blank" rel="noopener">+34 639 18 51 28</a>',
    'wa.me/34967217903">+34 967 21 79 03</a>' => 'wa.me/34639185128">+34 639 18 51 28</a>',
    'wa.me/34967217903'             => 'wa.me/34639185128',
    'whatsapp.com/send?phone=34967217903' => 'whatsapp.com/send?phone=34639185128',
    'api.whatsapp.com/send?phone=34967217903' => 'api.whatsapp.com/send?phone=34639185128',
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
