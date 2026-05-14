<?php
/**
 * PACAME — Royo: CTA WhatsApp + Tel + Dirección al pie del menú móvil.
 *
 * El menú principal mobile (hamburger panel Ecomus) muestra solo enlaces de
 * navegación. Pablo quiere trust signals + contacto rápido al pie:
 *   - Teléfono +34 967 21 79 03 (tel: link)
 *   - WhatsApp (wa.me link con mensaje pre-compuesto)
 *   - Dirección C. Tesifonte Gallego 2, Albacete
 *
 * Filter `wp_nav_menu_items` añade 3 items al menu_id principal.
 * Las clases royo-mobile-cta-* se estilan en CSS sec 41.
 */

if (!defined('ABSPATH')) exit;

const ROYO_MENU_TEL_DISPLAY = '+34 967 21 79 03';
const ROYO_MENU_TEL = '+34967217903';
const ROYO_MENU_WHATSAPP = '34967217903';
const ROYO_MENU_WHATSAPP_MSG = 'Hola, me gustaría consultar sobre un producto de Joyería Royo.';
const ROYO_MENU_ADDRESS = 'C. Tesifonte Gallego, 2 — Albacete';

add_filter('wp_nav_menu_items', 'royo_mobile_menu_append_cta', 20, 2);
function royo_mobile_menu_append_cta($items, $args) {
    // Solo añadir al menú principal (slug 'menu-menu-principal' o tema_location 'primary')
    $is_main = false;
    if (isset($args->menu) && is_object($args->menu)) {
        $slug = isset($args->menu->slug) ? $args->menu->slug : '';
        if (stripos($slug, 'principal') !== false || stripos($slug, 'primary') !== false || stripos($slug, 'main') !== false) {
            $is_main = true;
        }
    }
    if (!$is_main && isset($args->theme_location)) {
        if (stripos($args->theme_location, 'primary') !== false || stripos($args->theme_location, 'main') !== false) {
            $is_main = true;
        }
    }
    // Fallback: detectar por ID del menú generado en HTML (menu-menu-principal-2)
    if (!$is_main && isset($args->menu_id) && stripos($args->menu_id, 'principal') !== false) {
        $is_main = true;
    }
    if (!$is_main) return $items;

    $whatsapp_url = 'https://wa.me/' . ROYO_MENU_WHATSAPP . '?text=' . rawurlencode(ROYO_MENU_WHATSAPP_MSG);

    $extra = '';
    // Separator visible solo en mobile via CSS sec 41
    $extra .= '<li class="menu-item royo-mobile-cta-separator" role="separator" aria-hidden="true"></li>';
    // Phone
    $extra .= '<li class="menu-item royo-mobile-cta royo-mobile-cta-tel">';
    $extra .= '<a href="tel:' . esc_attr(ROYO_MENU_TEL) . '" rel="nofollow">';
    $extra .= '<span class="royo-mobile-cta__label">Llamar</span>';
    $extra .= '<span class="royo-mobile-cta__value">' . esc_html(ROYO_MENU_TEL_DISPLAY) . '</span>';
    $extra .= '</a>';
    $extra .= '</li>';
    // WhatsApp
    $extra .= '<li class="menu-item royo-mobile-cta royo-mobile-cta-whatsapp">';
    $extra .= '<a href="' . esc_url($whatsapp_url) . '" target="_blank" rel="noopener nofollow">';
    $extra .= '<span class="royo-mobile-cta__label">WhatsApp</span>';
    $extra .= '<span class="royo-mobile-cta__value">' . esc_html(ROYO_MENU_TEL_DISPLAY) . '</span>';
    $extra .= '</a>';
    $extra .= '</li>';
    // Address
    $extra .= '<li class="menu-item royo-mobile-cta royo-mobile-cta-address">';
    $extra .= '<a href="https://www.google.com/maps/place/Calle+Tesifonte+Gallego,+2,+02002+Albacete/" target="_blank" rel="noopener">';
    $extra .= '<span class="royo-mobile-cta__label">Tienda física</span>';
    $extra .= '<span class="royo-mobile-cta__value">' . esc_html(ROYO_MENU_ADDRESS) . '</span>';
    $extra .= '</a>';
    $extra .= '</li>';

    return $items . $extra;
}
