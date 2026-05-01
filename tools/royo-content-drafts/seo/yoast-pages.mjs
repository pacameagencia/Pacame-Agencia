#!/usr/bin/env node
/**
 * Sprint 6B — Yoast SEO tick verde para las 15 páginas de Joyería Royo.
 *
 * Para cada página WP (post_type=page):
 *   - Asigna focus keyword fija según slug/título.
 *   - Reescribe SEO title con keyword al inicio.
 *   - Reescribe meta description 130-155 chars con keyword + CTA Albacete.
 *
 * No toca el contenido (post_content) — solo Yoast meta_data.
 * El contenido lo manejamos en otros sprints (1A/B/D, 5C).
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node tools/royo-content-drafts/seo/yoast-pages.mjs --apply
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error("ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.");
  process.exit(1);
}
const authHeader = wpUser && wpPass
  ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`
  : null;

// Mapa slug→{focuskw, title, metadesc}
const PAGES_SEO = {
  "politica-de-cookies": {
    kw: "política de cookies",
    title: "Política de cookies | Joyería Royo Albacete",
    desc: "Política de cookies de Joyería Royo. Información transparente sobre cookies que utilizamos en joyeriaroyo.com y cómo gestionar tus preferencias.",
  },
  "politica-de-privacidad": {
    kw: "política de privacidad",
    title: "Política de privacidad | Joyería Royo Albacete",
    desc: "Política de privacidad de Joyería Royo Albacete. Cómo tratamos tus datos según el RGPD: finalidad, base legal, derechos y conservación.",
  },
  "politica-de-devolucion": {
    kw: "política de devolución",
    title: "Política de devolución | Joyería Royo Albacete",
    desc: "Política de devolución de Joyería Royo: 30 días para devolver, reembolso íntegro y envío gratuito en cambios y devoluciones a toda España.",
  },
  "canal-etico": {
    kw: "canal ético",
    title: "Canal ético | Joyería Royo Albacete",
    desc: "Canal ético de Joyería Royo. Comunica conductas irregulares de forma confidencial y segura, según directiva UE 2019/1937.",
  },
  "aviso-legal": {
    kw: "aviso legal",
    title: "Aviso legal | Joyería Royo Albacete",
    desc: "Aviso legal de joyeriaroyo.com. Datos identificativos, condiciones de uso, propiedad intelectual y responsabilidad de Joyería Royo Albacete.",
  },
  "terminos-y-condiciones": {
    kw: "términos y condiciones",
    title: "Términos y condiciones | Joyería Royo Albacete",
    desc: "Términos y condiciones de venta en Joyería Royo Albacete. Pago seguro, envíos 24/48h, garantía oficial y devolución 30 días.",
  },
  "blog": {
    kw: "blog joyería relojería",
    title: "Blog joyería relojería | Joyería Royo Albacete",
    desc: "Blog de joyería y relojería de Joyería Royo Albacete. Guías de compra, cuidados, tendencias y asesoramiento de joyeros con 50 años de oficio.",
  },
  "contacto-joyeria-royo-albacete": {
    kw: "joyería Albacete contacto",
    title: "Joyería Albacete contacto · Joyería Royo",
    desc: "Joyería Albacete contacto: C. Tesifonte Gallego 2, 967 21 79 03, jroyo@joyeriaroyo.com. Visita Joyería Royo en Albacete capital.",
  },
  "sobre-nosotros-joyeria-albacete": {
    kw: "joyería en Albacete",
    title: "Joyería en Albacete · Sobre Joyería Royo",
    desc: "Joyería en Albacete con más de 50 años de oficio. Joyería Royo: marcas oficiales de relojes, joyas artesanas y atención personalizada en Albacete.",
  },
  "marcas-joyeria-royo-en-albacete": {
    kw: "marcas relojes Albacete",
    title: "Marcas relojes Albacete | Joyería Royo",
    desc: "Marcas de relojes oficiales en Albacete: Tissot, Longines, Seiko, Casio, Hamilton, Oris, Omega y más. Joyería Royo, tienda oficial multimarca.",
  },
  "inicio": {
    kw: "Joyería Royo Albacete",
    title: "Joyería Royo Albacete · Relojes y joyas oficiales",
    desc: "Joyería Royo Albacete: relojes oficiales Tissot, Longines, Seiko, Casio y joyas artesanas. Garantía oficial, envío 24h y financiación sin intereses.",
  },
  "cart": {
    kw: "carrito Joyería Royo",
    title: "Carrito | Joyería Royo Albacete",
    desc: "Carrito de Joyería Royo Albacete. Revisa tu pedido, aplica códigos descuento y finaliza compra con envío 24h a toda España.",
  },
  "checkout": {
    kw: "finalizar pedido Joyería Royo",
    title: "Finalizar pedido | Joyería Royo Albacete",
    desc: "Finalizar pedido en Joyería Royo Albacete. Pago seguro con tarjeta, Bizum, transferencia y financiación SeQura sin intereses hasta 12 meses.",
  },
  "my-account": {
    kw: "mi cuenta Joyería Royo",
    title: "Mi cuenta | Joyería Royo Albacete",
    desc: "Mi cuenta en Joyería Royo Albacete. Accede a tus pedidos, dirección de envío, lista de deseos y datos personales en un solo lugar.",
  },
  "wishlist": {
    kw: "lista deseos Joyería Royo",
    title: "Lista de deseos | Joyería Royo Albacete",
    desc: "Lista de deseos en Joyería Royo Albacete. Guarda tus relojes y joyas favoritos para volver a ellos cuando quieras y recibir alertas.",
  },
};

async function fetchPages() {
  const url = `${WP_BASE}/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,title,meta`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader || "", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`fetch pages: ${res.status}`);
  return res.json();
}

async function updatePageMeta(id, meta) {
  const url = `${WP_BASE}/wp-json/wp/v2/pages/${id}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ meta }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`page ${id}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}`);
  const pages = await fetchPages();
  console.log(`[fetch] ${pages.length} páginas WP encontradas.`);

  let updated = 0, skipped = 0, errors = 0;

  for (const page of pages) {
    const seo = PAGES_SEO[page.slug];
    if (!seo) {
      console.log(`[skip] ${page.id} slug="${page.slug}" — sin mapping`);
      skipped++;
      continue;
    }

    const meta = {
      _yoast_wpseo_focuskw: seo.kw,
      _yoast_wpseo_title: seo.title,
      _yoast_wpseo_metadesc: seo.desc,
      "_yoast_wpseo_meta-robots-noindex": "0",
      "_yoast_wpseo_meta-robots-nofollow": "0",
    };

    console.log(`[${dryRun ? "DRY" : "DO "}] page ${page.id} "${page.slug}" kw="${seo.kw}"`);

    if (!dryRun) {
      try {
        await updatePageMeta(page.id, meta);
        updated++;
        await sleep(200);
      } catch (err) {
        console.error(`     ERROR: ${err.message}`);
        errors++;
      }
    } else {
      updated++;
    }
  }

  console.log(`\n[done] updated=${updated} skipped=${skipped} errors=${errors}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
