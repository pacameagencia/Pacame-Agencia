#!/usr/bin/env node
/**
 * Sprint 6B — Yoast SEO para las 15 páginas de Royo.
 *
 * Asigna focus keyword + meta title + meta description optimizados a cada
 * página WP. NO modifica el contenido (Sobre Nosotros / Contacto / Marcas
 * requieren plugin MU para reset Elementor — Sprint 5C aparte).
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... node tools/royo-content-drafts/seo/yoast-pages.mjs --apply
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0";
const dryRun = !process.argv.includes("--apply");

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) { console.error("ERROR: env"); process.exit(1); }
const auth = wpUser ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}` : null;

// Plan SEO por página: keyword + title + meta_desc
const PAGES_SEO = {
  // Inicio
  10820: {
    focuskw: "Joyería Royo Albacete",
    title: "Joyería Royo Albacete | Relojes Tissot, Longines y joyas oro",
    metaDesc: "Joyería Royo, joyería en Albacete con más de 50 años. Distribuidor oficial Tissot, Longines, Seiko, Casio y joyería de oro 18kt. Pásate.",
  },
  // Sobre Nosotros
  10796: {
    focuskw: "joyería en Albacete",
    title: "Sobre Joyería Royo · 50 años de joyería en Albacete",
    metaDesc: "Conoce Joyería Royo, joyería familiar en Albacete con más de 50 años. Distribuidores oficiales Tissot, Longines y joyería de oro 18kt artesanal.",
  },
  // Contacto
  10795: {
    focuskw: "joyería Albacete contacto",
    title: "Contacto · Joyería Royo Albacete | Tesifonte Gallego 2",
    metaDesc: "Visita Joyería Royo en Calle Tesifonte Gallego 2, Albacete. Llámanos al 967 21 79 03 o escríbenos. Atención personalizada con 50+ años.",
  },
  // Marcas
  10804: {
    focuskw: "marcas relojes Albacete",
    title: "Marcas oficiales · Joyería Royo Albacete",
    metaDesc: "Distribuidores oficiales de Tissot, Longines, Seiko, Casio, Hamilton, Oris, Citizen, Omega, MontBlanc y Victorinox. Garantía oficial en Joyería Royo.",
  },
  // Blog
  10789: {
    focuskw: "blog joyería relojería",
    title: "Blog · Joyería Royo Albacete | Guías de relojes y joyas",
    metaDesc: "Guías para elegir reloj, cuidado de joyas oro 18kt y consejos de joyero con 50 años de experiencia. Blog Joyería Royo Albacete.",
  },
  // Términos y Condiciones
  8888: {
    focuskw: "términos condiciones",
    title: "Términos y Condiciones · Joyería Royo Albacete",
    metaDesc: "Términos y condiciones de uso, compra y servicios de Joyería Royo, Albacete. Conoce tus derechos y obligaciones como cliente.",
  },
  // Aviso Legal
  8880: {
    focuskw: "aviso legal",
    title: "Aviso Legal · Joyería Royo Albacete",
    metaDesc: "Aviso legal de Joyería Royo Albacete. Información sobre titularidad, identificación, condiciones de uso y propiedad intelectual.",
  },
  // Política Privacidad
  6519: {
    focuskw: "política privacidad",
    title: "Política de Privacidad · Joyería Royo Albacete",
    metaDesc: "Política de privacidad de Joyería Royo. Cómo tratamos tus datos personales en cumplimiento del RGPD y la LOPDGDD.",
  },
  // Política Cookies
  6514: {
    focuskw: "política cookies",
    title: "Política de Cookies · Joyería Royo",
    metaDesc: "Política de cookies de Joyería Royo. Tipos de cookies utilizadas, finalidad y cómo gestionarlas en tu navegador.",
  },
  // Política Devolución
  6530: {
    focuskw: "política devolución",
    title: "Política de Devolución · Joyería Royo Albacete",
    metaDesc: "Política de devoluciones de Joyería Royo. 14 días para devolver tu compra. Conoce condiciones, plazos y método de reembolso.",
  },
  // Canal Ético
  7826: {
    focuskw: "canal ético",
    title: "Canal Ético · Joyería Royo Albacete",
    metaDesc: "Canal ético de Joyería Royo. Reporta cualquier irregularidad o conducta contraria a nuestros valores. Confidencial y seguro.",
  },
  // Wishlist (visible solo logueado)
  10826: {
    focuskw: "lista deseos joyería",
    title: "Mi lista de deseos · Joyería Royo Albacete",
    metaDesc: "Tu lista de deseos personalizada en Joyería Royo. Guarda tus relojes y joyas favoritas para volver a verlas más tarde.",
  },
  // My account
  10824: {
    focuskw: "mi cuenta Joyería Royo",
    title: "Mi cuenta · Joyería Royo Albacete",
    metaDesc: "Accede a tu cuenta de Joyería Royo. Consulta pedidos, gestiona tu información y revisa tus favoritos.",
  },
  // Checkout (Finalizar Pago)
  10823: {
    focuskw: "finalizar pago",
    title: "Finalizar pago · Joyería Royo Albacete",
    metaDesc: "Finaliza tu pedido en Joyería Royo. Pago seguro con Visa, Mastercard, AMEX, PayPal. Envío seguro a toda España.",
  },
  // Carrito
  10822: {
    focuskw: "carrito de compra",
    title: "Carrito de compra · Joyería Royo",
    metaDesc: "Tu carrito de compra en Joyería Royo Albacete. Revisa los productos seleccionados antes de finalizar.",
  },
};

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, ${Object.keys(PAGES_SEO).length} páginas`);

  let updated = 0, errors = 0;
  for (const [pageId, seo] of Object.entries(PAGES_SEO)) {
    console.log(`  [${dryRun ? "DRY" : "DO "}] page ${pageId} kw="${seo.focuskw}" title=${seo.title.length}c meta=${seo.metaDesc.length}c`);
    if (dryRun) continue;

    const url = `${WP_BASE}/wp-json/wp/v2/pages/${pageId}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({
        meta: {
          _yoast_wpseo_focuskw: seo.focuskw,
          _yoast_wpseo_title: seo.title,
          _yoast_wpseo_metadesc: seo.metaDesc,
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`    ERROR ${pageId}: ${res.status} ${text.slice(0, 150)}`);
      errors++;
    } else {
      updated++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n[done] updated=${updated} errors=${errors}`);
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
