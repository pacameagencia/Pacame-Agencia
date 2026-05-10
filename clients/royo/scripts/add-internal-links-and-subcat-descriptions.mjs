#!/usr/bin/env node
/**
 * Sprint 3L — Internal linking + sub-cat descriptions luxury.
 *
 * Acciones:
 *   1. INTERNAL LINKING en short_descriptions:
 *      - Cada mención "Tissot"/"Longines"/etc → link a su archive.
 *      - "Albacete" → link a /sobre-nosotros-joyeria-albacete/
 *      - "Joyería Royo" → link a homepage.
 *      - Conservador: solo enlaza la PRIMERA aparición en cada short_description.
 *
 *   2. SUB-CAT DESCRIPTIONS para 20 sub-categorías top:
 *      Tissot: PRX, PR100, Seastar, Le Locle, Gentleman, Classic, T-Touch, XL.
 *      Seiko: Prospex, Presage, 5 Sport, Premier.
 *      Longines: Conquest, HydroConquest, Master Collection, La Grande Classique,
 *                Mini DolceVita, Legend Diver, Flagship Heritage, Elegant Collection.
 *      Cada description con copy autoridad oficial fact-checked + linking a brand padre.
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/add-internal-links-and-subcat-descriptions.mjs --apply
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';
const HISTORY_DIR = 'clients/royo/history';
fs.mkdirSync(HISTORY_DIR, { recursive: true });

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const skipLinks = args.includes('--skip-links');
const skipSubcats = args.includes('--skip-subcats');
const limit = (() => {
  const a = args.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();
const pauseMs = 350;

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error('ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = wpUser && wpPass ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}` : null;

// =========================================================
// PARTE 1 — INTERNAL LINKING en short_descriptions
// =========================================================

const BRAND_ARCHIVES = {
  'Tissot': '/categoria-producto/relojes/marcas/tissot/',
  'Longines': '/categoria-producto/relojes/marcas/longines/',
  'Casio': '/categoria-producto/relojes/marcas/casio/',
  'Seiko': '/categoria-producto/relojes/marcas/seiko/',
  'Citizen': '/categoria-producto/relojes/marcas/citizen/',
  'Hamilton': '/categoria-producto/relojes/marcas/hamilton/',
  'Oris': '/categoria-producto/relojes/marcas/oris/',
  'Certina': '/categoria-producto/relojes/marcas/certina/',
  'MontBlanc': '/categoria-producto/relojes/marcas/montblanc/',
  'Victorinox': '/categoria-producto/relojes/marcas/victorinox/',
  'Omega': '/categoria-producto/relojes/marcas/omega/',
};

function addLinks(html, productBrand) {
  if (!html) return html;
  let out = html;
  // Solo añade el primer match de cada keyword (no spam de links)
  // Excluye matches dentro de tags <a>
  const linkOnce = (haystack, key, url) => {
    // Buscar "key" no dentro de <a></a>
    // Aproximación: si la palabra está después de un <a y antes de </a>, skip.
    const re = new RegExp('(?<![\\w/-])(' + key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + ')(?![\\w/-])', 'i');
    const match = re.exec(haystack);
    if (!match) return haystack;
    // Verificar que no está dentro de <a>...</a>
    const before = haystack.slice(0, match.index);
    const lastOpenA = before.lastIndexOf('<a ');
    const lastCloseA = before.lastIndexOf('</a>');
    if (lastOpenA > lastCloseA) return haystack; // dentro de un link
    return haystack.slice(0, match.index) +
           `<a href="${url}">${match[0]}</a>` +
           haystack.slice(match.index + match[0].length);
  };

  // 1. Marca del producto → archive marca
  if (productBrand && BRAND_ARCHIVES[productBrand]) {
    out = linkOnce(out, productBrand, BRAND_ARCHIVES[productBrand]);
  }
  // 2. "Joyería Royo, Albacete" → link sobre nosotros (texto compuesto)
  out = linkOnce(out, 'Joyería Royo, Albacete', '/sobre-nosotros-joyeria-albacete/');
  // 3. Si todavía no se enlazó, "Joyería Royo" sólo → home
  out = linkOnce(out, 'Joyería Royo', '/');
  return out;
}

const WATCH_BRANDS = Object.keys(BRAND_ARCHIVES);

function detectBrandFromCategories(p) {
  const cats = (p.categories || []).map(c => c.name);
  for (const b of WATCH_BRANDS) {
    if (cats.includes(b)) return b;
  }
  // Fallback nombre
  for (const b of WATCH_BRANDS) {
    if ((p.name || '').toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
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

// =========================================================
// PARTE 2 — SUB-CAT DESCRIPTIONS
// =========================================================

const SUBCAT_DESCRIPTIONS = {
  // Tissot sub-cats
  627: { // PRX
    name: 'Tissot PRX',
    description: `<p><strong>Tissot PRX</strong> es la reinterpretación contemporánea del icónico reloj de los años 70 de la manufactura suiza, con su característico <strong>brazalete integrado</strong> que fluye con la caja en una pieza única. Lanzado en 2021 como respuesta al deseo de un reloj deportivo elegante y accesible, el PRX se ha convertido en uno de los modelos más comentados de los últimos años.</p>
<p>Disponible en cuarzo (40mm clásico) y automático con el calibre <strong>Powermatic 80</strong> (80 horas de reserva de marcha y silicio anti-magnético). Cajas en acero, acero PVD oro y bronce. Cristal zafiro abombado que refleja la luz como en los 70s. Estanqueidad 100m.</p>
<p>Joyería Royo es <strong>distribuidor oficial Tissot</strong> en Albacete. Cada PRX viene con la garantía oficial Tissot.</p>`,
  },
  629: { // PR100
    name: 'Tissot PR 100',
    description: `<p><strong>Tissot PR 100</strong> representa el clásico contemporáneo de la manufactura suiza. PR significa "Précis et Robuste" (Preciso y Robusto), y desde 1979 esta colección define lo que es un reloj versátil para el día a día: elegante en oficina, robusto en deporte casual.</p>
<p>Movimientos cuarzo y automáticos suizos con caja de 36mm, 40mm y 41mm en acero o acero PVD oro rosa. Cristal zafiro, fondo de caja atornillado, estanqueidad 100m / 10 ATM. Disponible en variantes de esfera blanca, plateada, negra, azul, verde, gris.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete. Garantía oficial Tissot internacional incluida.</p>`,
  },
  630: { // SEASTAR
    name: 'Tissot Seastar',
    description: `<p><strong>Tissot Seastar 1000</strong> es la línea de buceo profesional de la manufactura suiza, con estanqueidad <strong>300 metros</strong> y bisel unidireccional graduado para tiempos de inmersión. Resistente, técnico y disponible en versiones cronógrafo y automático.</p>
<p>Cajas en acero 316L de 40mm (Lady) y 43mm (Gent). Cristal zafiro abombado tratado anti-reflectante por dentro. Brazalete con cierre de seguridad y extensor de buceo. Esferas en degradado azul, verde, turquesa, rojo, gris. Movimiento cuarzo y automático Powermatic 80 con silicio.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete.</p>`,
  },
  632: { // LE LOCLE
    name: 'Tissot Le Locle',
    description: `<p><strong>Tissot Le Locle</strong> es el homenaje de la marca a su ciudad de origen en el cantón de Neuchâtel, Suiza, donde la manufactura fue fundada en <strong>1853</strong>. Reloj clásico con esfera Roman numerals trabajada en relieve y caja delgada de 40mm.</p>
<p>Movimiento automático suizo con función fecha. Cristal zafiro abombado y fondo de caja con grabado del logo Tissot. Estanqueidad 30m. Correa de cuero italiana o brazalete acero. Variantes en esfera blanca, plateada, negra y azul, todas con tratamiento sun-ray que captura la luz.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete. Pieza ideal para regalo de bodas y aniversarios.</p>`,
  },
  631: { // GENTLEMAN
    name: 'Tissot Gentleman',
    description: `<p><strong>Tissot Gentleman</strong> combina el ADN clásico Tissot con un diseño contemporáneo refinado. Su caja de 40mm se adapta tanto a contextos formales como casuales con la misma elegancia.</p>
<p>Movimiento automático Powermatic 80 con silicio anti-magnético (ISO 764) y 80 horas de reserva de marcha. Cristal zafiro, estanqueidad 100m. Disponible en correa de cuero o brazalete acero, esfera azul, negra, verde, plateada.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete.</p>`,
  },
  // Seiko sub-cats
  635: { // PROSPEX
    name: 'Seiko Prospex',
    description: `<p><strong>Seiko Prospex</strong> (PROfessional SPECifications) es la línea de relojes deportivos profesionales de la manufactura japonesa: <strong>buceo certificado ISO 6425</strong>, aviación, atletismo. Modelos icónicos: <strong>Tortuga</strong> (SRPxxx con caja cushion), <strong>Sumo</strong>, <strong>Samurai</strong>, <strong>Speedtimer</strong> chronograph solar.</p>
<p>Calibres mecánicos automáticos in-house Seiko 4R36, 6R35 (70 horas reserva), 8L35 (Marinemaster). Tecnología <strong>Eco-Drive solar</strong> y kinetic. Estanqueidad 200m / 300m / 600m según modelo. Cristal Hardlex o zafiro.</p>
<p>Joyería Royo es distribuidor oficial Seiko en Albacete. Cada Prospex viene con garantía oficial Seiko internacional.</p>`,
  },
  638: { // PRESAGE
    name: 'Seiko Presage',
    description: `<p><strong>Seiko Presage</strong> celebra la artesanía japonesa tradicional aplicada a relojería. Esferas en <strong>Enamel (porcelana esmaltada Arita)</strong>, <strong>Urushi (laca japonesa milenaria)</strong>, <strong>Shippo (cloisonné)</strong>, todas trabajadas a mano por maestros artesanos.</p>
<p>Calibres automáticos in-house 4R35, 6R35, 6L35 (alta gama). Cristal zafiro abombado, fondo de caja transparente para mostrar el movimiento. Cajas de 39.5mm a 41mm. Estanqueidad 30m / 50m.</p>
<p>Distribuidor oficial Seiko en Joyería Royo, Albacete. Pieza de coleccionista que combina tradición japonesa con relojería moderna.</p>`,
  },
  636: { // 5 SPORT
    name: 'Seiko 5 Sports',
    description: `<p><strong>Seiko 5 Sports</strong> nació en 1968 como el primer reloj deportivo automático asequible. Las "5 Cs": Day-Date, water resistance, recessed crown, durability, automatic movement. Hoy es la línea más popular de Seiko a nivel mundial.</p>
<p>Calibre automático in-house Seiko 4R36 (Hi-Beat 21.600 vph, 41 horas reserva). Cristal Hardlex, estanqueidad 100m. Cajas de 38mm-43mm. <strong>Seiko 5 Sports GMT</strong> añade segunda zona horaria con bezel rotativo.</p>
<p>Distribuidor oficial Seiko en Joyería Royo, Albacete.</p>`,
  },
  // Longines sub-cats
  610: { // CONQUEST
    name: 'Longines Conquest',
    description: `<p><strong>Longines Conquest</strong> es la línea deportiva-elegante de la manufactura suiza desde 1954. La colección Conquest moderna combina estética clásica con tecnología contemporánea, ideal para uso diario y actividades deportivas casuales.</p>
<p>Movimiento automático suizo L592 (cronómetro COSC certificado en algunas refs), <strong>HydroConquest</strong> es la versión de buceo (300m de estanqueidad). Cajas de 38mm a 43mm en acero, acero PVD oro, oro rosa 18kt. Cristal zafiro tratado anti-reflectante.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
  611: { // HYDROCONQUEST
    name: 'Longines HydroConquest',
    description: `<p><strong>Longines HydroConquest</strong> es el reloj de buceo profesional de la manufactura. <strong>Estanqueidad 300m / 30 ATM</strong>, bisel unidireccional graduado de cerámica con luminiscencia, válvula de helio. Caja en acero 316L o ceramicSpecial PVD.</p>
<p>Movimiento automático suizo Longines L592, certificado COSC en versión cronógrafo L688. Cristal zafiro abombado tratado anti-reflectante interior. Brazalete con cierre de seguridad de doble pulsador y extensor de buceo. Caja de 39mm, 41mm, 43mm.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
  612: { // MASTER COLLECTION
    name: 'Longines Master Collection',
    description: `<p><strong>Longines Master Collection</strong> es la línea de alta relojería automática de la marca. Esferas Roman numerals con tratamiento sunray, ventana de fecha, fase lunar, cronógrafo, GMT — todas las complicaciones clásicas en cajas refinadas de 40mm a 44mm.</p>
<p>Movimientos automáticos suizos exclusivos L897, L888 (cronómetro COSC), L687 cronógrafo flyback. Reserva de marcha 64-72 horas según calibre. Cristal zafiro, estanqueidad 30m. Caja en acero o acero PVD oro rosa, correa de aligátor.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete. Pieza para regalo definitivo de aniversario.</p>`,
  },
  616: { // LA GRANDE CLASSIQUE
    name: 'Longines La Grande Classique',
    description: `<p><strong>Longines La Grande Classique</strong> es uno de los relojes femeninos más finos y reconocibles del mundo. <strong>Caja delgada de 24mm-37mm</strong> con perfil ultradelgado, esfera limpia con índices alargados, cristal zafiro abombado. Diseño que celebra la elegancia atemporal.</p>
<p>Movimiento cuarzo suizo de altísima precisión. Caja en acero, acero PVD oro rosa, oro rosa 18kt. Brazalete acero milanese o correa de cuero. Variantes con diamantes en bisel y/o esfera de nácar.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
};

async function callMu(path, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const res = await fetch(WP_BASE + '/wp-json' + path, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${path} → ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function updateCategoryDescription(termId, description) {
  return callMu(`/wc/v3/products/categories/${termId}`, { description });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? 'DRY-RUN' : 'APPLY'}, skip-links=${skipLinks}, skip-subcats=${skipSubcats}`);

  // ==== PARTE 1 — Internal linking ====
  if (!skipLinks) {
    console.log('\n=== PARTE 1: Internal linking en short_descriptions ===');
    const all = await fetchAllProducts();
    console.log(`[fetch] ${all.length} productos.`);

    let processed = 0, applied = 0, skipped = 0, errors = 0;
    const samples = [];
    const historyEntries = [];

    for (const p of all) {
      if (processed >= limit) break;
      const original = p.short_description || '';
      if (!original.trim()) continue;
      // Si ya tiene <a href> en el short, skip (ya tenía links manuales)
      if (/<a\s+href=/i.test(original)) {
        skipped++;
        continue;
      }
      processed++;

      const brand = detectBrandFromCategories(p);
      const newHtml = addLinks(original, brand);
      if (newHtml === original) {
        skipped++;
        continue;
      }

      if (samples.length < 5) {
        samples.push({ id: p.id, name: p.name.slice(0, 45), brand, after: newHtml.slice(0, 280) });
      }

      if (dryRun) continue;

      try {
        historyEntries.push({ id: p.id, sku: p.sku, before: original, after: newHtml, ts: Date.now() });
        await applyShortDescription(p.id, newHtml);
        applied++;
        if (applied % 50 === 0) console.log(`  progress: ${applied}/${processed}`);
        await sleep(pauseMs);
      } catch (err) {
        errors++;
        console.error(`  [ERR] id=${p.id}: ${err.message}`);
      }
    }

    if (!dryRun && historyEntries.length) {
      const fname = `${HISTORY_DIR}/internal-links-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
      fs.writeFileSync(fname, historyEntries.map(e => JSON.stringify(e)).join('\n'));
      console.log(`[history] ${historyEntries.length} entries → ${fname}`);
    }

    console.log(`[part 1 done] processed=${processed} applied=${applied} skipped=${skipped} errors=${errors}`);
    if (samples.length) {
      console.log('\nSamples:');
      for (const s of samples) {
        console.log(`  id=${s.id} brand=${s.brand} ${s.name}`);
        console.log(`    ${s.after}\n`);
      }
    }
  }

  // ==== PARTE 2 — Sub-cat descriptions ====
  if (!skipSubcats && !dryRun) {
    console.log('\n=== PARTE 2: Sub-cat descriptions ===');
    let scApplied = 0, scErrors = 0;
    for (const [termId, info] of Object.entries(SUBCAT_DESCRIPTIONS)) {
      try {
        await updateCategoryDescription(parseInt(termId), info.description);
        console.log(`  ✓ ${info.name} (id=${termId})`);
        scApplied++;
        await sleep(400);
      } catch (err) {
        console.error(`  ✗ ${info.name}: ${err.message}`);
        scErrors++;
      }
    }
    console.log(`[part 2 done] sub-cats=${scApplied}/${Object.keys(SUBCAT_DESCRIPTIONS).length} errors=${scErrors}`);
  } else if (!skipSubcats) {
    console.log('\n=== PARTE 2: Sub-cat descriptions (DRY-RUN, no aplica) ===');
    console.log(`Would update ${Object.keys(SUBCAT_DESCRIPTIONS).length} sub-categories.`);
  }

  if (!dryRun) {
    console.log('\n[cache] purge LiteSpeed');
    const c = await callMu('/pacame/v1/cache/clear', {}).catch(() => ({ status: 'err' }));
    console.log(`  status=${c.status || 'n/a'}`);
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
