#!/usr/bin/env node
/**
 * Sprint 2B v2 — Limpieza de nombres con SKU embebido (no al final).
 *
 * Casos típicos a limpiar:
 *   - "LONGINES HYDROCONQUEST L37794966 39 mm" → "LONGINES HYDROCONQUEST 39 mm"
 *   - "TISSOT PR100 T1504101104100 40MM" → "TISSOT PR100 40MM"
 *   - "Seiko Prospex SPB455J1 100 Aniversario" → "Seiko Prospex 100 Aniversario"
 *   - "Reloj Victorinox V241990 Dive Pro" → "Reloj Victorinox Dive Pro"
 *
 * Algoritmo:
 *   1. Skip joyería.
 *   2. Skip si SKU < 6 chars.
 *   3. Buscar el SKU exacto (insensitive case + ignore puntos/guiones) DENTRO del nombre.
 *   4. Si está, recortarlo + colapsar dobles espacios.
 *   5. NUNCA tocar si el SKU es la única parte (ej. "SNJ039 Prospex Mar" → no recortar
 *      porque dejaría "Prospex Mar" que pierde info de modelo).
 *
 * Conservador: si tras el corte el nombre resultante < 8 chars, abort.
 *
 * USO: ROYO_WP_USER=... ROYO_WP_APP_PASS=... node clients/royo/scripts/clean-product-names-v2.mjs [--apply]
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");
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

const JEWELRY_CATS = new Set(["Joyas", "Anillos", "Pendientes", "Pulseras", "Colgantes", "Gargantillas"]);

function isJewelry(product) {
  return (product.categories || []).some((c) => JEWELRY_CATS.has(c.name));
}

function decodeHtmlEntities(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function planRename(product) {
  if (isJewelry(product)) return null;
  const sku = (product.sku || "").trim();
  if (!sku || sku.length < 6) return null;

  const name = decodeHtmlEntities(product.name);

  // Construir regex para encontrar el SKU EXACTAMENTE dentro del nombre.
  // Insensitive case, permitir que en el nombre aparezca con/sin guiones.
  // Ej: "L37794966" debería matchear "L37794966" en el nombre.
  const escapedSku = sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*${escapedSku}\\s*`, "i");

  if (!re.test(name)) return null;

  // Recortar
  let newName = name.replace(re, " ").replace(/\s+/g, " ").trim();
  // Limpiar separadores residuales al inicio/final
  newName = newName.replace(/^[\s\-–—·,;:]+|[\s\-–—·,;:]+$/g, "").trim();

  // Conservador: si el nombre quedó muy corto (< 12 chars), abort.
  if (!newName || newName.length < 12) return null;
  // Si no cambió nada, abort.
  if (newName === name) return null;
  // Conservador 2: el nombre nuevo debe tener al menos 2 palabras significativas
  // (3+ caracteres c/u). Esto evita casos donde el SKU era la única parte identificable.
  const significantWords = newName.split(/\s+/).filter((w) => w.length >= 3);
  if (significantWords.length < 2) return null;

  return { newName, oldName: name, sku };
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,categories`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`fetch page ${page}: ${res.status}`);
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

async function fetchProductById(id) {
  const url = `${WP_BASE}/wp-json/wc/store/v1/products?include=${id}&_fields=id,name,sku,categories`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
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
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, pause=${pauseMs}ms${onlyProduct ? `, only-product=${onlyProduct}` : ""}`);

  let products;
  if (onlyProduct) {
    const p = await fetchProductById(onlyProduct);
    if (!p) { console.error(`Producto ${onlyProduct} no encontrado`); process.exit(1); }
    products = [p];
  } else {
    products = await fetchAllProducts();
    console.log(`[fetch] OK ${products.length} productos.`);
  }

  let processed = 0, planned = 0, applied = 0, skipped = 0, errors = 0;
  const errList = [];
  const samples = [];

  for (const product of products) {
    processed++;
    const plan = planRename(product);
    if (!plan) { skipped++; continue; }
    planned++;
    if (samples.length < 25) samples.push(plan);

    if (planned <= 3 || planned % 10 === 0) {
      console.log(`  [${dryRun ? "DRY" : "DO "}] #${planned} id=${product.id} sku=${plan.sku}`);
      console.log(`     OLD: ${plan.oldName}`);
      console.log(`     NEW: ${plan.newName}`);
    }

    if (!dryRun) {
      try {
        await applyRename(product.id, plan.newName);
        applied++;
        await sleep(pauseMs);
      } catch (err) {
        console.error(`  ERROR ${product.id}: ${err.message}`);
        errors++;
        errList.push({ id: product.id, error: err.message, plan });
        await sleep(pauseMs * 2);
      }
    }
  }

  console.log(`\n[done] processed=${processed} planned=${planned} applied=${applied} skipped=${skipped} errors=${errors}`);
  if (dryRun && samples.length > 0) {
    console.log(`\n=== muestra de transformaciones (${samples.length} de ${planned}) ===`);
    samples.forEach((s) => {
      console.log(`  sku=${s.sku}`);
      console.log(`     OLD: ${s.oldName}`);
      console.log(`     NEW: ${s.newName}`);
    });
  }
  if (errList.length) {
    console.log("\n=== ERRORES ===");
    for (const e of errList.slice(0, 20)) console.log(`  ${e.id}: ${e.error}`);
  }
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
