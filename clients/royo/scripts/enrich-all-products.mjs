#!/usr/bin/env node
/**
 * Sprint 2A++ — Enriquecimiento global de TODOS los productos Royo (~593).
 *
 * Estrategia:
 * - Para TODOS los productos:
 *     1. Asignar atributos Woo deducidos de nombre + categoría (Marca, Género,
 *        Tamaño, Movimiento, Material caja). Cero invento.
 *     2. Generar Yoast SEO title + meta description.
 * - SOLO para productos cuyo HTML siga el patrón Tissot (`ti-pdp-attribute`):
 *     3. Reescribir descripción con tabla limpia + lista de características.
 *     4. Generar short_description con concordancia género en español.
 * - Para los demás: NO se toca el HTML de la descripción ni el short.
 *
 * USO:
 *   ROYO_WP_USER="..." ROYO_WP_APP_PASS="..." \
 *     node tools/royo-content-drafts/enrich-all-products.mjs [flags]
 *
 *   --dry-run       Default. No escribe.
 *   --apply         Aplica los cambios.
 *   --limit=N       Solo N productos.
 *   --product=ID    Solo un producto.
 *   --pause-ms=N    Pausa entre llamadas (default 350ms).
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
  console.error("ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.");
  process.exit(1);
}
const authHeader = wpUser && wpPass
  ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`
  : null;

// =============================================================================
//  Catálogo de marcas y categorías Royo
// =============================================================================
const KNOWN_BRANDS = [
  "Tissot", "Longines", "Seiko", "Casio", "Hamilton", "Oris", "Citizen",
  "Omega", "MontBlanc", "Mont Blanc", "Victorinox", "Certina",
  "Baume & Mercier", "Franck Muller", "Genius Watches", "Tsar Bomba",
  "Roberto Demeglio",
];

const JEWELRY_CATS = ["Joyas", "Anillos", "Pendientes", "Pulseras", "Colgantes", "Gargantillas"];

const ATTR_IDS = {
  // Relojería (Sprint 3A)
  Marca: 8,
  Movimiento: 9,
  "Material caja": 10,
  "Material correa": 11,
  "Color esfera": 12,
  "Tamaño caja": 13,
  Estanqueidad: 14,
  Género: 15,
  // Joyería preexistentes
  Metal: 6,
  Quilates: 1,
  Gemas: 7,
  Diamantes: 2,
};

// =============================================================================
//  Heurísticas
// =============================================================================
function detectBrand(product) {
  // 1. Por categorías
  for (const c of product.categories || []) {
    if (KNOWN_BRANDS.includes(c.name)) return c.name;
  }
  // 2. Por nombre
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

function detectIsWatch(product) {
  const cats = (product.categories || []).map((c) => c.name);
  return cats.includes("Relojes");
}

function detectGender(product) {
  const cats = (product.categories || []).map((c) => c.name.toLowerCase());
  if (cats.includes("hombre")) return "Hombre";
  if (cats.includes("mujer")) return "Mujer";
  const n = (product.name || "").toLowerCase();
  if (n.includes("lady") || n.includes("dolcevita") || n.includes("ladies") || n.includes("femme") || n.includes("mujer")) return "Mujer";
  if (n.includes("gentleman") || n.includes("hombre") || n.includes("man ") || n.includes("men ")) return "Hombre";
  return null;
}

function detectSizeFromName(name) {
  // Busca patrones tipo "40mm", "34 mm", "45.5mm"
  const m = (name || "").match(/(\d{2}(?:[.,]\d)?)\s*mm/i);
  if (!m) return null;
  const w = parseFloat(m[1].replace(",", "."));
  if (!w || w < 20 || w > 60) return null;
  const valid = [28, 30, 32, 34, 36, 38, 40, 41, 42, 43, 44, 45, 46, 48];
  const nearest = valid.reduce((p, c) => Math.abs(c - w) < Math.abs(p - w) ? c : p);
  return nearest + "mm";
}

function detectMovementFromText(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("eco-drive") || t.includes("eco drive")) return "Eco-Drive";
  if (t.includes("solar")) return "Solar";
  if (t.includes("smartwatch")) return "Smartwatch";
  if (t.includes("automatic") || t.includes("automático") || t.includes("automatico") || t.includes("powermatic")) return "Automático";
  if (t.includes("quartz") || t.includes("cuarzo")) return "Cuarzo";
  if (t.includes("manual")) return "Mecánico Manual";
  return null;
}

function detectMaterialCajaFromText(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("titanio") || t.includes("titanium")) return "Titanio";
  if (t.includes("cerámica") || t.includes("ceramic")) return "Cerámica";
  if (t.includes("pvd oro") || t.includes("oro pvd")) return "Acero PVD oro";
  if (t.includes("pvd negro") || t.includes("pvd black") || t.includes("black pvd")) return "Acero PVD negro";
  if (t.includes("oro 18kt") || t.includes("oro 18 kt") || t.includes("oro 750")) return "Oro";
  if (t.includes("acero") || t.includes("steel") || t.includes("inox")) return "Acero";
  if (t.includes("resina") || t.includes("resin")) return "Resina";
  return null;
}

function detectMaterialCorreaFromText(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("piel") || t.includes("cuero") || t.includes("leather")) return "Cuero";
  if (t.includes("caucho") || t.includes("rubber")) return "Caucho";
  if (t.includes("nato")) return "Nylon NATO";
  if (t.includes("titanio") && t.includes("brazalete")) return "Titanio";
  if (t.includes("mesh")) return "Mesh";
  if ((t.includes("brazalete") && t.includes("acero")) || t.includes("steel bracelet")) return "Acero";
  return null;
}

function detectWaterResistanceFromText(text) {
  const t = (text || "").toLowerCase();
  if (/300\s*m|30\s*bar|30\s*atm/.test(t)) return "300m+";
  if (/200\s*m|20\s*bar|20\s*atm/.test(t)) return "200m / 20 ATM";
  if (/100\s*m|10\s*bar|10\s*atm/.test(t)) return "100m / 10 ATM";
  if (/50\s*m|5\s*bar|5\s*atm/.test(t)) return "50m / 5 ATM";
  if (/30\s*m|3\s*bar|3\s*atm/.test(t)) return "30m / 3 ATM";
  return null;
}

// === Joyería ===
function detectJewelryMetal(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("oro blanco") || t.includes("oro b. ")) return "Oro Blanco";
  if (t.includes("oro rosa") || t.includes("oro rosado")) return "Oro Rosa";
  if (t.includes("oro amarillo") || t.includes("oro amar.")) return "Oro Amarillo";
  if (t.includes("oro 18kt") || t.includes("oro 18 kt") || t.includes("oro 750") || t.includes("oro ")) return "Oro";
  if (t.includes("plata") && !t.includes("plat") /* "platino" */) return "Plata";
  if (t.includes("platino")) return "Platino";
  return null;
}

function detectJewelryQuilates(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("18kt") || t.includes("18 kt") || t.includes("750")) return "18kt";
  if (t.includes("14kt") || t.includes("14 kt") || t.includes("585")) return "14kt";
  if (t.includes("9kt") || t.includes("9 kt") || t.includes("375")) return "9kt";
  return null;
}

function detectJewelryGemas(text) {
  const t = (text || "").toLowerCase();
  const gems = [];
  if (t.includes("diamante") || t.includes("brillante")) gems.push("Diamante");
  if (t.includes("esmeralda")) gems.push("Esmeralda");
  if (t.includes("zafiro")) gems.push("Zafiro");
  if (t.includes("rubí") || t.includes("rubi") || t.includes("ruby")) gems.push("Rubí");
  if (t.includes("perla")) gems.push("Perla");
  if (t.includes("circonita") || t.includes("circon")) gems.push("Circonita");
  if (t.includes("topacio")) gems.push("Topacio");
  if (t.includes("amatista")) gems.push("Amatista");
  return gems.length > 0 ? gems : null;
}

// =============================================================================
//  Parser HTML Tissot (heredado del script original)
// =============================================================================
function parseTissotSpecs(html) {
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
  const descMatch = html.match(/<p class="ti-fs-14[^>]*ti-pdp-details-content[^>]*>([^<]+)<\/p>/);
  if (descMatch) specs._commercialDesc = descMatch[1].trim();
  return Object.keys(specs).length > 0 ? specs : null;
}

const GENDER_FEM = {
  blanco: "blanca", negro: "negra", rojo: "roja", amarillo: "amarilla",
  marrón: "marrón", azul: "azul", verde: "verde", gris: "gris",
  plata: "plateada", dorado: "dorada", crema: "crema", naranja: "naranja",
  champagne: "champagne",
};
const adjFem = (a) => GENDER_FEM[(a || "").toLowerCase()] || (a || "").toLowerCase();

function buildTissotHtml(specs) {
  const cleanNum = (s) => (s ? s.replace(/,00$/, "").replace(/,/g, ".") : s);
  const cleanCalibre = (s) => (s ? s.replace(/[»']/g, "").trim() : s);
  const sizeMm = parseFloat((specs["Anchura"] || "0").replace(",", "."));
  const caseMaterial = (specs["Material de la caja"] || "").replace("Caja de ", "");
  const movement = specs["Movimiento"] || "";
  const dialColor = specs["Color de la esfera"] || "";
  const wrText = specs["Hermeticidad"] || "";
  const correa = specs["Acabado de la piel"] === "Sintético" ? "Correa sintética" : (specs["Acabado de la piel"] || "Correa");
  const correaColor = (specs["Color de la correa"] || "").toLowerCase();

  let html = "";
  if (specs._commercialDesc) html += `<p class="lead">${specs._commercialDesc}</p>\n\n`;
  html += `<h3>Características principales</h3>\n<ul>\n`;
  if (caseMaterial) html += `  <li><strong>Caja:</strong> ${caseMaterial.toLowerCase()}${sizeMm ? " de " + Math.round(sizeMm) + " mm" : ""}</li>\n`;
  if (movement) html += `  <li><strong>Movimiento:</strong> ${movement}${specs["Calibre"] ? " (calibre " + cleanCalibre(specs["Calibre"]) + ")" : ""}</li>\n`;
  if (dialColor) html += `  <li><strong>Esfera:</strong> ${dialColor}</li>\n`;
  if (specs["Cristal"]) html += `  <li><strong>Cristal:</strong> ${specs["Cristal"]}</li>\n`;
  if (correa) html += `  <li><strong>Correa:</strong> ${correa}${correaColor ? " " + correaColor : ""}</li>\n`;
  if (wrText) html += `  <li><strong>Estanqueidad:</strong> ${wrText.replace(/^Hermético hasta una presión de /, "")}</li>\n`;
  if (specs["País de fabricación"]) html += `  <li><strong>Origen:</strong> ${specs["País de fabricación"]} · Garantía oficial 2 años</li>\n`;
  html += `</ul>\n\n`;

  const orderedKeys = ["SKU", "Colección", "Material de la caja", "Forma de la caja", "Anchura", "Longitud", "Grosor", "Asas", "Peso (g)", "Cristal", "Color de la esfera", "Índices", "Material luminiscente en las manos", "Movimiento", "Calibre", "Energía", "Pila", "Funciones", "Hermeticidad", "Color de la correa", "Acabado de la piel", "Hebilla", "Garantía", "País de fabricación"];
  const KEY_LABELS = { "Anchura": "Anchura caja", "Longitud": "Longitud caja", "Grosor": "Grosor", "Asas": "Anchura asas", "Peso (g)": "Peso", "Material de la caja": "Caja", "Color de la esfera": "Color esfera", "Material luminiscente en las manos": "Material luminiscente", "Hermeticidad": "Resistencia al agua", "Color de la correa": "Color correa", "Acabado de la piel": "Material correa", "Energía": "Tipo de energía", "Garantía": "Garantía oficial" };
  const VF = { "Anchura": (v) => cleanNum(v) + " mm", "Longitud": (v) => cleanNum(v) + " mm", "Grosor": (v) => cleanNum(v) + " mm", "Asas": (v) => cleanNum(v) + " mm", "Peso (g)": (v) => cleanNum(v) + " g", "Material de la caja": (v) => v.replace("Caja de ", "").replace(/^./, (c) => c.toUpperCase()), "Calibre": (v) => cleanCalibre(v) };
  html += `<h3>Ficha técnica completa</h3>\n<table>\n  <tbody>\n`;
  for (const k of orderedKeys) {
    if (specs[k]) {
      const label = KEY_LABELS[k] || k;
      const value = (VF[k] || ((v) => v))(specs[k]);
      html += `    <tr><th>${label}</th><td>${value}</td></tr>\n`;
    }
  }
  html += `  </tbody>\n</table>\n`;
  return html;
}

function buildShortDesc(brand, specs, attrs) {
  // Genérico desde atributos deducidos
  const parts = [];
  if (attrs["Material caja"] === "Acero") parts.push("Acero inoxidable");
  else if (attrs["Material caja"]) parts.push(attrs["Material caja"]);
  if (attrs["Tamaño caja"]) parts.push("de " + attrs["Tamaño caja"]);
  if (attrs["Color esfera"]) parts.push("con esfera " + adjFem(attrs["Color esfera"]));
  if (attrs["Movimiento"]) parts.push("movimiento " + attrs["Movimiento"].toLowerCase());
  if (attrs["Estanqueidad"]) parts.push("estanqueidad " + attrs["Estanqueidad"]);
  let s = parts.join(", ");
  if (!s) return null;
  s = s.charAt(0).toUpperCase() + s.slice(1) + ".";
  return s;
}

// =============================================================================
//  Generador de payload por producto
// =============================================================================
function generatePayload(product) {
  const isJewelry = detectIsJewelry(product);
  const isWatch = detectIsWatch(product);
  const brand = detectBrand(product);

  // === Atributos Woo (todos los productos) ===
  const attrs = {};
  if (brand) attrs["Marca"] = brand;
  const gender = detectGender(product);
  if (gender) attrs["Género"] = gender;

  // Específico relojes
  if (isWatch && !isJewelry) {
    const text = product.name + " " + (product.description || "");
    const size = detectSizeFromName(product.name);
    if (size) attrs["Tamaño caja"] = size;
    const mov = detectMovementFromText(text);
    if (mov) attrs["Movimiento"] = mov;
    const mc = detectMaterialCajaFromText(text);
    if (mc) attrs["Material caja"] = mc;
    const mco = detectMaterialCorreaFromText(text);
    if (mco) attrs["Material correa"] = mco;
    const wr = detectWaterResistanceFromText(text);
    if (wr) attrs["Estanqueidad"] = wr;
  }

  // Específico joyería
  const jewelryAttrs = {};
  if (isJewelry) {
    const text = product.name + " " + (product.description || "");
    const metal = detectJewelryMetal(text);
    if (metal) jewelryAttrs["Metal"] = metal;
    const kt = detectJewelryQuilates(text);
    if (kt) jewelryAttrs["Quilates"] = kt;
    const gemas = detectJewelryGemas(text);
    if (gemas) jewelryAttrs["Gemas"] = gemas;  // array
  }

  // === Reescritura HTML Tissot (si patrón) ===
  const tissotSpecs = parseTissotSpecs(product.description || "");
  let newHtml = null;
  let newShort = null;
  if (tissotSpecs && brand === "Tissot") {
    newHtml = buildTissotHtml(tissotSpecs);
    // Sobrescribir atributos con los de specs (son más precisos)
    if (tissotSpecs["Color de la esfera"]) {
      const ce = tissotSpecs["Color de la esfera"];
      const map = { "Blanco": "Blanco", "Negro": "Negro", "Azul": "Azul", "Verde": "Verde", "Gris": "Gris", "Plata": "Plata", "Marrón": "Marrón", "Champagne": "Champagne", "Dorado": "Dorado", "Amarillo": "Amarillo" };
      const mapped = map[ce];
      if (mapped) attrs["Color esfera"] = mapped;
    }
    newShort = buildShortDesc(brand, tissotSpecs, attrs);
  } else if (isWatch && Object.keys(attrs).length >= 3) {
    // Para no-Tissot: solo short_description si tenemos al menos 3 atributos relevantes
    newShort = buildShortDesc(brand, null, attrs);
  }

  // === Yoast SEO ===
  let seoTitle, seoDesc;
  if (isWatch && brand) {
    const movStr = attrs["Movimiento"] ? `Reloj ${attrs["Movimiento"]}` : "Reloj";
    const sizeStr = attrs["Tamaño caja"] || "";
    seoTitle = `${product.name} · ${movStr} ${brand}${sizeStr ? " " + sizeStr : ""} | Joyería Royo`.slice(0, 70);
    const parts = [];
    parts.push(`${brand} ${product.name.replace(new RegExp("^" + brand + "\\s*", "i"), "").slice(0, 60)}`);
    if (attrs["Material caja"]) parts.push(`en ${attrs["Material caja"].toLowerCase()}`);
    if (attrs["Color esfera"]) parts.push(`esfera ${adjFem(attrs["Color esfera"])}`);
    if (attrs["Movimiento"]) parts.push(`movimiento ${attrs["Movimiento"].toLowerCase()}`);
    if (attrs["Estanqueidad"]) parts.push(attrs["Estanqueidad"]);
    seoDesc = parts.join(", ") + `. Distribuidor oficial ${brand} en Albacete.`;
  } else if (isJewelry) {
    seoTitle = `${product.name} | Joyería Royo Albacete`.slice(0, 70);
    const jParts = [product.name];
    if (jewelryAttrs["Metal"]) jParts.push(jewelryAttrs["Metal"].toLowerCase());
    if (jewelryAttrs["Quilates"]) jParts.push(jewelryAttrs["Quilates"]);
    if (jewelryAttrs["Gemas"]) jParts.push("con " + jewelryAttrs["Gemas"].join(", ").toLowerCase());
    seoDesc = jParts.join(", ") + ". Joyería con más de 50 años de tradición en Albacete capital. Tasación, garantía oficial y financiación.";
  } else {
    // Otros (carteras, escritura, etc.)
    seoTitle = `${product.name} | Joyería Royo Albacete`.slice(0, 70);
    seoDesc = `${product.name}. Disponible en Joyería Royo, Albacete capital.`;
  }
  if (seoDesc.length > 160) seoDesc = seoDesc.slice(0, 157) + "...";

  // === Payload final ===
  const payload = {
    meta_data: [
      { key: "_yoast_wpseo_title", value: seoTitle },
      { key: "_yoast_wpseo_metadesc", value: seoDesc },
    ],
  };

  if (newHtml) payload.description = newHtml;
  if (newShort) payload.short_description = newShort;

  // Combinar atributos relojería + joyería
  const allAttrs = { ...attrs, ...jewelryAttrs };
  if (Object.keys(allAttrs).length > 0) {
    payload.attributes = Object.entries(allAttrs).map(([name, value], i) => ({
      id: ATTR_IDS[name],
      name,
      position: i,
      visible: true,
      variation: false,
      options: Array.isArray(value) ? value : [value],
    }));
  }

  return {
    skip: !payload.attributes && !payload.description,
    payload,
    debug: {
      brand: brand || "?",
      isJewelry,
      isWatch,
      attrsCount: Object.keys(attrs).length,
      tissotPattern: !!tissotSpecs,
      newHtml: !!newHtml,
      newShort: !!newShort,
    },
  };
}

// =============================================================================
//  Fetch + Apply
// =============================================================================
async function fetchAllProducts() {
  console.log("[fetch] Cargando 593 productos...");
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,description,short_description,categories`;
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
  const url = `${WP_BASE}/wp-json/wc/store/v1/products?include=${id}&_fields=id,name,sku,description,short_description,categories`;
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

  let processed = 0, updated = 0, skipped = 0, errors = 0;
  const errList = [];
  const stats = { withTissotPattern: 0, withNewShort: 0, byBrand: {} };

  for (const product of products) {
    if (processed >= limit) break;
    processed++;

    const result = generatePayload(product);
    if (result.skip) {
      console.log(`  [skip] ${product.id} "${product.name.slice(0, 50)}" (sin atributos deducibles)`);
      skipped++;
      continue;
    }

    if (result.debug.tissotPattern) stats.withTissotPattern++;
    if (result.debug.newShort) stats.withNewShort++;
    const b = result.debug.brand;
    stats.byBrand[b] = (stats.byBrand[b] || 0) + 1;

    if (processed % 25 === 0 || processed <= 3) {
      console.log(`  [${dryRun ? "DRY" : "DO "}] #${processed}/${products.length} id=${product.id} brand=${b} attrs=${result.debug.attrsCount} tissot=${result.debug.tissotPattern} short=${result.debug.newShort}`);
    }

    if (!dryRun) {
      try {
        await applyUpdate(product.id, result.payload);
        updated++;
        await sleep(pauseMs);
      } catch (err) {
        console.error(`  ERROR ${product.id}: ${err.message}`);
        errors++;
        errList.push({ id: product.id, name: product.name, error: err.message });
        await sleep(pauseMs * 2);
      }
    } else {
      updated++;
    }
  }

  console.log(`\n[done] processed=${processed} updated=${updated} skipped=${skipped} errors=${errors}`);
  console.log(`[stats] tissot-pattern=${stats.withTissotPattern} new-short=${stats.withNewShort}`);
  console.log(`[stats] por marca:`, JSON.stringify(stats.byBrand));
  if (errList.length) {
    console.log("\n=== ERRORES ===");
    for (const e of errList.slice(0, 20)) console.log(`  ${e.id}: ${e.name} — ${e.error}`);
  }
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
