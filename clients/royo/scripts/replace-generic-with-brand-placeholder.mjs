#!/usr/bin/env node
/**
 * Sprint 3J — Sustituir foto genérica "Sin-titulo-X.jpg" del cliente por
 * placeholder luxury específico por marca.
 *
 * Problema: 61 productos comparten 24 fotos genéricas "Sin-titulo-N.jpg"
 * que el cliente subió como provisional. En el grid de categoría parecen
 * todos el mismo producto. Pablo lo ve como "duplicados".
 *
 * Solución: para cada marca con productos en este conjunto, generar un
 * placeholder elegante con tipografía Playfair sobre fondo crema, ej.
 * "TISSOT — Foto en preparación · Disponible en tienda" en luxury Royo
 * branding (champagne #B8956A sobre paper #F8F5F0).
 *
 * Genera 14 placeholders máx (1 por marca oficial). Sube cada uno a media
 * library WP. Asigna como featured a TODOS los productos de esa marca cuya
 * featured actual sea filename "Sin-titulo*".
 *
 * Conservador:
 *   - SOLO sustituye productos con featured "Sin-titulo*" en filename.
 *   - NO toca productos con packshot oficial (filename con SKU variant).
 *   - NUNCA borra la imagen original, solo reasigna featured.
 *   - Cada marca con su placeholder único (no genérico) → en grid se
 *     diferencian visualmente por brand badge en la imagen.
 *
 * USO:
 *   node clients/royo/scripts/replace-generic-with-brand-placeholder.mjs               # dry-run
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/replace-generic-with-brand-placeholder.mjs --apply
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';
const HISTORY_DIR = 'clients/royo/history';
fs.mkdirSync(HISTORY_DIR, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const limit = (() => {
  const a = args.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();
const pauseMs = (() => {
  const a = args.find((x) => x.startsWith('--pause-ms='));
  return a ? parseInt(a.split('=')[1], 10) : 800;
})();

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
const muSecret = process.env.ROYO_PACAME_SECRET;
if (!dryRun && (!wpUser || !wpPass || !muSecret)) {
  console.error('ERROR: para --apply necesito ROYO_WP_USER, ROYO_WP_APP_PASS y ROYO_PACAME_SECRET en env.');
  process.exit(1);
}
const auth = wpUser && wpPass ? 'Basic ' + Buffer.from(`${wpUser}:${wpPass}`).toString('base64') : null;

const WATCH_BRANDS = [
  'Tissot', 'Longines', 'Casio', 'Seiko', 'Citizen', 'Hamilton',
  'Oris', 'Certina', 'MontBlanc', 'Mont Blanc', 'Victorinox',
  'Baume & Mercier', 'Franck Muller', 'Omega'
];

function detectBrand(p) {
  const cats = (p.categories || []).map(c => c.name);
  for (const b of WATCH_BRANDS) {
    if (cats.includes(b)) return b;
    if ((p.name || '').toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
}

function isGenericFilename(url) {
  if (!url) return false;
  const fn = url.split('/').pop().split('?')[0].toLowerCase();
  return /^sin-titulo(-\d+)?\.(jpg|jpeg|png|webp)$/i.test(fn);
}

// SVG → PNG vía placehold.co que renderiza tipografía. Color paper + champagne.
function placeholderUrlForBrand(brand) {
  const bg = 'F8F5F0';   // royo-paper
  const fg = 'B8956A';   // royo-champagne-dark
  const subFg = '6B635B'; // royo-charcoal
  const upperBrand = brand.toUpperCase();
  // Línea 1: marca grande, línea 2: "Foto disponible en tienda"
  // placehold.co soporta solo 1 texto. Usamos imagen única con concat de líneas.
  const text = encodeURIComponent(`${upperBrand}\\nFoto en tienda`);
  return `https://placehold.co/800x800/${bg}/${fg}/png?text=${text}&font=playfair`;
}

async function callMu(path, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', muSecret).update(ts + ':' + path + ':' + body).digest('hex');
  const res = await fetch(WP_BASE + '/wp-json' + path, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'User-Agent': PACAME_UA,
      'X-PACAME-Timestamp': ts,
      'X-PACAME-Signature': sig,
    },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${path} → ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchAllProducts() {
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
  return all;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, limit=${limit === Infinity ? 'all' : limit}`);

  const all = await fetchAllProducts();
  console.log(`[fetch] ${all.length} productos.`);

  // Filtrar productos con featured genérica
  const targets = all.filter(p => {
    const imgs = p.images || [];
    if (!imgs.length) return false;
    return isGenericFilename(imgs[0].src);
  });
  console.log(`[filter] ${targets.length} productos con foto featured genérica "Sin-titulo*".`);

  // Agrupar por marca
  const byBrand = {};
  const noBrand = [];
  for (const p of targets) {
    const b = detectBrand(p);
    if (!b) { noBrand.push(p); continue; }
    byBrand[b] = byBrand[b] || [];
    byBrand[b].push(p);
  }
  console.log(`[group] ${Object.keys(byBrand).length} marcas, ${noBrand.length} sin marca`);
  for (const [b, list] of Object.entries(byBrand)) {
    console.log(`  ${b}: ${list.length}`);
  }

  if (dryRun) {
    console.log('\n=== samples ===');
    for (const [b, list] of Object.entries(byBrand)) {
      const url = placeholderUrlForBrand(b);
      console.log(`  ${b} → ${url.slice(0, 110)}`);
      console.log(`    productos: ${list.slice(0, 2).map(p => p.id).join(', ')}${list.length > 2 ? ', ...' : ''}`);
    }
    return;
  }

  // 1. Subir 1 placeholder por marca a media library
  const brandMediaIds = {};
  for (const brand of Object.keys(byBrand)) {
    const url = placeholderUrlForBrand(brand);
    try {
      const upload = await callMu('/pacame/v1/media/upload-from-url', {
        url,
        filename: `placeholder-${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
        alt: `${brand} — Foto disponible en tienda Joyería Royo`,
      });
      if (upload?.id) {
        brandMediaIds[brand] = upload.id;
        console.log(`  [uploaded] ${brand} → media_id=${upload.id}`);
      }
      await sleep(800);
    } catch (e) {
      console.error(`  [ERR upload ${brand}] ${e.message}`);
    }
  }

  // 2. Asignar el placeholder de cada marca a sus productos
  let processed = 0, applied = 0, errors = 0;
  const historyEntries = [];
  for (const [brand, list] of Object.entries(byBrand)) {
    const mediaId = brandMediaIds[brand];
    if (!mediaId) {
      console.error(`  [skip ${brand}] no media id`);
      continue;
    }
    for (const p of list) {
      if (processed >= limit) break;
      processed++;
      try {
        const updateUrl = `${WP_BASE}/wp-json/wc/v3/products/${p.id}`;
        const oldImgs = (p.images || []).map(img => img.id);
        // Reemplazar la primera imagen por el placeholder. Mantener el resto si hay.
        const newImgs = [{ id: mediaId }, ...oldImgs.slice(1).map(id => ({ id }))];
        const res = await fetch(updateUrl, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
          body: JSON.stringify({ images: newImgs }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        applied++;
        historyEntries.push({ id: p.id, sku: p.sku, brand, before: oldImgs, after: newImgs.map(i => i.id), ts: Date.now() });
        await sleep(pauseMs);
      } catch (err) {
        errors++;
        console.error(`  [ERR ${p.id}] ${err.message}`);
        await sleep(pauseMs * 2);
      }
    }
  }

  if (historyEntries.length) {
    const fname = `${HISTORY_DIR}/replace-generic-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] processed=${processed} applied=${applied} errors=${errors}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
