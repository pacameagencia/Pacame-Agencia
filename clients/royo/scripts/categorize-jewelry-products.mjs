#!/usr/bin/env node
/**
 * Sprint 3F-C2 — Asignar sub-categoría jewelry a productos en "Joyas" que solo
 * tienen la categoría padre (13 productos detectados en audit 2026-05-10).
 *
 * Determinístico (sin LLM). Coste 0€. Reversible (escribe diff a history/).
 *
 * Mapeo nombre → sub-categoría:
 *   - "Anillo*" / "Sortija*" / "Alianza*" / "Solitario*" → Anillos (id 31)
 *   - "Pendient*" / "Aro*" / "Criolla*" → Pendientes (id 39)
 *   - "Pulsera*" / "Brazalete*" → Pulseras (id 42)
 *   - "Colgante*" / "Cadena*" / "Medalla*" → Colgantes (id 48)
 *   - "Gargantilla*" / "Collar*" → Gargantillas (id 2118)
 *
 * Conservador:
 *   - Solo aplica si producto tiene "Joyas" Y no tiene NINGUNA sub-cat ya.
 *   - PRESERVA la cat "Joyas" padre, solo AÑADE sub-cat.
 *   - Si nombre no matchea, skip (no asigna fallback genérico para evitar mal mapping).
 *
 * USO:
 *   node clients/royo/scripts/categorize-jewelry-products.mjs               # dry-run
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/categorize-jewelry-products.mjs --apply
 */
import fs from 'node:fs';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';
const HISTORY_DIR = 'clients/royo/history';
fs.mkdirSync(HISTORY_DIR, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
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

// Category IDs verificados con /wp-json/wc/store/v1/products/categories
const CAT_IDS = {
  Joyas: 29,
  Anillos: 31,
  Pendientes: 39,
  Pulseras: 42,
  Colgantes: 48,
  Gargantillas: 2118,
};

const SUBCATS = ['Anillos', 'Pendientes', 'Pulseras', 'Colgantes', 'Gargantillas'];

function detectSubcategory(name) {
  const n = (name || '').toLowerCase();
  if (/anillo|sortija|alianza|solitario/i.test(n)) return 'Anillos';
  if (/pendient|aro\b|criolla/i.test(n)) return 'Pendientes';
  if (/pulsera|brazalete/i.test(n)) return 'Pulseras';
  if (/colgante|cadena|medalla/i.test(n)) return 'Colgantes';
  if (/gargantilla|collar/i.test(n)) return 'Gargantillas';
  return null;
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,categories`;
    const res = await fetch(url, { headers: { 'User-Agent': PACAME_UA } });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

async function applyCategories(productId, categoryIds) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}`;
  const body = JSON.stringify({
    categories: categoryIds.map(id => ({ id })),
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`product ${productId}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, pause=${pauseMs}ms`);

  const all = await fetchAllProducts();
  console.log(`[fetch] ${all.length} productos.`);

  // Productos en "Joyas" SIN ninguna sub-categoría
  const targets = all.filter(p => {
    const cats = (p.categories || []).map(c => c.name);
    if (!cats.includes('Joyas')) return false;
    return !SUBCATS.some(sc => cats.includes(sc));
  });
  console.log(`[filter] ${targets.length} productos en Joyas sin sub-categoría.`);

  let processed = 0, applied = 0, errors = 0, skipped = 0;
  const samples = [];
  const skips = [];
  const historyEntries = [];

  for (const p of targets) {
    processed++;
    const subcat = detectSubcategory(p.name);
    if (!subcat) {
      skipped++;
      skips.push({ id: p.id, name: p.name.slice(0, 60) });
      continue;
    }
    const currentIds = (p.categories || []).map(c => c.id);
    const newSubId = CAT_IDS[subcat];
    if (currentIds.includes(newSubId)) {
      skipped++;
      continue;
    }
    const newIds = [...new Set([...currentIds, newSubId])];

    if (samples.length < 12) {
      samples.push({ id: p.id, name: p.name.slice(0, 50), oldCats: currentIds, addedCat: subcat, newIds });
    }
    if (dryRun) continue;

    try {
      historyEntries.push({ id: p.id, name: p.name, before: currentIds, after: newIds, ts: Date.now() });
      await applyCategories(p.id, newIds);
      applied++;
      await sleep(pauseMs);
    } catch (err) {
      errors++;
      console.error(`  [ERR] id=${p.id}: ${err.message}`);
      await sleep(pauseMs * 2);
    }
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/categorize-jewelry-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] processed=${processed} applied=${applied} skipped=${skipped} errors=${errors}`);
  if (samples.length) {
    console.log('\n=== muestras ===');
    for (const s of samples) {
      console.log(`  id=${s.id} ${s.name}`);
      console.log(`    + sub-cat: ${s.addedCat}`);
    }
  }
  if (skips.length) {
    console.log('\n=== skips (no matchea ninguna sub-cat) ===');
    for (const s of skips.slice(0, 10)) console.log(`  id=${s.id} ${s.name}`);
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
