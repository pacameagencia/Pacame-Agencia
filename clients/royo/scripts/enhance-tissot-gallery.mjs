#!/usr/bin/env node
/**
 * Sprint 3F-C3 — Enriquecer galería Tissot con 2da+3ra imagen oficial.
 *
 * Estrategia ESTRICTA: para cada producto Tissot que tenga 1 sola imagen
 * (la featured en sesión 2C), descargar las VARIANTES de la misma URL
 * Tissot CDN: _Shadow (principal, ya tiene), _B1 (vista trasera caja),
 * _ZOOM (zoom correa). Se añaden como 2da y 3ra imagen de la galería.
 *
 * MATCH ESTRICTO: la URL fuente debe contener la variante SKU completa
 * (ej. T150-410-11-091-00). Si no hay match, skip silencioso.
 *
 * Conservador:
 *   - Solo añade nuevas imágenes a galería, NUNCA borra ni cambia featured.
 *   - Si producto tiene ya 2+ imágenes en galería, skip.
 *   - Solo Tissot (catálogo oficial accesible). Otras marcas pendientes.
 *
 * USO:
 *   node clients/royo/scripts/enhance-tissot-gallery.mjs               # dry-run
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/enhance-tissot-gallery.mjs --apply
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const TISSOT_BASE = 'https://www.tissotwatches.com/es-es';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
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
  return a ? parseInt(a.split('=')[1], 10) : 1500;
})();

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
const muSecret = process.env.ROYO_PACAME_SECRET;
if (!dryRun && (!wpUser || !wpPass || !muSecret)) {
  console.error('ERROR: para --apply necesito ROYO_WP_USER, ROYO_WP_APP_PASS y ROYO_PACAME_SECRET en env.');
  process.exit(1);
}
const auth = wpUser && wpPass ? 'Basic ' + Buffer.from(`${wpUser}:${wpPass}`).toString('base64') : null;

function variantSkuDash(sku) {
  if (!sku || sku.length < 14 || !sku.startsWith('T')) return null;
  return sku.charAt(0) + sku.slice(1, 4) + '-' + sku.slice(4, 7) + '-' + sku.slice(7, 9) + '-' + sku.slice(9, 12) + '-' + sku.slice(12);
}

async function fetchProductPage(sku) {
  const url = `${TISSOT_BASE}/${sku}.html`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' },
    });
    if (!res.ok) return null;
    return res.text();
  } catch { return null; }
}

function extractAlternateViews(html, vDash) {
  if (!vDash) return [];
  const escDash = vDash.replace(/-/g, '\\-');
  // Variantes alternativas: _B1 (vista trasera), _ZOOM (correa zoom), _WRIST (en muñeca)
  const result = {};
  for (const variant of ['B1', 'ZOOM', 'WRIST']) {
    const re = new RegExp(
      `https://www\\.tissotwatches\\.com/dw/image/[^"\\) ]+_${escDash}_${variant}\\.png(?:\\?[^"\\) ]*)?`,
      'gi'
    );
    const matches = html.match(re);
    if (matches && matches.length > 0) {
      result[variant] = matches[0].split('?')[0]; // hi-res sin query
    }
  }
  return result;
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
    const text = await res.text();
    throw new Error(`${path} → ${res.status} ${text.slice(0, 250)}`);
  }
  return res.json();
}

async function fetchTissotProducts() {
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&category=&_fields=id,name,sku,images,categories`;
    const res = await fetch(url, {
      headers: {
        Authorization: auth || '',
        'User-Agent': PACAME_UA,
      },
    });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  // Filtrar Tissot
  return all.filter(p => (p.categories || []).some(c => c.name === 'Tissot'));
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, limit=${limit === Infinity ? 'all' : limit}`);

  const products = await fetchTissotProducts();
  console.log(`[fetch] ${products.length} productos Tissot.`);

  // Solo productos con 1 imagen
  const targets = products.filter(p => (p.images || []).length === 1);
  console.log(`[filter] ${targets.length} Tissot con 1 sola imagen.`);

  let processed = 0, found = 0, applied = 0, errors = 0;
  const samples = [];
  const historyEntries = [];

  for (const p of targets) {
    if (processed >= limit) break;
    if (!p.sku) continue;
    processed++;

    const vDash = variantSkuDash(p.sku);
    if (!vDash) continue;

    try {
      const html = await fetchProductPage(p.sku);
      if (!html) {
        await sleep(pauseMs);
        continue;
      }
      const views = extractAlternateViews(html, vDash);
      const numViews = Object.keys(views).length;
      if (numViews === 0) {
        await sleep(pauseMs);
        continue;
      }
      found++;
      console.log(`  [found] #${processed} id=${p.id} sku=${p.sku} → ${numViews} views (${Object.keys(views).join(',')})`);
      if (samples.length < 5) samples.push({ id: p.id, sku: p.sku, name: p.name.slice(0, 50), views: Object.keys(views) });

      if (dryRun) { await sleep(pauseMs); continue; }

      // Subir cada vista alternativa como adjunto y añadir a galería
      const newImageIds = (p.images || []).map(img => img.id);
      const beforeIds = [...newImageIds];
      const labels = { B1: 'vista trasera', ZOOM: 'detalle correa', WRIST: 'puesto en muñeca' };

      for (const [variantKey, url] of Object.entries(views)) {
        try {
          const upload = await callMu('/pacame/v1/media/upload-from-url', {
            url,
            filename: `${p.sku}_${variantKey}.png`,
            alt: `${p.name} — ${labels[variantKey] || variantKey}`,
          });
          if (upload?.id && !newImageIds.includes(upload.id)) {
            newImageIds.push(upload.id);
          }
        } catch (e) {
          console.error(`    upload ${variantKey} fail: ${e.message.slice(0, 100)}`);
        }
        await sleep(500);
      }

      if (newImageIds.length > beforeIds.length) {
        // Update product images: featured + galería
        const updateUrl = `${WP_BASE}/wp-json/wc/v3/products/${p.id}`;
        const updateBody = JSON.stringify({
          images: newImageIds.map(id => ({ id })),
        });
        const upRes = await fetch(updateUrl, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
          body: updateBody,
        });
        if (!upRes.ok) {
          throw new Error(`update product ${p.id}: ${upRes.status}`);
        }
        applied++;
        historyEntries.push({ id: p.id, sku: p.sku, before: beforeIds, after: newImageIds, ts: Date.now() });
      }
      await sleep(pauseMs);
    } catch (err) {
      errors++;
      console.error(`  [ERR] id=${p.id}: ${err.message}`);
      await sleep(pauseMs * 2);
    }
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/enhance-gallery-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] processed=${processed} found=${found} applied=${applied} errors=${errors}`);
  if (samples.length) {
    console.log('\n=== muestras ===');
    for (const s of samples) console.log(`  id=${s.id} sku=${s.sku} → ${s.views.join(',')}`);
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
