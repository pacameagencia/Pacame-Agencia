<?php
/**
 * PACAME — Single product enrichment para Royo (estilo Joyeria Suarez).
 *
 * Inyecta bloques HTML alta gama en el single product de WooCommerce:
 * - Subtitulo descriptivo (basado en atributos Woo).
 * - Trust Bar premium (4 iconos: distribuidor oficial / garantia / envio / devolucion).
 * - CTAs duales (carrito + WhatsApp).
 * - Atencion personalizada (telefono Royo + direccion).
 * - Distribuidor oficial badge (basado en marca detectada).
 * - Banner brand lifestyle.
 *
 * Hooks usados (prioridades elegidas para orden visual correcto):
 * - woocommerce_single_product_summary @ 6  -> subtitulo (despues de title @ 5)
 * - woocommerce_single_product_summary @ 25 -> trust bar (despues de price @ 10)
 * - woocommerce_single_product_summary @ 35 -> CTA dual (despues de add-to-cart @ 30)
 * - woocommerce_single_product_summary @ 45 -> atencion personalizada
 * - woocommerce_after_single_product_summary @ 5 -> distribuidor oficial badge
 * - woocommerce_after_single_product @ 15 -> banner brand lifestyle
 */

if (!defined('ABSPATH')) {
    exit;
}

// Datos del cliente Royo (verificados en memoria PACAME 2026-05-07)
define('ROYO_PHONE', '+34 967 21 79 03');
define('ROYO_PHONE_DISPLAY', '967 21 79 03');
define('ROYO_WHATSAPP', '34967217903');
define('ROYO_ADDRESS', 'C. Tesifonte Gallego, 2 — Albacete');
define('ROYO_EMAIL', 'jroyo@joyeriaroyo.com');

// Marcas con las que Royo es distribuidor oficial verificado
function royo_official_brands() {
    return array(
        'Tissot', 'Longines', 'Casio', 'Seiko', 'Citizen', 'Hamilton',
        'Oris', 'Certina', 'MontBlanc', 'Mont Blanc', 'Victorinox',
        'Baume & Mercier', 'Franck Muller', 'Omega', 'Tsar Bomba',
        'Genius Watches', 'Roberto Demeglio'
    );
}

/* ============================================================
 * Helper: detectar marca del producto por categoria o nombre.
 * ============================================================ */
function royo_detect_brand($product) {
    if (!$product || !is_object($product)) {
        return null;
    }
    $cats = wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'names'));
    if (is_wp_error($cats)) {
        $cats = array();
    }
    foreach (royo_official_brands() as $b) {
        if (in_array($b, $cats, true)) {
            return $b;
        }
    }
    $name = $product->get_name();
    foreach (royo_official_brands() as $b) {
        if (stripos($name, $b) !== false) {
            return $b;
        }
    }
    return null;
}

/* ============================================================
 * 1. Subtitulo descriptivo
 * ============================================================ */
add_action('woocommerce_single_product_summary', 'royo_inject_subtitle', 6);
function royo_inject_subtitle() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    $parts = array();
    $movement = $product->get_attribute('Movimiento');
    $tamano = $product->get_attribute('Tamaño caja');
    $material = $product->get_attribute('Material caja');
    if ($movement) {
        $parts[] = 'Reloj ' . $movement;
    }
    if ($tamano) {
        $parts[] = $tamano;
    }
    if ($material) {
        $parts[] = $material;
    }
    if (empty($parts)) {
        return;
    }
    echo '<div class="royo-product-subtitle">' . esc_html(implode(' · ', $parts)) . '</div>';
}

/* ============================================================
 * 2. Trust Bar (4 iconos)
 * ============================================================ */
add_action('woocommerce_single_product_summary', 'royo_inject_trust_bar', 25);
function royo_inject_trust_bar() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    $brand = royo_detect_brand($product);
    $brand_label = $brand ? esc_html('Distribuidor oficial ' . $brand) : 'Distribuidor autorizado';
    ?>
    <div class="royo-trust-bar">
        <div class="royo-trust-bar__item">
            <span class="royo-trust-bar__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
            </span>
            <span class="royo-trust-bar__label"><?php echo $brand_label; ?></span>
        </div>
        <div class="royo-trust-bar__item">
            <span class="royo-trust-bar__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
            </span>
            <span class="royo-trust-bar__label">Garantía oficial<br/>de marca</span>
        </div>
        <div class="royo-trust-bar__item">
            <span class="royo-trust-bar__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 7h13v10H3z"/>
                    <path d="M16 10h4l1 3v4h-5"/>
                    <circle cx="6.5" cy="17.5" r="1.5"/>
                    <circle cx="18.5" cy="17.5" r="1.5"/>
                </svg>
            </span>
            <span class="royo-trust-bar__label">Envío<br/>asegurado</span>
        </div>
        <div class="royo-trust-bar__item">
            <span class="royo-trust-bar__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 3-6.7"/>
                    <path d="M3 4v5h5"/>
                </svg>
            </span>
            <span class="royo-trust-bar__label">Devolución<br/>14 días</span>
        </div>
    </div>
    <?php
}

/* ============================================================
 * 3. CTA secundario WhatsApp (junto al "Anadir al carrito")
 * El "Anadir al carrito" lo renderiza WC en @ 30. Este se anade despues
 * via wrapper.
 * ============================================================ */
add_action('woocommerce_single_product_summary', 'royo_inject_dual_cta_open', 29);
function royo_inject_dual_cta_open() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    echo '<div class="royo-cta-group">';
}

add_action('woocommerce_single_product_summary', 'royo_inject_dual_cta_close', 31);
function royo_inject_dual_cta_close() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    $name = $product->get_name();
    $sku = $product->get_sku();
    $msg_text = "Hola, me interesa el " . $name;
    if ($sku) {
        $msg_text .= " (Ref. " . $sku . ")";
    }
    $msg_text .= ". ¿Podrían enviarme más información?";
    $wa = "https://wa.me/" . ROYO_WHATSAPP . "?text=" . rawurlencode($msg_text);
    ?>
        <a href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener" class="royo-cta-whatsapp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.149-.669.15-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
            </svg>
            Consultar por WhatsApp
        </a>
    </div>
    <?php
}

/* ============================================================
 * 4. Atencion personalizada (debajo del CTA dual)
 * ============================================================ */
add_action('woocommerce_single_product_summary', 'royo_inject_personal_service', 45);
function royo_inject_personal_service() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    ?>
    <div class="royo-personal-service">
        <span class="royo-personal-service__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2h-7l-4 4v-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        </span>
        <div>
            <p class="royo-personal-service__title">Atención personalizada</p>
            <p class="royo-personal-service__text">
                Llama al <a href="tel:<?php echo esc_attr(str_replace(' ', '', ROYO_PHONE)); ?>"><?php echo esc_html(ROYO_PHONE_DISPLAY); ?></a> o pasa por nuestra tienda en <?php echo esc_html(ROYO_ADDRESS); ?>. Recogida en mano si lo prefieres.
            </p>
        </div>
    </div>
    <?php
}

/* ============================================================
 * 5. Distribuidor oficial badge (despues del summary)
 * ============================================================ */
add_action('woocommerce_after_single_product_summary', 'royo_inject_official_dealer', 5);
function royo_inject_official_dealer() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    $brand = royo_detect_brand($product);
    if (!$brand) {
        return;
    }
    ?>
    <section class="royo-official-dealer">
        <div class="royo-official-dealer__brand"><?php echo esc_html(strtoupper($brand)); ?></div>
        <h2 class="royo-official-dealer__title">Distribuidor Oficial</h2>
        <p class="royo-official-dealer__text">
            Joyería Royo es punto de venta autorizado de <?php echo esc_html($brand); ?>.
            Cada pieza incluye la garantía oficial de la marca y certificado de autenticidad.
            Más de 50 años acompañando a generaciones de familias albaceteñas en cada momento importante.
        </p>
    </section>
    <?php
}

/* ============================================================
 * 6. Banner brand lifestyle (al final del producto)
 * ============================================================ */
add_action('woocommerce_after_single_product', 'royo_inject_brand_banner', 15);
function royo_inject_brand_banner() {
    global $product;
    if (!$product || !is_object($product)) {
        return;
    }
    $brand = royo_detect_brand($product);
    if (!$brand) {
        return;
    }
    ?>
    <section class="royo-brand-banner">
        <div class="royo-brand-banner__overline">Tradición en alta relojería</div>
        <h2 class="royo-brand-banner__title">El arte de la precisión, en tu muñeca</h2>
        <p class="royo-brand-banner__text">
            Descubre el catálogo completo de <?php echo esc_html($brand); ?> en Joyería Royo.
            Asesoramiento experto, garantía oficial y la confianza de más de medio siglo en el centro de Albacete.
        </p>
    </section>
    <?php
}
