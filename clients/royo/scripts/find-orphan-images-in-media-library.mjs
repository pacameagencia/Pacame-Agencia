#!/usr/bin/env node
/**
 * Sprint 3T — Buscar packshots oficiales huérfanos en media library WP.
 *
 * Hallazgo de Sprint 3Q: 2 packshots Longines estaban en uploads pero asignados
 * al producto INCORRECTO. Re-mapamos 2.
 *
 * Sprint 3T extiende: buscar en TODA la media library (wp/v2/media) cualquier
 * filename que matchee el variant del SKU de productos sin foto, NO solo en
 * galerías de otros productos. Cubre el caso "imagen huérfana subida pero no
 * asignada a ningún producto".
 *
 * Patrones SKU → variant filename:
 *   - Longines: L37794566 → l3-779-4-56-6
 *   - Tissot: T1504101109100 → T150-410-11-091-00 (guiones) o T150_410_11_091_00 (underscores)
 *   - Hamilton: H70615133 → h7-061-5-13-3 (similar a Longines)
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/find-orphan-images-in-media-library.mjs --apply
 */
import fs from 'node:fs';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0';
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
 * Genera todas las variantes de filename posibles para un SKU.
 * Las marcas usan distintos formatos en CDN.
 */
function skuToVariants(sku) {
  if (!sku) return [];
  const variants = new Set();
  variants.add(sku.toLowerCase());
  variants.add(sku.toUpperCase());

  // Longines L37794566 → l3-779-4-56-6
  if (sku.match(/^L\d{8}$/i)) {
    const d = sku.slice(1);
    variants.add(`l${d[0]}-${d.slice(1, 4)}-${d[4]}-${d.slice(5, 7)}-${d[7]}`);
    variants.add(`l${d[0]}.${d.slice(1, 4)}.${d[4]}.${d.slice(5, 7)}.${d[7]}`);
  }
  // Longines L378814066 (9 digit) → l3-788-1-40-6-6
  if (sku.match(/^L\d{9}$/i)) {
    const d = sku.slice(1);
    variants.add(`l${d[0]}-${d.slice(1, 4)}-${d[4]}-${d.slice(5, 7)}-${d[7]}-${d[8]}`);
  }

  // Tissot T1504101109100 → T150-410-11-091-00 / T150_410_11_091_00
  if (sku.match(/^T\d{13}$/i)) {
    const d = sku.slice(1);
    const dashed = `t${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 11)}-${d.slice(11)}`;
    variants.add(dashed);
    variants.add(dashed.replace(/-/g, '_'));
    variants.add(dashed.replace(/-/g, '.'));
  }

  // Hamilton H70615133 → h7-061-5-13-3
  if (sku.match(/^H\d{8}$/i)) {
    const d = sku.slice(1);
    variants.add(`h${d[0]}-${d.slice(1, 4)}-${d[4]}-${d.slice(5, 7)}-${d[7]}`);
  }

  // Certina C0484071105101 → c048-407-11-051-01
  if (sku.match(/^C\d{13}$/i)) {
    const d = sku.slice(1);
    variants.add(`c${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 11)}-${d.slice(11)}`);
    variants.add(`c${d.slice(0, 3)}_${d.slice(3, 6)}_${d.slice(6, 8)}_${d.slice(8, 11)}_${d.slice(11)}`);
  }

  return [...variants];
}

async function fetchProductsWithoutPhoto() {
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&_fields=id,name,sku,categories,images`;
    const res = await fetch(url, { headers: { Authorization: auth || '', 'User-Agent': PACAME_UA } });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all.filter(p => {
    const imgs = p.images || [];
    if (!imgs.length) return false;
    return (imgs[0].src || '').toLowerCase().includes('sin-titulo');
  });
}

async function searchMediaLibrary(variant) {
  // Buscar en media library con search
  const url = `${WP_BASE}/wp-json/wp/v2/media?per_page=30&search=${encodeURIComponent(variant)}&_fields=id,source_url,title,slug,media_details`;
  const res = await fetch(url, { headers: { Authorization: auth || '', 'User-Agent': PACAME_UA } });
  if (!res.ok) return [];
  return res.json();
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}`);

  const sinFoto = await fetchProductsWithoutPhoto();
  console.log(`[fetch] ${sinFoto.length} productos con featured "Sin-titulo*"`);

  let found = 0, applied = 0, notFound = 0;
  const historyEntries = [];

  for (const p of sinFoto) {
    const variants = skuToVariants(p.sku);
    if (!variants.length) {
      console.log(`  [skip] id=${p.id} sku=${p.sku} — no patrón`);
      continue;
    }

    let allMedia = [];
    for (const v of variants) {
      const matches = await searchMediaLibrary(v);
      for (const m of matches) {
        if (m.source_url.toLowerCase().includes(v.toLowerCase())) {
          allMedia.push({ ...m, matchedVariant: v });
        }
      }
      await sleep(150);
    }

    // Deduplicate por id
    const uniq = {};
    for (const m of allMedia) uniq[m.id] = m;
    const list = Object.values(uniq);

    if (list.length === 0) {
      notFound++;
      console.log(`  [no-match] id=${p.id} sku=${p.sku} variants=${variants.slice(0,3).join(',')}`);
      continue;
    }

    found++;
    console.log(`\n[found] id=${p.id} sku=${p.sku} → ${list.length} media`);
    for (const m of list.slice(0, 5)) console.log(`    media_id=${m.id} → ${m.source_url.split('/').pop().slice(0, 80)}`);

    // Preferir "hero" / "watch-collection" como primera
    const sorted = list.sort((a, b) => {
      const aHero = (a.source_url.includes('hero') || a.source_url.includes('watch-collection')) ? 0 : 1;
      const bHero = (b.source_url.includes('hero') || b.source_url.includes('watch-collection')) ? 0 : 1;
      return aHero - bHero;
    });

    const ids = sorted.map(m => m.id).slice(0, 6);

    if (dryRun) continue;

    try {
      const oldIds = (p.images || []).map(img => img.id);
      await updateProductImages(p.id, ids);
      applied++;
      historyEntries.push({ id: p.id, sku: p.sku, variants, before: oldIds, after: ids, ts: Date.now() });
      console.log(`  ✓ aplicado`);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
    await sleep(400);
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/orphan-images-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`\n[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] sin-foto=${sinFoto.length} found=${found} applied=${applied} notFound=${notFound}`);
})();
