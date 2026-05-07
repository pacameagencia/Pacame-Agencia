#!/usr/bin/env node
/**
 * Sprint 2B — Limpieza de nombres de producto Royo.
 *
 * Recorta el SKU del final del título del producto SOLO cuando el texto
 * al final del `name` coincide (case-insensitive, ignorando puntos y
 * guiones) con el campo `sku` del producto.
 *
 * Estrategia conservadora — 0 falsos positivos garantizados:
 *   - NUNCA toca joyería (categorías Anillos/Pendientes/Pulseras/...).
 *   - NUNCA toca productos sin SKU o con SKU < 6 chars.
 *   - SOLO recorta si el sufijo coincide con el SKU oficial.
 *
 * El SKU sigue visible en el bloque metadata del single product
 * (sku_wrapper > sku) — solo lo quitamos del título visible.
 *
 * USO:
 *   node clients/royo/scripts/clean-product-names.mjs              # dry-run
 *   ROYO_WP_USER="..." ROYO_WP_APP_PASS="..." \
 *     node clients/royo/scripts/clean-product-names.mjs --apply
 *
 *   --apply         Aplica los cambios.
 *   --product=ID    Solo un producto (para test).
 *   --pause-ms=N    Pausa entre llamadas (default 350ms).
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
  const cats = (product.categories || []).map((c) => c.name);
  return cats.some((c) => JEWELRY_CATS.has(c));
}

function normalizeForCompare(s) {
  return (s || "").replace(/[\s.\-]/g, "").toUpperCase();
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

/**
 * Decide si el nombre puede limpiarse.
 * Devuelve { newName } si aplica, null si no.
 */
function planRename(product) {
  if (isJewelry(product)) return null;
  const sku = (product.sku || "").trim();
  if (!sku || sku.length < 6) return null;

  const name = decodeHtmlEntities(product.name);

  // Buscar el SKU como sufijo del nombre, posiblemente con espacios u otros separadores.
  // Normalizamos ambos lados y buscamos coincidencia al final.
  const nameNorm = normalizeForCompare(name);
  const skuNorm = normalizeForCompare(sku);

  if (!nameNorm.endsWith(skuNorm)) return null;

  // Cortar el nombre: encontrar la posición original del SKU.
  // Estrategia: ir desde el final del nombre original hacia atrás
  // recogiendo caracteres hasta acumular tantos como skuNorm tiene.
  let acc = "";
  let cutAt = name.length;
  for (let i = name.length - 1; i >= 0; i--) {
    const ch = name[i];
    if (/[\s.\-]/.test(ch)) continue;
    acc = ch + acc;
    if (normalizeForCompare(acc) === skuNorm) {
      cutAt = i;
      break;
    }
  }
  if (acc.length === 0) return null;

  let newName = name.slice(0, cutAt).trim();
  // Limpiar separadores residuales (espacios, guiones, "-", "·", "—") al final
  newName = newName.replace(/[\s\-–—·,;:]+$/, "").trim();
  if (!newName) return null;
  if (newName === name) return null;

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
    if (samples.length < 12) samples.push(plan);

    if (planned <= 3 || planned % 25 === 0) {
      console.log(`  [${dryRun ? "DRY" : "DO "}] #${planned} id=${product.id}`);
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
      console.log(`  id=? sku=${s.sku}`);
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
