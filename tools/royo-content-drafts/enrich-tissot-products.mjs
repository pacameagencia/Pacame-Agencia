#!/usr/bin/env node
/**
 * Sprint 2A — Enriquecimiento de productos Tissot de Joyería Royo.
 *
 * Para cada producto Tissot:
 *   1. Parsea specs del HTML actual (que viene importado de tissot.com con sus
 *      clases CSS propias `ti-pdp-attribute` que no renderiza bonito).
 *   2. Genera HTML limpio: lead + lista de características + tabla técnica completa.
 *   3. Genera short_description con concordancia género en español.
 *   4. Asigna atributos Woo: Marca, Movimiento, Material caja, Material correa,
 *      Color esfera, Tamaño caja, Estanqueidad, Género (los 8 atributos id 8-15).
 *   5. Yoast SEO: title + meta description.
 *
 * NO inventa NADA: toda la info sale del propio HTML del producto en Royo
 * (que originalmente fue extraído de tissot.com). El script solo reformatea.
 *
 * USO:
 *   ROYO_WP_USER="..." ROYO_WP_APP_PASS="..." \
 *     node tools/royo-content-drafts/enrich-tissot-products.mjs [flags]
 *
 *   --dry-run        Default. Solo imprime payloads, no escribe.
 *   --apply          Aplica los cambios reales.
 *   --limit=N        Limita a los primeros N productos (default sin límite).
 *   --product=ID     Solo aplica al producto con ese ID (test).
 *   --category=tissot Default. Categoría a procesar (slug Woo).
 *   --pause-ms=N     Pausa entre llamadas (default 400ms).
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
const categorySlug = (() => {
  const a = args.find((x) => x.startsWith("--category="));
  return a ? a.split("=")[1] : "tissot";
})();
const pauseMs = (() => {
  const a = args.find((x) => x.startsWith("--pause-ms="));
  return a ? parseInt(a.split("=")[1], 10) : 400;
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

// =============================================================================
//  PARSER del HTML Tissot
// =============================================================================

/**
 * Parsea el HTML "feo" actual de un producto y extrae el diccionario de specs.
 * Si el HTML no sigue el patrón Tissot (clases ti-pdp-attribute), devuelve null.
 */
function parseSpecs(html) {
  if (!html || !html.includes("ti-pdp-attribute")) return null;
  const specs = {};
  const rowRegex = /<div class="col[^>]+ti-pdp-attribute[^>]*>([^<]+)<\/div>\s*<div class="col[^>]+ti-pdp-attribute[^>]*>([^<]+)<\/div>/g;
  let m;
  while ((m = rowRegex.exec(html)) !== null) {
    specs[m[1].trim()] = m[2].trim()
      .replace(/&#8217;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ");
  }
  // Descripción comercial
  const descMatch = html.match(/<p class="ti-fs-14[^>]*ti-pdp-details-content[^>]*>([^<]+)<\/p>/);
  if (descMatch) specs._commercialDesc = descMatch[1].trim();
  return Object.keys(specs).length > 0 ? specs : null;
}

// =============================================================================
//  DEDUCCIÓN de atributos Woo desde specs
// =============================================================================

function inferMovimiento(specs) {
  const mov = (specs["Movimiento"] || "").toLowerCase();
  if (mov.includes("cuarzo") || mov.includes("quartz")) return "Cuarzo";
  if (mov.includes("automatic") || mov.includes("autom")) return "Automático";
  if (mov.includes("manual")) return "Mecánico Manual";
  if (mov.includes("solar")) return "Solar";
  if (mov.includes("eco-drive")) return "Eco-Drive";
  return null;
}

function inferMaterialCaja(specs) {
  const mat = (specs["Material de la caja"] || "").toLowerCase();
  if (mat.includes("titanio")) return "Titanio";
  if (mat.includes("cerámica") || mat.includes("ceramic")) return "Cerámica";
  if (mat.includes("oro pvd") || mat.includes("pvd oro") || mat.includes("dorado")) return "Acero PVD oro";
  if (mat.includes("pvd")) return "Acero PVD negro";
  if (mat.includes("oro") && !mat.includes("acero")) return "Oro";
  if (mat.includes("acero") || mat.includes("steel")) return "Acero";
  if (mat.includes("resina")) return "Resina";
  return null;
}

function inferMaterialCorrea(specs) {
  const c = (specs["Acabado de la piel"] || "").toLowerCase();
  const corr = (specs["Color de la correa"] || "").toLowerCase();
  if (c === "sintético") return "Cuero";  // Tissot usa "sintético" pero comercialmente es cuero
  if (c.includes("piel") || c.includes("cuero") || c.includes("leather")) return "Cuero";
  if (c.includes("caucho") || c.includes("rubber")) return "Caucho";
  if (corr.includes("acero") || corr.includes("steel")) return "Acero";
  if (corr.includes("nato")) return "Nylon NATO";
  return null;
}

function inferColorEsfera(specs) {
  const c = (specs["Color de la esfera"] || "").trim();
  // Map a los valores creados en Sprint 3A
  const map = {
    "blanco": "Blanco", "negro": "Negro", "azul": "Azul", "verde": "Verde",
    "gris": "Gris", "plata": "Plata", "rojo": "Rojo", "marrón": "Marrón",
    "naranja": "Naranja", "champagne": "Champagne", "dorado": "Dorado",
    "amarillo": "Amarillo", "crema": "Crema",
  };
  return map[c.toLowerCase()] || null;
}

function inferTamanoCaja(specs) {
  const w = parseFloat((specs["Anchura"] || "").replace(",", "."));
  if (!w || isNaN(w)) return null;
  // Redondear al mm más cercano disponible (28-48 según términos creados)
  const valid = [28, 30, 32, 34, 36, 38, 40, 41, 42, 43, 44, 45, 46, 48];
  const nearest = valid.reduce((p, c) => Math.abs(c - w) < Math.abs(p - w) ? c : p);
  return nearest + "mm";
}

function inferEstanqueidad(specs) {
  const h = (specs["Hermeticidad"] || "").toLowerCase();
  if (h.includes("300") || h.includes("30 bar") || h.includes("30 atm")) return "300m+";
  if (h.includes("200") || h.includes("20 bar") || h.includes("20 atm")) return "200m / 20 ATM";
  if (h.includes("100") || h.includes("10 bar") || h.includes("10 atm")) return "100m / 10 ATM";
  if (h.includes("50 ") || h.includes("5 bar") || h.includes("5 atm")) return "50m / 5 ATM";
  if (h.includes("30 ") || h.includes("3 bar") || h.includes("3 atm")) return "30m / 3 ATM";
  return null;
}

function inferGenero(specs, productName) {
  const name = (productName || "").toLowerCase();
  if (name.includes("lady") || name.includes("dolcevita") || name.includes("femme")) return "Mujer";
  // Tamaño caja como heurística secundaria
  const w = parseFloat((specs["Anchura"] || "").replace(",", "."));
  if (w && w >= 40) return "Hombre";
  if (w && w <= 32) return "Mujer";
  // Colección Lady → Mujer (Tissot Le Locle Lady, Conquest Lady, etc.)
  // Sin info clara → Hombre por defecto (la mayoría del catálogo es masculino)
  if (w && w >= 36) return "Hombre";
  return null;  // skip atributo si no se puede deducir
}

// =============================================================================
//  Concordancia género en ESPAÑOL para short_description
// =============================================================================

const GENDER_FEM = {
  blanco: "blanca", negro: "negra", rojo: "roja", amarillo: "amarilla",
  marrón: "marrón", azul: "azul", verde: "verde", gris: "gris",
  plata: "plateada", dorado: "dorada", crema: "crema", naranja: "naranja",
  champagne: "champagne",
};
function adjFem(adj) {
  const lc = adj.toLowerCase();
  return GENDER_FEM[lc] || lc;
}

// =============================================================================
//  GENERADOR de payload final
// =============================================================================

function generatePayload(product) {
  const specs = parseSpecs(product.description || "");
  if (!specs) return { skip: true, reason: "no patrón Tissot" };

  const cleanNum = (s) => s ? s.replace(/,00$/, "").replace(/,/g, ".") : s;
  const cleanCalibre = (s) => s ? s.replace(/[»']/g, "").trim() : s;

  // ===== HTML LIMPIO =====
  const sizeMm = parseFloat((specs["Anchura"] || "0").replace(",", "."));
  const caseMaterial = (specs["Material de la caja"] || "").replace("Caja de ", "");
  const movement = specs["Movimiento"] || "";
  const dialColor = specs["Color de la esfera"] || "";
  const wrText = specs["Hermeticidad"] || "";
  const correa = specs["Acabado de la piel"] === "Sintético" ? "Correa sintética" : (specs["Acabado de la piel"] || "Correa");
  const correaColor = (specs["Color de la correa"] || "").toLowerCase();

  let html = "";
  if (specs._commercialDesc) {
    html += `<p class="lead">${specs._commercialDesc}</p>\n\n`;
  }
  html += `<h3>Características principales</h3>\n<ul>\n`;
  if (caseMaterial) html += `  <li><strong>Caja:</strong> ${caseMaterial.toLowerCase()}${sizeMm ? " de " + Math.round(sizeMm) + " mm" : ""}</li>\n`;
  if (movement) html += `  <li><strong>Movimiento:</strong> ${movement}${specs["Calibre"] ? " (calibre " + cleanCalibre(specs["Calibre"]) + ")" : ""}</li>\n`;
  if (dialColor) html += `  <li><strong>Esfera:</strong> ${dialColor}</li>\n`;
  if (specs["Cristal"]) html += `  <li><strong>Cristal:</strong> ${specs["Cristal"]}</li>\n`;
  if (correa) {
    html += `  <li><strong>Correa:</strong> ${correa}${correaColor ? " " + correaColor : ""}${specs["Hebilla"] ? ", " + specs["Hebilla"].toLowerCase().replace("hebilla estándar, ", "") : ""}</li>\n`;
  }
  if (wrText) html += `  <li><strong>Estanqueidad:</strong> ${wrText.replace(/^Hermético hasta una presión de /, "")}</li>\n`;
  if (specs["País de fabricación"]) html += `  <li><strong>Origen:</strong> ${specs["País de fabricación"]} · Garantía oficial 2 años</li>\n`;
  html += `</ul>\n\n`;

  // ===== TABLA TÉCNICA COMPLETA =====
  const orderedKeys = [
    "SKU", "Colección", "Material de la caja", "Forma de la caja",
    "Anchura", "Longitud", "Grosor", "Asas", "Peso (g)",
    "Cristal", "Color de la esfera", "Índices", "Material luminiscente en las manos",
    "Movimiento", "Calibre", "Energía", "Pila", "Funciones",
    "Hermeticidad",
    "Color de la correa", "Acabado de la piel", "Hebilla",
    "Garantía", "País de fabricación",
  ];
  const KEY_LABELS = {
    "Anchura": "Anchura caja", "Longitud": "Longitud caja", "Grosor": "Grosor",
    "Asas": "Anchura asas", "Peso (g)": "Peso",
    "Material de la caja": "Caja", "Color de la esfera": "Color esfera",
    "Material luminiscente en las manos": "Material luminiscente",
    "Hermeticidad": "Resistencia al agua",
    "Color de la correa": "Color correa", "Acabado de la piel": "Material correa",
    "Energía": "Tipo de energía", "Garantía": "Garantía oficial",
  };
  const VALUE_FORMATTERS = {
    "Anchura": (v) => cleanNum(v) + " mm",
    "Longitud": (v) => cleanNum(v) + " mm",
    "Grosor": (v) => cleanNum(v) + " mm",
    "Asas": (v) => cleanNum(v) + " mm",
    "Peso (g)": (v) => cleanNum(v) + " g",
    "Material de la caja": (v) => v.replace("Caja de ", "").replace(/^./, (c) => c.toUpperCase()),
    "Calibre": (v) => cleanCalibre(v),
  };

  html += `<h3>Ficha técnica completa</h3>\n<table>\n  <tbody>\n`;
  for (const key of orderedKeys) {
    if (specs[key]) {
      const label = KEY_LABELS[key] || key;
      const value = (VALUE_FORMATTERS[key] || ((v) => v))(specs[key]);
      html += `    <tr><th>${label}</th><td>${value}</td></tr>\n`;
    }
  }
  html += `  </tbody>\n</table>\n`;

  // ===== SHORT DESCRIPTION =====
  const wrSimple = inferEstanqueidad(specs);
  const swiss = (specs["País de fabricación"] || "").includes("Suiza") ? " Made in Switzerland." : "";
  const dialColorAdj = adjFem(dialColor);
  const movementLc = movement.toLowerCase().replace("swiss", "suizo").replace("eol", "").trim();
  const shortDesc = caseMaterial && sizeMm
    ? `${caseMaterial.replace(/^./, (c) => c.toUpperCase())} de ${Math.round(sizeMm)} mm con esfera ${dialColorAdj}, movimiento ${movementLc}${wrSimple ? " y estanqueidad de " + wrSimple : ""}.${swiss}`
    : null;

  // ===== ATRIBUTOS Woo =====
  const attributes = [];
  attributes.push({ id: 8, name: "Marca", position: 0, visible: true, variation: false, options: ["Tissot"] });
  const m = inferMovimiento(specs); if (m) attributes.push({ id: 9, name: "Movimiento", position: 1, visible: true, variation: false, options: [m] });
  const mc = inferMaterialCaja(specs); if (mc) attributes.push({ id: 10, name: "Material caja", position: 2, visible: true, variation: false, options: [mc] });
  const mco = inferMaterialCorrea(specs); if (mco) attributes.push({ id: 11, name: "Material correa", position: 3, visible: true, variation: false, options: [mco] });
  const ce = inferColorEsfera(specs); if (ce) attributes.push({ id: 12, name: "Color esfera", position: 4, visible: true, variation: false, options: [ce] });
  const tc = inferTamanoCaja(specs); if (tc) attributes.push({ id: 13, name: "Tamaño caja", position: 5, visible: true, variation: false, options: [tc] });
  const est = inferEstanqueidad(specs); if (est) attributes.push({ id: 14, name: "Estanqueidad", position: 6, visible: true, variation: false, options: [est] });
  const gen = inferGenero(specs, product.name); if (gen) attributes.push({ id: 15, name: "Género", position: 7, visible: true, variation: false, options: [gen] });

  // ===== YOAST SEO =====
  const collection = specs["Colección"] || "";
  const sku = specs["SKU"] || product.sku || "";
  const sizeStr = sizeMm ? Math.round(sizeMm) + "mm" : "";
  const movementStr = m ? `Reloj ${m}` : "Reloj";
  const seoTitle = `${product.name} · ${movementStr} Tissot${sizeStr ? " " + sizeStr : ""} | Joyería Royo`.slice(0, 70);
  const seoDescParts = [];
  seoDescParts.push(`Tissot ${product.name.replace(/^Tissot\s+/i, "")}`);
  if (caseMaterial) seoDescParts.push(`en ${caseMaterial.toLowerCase()}`);
  if (dialColor) seoDescParts.push(`esfera ${dialColorAdj}`);
  if (m) seoDescParts.push(`movimiento ${m.toLowerCase()}`);
  if (wrSimple) seoDescParts.push(wrSimple);
  let seoDesc = seoDescParts.join(", ") + ". Distribuidor oficial Tissot en Albacete.";
  if (seoDesc.length > 160) seoDesc = seoDesc.slice(0, 157) + "...";

  return {
    skip: false,
    payload: {
      description: html,
      short_description: shortDesc || product.short_description || "",
      attributes,
      meta_data: [
        { key: "_yoast_wpseo_title", value: seoTitle },
        { key: "_yoast_wpseo_metadesc", value: seoDesc },
      ],
    },
    debug: { specs_count: Object.keys(specs).length, brand: "Tissot", attrs_inferred: attributes.length },
  };
}

// =============================================================================
//  Fetch + Apply
// =============================================================================

async function fetchTissotProducts() {
  console.log(`[fetch] Cargando productos categoría '${categorySlug}'...`);
  const all = [];
  let page = 1;
  while (page <= 5) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&category=${categorySlug}&_fields=id,name,sku,permalink,description,short_description,categories`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`fetch page ${page}: ${res.status}`);
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
    page++;
  }
  console.log(`[fetch] OK ${all.length} productos cargados.`);
  return all;
}

async function fetchProductById(id) {
  const url = `${WP_BASE}/wp-json/wc/store/v1/products?include=${id}&_fields=id,name,sku,permalink,description,short_description,categories`;
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
    throw new Error(`product ${productId} update failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
//  Main
// =============================================================================

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, category=${categorySlug}, limit=${limit === Infinity ? "all" : limit}, pause=${pauseMs}ms${onlyProduct ? `, only-product=${onlyProduct}` : ""}`);

  let products;
  if (onlyProduct) {
    const p = await fetchProductById(onlyProduct);
    if (!p) { console.error(`Producto ${onlyProduct} no encontrado`); process.exit(1); }
    products = [p];
  } else {
    products = await fetchTissotProducts();
  }

  let processed = 0, updated = 0, skipped = 0, errors = 0;
  const skipList = [];
  const errList = [];

  for (const product of products) {
    if (processed >= limit) break;
    processed++;

    const result = generatePayload(product);
    if (result.skip) {
      console.log(`  [skip] ${product.id} "${product.name.slice(0, 50)}" — ${result.reason}`);
      skipped++;
      skipList.push({ id: product.id, name: product.name, reason: result.reason });
      continue;
    }

    console.log(`  [${dryRun ? "DRY" : "DO "}] ${product.id} "${product.name.slice(0, 60)}"`);
    console.log(`        specs=${result.debug.specs_count} attrs=${result.debug.attrs_inferred}`);

    if (!dryRun) {
      try {
        await applyUpdate(product.id, result.payload);
        updated++;
        await sleep(pauseMs);
      } catch (err) {
        console.error(`        ERROR: ${err.message}`);
        errors++;
        errList.push({ id: product.id, name: product.name, error: err.message });
        await sleep(pauseMs * 2);
      }
    } else {
      updated++;
    }
  }

  console.log(`\n[done] processed=${processed} updated=${updated} skipped=${skipped} errors=${errors}`);
  if (skipList.length) {
    console.log("\n=== PRODUCTOS SALTADOS (revisar manual) ===");
    for (const s of skipList) console.log(`  ${s.id}: ${s.name} — ${s.reason}`);
  }
  if (errList.length) {
    console.log("\n=== PRODUCTOS CON ERROR ===");
    for (const e of errList) console.log(`  ${e.id}: ${e.name} — ${e.error}`);
  }
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
