#!/usr/bin/env node
/**
 * Bulk fix de alt + title de imágenes para Joyería Royo.
 *
 * Estrategia:
 *   1. Lee los 593 productos via WC Store API.
 *   2. Por cada producto, genera un alt descriptivo basado en el nombre del producto.
 *   3. Llama a `wp/v2/media/{id}` con `alt_text` y `title` (PUT/POST con auth).
 *
 * Patrón de alt:
 *   - Reloj: "Reloj {marca} {modelo} {referencia}"
 *     ej: "Reloj Longines Conquest Lady L34304029"
 *   - Joya: "{tipo} {material}" + descripción
 *     ej: "Anillo Oro Amarillo 18kt 6 Hilos Bicolor"
 *
 * USO (ejecutar SOLO cuando Pablo:
 *   1. Haya hecho backup en hPanel
 *   2. Haya creado una application password para PACAME en wp-admin de Royo
 *   3. Haya pasado las credenciales a este script via env)
 *
 * EJECUCIÓN:
 *   ROYO_WP_USER="usuario_admin" ROYO_WP_APP_PASS="xxxx xxxx xxxx xxxx xxxx xxxx" \
 *     node tools/royo-content-drafts/fix-image-alts.mjs
 *
 *   Flags:
 *     --dry-run        Imprime los alts pero no escribe (default activo si NO hay --apply)
 *     --apply          Aplica los cambios reales
 *     --limit=N        Limita a los N primeros productos (default sin límite)
 *     --product=ID     Solo aplica al producto con ese ID (para tests)
 *     --pause-ms=N     Pausa entre llamadas (default 300ms)
 */

// Node 18+ trae fetch nativo. Sin dependencias externas.
const undiciFetch = globalThis.fetch;

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
  return a ? parseInt(a.split("=")[1], 10) : 300;
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

// --- Marcas y heurísticas para inferir tipo ---
// Lista actualizada con TODAS las marcas detectadas en el catálogo Royo (audit 2026-04-29).
const KNOWN_BRANDS = [
  "Tissot", "Longines", "Seiko", "Casio", "Hamilton", "Oris", "Citizen",
  "Omega", "MontBlanc", "Mont Blanc", "Victorinox", "Certina",
  "Baume & Mercier", "Baume", "Franck Muller", "Genius Watches", "Genius",
  "Tsar Bomba", "Roberto Demeglio",
];

const JEWELRY_CATS = ["Joyas", "Anillos", "Pendientes", "Pulseras", "Colgantes", "Gargantillas"];
const JEWELRY_NAME_PREFIXES = [
  "Anillo", "Anillos", "Pendientes", "Pendiente", "Pulsera", "Pulseras",
  "Colgante", "Colgantes", "Gargantilla", "Gargantillas", "Solitario",
  "Cordón", "Gemelos",
];

function inferBrandFromName(productName) {
  for (const brand of KNOWN_BRANDS) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return null;
}

function inferBrandFromCategories(categories) {
  for (const c of categories || []) {
    if (KNOWN_BRANDS.includes(c.name)) return c.name;
  }
  return null;
}

function inferIsJewelry(productName, categories) {
  const catNames = (categories || []).map((c) => c.name);
  if (catNames.some((c) => JEWELRY_CATS.includes(c))) return true;
  for (const t of JEWELRY_NAME_PREFIXES) {
    if (productName.toLowerCase().startsWith(t.toLowerCase() + " ")) return true;
  }
  return false;
}

// --- Smart Title Case ---
// Convierte "CASIO MASTER OF G MUDMASTER GG-B100X-1AER" → "Casio Master of G Mudmaster GG-B100X-1AER"
// Reglas: conserva refs técnicas (con dígitos), siglas cortas, "of/y/de/la" en minúscula salvo inicio.
const LOWER_WORDS = new Set(["of", "y", "de", "la", "el", "los", "las", "the", "and", "or", "a", "an"]);

function titleCaseWord(word, isFirst) {
  // Conserva refs técnicas (contiene dígito): SKUs, modelos, calibres
  if (/\d/.test(word)) return word;
  // PALABRA-PALABRA con guion → cada parte recursivo (ej. "G-SHOCK" → "G-Shock")
  if (word.includes("-") && !/[-]\d|\d[-]/.test(word)) {
    return word.split("-").map((p, i) => titleCaseWord(p, isFirst && i === 0)).join("-");
  }
  // Conector lowercase (aunque venga en mayúsculas) — antes que siglas cortas
  const lower = word.toLowerCase();
  if (!isFirst && LOWER_WORDS.has(lower)) return lower;
  // Conserva siglas cortas: "DS", "GMT", "PVD" (no son conectores)
  if (word.length <= 3 && /^[A-ZÁÉÍÓÚÑÜ]+$/.test(word)) return word;
  // Title Case clásico
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function smartTitleCase(text) {
  return text.split(/\s+/).map((w, i) => titleCaseWord(w, i === 0)).join(" ");
}

function generateAlt(product, imageIndex = 0) {
  const rawName = (product.name || "").trim();
  // Aplicar Title Case al nombre solo para uso en alt (no toca el name del producto)
  const name = smartTitleCase(rawName);
  // Buscar marca primero en el nombre del producto, después en categorías como fallback.
  const brand = inferBrandFromName(rawName) || inferBrandFromCategories(product.categories);
  const isJewelry = inferIsJewelry(rawName, product.categories);

  // Reloj con marca conocida → "Reloj {marca} {resto del nombre}"
  if (brand && !isJewelry) {
    const lcName = name.toLowerCase();
    const lcBrand = brand.toLowerCase();
    let base;
    // Si el nombre ya empieza por "Reloj " (cualquier orden de palabras), no duplicar prefijo
    if (/^reloj\s/i.test(rawName)) {
      base = name;
    } else if (lcName.startsWith(lcBrand)) {
      base = `Reloj ${name}`;
    } else {
      base = `Reloj ${brand} ${name}`;
    }
    if (imageIndex === 0) return base.trim();
    return `${base.trim()} — vista ${imageIndex + 1}`;
  }

  // Joya: usar el nombre con Title Case (ej. "Anillo Oro Amarillo 18kt Flor con 5+5 Esmeraldas")
  if (isJewelry) {
    if (imageIndex === 0) return name;
    return `${name} — vista ${imageIndex + 1}`;
  }

  // Otros (carteras, cinturones, escritura): nombre con Title Case
  if (imageIndex === 0) return name;
  return `${name} — vista ${imageIndex + 1}`;
}

function generateTitle(product) {
  // Title = nombre del producto + " · Joyería Royo"
  return `${product.name} · Joyería Royo`;
}

async function fetchProducts() {
  console.log("[fetch] Cargando 593 productos en 6 páginas...");
  const all = [];
  for (let page = 1; page <= 6; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,categories,images`;
    const res = await undiciFetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`fetch products page ${page}: ${res.status}`);
    const data = await res.json();
    all.push(...data);
  }
  console.log(`[fetch] OK ${all.length} productos cargados.`);
  return all;
}

async function updateMedia(mediaId, alt, title) {
  const url = `${WP_BASE}/wp-json/wp/v2/media/${mediaId}`;
  const res = await undiciFetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ alt_text: alt, title }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`media ${mediaId} update failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}, limit=${limit === Infinity ? "all" : limit}, pause=${pauseMs}ms${onlyProduct ? `, only-product=${onlyProduct}` : ""}`);

  const products = await fetchProducts();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    if (processed >= limit) break;
    if (onlyProduct && product.id !== onlyProduct) continue;
    processed++;

    const images = product.images || [];
    if (images.length === 0) {
      console.log(`[skip] product ${product.id} "${product.name}" — sin imágenes`);
      skipped++;
      continue;
    }

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const newAlt = generateAlt(product, i);
      const newTitle = generateTitle(product);
      const currentAlt = img.alt || "";

      // Skip si ya está bien
      if (currentAlt && currentAlt.length > 5 && !/^Sin\s|^IMG_|^untitled/i.test(currentAlt)) {
        console.log(`  [skip] media ${img.id} ya tiene alt OK: "${currentAlt.slice(0, 60)}"`);
        skipped++;
        continue;
      }

      console.log(`  [${dryRun ? "DRY" : "DO "}] media ${img.id} | producto "${product.name.slice(0, 50)}"`);
      console.log(`        alt: "${newAlt}"`);
      console.log(`        title: "${newTitle}"`);

      if (!dryRun) {
        try {
          await updateMedia(img.id, newAlt, newTitle);
          updated++;
          await sleep(pauseMs);
        } catch (err) {
          console.error(`        ERROR: ${err.message}`);
          errors++;
          await sleep(pauseMs * 2);
        }
      } else {
        updated++;
      }
    }
  }

  console.log(`\n[done] processed=${processed} updated=${updated} skipped=${skipped} errors=${errors}`);
  if (dryRun) console.log("[done] DRY-RUN. Para aplicar de verdad: añade --apply");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
