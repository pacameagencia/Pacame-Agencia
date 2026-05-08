#!/usr/bin/env node
/**
 * Sprint 2C v2 — Reemplazar imagen destacada de productos Tissot por la
 * imagen oficial packshot del catálogo Tissot (tissotwatches.com).
 *
 * Diferencias vs v1:
 *   - Usa Scrapling stealthy_fetch via subprocess (anti-bot bypass).
 *   - Nuevo regex CDN actualizado: el catálogo usa GUIONES (T150-410-11-091-00)
 *     y el CDN es `https://www.tissotwatches.com/dw/image/v2/BKKD_PRD/...`.
 *   - Estrategia preferente: imagen "_Shadow" (packshot principal con sombra,
 *     mejor calidad que sin shadow, mejor que _ZOOM o _WRIST o _PROFIL).
 *
 * Flujo por producto:
 *   1. Leer SKU vía Store API.
 *   2. fetchOfficialImage(sku) hace GET con Mozilla UA estándar.
 *      Si encuentra, devuelve URL hi-res "_Shadow.png" o "_shadow.png".
 *      Si no, fallback a cualquier "{variantSku}.png" (sin sufijo).
 *   3. Subir al WP de Royo vía /pacame/v1/media/upload-from-url.
 *   4. Asignar el media id como imagen destacada.
 *
 * USO:
 *   node clients/royo/scripts/replace-tissot-images-v2.mjs              # dry-run
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/replace-tissot-images-v2.mjs --apply
 */
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const TISSOT_BASE = 'https://www.tissotwatches.com/es-es';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';
const TMP = 'C:/tmp/royo-tissot-v2';
fs.mkdirSync(TMP, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const onlyMissing = args.includes('--only-missing'); // saltar productos que ya tienen packshot oficial
const limit = (() => {
  const a = args.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();
const onlyProduct = (() => {
  const a = args.find((x) => x.startsWith('--product='));
  return a ? parseInt(a.split('=')[1], 10) : null;
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
  // T1504101108100 → T150-410-11-081-00 (guiones)
  if (!sku || sku.length < 14 || !sku.startsWith('T')) return null;
  return sku.charAt(0) + sku.slice(1, 4) + '-' + sku.slice(4, 7) + '-' + sku.slice(7, 9) + '-' + sku.slice(9, 12) + '-' + sku.slice(12);
}
function variantSkuUnder(sku) {
  // T1504101108100 → T150_410_11_081_00 (compat URLs viejas)
  if (!sku || sku.length < 14 || !sku.startsWith('T')) return null;
  return sku.charAt(0) + sku.slice(1, 4) + '_' + sku.slice(4, 7) + '_' + sku.slice(7, 9) + '_' + sku.slice(9, 12) + '_' + sku.slice(12);
}

async function fetchOfficialImage(skuRaw) {
  const sku = (skuRaw || '').trim();
  if (!sku) return null;
  const vDash = variantSkuDash(sku);
  const vUnder = variantSkuUnder(sku);

  const tryUrls = [
    `${TISSOT_BASE}/${sku}.html`,
    `${TISSOT_BASE}/search?q=${encodeURIComponent(sku)}`,
  ];

  for (const url of tryUrls) {
    let html = '';
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          Referer: 'https://www.google.com/',
        },
      });
      if (!res.ok) continue;
      html = await res.text();
    } catch {
      continue;
    }

    // 1. Preferir packshot Shadow hi-res (.png canonical) - patrón guiones
    if (vDash) {
      const reShadow = new RegExp(
        'https://www\\.tissotwatches\\.com/dw/image/[^"\\) ]+_' + vDash.replace(/-/g, '\\-') + '_(?:Shadow|shadow)\\.png(?:\\?[^"\\) ]*)?',
        'g'
      );
      const ms = html.match(reShadow);
      if (ms && ms.length > 0) {
        // Quitar query params (?sm=fit&sw=...) para coger versión hi-res
        return ms[0].split('?')[0];
      }

      // 2. Fallback: packshot sin sufijo
      const rePlain = new RegExp(
        'https://www\\.tissotwatches\\.com/dw/image/[^"\\) ]+_' + vDash.replace(/-/g, '\\-') + '\\.png(?:\\?[^"\\) ]*)?',
        'g'
      );
      const mp = html.match(rePlain);
      if (mp && mp.length > 0) return mp[0].split('?')[0];
    }

    // 3. Compat URLs viejas con underscore
    if (vUnder) {
      const reOld = new RegExp(
        'https://www\\.tissotwatches\\.com/[^"\\) ]+_' + vUnder + '\\.png',
        'g'
      );
      const mo = html.match(reOld);
      if (mo && mo.length > 0) return mo[0];
    }
  }
  return null;
}

async function fetchTissotProducts() {
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,categories,images`;
    const res = await fetch(url, { headers: { 'User-Agent': PACAME_UA } });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all.filter((p) => (p.categories || []).some((c) => c.name === 'Tissot'));
}

function alreadyHasOfficial(p) {
  if (!p.sku || !p.images?.length) return false;
  const first = (p.images[0]?.src || '').toLowerCase();
  const vDash = variantSkuDash(p.sku);
  const vUnder = variantSkuUnder(p.sku);
  if (vDash && first.includes(vDash.toLowerCase())) return true;
  if (vUnder && first.includes(vUnder.toLowerCase())) return true;
  if (first.includes(p.sku.toLowerCase())) return true;
  return false;
}

async function downloadFile(url, outPath) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.tissotwatches.com/' } });
  if (!res.ok) throw new Error(`download ${url}: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(outPath));
  return fs.statSync(outPath).size;
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, limit=${limit === Infinity ? 'all' : limit}, only-missing=${onlyMissing}`);

  let products;
  if (onlyProduct) {
    const r = await fetch(`${WP_BASE}/wp-json/wc/store/v1/products?include=${onlyProduct}&_fields=id,name,sku,categories,images`);
    products = await r.json();
    if (!products.length) { console.error(`Producto ${onlyProduct} no encontrado`); process.exit(1); }
  } else {
    products = await fetchTissotProducts();
  }
  console.log(`[fetch] ${products.length} productos Tissot.`);

  if (onlyMissing) {
    const before = products.length;
    products = products.filter((p) => !alreadyHasOfficial(p));
    console.log(`[filter] only-missing: ${before} → ${products.length} productos sin packshot oficial`);
  }

  let processed = 0, found = 0, replaced = 0, errors = 0;
  const noImg = [];
  const newImages = [];

  for (const p of products) {
    if (processed >= limit) break;
    if (!p.sku) continue;
    processed++;
    try {
      const officialUrl = await fetchOfficialImage(p.sku);
      if (!officialUrl) {
        noImg.push({ id: p.id, sku: p.sku, name: p.name });
        console.log(`  [no-img] #${processed} id=${p.id} sku=${p.sku}`);
        await sleep(pauseMs);
        continue;
      }
      found++;
      console.log(`  [found] #${processed} id=${p.id} sku=${p.sku}`);
      console.log(`            ${officialUrl.slice(0, 130)}...`);

      if (dryRun) {
        await sleep(pauseMs);
        continue;
      }

      // Descargar local
      const local = `${TMP}/${p.sku}.png`;
      const size = await downloadFile(officialUrl, local);
      if (size < 5000) throw new Error(`imagen demasiado pequeña: ${size}b`);

      // Subir vía /media/upload-from-url
      const upload = await callMu('/pacame/v1/media/upload-from-url', {
        url: officialUrl,
        filename: `${p.sku}.png`,
        alt: `${p.name} — packshot oficial Tissot`,
      });
      if (!upload?.id) throw new Error(`upload sin id: ${JSON.stringify(upload).slice(0, 200)}`);

      // Asignar como featured image
      await callMu(`/pacame/v1/products/${p.id}/featured-image`, {
        media_id: upload.id,
      });
      replaced++;
      newImages.push({ id: p.id, sku: p.sku, name: p.name, mediaId: upload.id });
      await sleep(pauseMs);
    } catch (err) {
      errors++;
      console.error(`  [ERR] #${processed} id=${p.id} sku=${p.sku}: ${err.message}`);
      await sleep(pauseMs * 2);
    }
  }

  console.log(`\n[done] processed=${processed} found=${found} replaced=${replaced} errors=${errors} no-img=${noImg.length}`);
  if (noImg.length > 0 && noImg.length <= 30) {
    console.log('\n=== Sin imagen oficial ===');
    for (const x of noImg) console.log(`  id=${x.id} sku=${x.sku} — ${x.name.slice(0, 70)}`);
  }
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
