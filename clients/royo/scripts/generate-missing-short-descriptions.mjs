#!/usr/bin/env node
/**
 * Sprint 3F-C1 — Generar short_description faltante para productos sin ella.
 *
 * Determinístico (sin LLM). Coste 0€. Reversible (escribe diff a history/).
 *
 * Patrón generación:
 *   - Reloj: "Reloj {Marca} {Modelo}, movimiento {movimiento}, caja {tamaño} de {material}, {tipo correa} {color correa}."
 *   - Joya:  "{Tipo} en {material principal} de {kt} con {piedra} de {peso}ct, color {color}."
 *   - Si faltan atributos clave, skip y reporta.
 *
 * Conservador: solo escribe sobre productos donde short_description == ''.
 *
 * USO:
 *   node clients/royo/scripts/generate-missing-short-descriptions.mjs               # dry-run
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/generate-missing-short-descriptions.mjs --apply
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

const JEWELRY_CAT_NAMES = new Set(['Joyas', 'Anillos', 'Pendientes', 'Pulseras', 'Colgantes', 'Gargantillas']);
const WATCH_BRANDS = new Set([
  'Tissot', 'Longines', 'Casio', 'Seiko', 'Citizen', 'Hamilton', 'Oris', 'Certina',
  'MontBlanc', 'Mont Blanc', 'Victorinox', 'Baume & Mercier', 'Baume Mercier',
  'Franck Muller', 'Omega', 'Tsar Bomba', 'Genius Watches'
]);

function getAttr(attrs, names) {
  if (!Array.isArray(attrs)) return null;
  for (const a of attrs) {
    const aname = (a.name || '').toLowerCase();
    for (const n of names) {
      if (aname === n.toLowerCase()) {
        const terms = (a.terms || []).map(t => t.name).filter(Boolean);
        if (terms.length) return terms.join(', ');
      }
    }
  }
  return null;
}

function isJewelry(p) {
  // Solo es joyería si tiene categoría joyería Y NO es de marca relojera
  const hasJewelryCat = (p.categories || []).some(c => JEWELRY_CAT_NAMES.has(c.name));
  if (!hasJewelryCat) return false;
  // Si tiene marca de reloj en categoría/nombre, NO es joyería de oro
  const cats = (p.categories || []).map(c => c.name);
  for (const b of WATCH_BRANDS) {
    if (cats.includes(b)) return false;
    if ((p.name || '').toLowerCase().includes(b.toLowerCase())) return false;
  }
  return true;
}
function detectBrand(p) {
  const cats = (p.categories || []).map(c => c.name);
  for (const b of WATCH_BRANDS) {
    if (cats.includes(b)) return b;
  }
  // fallback nombre
  for (const b of WATCH_BRANDS) {
    if (p.name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
}

function generateWatchDescription(p) {
  const attrs = p.attributes || [];
  const brand = detectBrand(p) || getAttr(attrs, ['Marca']);
  if (!brand) return null;

  const movement = getAttr(attrs, ['Movimiento', 'Tipo de movimiento']);
  const caseSize = getAttr(attrs, ['Tamaño caja', 'Tamano caja', 'Diámetro', 'Diametro']);
  const caseMaterial = getAttr(attrs, ['Material caja', 'Material de la caja']);
  const strapMaterial = getAttr(attrs, ['Material correa', 'Material de la correa']);
  const strapColor = getAttr(attrs, ['Color correa', 'Color de la correa']);
  const dialColor = getAttr(attrs, ['Color esfera', 'Color de la esfera']);

  // Construir frases con respiración
  const parts = [];

  // Frase 1: identidad — limpiar nombre modelo
  let nombreModelo = (p.name || '')
    .replace(new RegExp(brand, 'gi'), '')
    .replace(/^reloj\s+/i, '')
    .replace(/\s*·\s*.*$/, '')
    .replace(/\s*ref\.?\s*[A-Z0-9-]+/i, '')
    .replace(/^[\s·•]+/, '')
    .trim();
  if (nombreModelo.length < 3) nombreModelo = '';
  // Title case para el modelo si está todo mayúsculas
  if (nombreModelo === nombreModelo.toUpperCase() && nombreModelo.length > 4) {
    nombreModelo = nombreModelo.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  parts.push(`Reloj oficial ${brand}${nombreModelo ? ' ' + nombreModelo : ''}.`);

  // Frase 2: movimiento + caja
  const techParts = [];
  if (movement) techParts.push(`movimiento ${movement.toLowerCase()}`);
  if (caseSize) techParts.push(`caja de ${caseSize}`);
  if (caseMaterial) techParts.push(`acabado en ${caseMaterial.toLowerCase()}`);
  if (techParts.length >= 2) {
    parts.push(`Cuenta con ${techParts.join(', ')}.`);
  } else if (techParts.length === 1) {
    parts.push(`Cuenta con ${techParts[0]}.`);
  }

  // Frase 3: correa + esfera
  const aestheticParts = [];
  if (strapMaterial) {
    let strap = `correa de ${strapMaterial.toLowerCase()}`;
    if (strapColor) strap += ` en ${strapColor.toLowerCase()}`;
    aestheticParts.push(strap);
  } else if (strapColor) {
    aestheticParts.push(`correa ${strapColor.toLowerCase()}`);
  }
  if (dialColor) aestheticParts.push(`esfera ${dialColor.toLowerCase()}`);
  if (aestheticParts.length) {
    parts.push(`Detalles: ${aestheticParts.join(' y ')}.`);
  }

  // Cierre
  parts.push(`Distribuidor oficial con garantía de marca.`);

  if (parts.length < 2) return null;
  return parts.join(' ');
}

function generateJewelryDescription(p) {
  const attrs = p.attributes || [];
  const name = p.name || '';
  const cats = (p.categories || []).map(c => c.name);

  // Tipo desde categoría o nombre
  let tipo = '';
  if (cats.includes('Anillos')) tipo = 'Anillo';
  else if (cats.includes('Pendientes')) tipo = 'Pendientes';
  else if (cats.includes('Pulseras')) tipo = 'Pulsera';
  else if (cats.includes('Colgantes')) tipo = 'Colgante';
  else if (cats.includes('Gargantillas')) tipo = 'Gargantilla';
  else if (/anillo|sortija|alianza/i.test(name)) tipo = 'Anillo';
  else if (/pendiente|aro|criolla/i.test(name)) tipo = 'Pendientes';
  else if (/pulsera|brazalete/i.test(name)) tipo = 'Pulsera';
  else if (/colgante|cadena/i.test(name)) tipo = 'Colgante';
  else if (/gargantilla|collar/i.test(name)) tipo = 'Gargantilla';
  else tipo = 'Pieza de joyería';

  // Detectar oro: color + kilataje
  let oroColor = '';
  if (/oro\s+blanco/i.test(name)) oroColor = 'oro blanco';
  else if (/oro\s+amarillo/i.test(name)) oroColor = 'oro amarillo';
  else if (/oro\s+rosa/i.test(name)) oroColor = 'oro rosa';
  else if (/oro/i.test(name)) oroColor = 'oro';
  else if (/plata/i.test(name)) oroColor = 'plata';

  let kilataje = '';
  const ktMatch = name.match(/(\d+)\s*kt/i);
  if (ktMatch) kilataje = ` de ${ktMatch[1]}kt`;
  else if (oroColor && oroColor !== 'plata') kilataje = ' de 18kt';

  const oro = oroColor ? oroColor + kilataje : null;

  const piedra = getAttr(attrs, ['Piedra', 'Gema']) ||
    (/diamante|brillante/i.test(name) ? 'diamantes' :
      /esmeralda/i.test(name) ? 'esmeraldas' :
        /rubí|rubi/i.test(name) ? 'rubíes' :
          /zafiro/i.test(name) ? 'zafiros' :
            /circon|circul/i.test(name) ? 'circonitas' :
              /perla/i.test(name) ? 'perlas' :
                /topacio/i.test(name) ? 'topacio' : null);

  const parts = [];
  if (oro && piedra) {
    parts.push(`${tipo} en ${oro} con ${piedra}.`);
  } else if (oro) {
    parts.push(`${tipo} elaborado en ${oro}.`);
  } else if (piedra) {
    parts.push(`${tipo} con ${piedra}.`);
  } else {
    return null; // sin datos suficientes
  }

  parts.push('Joya cuidadosamente seleccionada por Joyería Royo, Albacete.');
  parts.push('Incluye estuche y certificado.');

  return parts.join(' ');
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,short_description,description,categories,attributes`;
    const res = await fetch(url, { headers: { 'User-Agent': PACAME_UA } });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

function isEmpty(html) {
  if (!html) return true;
  const stripped = html.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  return stripped.length === 0;
}

async function applyShortDescription(productId, html) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/${productId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body: JSON.stringify({ short_description: html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`product ${productId}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, limit=${limit === Infinity ? 'all' : limit}, pause=${pauseMs}ms`);

  const all = await fetchAllProducts();
  console.log(`[fetch] ${all.length} productos.`);

  const targets = all.filter(p => isEmpty(p.short_description));
  console.log(`[filter] ${targets.length} productos sin short_description.`);

  let processed = 0, applied = 0, errors = 0, skipped = 0;
  const samples = [];
  const skips = [];
  const historyEntries = [];

  for (const p of targets) {
    if (processed >= limit) break;
    processed++;
    const isJewel = isJewelry(p);
    const newDesc = isJewel ? generateJewelryDescription(p) : generateWatchDescription(p);

    if (!newDesc) {
      skipped++;
      if (skips.length < 10) skips.push({ id: p.id, name: p.name.slice(0, 50), reason: isJewel ? 'jewelry no attrs' : 'watch no brand/attrs' });
      continue;
    }

    const html = `<p>${newDesc}</p>`;
    if (samples.length < 8) samples.push({ id: p.id, name: p.name.slice(0, 50), desc: newDesc });

    if (dryRun) continue;

    try {
      historyEntries.push({ id: p.id, sku: p.sku, name: p.name, before: p.short_description || '', after: html, ts: Date.now() });
      await applyShortDescription(p.id, html);
      applied++;
      await sleep(pauseMs);
    } catch (err) {
      errors++;
      console.error(`  [ERR] id=${p.id}: ${err.message}`);
      await sleep(pauseMs * 2);
    }
  }

  if (!dryRun && historyEntries.length) {
    const fname = `${HISTORY_DIR}/short-descriptions-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
    console.log(`[history] ${historyEntries.length} entries → ${fname}`);
  }

  console.log(`\n[done] processed=${processed} applied=${applied} skipped=${skipped} errors=${errors}`);
  if (samples.length) {
    console.log('\n=== muestras ===');
    for (const s of samples) {
      console.log(`  id=${s.id} ${s.name}`);
      console.log(`    → ${s.desc}\n`);
    }
  }
  if (skips.length) {
    console.log('\n=== skips (primeros 10) ===');
    for (const s of skips) console.log(`  id=${s.id} ${s.name} — ${s.reason}`);
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
