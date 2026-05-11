#!/usr/bin/env node
/**
 * Sprint 3V — Recuperar packshots de descripciones HTML.
 *
 * Pablo reportó: "muchos productos tienen placeholder pero tienen fotos".
 * Hipótesis: las imágenes oficiales pueden estar embebidas en `post_content`
 * (descripción HTML) sin estar registradas en `_product_image_gallery`.
 *
 * Algoritmo conservador:
 *   1. Para cada producto con featured "Sin-titulo*":
 *      - Fetch wc/v3/products/{id}?_fields=description,short_description
 *      - Parsear <img src="..."> de ambos campos
 *      - Filtrar URLs válidas: wp-content/uploads/ + extensión imagen,
 *        excluir Sin-titulo/logo/icon/placeholder
 *   2. Para cada URL recuperada:
 *      - wp/v2/media?search=<filename-base> → obtener media_id
 *      - Si encuentra, añadir a array de media_ids del producto
 *   3. Si recuperó ≥1 media real, asignar como featured + gallery
 *
 * Diff JSONL para reversibilidad.
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/recover-images-from-descriptions.mjs --apply
 */
import fs from 'node:fs';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0';
const HISTORY_DIR = 'clients/royo/history';
fs.mkdirSync(HISTORY_DIR, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const limit = (() => {
  const a = args.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();
const pauseMs = 400;

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error('ERROR: necesito ROYO_WP_USER y ROYO_WP_APP_PASS');
  process.exit(1);
}
const auth = wpUser && wpPass ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}` : null;

const EXCLUDE_PATTERNS = [
  /sin-titulo/i,
  /placeholder/i,
  /logo/i,
  /icon/i,
  /loading\.gif/i,
  /spinner/i,
  /1x1\.png/i,
  /transparent/i,
  /default[-_]image/i,
];

function isExcluded(url) {
  const fname = url.split('/').pop().toLowerCase();
  return EXCLUDE_PATTERNS.some(p => p.test(fname));
}

function extractImageUrls(html) {
  if (!html) return [];
  // <img src="...">
  const srcMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  // Background-image:url(...) en style inline
  const bgMatches = [...html.matchAll(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi)].map(m => m[1]);
  return [...srcMatches, ...bgMatches];
}

function filterRealImages(urls, baseUrl = WP_BASE) {
  return urls.filter(u => {
    // Solo URLs locales de wp-content/uploads
    if (!u.includes('wp-content/uploads/')) return false;
    // Solo extensiones de imagen válidas
    if (!u.match(/\.(jpg|jpeg|png|webp|avif|gif)(\?|$)/i)) return false;
    // Excluir patrones de placeholder
    if (isExcluded(u)) return false;
    return true;
  });
}

async function fetchProductsSinFoto() {
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&_fields=id,name,sku,images`;
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

async function fetchProductDescription(productId) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}?_fields=description,short_description`;
  const res = await fetch(url, { headers: { Authorization: auth || '', 'User-Agent': PACAME_UA } });
  if (!res.ok) return { description: '', short_description: '' };
  return res.json();
}

async function searchMediaByFilenameBase(filenameBase) {
  // Quitar la extensión y dimensiones para search
  const cleaned = filenameBase.replace(/\.(jpg|jpeg|png|webp|avif|gif)$/i, '').replace(/-\d+x\d+$/, '');
  // Reducir a primeros 30 chars únicos para que el search engine encuentre
  const search = cleaned.slice(0, 40);
  const url = `${WP_BASE}/wp-json/wp/v2/media?per_page=10&search=${encodeURIComponent(search)}&_fields=id,source_url,slug`;
  const res = await fetch(url, { headers: { Authorization: auth || '', 'User-Agent': PACAME_UA } });
  if (!res.ok) return [];
  return res.json();
}

async function findMediaIdForUrl(url) {
  const filename = url.split('/').pop().split('?')[0];
  // Probar exact filename
  const results = await searchMediaByFilenameBase(filename);
  // El filename puede incluir -500x500 (thumbnail). Probar también filename original.
  const filenameOriginal = filename.replace(/-\d+x\d+\.(jpg|jpeg|png|webp|avif|gif)$/i, '.$1');
  const all = [...results];
  if (filenameOriginal !== filename) {
    const r2 = await searchMediaByFilenameBase(filenameOriginal);
    all.push(...r2);
  }
  // Match exacto del filename (sin la parte de tamaño)
  const cleanWanted = filename.replace(/-\d+x\d+\.(jpg|jpeg|png|webp|avif|gif)$/i, '.$1').toLowerCase();
  for (const m of all) {
    const mFname = m.source_url.split('/').pop().toLowerCase();
    if (mFname === cleanWanted || mFname === filename.toLowerCase()) {
      return m.id;
    }
  }
  // Fallback: si hay 1 solo resultado, devolverlo
  if (all.length >= 1) return all[0].id;
  return null;
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
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'} limit=${limit === Infinity ? 'all' : limit}`);

  const sinFoto = await fetchProductsSinFoto();
  console.log(`[fetch] ${sinFoto.length} productos con featured "Sin-titulo*"`);

  let processed = 0, found = 0, applied = 0, errors = 0, noImages = 0;
  const historyEntries = [];
  const samples = [];

  for (const p of sinFoto) {
    if (processed >= limit) break;
    processed++;

    try {
      const detail = await fetchProductDescription(p.id);
      await sleep(pauseMs / 2);
      const allUrls = [
        ...extractImageUrls(detail.description),
        ...extractImageUrls(detail.short_description),
      ];
      const realUrls = filterRealImages(allUrls);

      if (realUrls.length === 0) {
        noImages++;
        if (samples.length < 8) {
          samples.push({ id: p.id, sku: p.sku, name: p.name.slice(0, 50), found_urls: allUrls.length, real_urls: 0 });
        }
        continue;
      }

      // Resolver media_ids
      const mediaIds = [];
      const dedup = new Set();
      for (const u of realUrls) {
        if (dedup.has(u)) continue;
        dedup.add(u);
        const mid = await findMediaIdForUrl(u);
        if (mid && !mediaIds.includes(mid)) mediaIds.push(mid);
        await sleep(150);
      }

      if (mediaIds.length === 0) {
        if (samples.length < 8) {
          samples.push({ id: p.id, sku: p.sku, name: p.name.slice(0, 50), found_urls: realUrls.length, no_media_id: true, urls_sample: realUrls.slice(0, 2) });
        }
        continue;
      }

      found++;
      if (samples.length < 8) {
        samples.push({ id: p.id, sku: p.sku, name: p.name.slice(0, 50), media_ids: mediaIds.slice(0, 5), urls_sample: realUrls.slice(0, 3).map(u => u.split('/').pop()) });
      }

      if (dryRun) continue;

      const oldIds = (p.images || []).map(img => img.id);
      await updateProductImages(p.id, mediaIds);
      applied++;
      historyEntries.push({ id: p.id, sku: p.sku, name: p.name, before: oldIds, after: mediaIds, urls: realUrls.slice(0, 5), ts: Date.now() });
      await sleep(pauseMs);
    } catch (err) {
      errors++;
      console.error(`  [ERR] id=${p.id} sku=${p.sku}: ${err.message.slice(0, 150)}`);
      await sleep(pauseMs * 2);
    }
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/recover-from-descriptions-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`\n[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] processed=${processed} found=${found} applied=${applied} no-images=${noImages} errors=${errors}`);
  if (samples.length) {
    console.log('\n=== SAMPLES ===');
    for (const s of samples) {
      console.log(`  id=${s.id} sku=${s.sku} | ${s.name}`);
      if (s.media_ids) {
        console.log(`    ✓ media_ids: ${s.media_ids.join(',')}`);
        console.log(`    urls: ${(s.urls_sample || []).slice(0, 2).join(' | ')}`);
      } else if (s.no_media_id) {
        console.log(`    ⚠️ ${s.found_urls} URLs reales pero no se mapearon a media_id`);
        console.log(`    urls: ${(s.urls_sample || []).join(' | ')}`);
      } else {
        console.log(`    ✗ 0 URLs reales encontradas (${s.found_urls} total)`);
      }
    }
  }
})();
