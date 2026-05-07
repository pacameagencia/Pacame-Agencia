#!/usr/bin/env node
/**
 * Sprint 2C — Reemplazar imagen destacada de productos Tissot por la
 * imagen oficial packshot del catálogo Tissot (tissotwatches.com).
 *
 * Flujo por producto:
 *   1. Leer SKU vía Store API.
 *   2. Visitar https://www.tissotwatches.com/es-es/{SKU}.html.
 *   3. Extraer URL packshot principal por regex con variante del SKU.
 *   4. Subir la imagen al WP de Royo vía /pacame/v1/media/upload-from-url.
 *   5. Asignar el media id como imagen destacada vía
 *      /pacame/v1/products/{id}/featured-image.
 *
 * Reversibilidad: la imagen actual del cliente NO se borra, solo se
 * sustituye como destacada. Sigue accesible en la galería original.
 *
 * USO:
 *   node clients/royo/scripts/replace-tissot-images.mjs              # dry-run (sin subir)
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/replace-tissot-images.mjs --apply
 *
 *   --apply         Sube imágenes y reemplaza destacada.
 *   --limit=N       Solo N productos (útil para test).
 *   --product=ID    Solo un producto.
 *   --pause-ms=N    Pausa entre llamadas (default 1000ms).
 */
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const TISSOT_BASE = 'https://www.tissotwatches.com/es-es';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';
const TMP = 'C:/tmp/royo-tissot-poc';
fs.mkdirSync(TMP, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
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
  return a ? parseInt(a.split('=')[1], 10) : 1000;
})();

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
const muSecret = process.env.ROYO_PACAME_SECRET;
if (!dryRun && (!wpUser || !wpPass || !muSecret)) {
  console.error('ERROR: para --apply necesito ROYO_WP_USER, ROYO_WP_APP_PASS y ROYO_PACAME_SECRET en env.');
  process.exit(1);
}
const auth = wpUser && wpPass ? 'Basic ' + Buffer.from(`${wpUser}:${wpPass}`).toString('base64') : null;

function variantSku(sku) {
  // T1504101109100 → T150_410_11_091_00
  if (!sku || sku.length < 14 || !sku.startsWith('T')) return null;
  return sku.charAt(0) + sku.slice(1, 4) + '_' + sku.slice(4, 7) + '_' + sku.slice(7, 9) + '_' + sku.slice(9, 12) + '_' + sku.slice(12);
}

async function fetchOfficialImage(skuRaw) {
  const sku = (skuRaw || '').trim();
  if (!sku) return null;
  // Estrategia 1: página directa del producto
  const url = `${TISSOT_BASE}/${sku}.html`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.ok) {
    const html = await res.text();
    const v = variantSku(sku);
    if (v) {
      const re = new RegExp('https://www\\.tissotwatches\\.com/[^"\\) ]+_' + v + '\\.png', 'g');
      const matches = html.match(re);
      if (matches && matches.length > 0) return matches[0];
    }
  }
  // Estrategia 2: search interno del sitio Tissot
  const searchUrl = `https://www.tissotwatches.com/es-es/search?q=${encodeURIComponent(sku)}`;
  const sres = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
  if (sres.ok) {
    const shtml = await sres.text();
    // Buscar packshot principal (sin sufijos como _PROFIL/_WRIST/_Head)
    const v = variantSku(sku);
    if (v) {
      const re = new RegExp('https://www\\.tissotwatches\\.com/[^"\\) ]+_' + v + '\\.png', 'g');
      const matches = shtml.match(re);
      if (matches && matches.length > 0) return matches[0];
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
  // Filtrar solo Tissot
  return all.filter((p) => (p.categories || []).some((c) => c.name === 'Tissot'));
}

async function fetchProductById(id) {
  const url = `${WP_BASE}/wp-json/wc/store/v1/products?include=${id}&_fields=id,name,sku,categories,images`;
  const res = await fetch(url, { headers: { 'User-Agent': PACAME_UA } });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function downloadFile(url, outPath) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
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
    throw new Error(`${path} → ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, limit=${limit === Infinity ? 'all' : limit}, pause=${pauseMs}ms`);

  let products;
  if (onlyProduct) {
    const p = await fetchProductById(onlyProduct);
    if (!p) { console.error(`Producto ${onlyProduct} no encontrado`); process.exit(1); }
    products = [p];
  } else {
    products = await fetchTissotProducts();
    console.log(`[fetch] ${products.length} productos Tissot encontrados.`);
  }

  let processed = 0, found = 0, replaced = 0, noOfficial = 0, errors = 0;
  const errList = [];

  for (const product of products) {
    if (processed >= limit) break;
    processed++;

    const sku = product.sku;
    if (!sku || !sku.startsWith('T')) {
      console.log(`  [skip] id=${product.id} "${product.name.slice(0, 40)}" — SKU no Tissot: "${sku}"`);
      continue;
    }

    try {
      const officialUrl = await fetchOfficialImage(sku);
      if (!officialUrl) {
        console.log(`  [no-img] id=${product.id} sku=${sku} — sin imagen oficial encontrada`);
        noOfficial++;
        await sleep(pauseMs);
        continue;
      }
      found++;
      const filename = `tissot-${sku}.png`;
      console.log(`  [${dryRun ? 'DRY' : 'DO '}] #${processed}/${products.length} id=${product.id} sku=${sku}`);

      if (!dryRun) {
        // Subir directo desde URL oficial via plugin MU
        const upload = await callMu('/pacame/v1/media/upload-from-url', {
          url: officialUrl,
          alt: product.name,
          title: product.name,
          post_id: product.id,
        });
        const mediaId = upload.id;
        if (!mediaId) throw new Error(`upload no devolvió media id: ${JSON.stringify(upload).slice(0, 200)}`);

        // Asignar como destacada
        await callMu(`/pacame/v1/products/${product.id}/featured-image`, { media_id: mediaId });
        replaced++;
        console.log(`    → media_id=${mediaId} aplicado como destacada`);
        await sleep(pauseMs);
      }
    } catch (err) {
      errors++;
      errList.push({ id: product.id, sku, error: err.message });
      console.error(`  ERROR ${product.id} sku=${sku}: ${err.message}`);
      await sleep(pauseMs);
    }
  }

  console.log(`\n[done] processed=${processed} official-found=${found} replaced=${replaced} no-official=${noOfficial} errors=${errors}`);
  if (errList.length) {
    console.log('\n=== ERRORES ===');
    for (const e of errList.slice(0, 20)) console.log(`  ${e.id} sku=${e.sku}: ${e.error}`);
  }
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
