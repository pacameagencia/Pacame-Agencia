#!/usr/bin/env node
/**
 * Sprint 6A — Yoast SEO tick verde para los 597 productos de Joyería Royo.
 *
 * Para cada producto:
 *   1. Calcula focus keyword tipo "{Marca} {Modelo} {Tamaño}".
 *   2. Reescribe SEO title con keyphrase al INICIO (≤60 chars).
 *   3. Reescribe meta description 130-155 chars con keyphrase + CTA.
 *   4. Extiende description del producto a ≥300 palabras con bloque adicional:
 *      - H3 "Sobre {keyword} en Joyería Royo"
 *      - Internal link a /categoria-producto/marcas/{slug}/
 *      - External link a sitio oficial marca (tissot.com, longines.com…)
 *      - Lista servicios Royo (garantía, envío, devolución, financiación)
 *   5. Marca robots noindex=0 / nofollow=0 explícitos.
 *
 * Sólo toca campos Yoast (meta_data) y `description` (content largo). NO toca
 * name, price, attributes, images, categories, sku.
 *
 * USO:
 *   ROYO_WP_USER="..." ROYO_WP_APP_PASS="..." \
 *     node tools/royo-content-drafts/seo/yoast-tick-verde.mjs --apply
 *
 *   Flags:
 *     --dry-run        Imprime cambios sin escribir (default si NO hay --apply)
 *     --apply          Aplica los cambios reales
 *     --limit=N        Limita a los N primeros productos
 *     --product=ID     Solo aplica al producto con ese ID
 *     --pause-ms=N     Pausa entre llamadas (default 250ms)
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
  return a ? parseInt(a.split("=")[1], 10) : 250;
})();

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error("ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.");
  process.exit(1);
}
const authHeader = wpUser && wpPass
  ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`
  : null;

// --- Marcas con sus sitios oficiales para external links ---
const BRAND_SITES = {
  Tissot: "https://www.tissotwatches.com/es-es/",
  Longines: "https://www.longines.com/es-es/",
  Seiko: "https://www.seikowatches.com/es-es/",
  Casio: "https://www.casio.com/es/",
  Hamilton: "https://www.hamiltonwatch.com/es-es/",
  Oris: "https://www.oris.ch/es/",
  Citizen: "https://www.citizenwatch.es/",
  Omega: "https://www.omegawatches.com/es-es/",
  MontBlanc: "https://www.montblanc.com/es-es/",
  "Mont Blanc": "https://www.montblanc.com/es-es/",
  Victorinox: "https://www.victorinox.com/es-ES/",
  Certina: "https://www.certina.com/es-es/",
  "Baume & Mercier": "https://www.baume-et-mercier.com/es-es/",
  Baume: "https://www.baume-et-mercier.com/es-es/",
  "Franck Muller": "https://www.franckmuller.com/",
  "Genius Watches": "https://geniuswatches.com/",
  Genius: "https://geniuswatches.com/",
  "Tsar Bomba": "https://tsarbombawatch.com/",
  "Roberto Demeglio": "https://www.robertodemeglio.com/",
};

const KNOWN_BRANDS = Object.keys(BRAND_SITES);
const JEWELRY_PREFIXES = [
  "Anillo", "Anillos", "Pendientes", "Pendiente", "Pulsera", "Pulseras",
  "Colgante", "Colgantes", "Gargantilla", "Gargantillas", "Solitario",
  "Cordón", "Cordon", "Gemelos", "Sortija", "Sortijas",
];

function inferBrand(name) {
  for (const b of KNOWN_BRANDS) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
}
function inferIsJewelry(name) {
  for (const p of JEWELRY_PREFIXES) {
    if (name.toLowerCase().startsWith(p.toLowerCase() + " ")) return true;
  }
  return false;
}

// Title Case respetando refs técnicas
const LOWER_WORDS = new Set(["of","y","de","la","el","los","las","the","and","or","con","en","a","an"]);
function titleCaseWord(word, isFirst) {
  if (/\d/.test(word)) return word;
  if (word.includes("-") && !/[-]\d|\d[-]/.test(word)) {
    return word.split("-").map((p, i) => titleCaseWord(p, isFirst && i === 0)).join("-");
  }
  const lower = word.toLowerCase();
  if (!isFirst && LOWER_WORDS.has(lower)) return lower;
  if (word.length <= 3 && /^[A-ZÁÉÍÓÚÑÜ]+$/.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
function smartTitleCase(text) {
  return text.split(/\s+/).map((w, i) => titleCaseWord(w, i === 0)).join(" ");
}

function extractSize(name) {
  const m = name.match(/(\d{2}(?:\.\d)?)\s*mm/i);
  return m ? m[0].replace(/\s+/g, "") : null;
}

function extractModel(name, brand) {
  // Quita la marca del nombre y devuelve el primer fragmento "modelo"
  let n = name;
  if (brand) n = n.replace(new RegExp(brand, "i"), "").trim();
  // Quita "Reloj " inicial
  n = n.replace(/^reloj\s+/i, "").trim();
  // Coge primeras 2-3 palabras significativas (sin refs largas)
  const tokens = n.split(/\s+/).filter(t => !/^[A-Z0-9]{6,}$/.test(t));
  return tokens.slice(0, 3).join(" ").trim();
}

function calcFocusKeyword(product) {
  const name = product.name || "";
  const brand = inferBrand(name);
  const isJewelry = inferIsJewelry(name);
  const size = extractSize(name);

  if (brand && !isJewelry) {
    const model = extractModel(name, brand);
    const parts = ["Reloj", brand, model].filter(Boolean);
    if (size) parts.push(size);
    return smartTitleCase(parts.join(" ").replace(/\s+/g, " ").trim());
  }
  if (isJewelry) {
    // primer prefijo + material si aparece
    const tokens = name.split(/\s+/).slice(0, 6).join(" ");
    return smartTitleCase(tokens);
  }
  return smartTitleCase(name.split(/\s+/).slice(0, 5).join(" "));
}

function calcSeoTitle(keyword, name) {
  // Keyphrase al inicio + " | Joyería Royo" (≤60 chars)
  const suffix = " | Joyería Royo";
  const maxKw = 60 - suffix.length;
  const kw = keyword.length > maxKw ? keyword.slice(0, maxKw - 1).trim() : keyword;
  return `${kw}${suffix}`;
}

function calcMetaDesc(keyword, brand, isJewelry) {
  // 130-155 chars con keyword + CTA
  let base;
  if (brand && !isJewelry) {
    base = `${keyword} oficial en Joyería Royo Albacete. Garantía oficial ${brand}, envío 24h, financiación sin intereses. Asesoramiento experto desde 1971.`;
  } else if (isJewelry) {
    base = `${keyword} en Joyería Royo Albacete. Diseño artesano, garantía, envío 24h y financiación. Asesoramiento personal de joyeros con 50 años de oficio.`;
  } else {
    base = `${keyword} en Joyería Royo Albacete. Producto original, garantía oficial, envío 24h y financiación sin intereses. Atención personalizada.`;
  }
  if (base.length > 155) base = base.slice(0, 154).trim() + "…";
  if (base.length < 130) base = base + " Pide cita en tienda.";
  return base.slice(0, 155);
}

function buildExtraContent(keyword, brand, isJewelry) {
  const slug = brand ? brand.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and") : null;
  const internalLink = slug
    ? `<a href="${WP_BASE}/categoria-producto/marcas/${slug}/">colección ${brand} en Joyería Royo</a>`
    : `<a href="${WP_BASE}/tienda/">catálogo Joyería Royo</a>`;
  const externalLink = brand && BRAND_SITES[brand]
    ? `<a href="${BRAND_SITES[brand]}" target="_blank" rel="nofollow noopener">sitio oficial ${brand}</a>`
    : null;

  const tipo = isJewelry ? "joya" : "reloj";
  const heading = `<h3>Sobre ${keyword} en Joyería Royo</h3>`;
  const intro = brand && !isJewelry
    ? `<p>Esta pieza forma parte de la colección oficial ${brand} disponible en Joyería Royo Albacete. Cada ${keyword} se entrega con la garantía internacional de ${brand} y con la atención personalizada que distingue a una joyería con más de 50 años de oficio. Si quieres ver más modelos, visita la ${internalLink} o consulta el ${externalLink} para conocer la historia y los movimientos de la marca.</p>`
    : isJewelry
      ? `<p>${keyword} elaborada con materiales nobles y acabado artesano. En Joyería Royo trabajamos cada ${tipo} con la atención y el oficio que solo aporta una joyería con más de 50 años en Albacete. Puedes ver más piezas en nuestro ${internalLink}.</p>`
      : `<p>${keyword} disponible en Joyería Royo Albacete con garantía oficial, envío 24h y financiación sin intereses. Consulta nuestro ${internalLink} para más opciones.</p>`;

  const services = `
<h3>Servicios Joyería Royo</h3>
<ul>
  <li><strong>Garantía oficial</strong> de marca${brand ? ` ${brand}` : ""} con servicio técnico autorizado.</li>
  <li><strong>Envío 24/48h</strong> a toda España con seguro y embalaje regalo.</li>
  <li><strong>Devolución gratuita</strong> hasta 30 días si no queda totalmente convencido.</li>
  <li><strong>Financiación sin intereses</strong> hasta 12 meses con SeQura y Aplazame.</li>
  <li><strong>Asesoramiento experto</strong> en tienda física en C. Tesifonte Gallego, 2, Albacete.</li>
</ul>
<p>Más de 50 años de oficio respaldan cada ${keyword} que entregamos. Si necesitas asesoramiento personal, escríbenos a <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a> o llámanos al <a href="tel:+34967217903">967 21 79 03</a>.</p>`;

  return `\n\n${heading}\n${intro}${services}`;
}

async function fetchProducts(page) {
  const url = `${WP_BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&_fields=id,name,slug,description,short_description,meta_data,categories`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader || "", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`fetch products page ${page}: ${res.status}`);
  return res.json();
}

async function updateProduct(id, payload) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${id}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`product ${id} update: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, limit=${limit === Infinity ? "all" : limit}, pause=${pauseMs}ms`);
  let processed = 0, updated = 0, errors = 0;

  for (let page = 1; page <= 10; page++) {
    const products = await fetchProducts(page);
    if (products.length === 0) break;

    for (const product of products) {
      if (processed >= limit) break;
      if (onlyProduct && product.id !== onlyProduct) continue;
      processed++;

      const name = product.name || "";
      const brand = inferBrand(name);
      const isJewelry = inferIsJewelry(name);
      const keyword = calcFocusKeyword(product);
      const seoTitle = calcSeoTitle(keyword, name);
      const metaDesc = calcMetaDesc(keyword, brand, isJewelry);

      // Extiende description si <300 palabras
      const currentDesc = product.description || "";
      const wordCount = currentDesc.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      const needsExtension = wordCount < 300 || !currentDesc.toLowerCase().includes(keyword.toLowerCase().split(" ")[0]);
      const extra = needsExtension ? buildExtraContent(keyword, brand, isJewelry) : "";
      const newDesc = currentDesc + extra;

      // Reconstruye meta_data Yoast (preserva otras claves)
      const yoastKeys = new Set([
        "_yoast_wpseo_focuskw",
        "_yoast_wpseo_title",
        "_yoast_wpseo_metadesc",
        "_yoast_wpseo_meta-robots-noindex",
        "_yoast_wpseo_meta-robots-nofollow",
      ]);
      const meta = (product.meta_data || []).filter((m) => !yoastKeys.has(m.key));
      meta.push({ key: "_yoast_wpseo_focuskw", value: keyword });
      meta.push({ key: "_yoast_wpseo_title", value: seoTitle });
      meta.push({ key: "_yoast_wpseo_metadesc", value: metaDesc });
      meta.push({ key: "_yoast_wpseo_meta-robots-noindex", value: "0" });
      meta.push({ key: "_yoast_wpseo_meta-robots-nofollow", value: "0" });

      console.log(`[${dryRun ? "DRY" : "DO "}] #${product.id} ${name.slice(0, 50)}`);
      console.log(`     kw="${keyword}" title="${seoTitle.slice(0, 60)}"`);
      console.log(`     meta="${metaDesc.slice(0, 80)}..." ext=${needsExtension ? "+" + extra.length + "ch" : "no"}`);

      if (!dryRun) {
        try {
          await updateProduct(product.id, { description: newDesc, meta_data: meta });
          updated++;
          await sleep(pauseMs);
        } catch (err) {
          console.error(`     ERROR: ${err.message}`);
          errors++;
          await sleep(pauseMs * 2);
        }
      } else {
        updated++;
      }
    }
    if (processed >= limit) break;
  }

  console.log(`\n[done] processed=${processed} updated=${updated} errors=${errors}`);
  if (dryRun) console.log("[done] DRY-RUN — añade --apply para aplicar.");
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
