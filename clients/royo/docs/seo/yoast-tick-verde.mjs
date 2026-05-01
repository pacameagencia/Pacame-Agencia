#!/usr/bin/env node
/**
 * Sprint 6A — Yoast SEO tick verde para todos los productos Royo.
 *
 * Por cada producto aplica:
 *   1. focus keyword (`_yoast_wpseo_focuskw`) con keyphrase corta tipo
 *      "{Marca} {Modelo}" (ej: "Tissot PRX 40mm" sin SKU para mejor densidad).
 *   2. title con keyphrase al INICIO (Yoast premia eso para tick verde).
 *   3. meta description optimizada 130-155 chars con keyphrase + CTA.
 *   4. extiende `description` HTML si <300 palabras añadiendo:
 *      - párrafo de marca + link interno a /categoria-producto/marcas/{slug}/
 *      - link externo a sitio oficial marca
 *      - mención local "Joyería Royo Albacete distribuidor oficial"
 *   5. mantiene atributos Woo y resto de campos intactos.
 *
 * USO:
 *   ROYO_WP_USER="..." ROYO_WP_APP_PASS="..." \
 *     node tools/royo-content-drafts/seo/yoast-tick-verde.mjs [flags]
 *
 *   --dry-run / --apply / --limit=N / --product=ID / --pause-ms=N
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");
const limit = (() => {
  const a = args.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1], 10) : Infinity;
})();
const onlyProduct = (() => {
  const a = args.find((x) => x.startsWith("--product="));
  return a ? parseInt(a.split("=")[1], 10) : null;
})();
const pauseMs = (() => {
  const a = args.find((x) => x.startsWith("--pause-ms="));
  return a ? parseInt(a.split("=")[1], 10) : 350;
})();

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error("ERROR: --apply necesita ROYO_WP_USER + ROYO_WP_APP_PASS env.");
  process.exit(1);
}
const authHeader = wpUser && wpPass
  ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`
  : null;

// =============================================================================
//  Marcas + sus URLs oficiales (para external link Yoast tick verde)
// =============================================================================
const BRAND_OFFICIAL_URL = {
  Tissot: "https://www.tissot.com",
  Longines: "https://www.longines.com",
  Seiko: "https://www.seikowatches.com",
  Casio: "https://www.casio.com",
  Hamilton: "https://www.hamiltonwatch.com",
  Oris: "https://www.oris.ch",
  Citizen: "https://www.citizenwatch.com",
  Omega: "https://www.omegawatches.com",
  MontBlanc: "https://www.montblanc.com",
  "Mont Blanc": "https://www.montblanc.com",
  Victorinox: "https://www.victorinox.com",
  Certina: "https://www.certina.com",
  "Baume & Mercier": "https://www.baume-et-mercier.com",
  "Franck Muller": "https://www.franckmuller.com",
  "Genius Watches": "https://www.geniuswatches.com",
  "Tsar Bomba": "https://tsarbombawatch.com",
  "Roberto Demeglio": "https://www.robertodemeglio.com",
};

const BRAND_CATEGORY_SLUG = {
  Tissot: "tissot",
  Longines: "longines",
  Seiko: "seiko",
  Casio: "casio",
  Hamilton: "hamilton",
  Oris: "oris",
  Citizen: "citizen",
  Omega: "omega",
  MontBlanc: "montblanc",
  "Mont Blanc": "montblanc",
  Victorinox: "victorinox",
  Certina: "certina",
  "Baume & Mercier": "baume-mercier",
  "Franck Muller": "franck-muller",
  "Genius Watches": "genius-watches",
  "Tsar Bomba": "tsar-bomba",
  "Roberto Demeglio": "roberto-demeglio",
};

const KNOWN_BRANDS = Object.keys(BRAND_OFFICIAL_URL);
const JEWELRY_CATS = ["Joyas", "Anillos", "Pendientes", "Pulseras", "Colgantes", "Gargantillas"];

// =============================================================================
//  Utilidades
// =============================================================================
function detectBrand(product) {
  for (const c of product.categories || []) {
    if (KNOWN_BRANDS.includes(c.name)) return c.name;
  }
  const n = (product.name || "").toLowerCase();
  for (const b of KNOWN_BRANDS) {
    if (n.includes(b.toLowerCase())) return b;
  }
  return null;
}

function detectIsJewelry(product) {
  const cats = (product.categories || []).map((c) => c.name);
  return cats.some((c) => JEWELRY_CATS.includes(c));
}

function extractSizeFromName(name) {
  const m = (name || "").match(/(\d{2}(?:[.,]\d)?)\s*mm/i);
  return m ? Math.round(parseFloat(m[1].replace(",", "."))) + "mm" : null;
}

function extractModelFromName(name, brand) {
  // Quita "Reloj " inicial, quita la marca, quita SKU largo (>10 chars con números)
  let n = (name || "").replace(/^Reloj\s+/i, "").trim();
  if (brand) n = n.replace(new RegExp("^" + brand + "\\s+", "i"), "").trim();
  // Quita SKU final tipo T1374101701100 / L34304029 / GG-B100X-1AER (refs >7 chars con dígitos)
  n = n.replace(/\s+[A-Z0-9.\-]{7,}\s*$/i, "").trim();
  return n.slice(0, 40);
}

function countWords(text) {
  return (text || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter((w) => w.length > 1).length;
}

function htmlContainsLinkTo(html, url) {
  return (html || "").includes(`href="${url}`) || (html || "").includes(`href='${url}`);
}

// =============================================================================
//  Generador
// =============================================================================
function generateYoastPayload(product) {
  const brand = detectBrand(product);
  const isJewelry = detectIsJewelry(product);
  const size = extractSizeFromName(product.name);

  // ===== FOCUS KEYWORD =====
  let focusKw;
  if (brand && !isJewelry) {
    const model = extractModelFromName(product.name, brand);
    focusKw = `${brand} ${model}${size ? " " + size : ""}`.trim();
  } else if (isJewelry) {
    // Joyas: "{tipo} {material}" — ej "Anillo Oro 18kt"
    const n = product.name.replace(/^Reloj\s+/i, "");
    const firstWords = n.split(/\s+/).slice(0, 3).join(" ");
    focusKw = firstWords;
  } else {
    focusKw = product.name.split(/\s+/).slice(0, 3).join(" ");
  }
  // Limitar a 4 palabras max para que Yoast detecte densidad
  focusKw = focusKw.split(/\s+/).slice(0, 4).join(" ").trim();

  // ===== META TITLE (keyphrase al INICIO, ≤60 chars) =====
  let title;
  if (brand && !isJewelry) {
    title = `${focusKw} | Joyería Royo Albacete`;
  } else if (isJewelry) {
    title = `${focusKw} en Joyería Royo Albacete`;
  } else {
    title = `${focusKw} | Joyería Royo`;
  }
  if (title.length > 60) title = title.slice(0, 57) + "...";

  // ===== META DESCRIPTION (130-155 chars, con keyphrase) =====
  let metaDesc;
  if (brand && !isJewelry) {
    const officialMarker = brand === "Tissot" ? "Distribuidor oficial Tissot" : `Distribuidor oficial ${brand}`;
    metaDesc = `${focusKw} con garantía oficial. ${officialMarker} en Albacete · Joyería Royo, 50+ años. Envío seguro a toda España.`;
  } else if (isJewelry) {
    metaDesc = `${focusKw} en Joyería Royo Albacete. Joyería con más de 50 años, tasación, garantía y financiación. Envío a toda España.`;
  } else {
    metaDesc = `${focusKw} disponible en Joyería Royo, Albacete capital. Más de 50 años de experiencia en joyería y relojería.`;
  }
  // Ajustar a 120-155 chars
  if (metaDesc.length > 155) metaDesc = metaDesc.slice(0, 152) + "...";

  // ===== EXTENSIÓN DESCRIPTION si <300 palabras =====
  const currentDesc = product.description || "";
  const wordCount = countWords(currentDesc);
  let newDesc = currentDesc;

  if (wordCount < 300 || !htmlContainsLinkTo(currentDesc, "joyeriaroyo.com/categoria-producto") || (brand && !htmlContainsLinkTo(currentDesc, BRAND_OFFICIAL_URL[brand]))) {
    // Construir bloque extra SEO
    let extraBlock = "\n\n";
    extraBlock += `<h3>Sobre ${focusKw} en Joyería Royo</h3>\n`;

    if (brand && !isJewelry) {
      const officialUrl = BRAND_OFFICIAL_URL[brand];
      const catSlug = BRAND_CATEGORY_SLUG[brand];
      extraBlock += `<p>El <strong>${focusKw}</strong> forma parte de la colección <a href="/categoria-producto/marcas/${catSlug}/" title="Ver toda la colección ${brand}">${brand}</a> en <strong>Joyería Royo Albacete</strong>, distribuidor oficial autorizado con garantía de fábrica completa. Te lo entregamos en su estuche original con todos los certificados.</p>\n`;
      extraBlock += `<p>Si quieres conocer todas las novedades del catálogo oficial, visita el sitio web de <a href="${officialUrl}" target="_blank" rel="noopener noreferrer">${brand}</a>. En nuestra tienda física en Calle Tesifonte Gallego, 2, Albacete, puedes verlo, probarlo y resolver cualquier duda con nuestros joyeros con más de 50 años de experiencia.</p>\n`;
      extraBlock += `<h3>Por qué comprar tu ${brand} en Joyería Royo</h3>\n<ul>\n  <li><strong>Garantía oficial</strong> ${brand} de 2 años + servicio postventa propio.</li>\n  <li><strong>Asesoramiento personalizado</strong> de un joyero con experiencia.</li>\n  <li><strong>Envío seguro</strong> a toda España con seguimiento.</li>\n  <li><strong>Devolución 14 días</strong> sin preguntas.</li>\n  <li><strong>Financiación</strong> hasta 24 meses sin intereses (consultar).</li>\n</ul>\n`;
    } else if (isJewelry) {
      extraBlock += `<p>Estos <strong>${focusKw}</strong> forman parte de la colección de <a href="/categoria-producto/joyas/" title="Ver toda la joyería">joyería Royo</a>. Trabajamos con piedras certificadas y oro 18kt de máxima calidad. En nuestra tienda física en <strong>Calle Tesifonte Gallego, 2, Albacete</strong> puedes verla, probarla y conocer su origen y certificados.</p>\n`;
      extraBlock += `<p>Para entender mejor la calidad del oro 18kt, las piedras y la artesanía joyera, visita la <a href="https://www.gia.edu/ES" target="_blank" rel="noopener noreferrer">Gemological Institute of America</a>, autoridad mundial en gemología.</p>\n`;
      extraBlock += `<h3>Servicios de joyería en Royo</h3>\n<ul>\n  <li><strong>Tasación gratuita</strong> con criterio y transparencia.</li>\n  <li><strong>Diseño a medida</strong> para piezas únicas.</li>\n  <li><strong>Reparación y mantenimiento</strong> en taller propio.</li>\n  <li><strong>Garantía y certificado de origen</strong> en cada pieza.</li>\n  <li><strong>Envío seguro</strong> a toda España.</li>\n</ul>\n`;
    }
    newDesc = currentDesc + extraBlock;
  }

  // ===== Payload final =====
  return {
    payload: {
      description: newDesc,
      meta_data: [
        { key: "_yoast_wpseo_focuskw", value: focusKw },
        { key: "_yoast_wpseo_title", value: title },
        { key: "_yoast_wpseo_metadesc", value: metaDesc },
        { key: "_yoast_wpseo_meta-robots-noindex", value: "0" },
        { key: "_yoast_wpseo_meta-robots-nofollow", value: "0" },
      ],
    },
    debug: {
      focusKw,
      brand: brand || "?",
      isJewelry,
      titleLen: title.length,
      metaLen: metaDesc.length,
      origWords: wordCount,
      extended: newDesc !== currentDesc,
    },
  };
}

// =============================================================================
//  Fetch + Apply
// =============================================================================
async function fetchAllProducts() {
  console.log("[fetch] Cargando productos...");
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,description,categories`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`fetch page ${page}: ${res.status}`);
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  console.log(`[fetch] OK ${all.length} productos.`);
  return all;
}

async function fetchProductById(id) {
  const url = `${WP_BASE}/wp-json/wc/store/v1/products?include=${id}&_fields=id,name,sku,description,categories`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function applyUpdate(productId, payload) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`product ${productId}: ${res.status} ${text.slice(0, 150)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
//  Main
// =============================================================================
async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, limit=${limit === Infinity ? "all" : limit}, pause=${pauseMs}ms${onlyProduct ? `, only-product=${onlyProduct}` : ""}`);

  let products;
  if (onlyProduct) {
    const p = await fetchProductById(onlyProduct);
    if (!p) { console.error(`Producto ${onlyProduct} no encontrado`); process.exit(1); }
    products = [p];
  } else {
    products = await fetchAllProducts();
  }

  let processed = 0, updated = 0, errors = 0, extended = 0;
  const stats = { byBrand: {} };

  for (const product of products) {
    if (processed >= limit) break;
    processed++;

    const result = generateYoastPayload(product);
    if (result.debug.extended) extended++;
    const b = result.debug.brand;
    stats.byBrand[b] = (stats.byBrand[b] || 0) + 1;

    if (processed % 50 === 0 || processed <= 3) {
      console.log(`  [${dryRun ? "DRY" : "DO "}] #${processed}/${products.length} id=${product.id} kw="${result.debug.focusKw}" title=${result.debug.titleLen}c meta=${result.debug.metaLen}c words=${result.debug.origWords} ext=${result.debug.extended}`);
    }

    if (!dryRun) {
      try {
        await applyUpdate(product.id, result.payload);
        updated++;
        await sleep(pauseMs);
      } catch (err) {
        console.error(`  ERROR ${product.id}: ${err.message}`);
        errors++;
        await sleep(pauseMs * 2);
      }
    } else {
      updated++;
    }
  }

  console.log(`\n[done] processed=${processed} updated=${updated} errors=${errors} extended-content=${extended}`);
  console.log(`[stats] por marca:`, JSON.stringify(stats.byBrand));
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
