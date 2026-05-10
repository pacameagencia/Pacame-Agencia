#!/usr/bin/env node
/**
 * Sprint 3I — Expandir short_descriptions cortas (<150 chars) con cierre
 * comercial SEO + autoridad de distribuidor oficial.
 *
 * Patrón:
 *   Original: "Acero inoxidable, de 40mm, con esfera verde, movimiento automático, estanqueidad 100m / 10 ATM."
 *   Expandido: "Reloj Tissot PR 100 40mm. Acero inoxidable, esfera verde, movimiento automático, estanqueidad 100m / 10 ATM. Distribuidor oficial Tissot en Joyería Royo Albacete. Incluye garantía oficial de marca y caja original. Envío asegurado a toda España."
 *
 * Para joyería:
 *   Original: "Anillo en oro blanco de 18kt con diamantes."
 *   Expandido: "Anillo en oro blanco de 18kt con diamantes. Pieza seleccionada por Joyería Royo, Albacete, con más de 50 años en alta joyería. Incluye estuche premium y certificado de autenticidad."
 *
 * Conservador: solo aplica si short_description tiene 30-150 chars Y no contiene
 * ya cierre comercial ("Distribuidor oficial" / "Joyería Royo Albacete").
 *
 * USO:
 *   node clients/royo/scripts/expand-short-descriptions.mjs               # dry-run
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/expand-short-descriptions.mjs --apply
 */
import fs from 'node:fs';

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
  return a ? parseInt(a.split('=')[1], 10) : 350;
})();

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error('ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = wpUser && wpPass ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}` : null;

const WATCH_BRANDS = [
  'Tissot', 'Longines', 'Casio', 'Seiko', 'Citizen', 'Hamilton',
  'Oris', 'Certina', 'MontBlanc', 'Mont Blanc', 'Victorinox',
  'Baume & Mercier', 'Franck Muller', 'Omega'
];
const JEWELRY_CATS = new Set(['Joyas', 'Anillos', 'Pendientes', 'Pulseras', 'Colgantes', 'Gargantillas']);

function detectBrand(p) {
  const cats = (p.categories || []).map(c => c.name);
  for (const b of WATCH_BRANDS) {
    if (cats.includes(b)) return b;
    if ((p.name || '').toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
}

function isJewelry(p) {
  const cats = (p.categories || []).map(c => c.name);
  if (cats.some(c => JEWELRY_CATS.has(c))) {
    // Solo si no es marca relojera (un Casio Anillo digital es watch, no jewelry)
    for (const b of WATCH_BRANDS) {
      if (cats.includes(b)) return false;
      if ((p.name || '').toLowerCase().includes(b.toLowerCase())) return false;
    }
    return true;
  }
  return false;
}

function text(html) {
  return (html || '').replace(/<[^>]+>/g, '').replace(/ /g, ' ').trim();
}

function alreadyHasCierre(short) {
  const t = text(short).toLowerCase();
  // "Distribuidor oficial con garantía de marca." (firma Sprint 3F) NO es cierre completo,
  // queda sin "Joyería Royo Albacete" + sin "envío asegurado". Esos los expandimos.
  // El cierre completo SÍ contiene "joyería royo, albacete" y "envío asegurado".
  return /joyer.a royo[, ]?\s*albacete/i.test(t) && /env.o asegurado|atenci.n personalizada/i.test(t);
}

function expandWatchShort(p, brand) {
  // Limpiar firmas Sprint 3F viejas antes de añadir cierre completo
  let original = text(p.short_description);
  original = original.replace(/Distribuidor oficial con garantía de marca\.?\s*$/i, '').trim();
  original = original.replace(/Distribuidor oficial con garantía de marca\.?\s*/gi, '').trim();
  // Cierre comercial luxury específico
  const cierre = `Distribuidor oficial ${brand} en Joyería Royo, Albacete. Incluye garantía oficial de marca, caja original y servicio post-venta autorizado. Envío asegurado a toda España.`;
  // Si la original empieza con "Acero", "Movimiento", "Caja" etc — añadirle un prefijo identificador
  // (modelo limpio sin SKU pegado al final)
  let modelClean = (p.name || '').split(' · ')[0].trim();
  modelClean = modelClean.replace(/^reloj\s+/i, '').replace(/\s*ref\.?\s*[A-Z0-9-]+/i, '').trim();
  if (modelClean === modelClean.toUpperCase() && modelClean.length > 4) {
    modelClean = modelClean.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  // Asegurar que el modelo incluye la marca al inicio
  if (!modelClean.toLowerCase().startsWith(brand.toLowerCase())) {
    modelClean = `${brand} ${modelClean}`;
  }
  // Limpiar original removiendo "Acero inoxidable, " si ya está presente
  let originalCleaned = original;
  // Si original ya empieza "Reloj X" o tiene la marca, no añadimos prefijo
  if (originalCleaned.toLowerCase().startsWith('reloj') || originalCleaned.toLowerCase().includes(brand.toLowerCase())) {
    return `<p>${originalCleaned} ${cierre}</p>`;
  }
  // Añadir prefijo modelo
  return `<p>Reloj ${modelClean}. ${originalCleaned} ${cierre}</p>`;
}

function expandJewelryShort(p) {
  let original = text(p.short_description);
  // Limpiar firmas Sprint 3F viejas para reescribir luxury
  original = original.replace(/Joya cuidadosamente seleccionada por Joyería Royo, Albacete\.\s*Incluye estuche y certificado\.?\s*$/i, '').trim();
  original = original.replace(/Joya cuidadosamente seleccionada por Joyería Royo, Albacete\.\s*/gi, '').trim();
  original = original.replace(/Incluye estuche y certificado\.\s*$/i, '').trim();
  const cierre = `Pieza seleccionada por Joyería Royo, Albacete, con más de 50 años en alta joyería. Incluye estuche premium, certificado de autenticidad y tasación profesional. Atención personalizada en tienda y envío asegurado a toda España.`;
  return `<p>${original} ${cierre}</p>`.replace(/\s+/g, ' ').replace(/<p> /, '<p>').replace(/ <\/p>/, '</p>');
}

function expandGenericShort(p) {
  const original = text(p.short_description);
  const cierre = `Disponible en Joyería Royo, Albacete. Atención personalizada, envío asegurado a toda España y devolución sin compromiso durante 14 días.`;
  return `<p>${original} ${cierre}</p>`;
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,short_description,categories`;
    const res = await fetch(url, { headers: { 'User-Agent': PACAME_UA } });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

async function applyShortDescription(productId, html) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body: JSON.stringify({ short_description: html }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`product ${productId}: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, limit=${limit === Infinity ? 'all' : limit}, pause=${pauseMs}ms`);

  const all = await fetchAllProducts();
  console.log(`[fetch] ${all.length} productos.`);

  const targets = all.filter(p => {
    const len = text(p.short_description).length;
    return len >= 30 && len < 150 && !alreadyHasCierre(p.short_description);
  });
  console.log(`[filter] ${targets.length} productos con short 30-150 chars sin cierre.`);

  let processed = 0, applied = 0, errors = 0, skipped = 0;
  const samples = [];
  const historyEntries = [];

  for (const p of targets) {
    if (processed >= limit) break;
    processed++;

    const brand = detectBrand(p);
    const jewelry = isJewelry(p);
    let newHtml;
    if (brand) newHtml = expandWatchShort(p, brand);
    else if (jewelry) newHtml = expandJewelryShort(p);
    else newHtml = expandGenericShort(p);

    if (!newHtml || text(newHtml).length === text(p.short_description).length) {
      skipped++;
      continue;
    }

    if (samples.length < 6) {
      samples.push({ id: p.id, name: p.name.slice(0, 45), oldLen: text(p.short_description).length, newLen: text(newHtml).length, sample: text(newHtml).slice(0, 250) });
    }

    if (dryRun) continue;

    try {
      historyEntries.push({ id: p.id, sku: p.sku, before: p.short_description || '', after: newHtml, ts: Date.now() });
      await applyShortDescription(p.id, newHtml);
      applied++;
      await sleep(pauseMs);
    } catch (err) {
      errors++;
      console.error(`  [ERR] id=${p.id}: ${err.message}`);
      await sleep(pauseMs * 2);
    }
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/expand-short-descriptions-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] processed=${processed} applied=${applied} skipped=${skipped} errors=${errors}`);
  if (samples.length) {
    console.log('\n=== muestras ===');
    for (const s of samples) {
      console.log(`  id=${s.id} ${s.name} (${s.oldLen}→${s.newLen}c)`);
      console.log(`    ${s.sample}\n`);
    }
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
