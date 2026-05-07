#!/usr/bin/env node
/**
 * Sprint 2D — Desambiguación de nombres duplicados.
 *
 * Tras Sprint 2B (PR #134) que recortó SKUs del nombre, quedaron 64 grupos
 * de productos con nombre idéntico (en realidad son variantes distintas
 * con SKU único pero mismo nombre base). Visualmente parecen duplicados
 * en la grid de categoría.
 *
 * Estrategia:
 *   1. Agrupar productos por nombre exacto (case-insensitive).
 *   2. Para cada grupo de 2+ productos, generar un sufijo descriptivo único
 *      basado en specs reales extraídas de:
 *        a) Atributos Woo (Movimiento, Material correa, Color esfera, ...)
 *        b) Descripción HTML (tabla ficha técnica Tissot/Longines)
 *   3. Aplicar el sufijo al nombre con formato "Nombre · Sufijo".
 *
 * Conservador:
 *   - NUNCA toca productos de joyería.
 *   - Si dos productos tienen specs idénticas, intenta usar el SKU corto
 *     o lo deja sin tocar (mejor un duplicado que un error).
 *
 * USO:
 *   node clients/royo/scripts/disambiguate-product-names.mjs               # dry-run
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/disambiguate-product-names.mjs --apply
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");
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

const JEWELRY_CATS = new Set(["Joyas", "Anillos", "Pendientes", "Pulseras", "Colgantes", "Gargantillas"]);

function isJewelry(product) {
  return (product.categories || []).some((c) => JEWELRY_CATS.has(c.name));
}

function decodeHtml(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrae specs descriptivas para diferenciar el producto.
 * Devuelve el sufijo más distintivo posible.
 */
function extractDescriptiveSuffix(product) {
  // Primero atributos Woo
  const attrs = {};
  for (const a of product.attributes || []) {
    const val = (a.terms || []).map((t) => t.name).join(", ");
    if (val) attrs[a.name] = val;
  }

  // Luego datos de la descripción HTML (tabla Tissot)
  const html = product.description || "";
  const get = (re) => {
    const m = html.match(re);
    return m ? decodeHtml(m[1] || m[2] || "") : null;
  };
  const colorEsfera =
    attrs["Color esfera"] ||
    get(/Color esfera<\/th>\s*<td>([^<]+)<\/td>/i) ||
    get(/Color de la esfera<\/th>\s*<td>([^<]+)<\/td>/i);
  const colorCorrea =
    get(/Color correa<\/th>\s*<td>([^<]+)<\/td>/i) ||
    get(/Color de la correa<\/th>\s*<td>([^<]+)<\/td>/i);
  const matCorrea =
    attrs["Material correa"] ||
    get(/Material correa<\/th>\s*<td>([^<]+)<\/td>/i) ||
    get(/Acabado de la piel<\/th>\s*<td>([^<]+)<\/td>/i);
  const movimiento = attrs["Movimiento"];

  return { colorEsfera, colorCorrea, matCorrea, movimiento, attrs };
}

/**
 * Encuentra el segmento más corto del SKU que diferencia este producto del
 * resto del grupo. Mira de derecha a izquierda hasta encontrar una parte
 * que no comparta con los demás SKUs.
 */
function uniqueSkuTail(mySku, otherSkus) {
  if (!mySku) return null;
  // Probar tails de longitud 3, 4, 5, 6
  for (const len of [3, 4, 5, 6]) {
    const myTail = mySku.slice(-len);
    const allDifferent = otherSkus.every((o) => o.slice(-len) !== myTail);
    if (allDifferent) return myTail;
  }
  // Si nada de los últimos 6 chars distingue, usa el SKU completo
  return mySku;
}

/**
 * Construye el sufijo final tras comparar todos los productos del grupo.
 * Solo añade lo que es DIFERENTE entre productos del grupo.
 */
function buildDifferentiator(product, groupSpecs, allInGroup) {
  const my = groupSpecs[product.id];
  const others = Object.entries(groupSpecs).filter(([id]) => +id !== product.id).map(([_, s]) => s);
  if (others.length === 0) return null;

  // Lista priorizada de specs a usar para diferenciar
  const candidates = [
    { key: "colorEsfera", label: "esfera" },
    { key: "matCorrea", label: "correa" },
    { key: "colorCorrea", label: "correa" },
    { key: "movimiento", label: null },
  ];

  const parts = [];
  const usedLabels = new Set();
  for (const c of candidates) {
    const myVal = my[c.key];
    if (!myVal) continue;
    const otherHasDifferent = others.some((o) => o[c.key] && o[c.key] !== myVal);
    const allOthersHaveSame = others.every((o) => o[c.key] === myVal);
    if (!otherHasDifferent && allOthersHaveSame) continue;
    // Esta spec es distintiva
    const labelKey = c.label || c.key;
    if (usedLabels.has(labelKey)) continue;
    usedLabels.add(labelKey);
    if (c.key === "movimiento") {
      parts.push(myVal);
    } else if (c.key === "colorEsfera") {
      parts.push("esfera " + myVal.toLowerCase());
    } else if (c.key === "matCorrea") {
      // Si es "Cuero", "Acero", "Caucho" etc. directo
      parts.push("correa " + myVal.toLowerCase());
    } else if (c.key === "colorCorrea") {
      parts.push("correa " + myVal.toLowerCase());
    }
    if (parts.length >= 2) break;
  }

  if (parts.length === 0) {
    // Fallback: la parte del SKU que ES DIFERENTE entre productos del grupo
    if (!product.sku || !allInGroup) return null;
    const otherSkus = allInGroup.filter((p) => p.id !== product.id).map((p) => p.sku || "");
    const tail = uniqueSkuTail(product.sku, otherSkus);
    return tail ? `Ref. ${tail}` : null;
  }
  return parts.join(" · ");
}

/**
 * Si dos productos del grupo terminan con el mismo sufijo, los desempata
 * añadiendo la cola del SKU que es DIFERENTE entre ellos. Garantiza unicidad
 * sin duplicar "Ref." si ya existía.
 */
function ensureUnique(group, suffixes) {
  const counts = {};
  for (const id in suffixes) {
    const k = suffixes[id] || "";
    counts[k] = (counts[k] || 0) + 1;
  }
  const dupSuffixes = Object.entries(counts).filter(([_, n]) => n > 1).map(([k]) => k);
  for (const dupSuffix of dupSuffixes) {
    const dupGroup = group.filter((p) => (suffixes[p.id] || "") === dupSuffix);
    const dupSkus = dupGroup.map((p) => p.sku || "");
    for (const p of dupGroup) {
      const otherSkus = dupSkus.filter((s) => s !== p.sku);
      const tail = uniqueSkuTail(p.sku, otherSkus);
      if (!tail) continue;
      // Si el sufijo previo ya empezaba por "Ref.", reemplazarlo en vez de duplicar
      if (dupSuffix.startsWith("Ref.")) {
        suffixes[p.id] = `Ref. ${tail}`;
      } else {
        suffixes[p.id] = (dupSuffix ? dupSuffix + " · " : "") + `Ref. ${tail}`;
      }
    }
  }
  return suffixes;
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,categories,attributes,description`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`fetch page ${page}: ${res.status}`);
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

async function applyRename(productId, newName) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`product ${productId}: ${res.status} ${text.slice(0, 150)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, pause=${pauseMs}ms`);

  const all = await fetchAllProducts();
  console.log(`[fetch] OK ${all.length} productos.`);

  // Agrupar por nombre normalizado
  const byName = {};
  for (const p of all) {
    if (isJewelry(p)) continue;
    const key = (p.name || "").trim().toLowerCase();
    if (!key) continue;
    if (!byName[key]) byName[key] = [];
    byName[key].push(p);
  }
  const groups = Object.values(byName).filter((g) => g.length > 1);
  console.log(`[group] ${groups.length} grupos con nombre duplicado, total productos en duplicación: ${groups.reduce((a, g) => a + g.length, 0)}`);

  let plansCount = 0, applied = 0, errors = 0;
  const samples = [];
  const errList = [];

  for (const group of groups) {
    // Pre-calcular specs de todos los productos del grupo
    const groupSpecs = {};
    for (const p of group) groupSpecs[p.id] = extractDescriptiveSuffix(p);

    // Generar sufijos iniciales
    let suffixes = {};
    for (const p of group) {
      suffixes[p.id] = buildDifferentiator(p, groupSpecs, group);
    }
    // Garantizar unicidad: si hay sufijos duplicados, añade Ref. corta
    suffixes = ensureUnique(group, suffixes);

    for (const p of group) {
      const suffix = suffixes[p.id];
      if (!suffix) continue;
      const newName = `${p.name} · ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
      if (newName === p.name) continue;
      plansCount++;
      if (samples.length < 25) {
        samples.push({ id: p.id, sku: p.sku, oldName: p.name, newName });
      }
      if (!dryRun) {
        try {
          await applyRename(p.id, newName);
          applied++;
          await sleep(pauseMs);
        } catch (err) {
          errors++;
          errList.push({ id: p.id, sku: p.sku, error: err.message });
          console.error(`  ERROR ${p.id} sku=${p.sku}: ${err.message}`);
          await sleep(pauseMs * 2);
        }
      }
    }
  }

  console.log(`\n[done] groups=${groups.length} planned=${plansCount} applied=${applied} errors=${errors}`);
  if (samples.length > 0) {
    console.log("\n=== muestras ===");
    samples.forEach((s) => {
      console.log(`  id=${s.id} sku=${s.sku}`);
      console.log(`     OLD: ${s.oldName}`);
      console.log(`     NEW: ${s.newName}`);
    });
  }
  if (errList.length) {
    console.log("\n=== ERRORES ===");
    for (const e of errList.slice(0, 20)) console.log(`  ${e.id} sku=${e.sku}: ${e.error}`);
  }
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
