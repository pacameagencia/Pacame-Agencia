#!/usr/bin/env node
/**
 * Sprint 3Q — Re-mapear imágenes Longines HydroConquest mal asignadas.
 *
 * Hallazgo: las imágenes oficiales de los modelos sin foto ya están subidas
 * a wp-content/uploads pero asignadas a OTRO producto. Ejemplo:
 *   - id=12939 sku=L37794966 (sin foto, usa "Sin-titulo-64.jpg")
 *   - Pero existe en uploads: hydroconquest-l3-779-4-96-6-*.avif
 *     (variante L37794966 = l3-779-4-96-6) asignada a otro producto.
 *
 * Patrón URL Longines: L<a><bbb><c><dd><e> → l<a>-<bbb>-<c>-<dd>-<e>
 *
 * Algoritmo:
 *   1. Fetch todos los productos Longines con sus images.
 *   2. Para cada producto cuyo featured sea "Sin-titulo*", buscar en la galería
 *      de TODOS los productos Longines una imagen que matchee la variante.
 *   3. Si encuentra, asignar esa media_id como featured + añadir extras a galería.
 *
 * Conservador: NUNCA borra imágenes existentes. Solo reasigna.
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/fix-longines-hydroconquest-images.mjs --apply
 */
import fs from 'node:fs';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';
const HISTORY_DIR = 'clients/royo/history';
fs.mkdirSync(HISTORY_DIR, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error('ERROR: necesito ROYO_WP_USER y ROYO_WP_APP_PASS');
  process.exit(1);
}
const auth = wpUser && wpPass ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}` : null;

/**
 * Convierte SKU Longines a variante CDN.
 * L37794966 → l3-779-4-96-6
 * Patrón: L + 8 dígitos → l + d1 + - + d2d3d4 + - + d5 + - + d6d7 + - + d8
 */
function skuToVariant(sku) {
  if (!sku || !sku.startsWith('L') || sku.length < 9) return null;
  const digits = sku.slice(1);
  // L37794566 (8 dígitos) → l3-779-4-56-6
  if (digits.length === 8) {
    return `l${digits[0]}-${digits.slice(1, 4)}-${digits[4]}-${digits.slice(5, 7)}-${digits[7]}`;
  }
  // L378814066 (9 dígitos) hipotético
  if (digits.length === 9) {
    return `l${digits[0]}-${digits.slice(1, 4)}-${digits[4]}-${digits.slice(5, 7)}-${digits.slice(7)}`;
  }
  return null;
}

async function fetchProducts(brand = 'Longines') {
  // Use authenticated WC v3 endpoint to get image IDs
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&_fields=id,name,sku,categories,images`;
    const res = await fetch(url, {
      headers: { Authorization: auth || '', 'User-Agent': PACAME_UA },
    });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all.filter(p => (p.categories || []).some(c => c.name === brand));
}

function findVariantInImages(variant, allProducts) {
  // Busca en TODAS las galerías del catálogo cualquier imagen que matchee el variant
  const matches = [];
  for (const p of allProducts) {
    for (const img of (p.images || [])) {
      const src = (img.src || '').toLowerCase();
      const fname = src.split('/').pop().split('?')[0];
      if (fname.includes(variant)) {
        // Encontrado! Devolver media_id, current product id, filename
        matches.push({ mediaId: img.id, fromProductId: p.id, filename: fname, src: img.src });
      }
    }
  }
  return matches;
}

async function updateProductImages(productId, mediaIds) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body: JSON.stringify({ images: mediaIds.map(id => ({ id })) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`product ${productId}: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

(async () => {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}`);

  const longines = await fetchProducts('Longines');
  console.log(`[fetch] ${longines.length} productos Longines`);

  // Productos sin foto (featured Sin-titulo*)
  const sinFoto = longines.filter(p => {
    const imgs = p.images || [];
    if (!imgs.length) return false;
    return (imgs[0].src || '').toLowerCase().includes('sin-titulo');
  });
  console.log(`[filter] ${sinFoto.length} Longines con featured "Sin-titulo*"`);

  let applied = 0, found = 0, notFound = 0, errors = 0;
  const historyEntries = [];

  for (const p of sinFoto) {
    const variant = skuToVariant(p.sku);
    if (!variant) {
      console.log(`  [skip] id=${p.id} sku=${p.sku} — no variant pattern`);
      continue;
    }
    console.log(`\n[search] id=${p.id} sku=${p.sku} → variant=${variant}`);

    const matches = findVariantInImages(variant, longines);
    if (matches.length === 0) {
      console.log(`  [no-match] No images found for variant ${variant}`);
      notFound++;
      continue;
    }
    found++;
    console.log(`  [found] ${matches.length} imágenes con variant ${variant}:`);
    for (const m of matches.slice(0, 5)) {
      console.log(`    media_id=${m.mediaId} en producto ${m.fromProductId} → ${m.filename.slice(0, 80)}`);
    }

    // Preferir el "hero" o "watch-collection-..." como primera
    const sorted = matches.slice().sort((a, b) => {
      const aHero = a.filename.includes('hero') || a.filename.includes('watch-collection') ? 0 : 1;
      const bHero = b.filename.includes('hero') || b.filename.includes('watch-collection') ? 0 : 1;
      return aHero - bHero;
    });
    const uniqueIds = [...new Set(sorted.map(m => m.mediaId))];
    console.log(`  [plan] usar ${uniqueIds.length} media_ids como galería: ${uniqueIds.slice(0, 5).join(',')}`);

    if (dryRun) continue;

    try {
      const oldIds = (p.images || []).map(img => img.id);
      await updateProductImages(p.id, uniqueIds);
      applied++;
      historyEntries.push({ id: p.id, sku: p.sku, variant, before: oldIds, after: uniqueIds, ts: Date.now() });
    } catch (err) {
      console.error(`  [ERR] ${err.message}`);
      errors++;
    }
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/fix-longines-images-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`\n[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] sin-foto=${sinFoto.length} found=${found} applied=${applied} notFound=${notFound} errors=${errors}`);
})();
