#!/usr/bin/env node
/**
 * Sprint 3M — Term descriptions luxury para 8 sub-cats restantes.
 *
 * Cubre las sub-cats que no se incluyeron en Sprint 3L:
 *   - Tissot: CLASSIC (634), T-TOUCH (628), XL (633)
 *   - Longines: ELEGANT COLLECTION (625), FLAGSHIP HERITAGE (617),
 *               LEGEND DIVER (614), MINI DOLCEVITA (613)
 *   - Seiko: PREMIER (637)
 *
 * Copy fact-checked oficial: año lanzamiento, especs técnicos, modelos icónicos.
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/add-remaining-subcat-descriptions.mjs
 */
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const PACAME_UA = 'PACAME-Bot/1.0 (+https://pacameagencia.com)';

const SECRET = process.env.ROYO_PACAME_SECRET;
const USER = process.env.ROYO_WP_USER;
const PASS = process.env.ROYO_WP_APP_PASS;
if (!SECRET || !USER || !PASS) {
  console.error('ERROR: faltan ROYO_PACAME_SECRET, ROYO_WP_USER, ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = `Basic ${Buffer.from(`${USER}:${PASS}`).toString('base64')}`;

const SUBCATS = {
  // Tissot
  634: { // CLASSIC
    name: 'Tissot Classic',
    description: `<p>La línea <strong>Tissot Classic Dream</strong> es la propuesta más accesible y versátil dentro del catálogo de la manufactura suiza. Diseño limpio, esfera con índices arábigos o romanos, caja delgada de 38mm o 42mm en acero. El reloj diario por excelencia.</p>
<p>Movimientos cuarzo y automáticos suizos, cristal mineral o zafiro según referencia, estanqueidad 30m. Disponible en correa de cuero italiana o brazalete acero. Esferas en blanco, plateado, negro y azul.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete. Garantía oficial Tissot internacional.</p>`,
  },
  628: { // T-TOUCH
    name: 'Tissot T-Touch',
    description: `<p><strong>Tissot T-Touch Connect Solar</strong> es el primer reloj suizo conectado <strong>solar</strong>, lanzado en 2020 por la manufactura. Pantalla táctil sobre cristal zafiro que activa funciones avanzadas: cronógrafo, alarma, brújula, altímetro, barómetro, termómetro, GPS, notificaciones smartphone.</p>
<p>Carga solar perpetua sin necesidad de cambiar batería. Caja en titanio grado 2, 47mm, estanqueidad 100m. Conectividad Bluetooth Low Energy con iOS y Android. La línea Connect Sport añade variantes deportivas.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete.</p>`,
  },
  633: { // XL
    name: 'Tissot Chrono XL',
    description: `<p><strong>Tissot Chrono XL</strong> es la línea de cronógrafos de gran formato de la manufactura. Caja de 45mm en acero o acero PVD oro rosa con bisel grabado tipo taquímetro. Tres sub-esferas + ventana de fecha + función cronógrafo 1/10 segundo.</p>
<p>Movimiento cuarzo cronógrafo Swiss Made (ETA G10.211). Cristal mineral, estanqueidad 100m. Correa cuero acolchado o brazalete acero. Esferas en negro, plateado, azul, blanco.</p>
<p>Distribuidor oficial Tissot en Joyería Royo, Albacete.</p>`,
  },
  // Longines
  625: { // ELEGANT COLLECTION
    name: 'Longines Elegant Collection',
    description: `<p><strong>Longines Elegant Collection</strong> es el clásico atemporal por excelencia de la manufactura. Diseño minimalista, caja delgada de 25.5mm a 41.5mm, esfera con índices alargados pulidos, ventana de fecha discreta a las 3.</p>
<p>Movimiento automático suizo Longines L897 con 64 horas de reserva de marcha. Cristal zafiro, estanqueidad 30m. Caja en acero o acero PVD oro rosa, correa de aligátor o brazalete milanese. Variantes con diamantes en bisel.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
  617: { // FLAGSHIP HERITAGE
    name: 'Longines Flagship Heritage',
    description: `<p><strong>Longines Flagship Heritage</strong> es el homenaje contemporáneo al icónico Flagship original de 1957, uno de los relojes más reconocibles de la marca con su barco grabado en el fondo de caja. Caja delgada de 38.5mm de inspiración vintage.</p>
<p>Movimiento automático suizo L607 con 38 horas de reserva. Cristal zafiro abombado, estanqueidad 30m. Caja en acero o acero PVD oro rosa con fondo de caja transparente. Correa de cuero italiano o brazalete acero.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
  614: { // LEGEND DIVER
    name: 'Longines Legend Diver',
    description: `<p><strong>Longines Legend Diver</strong> reinterpreta el icónico reloj de buceo Longines de 1959, uno de los primeros en incorporar el bisel interno rotativo (super-compresor). Caja de 42mm en acero con doble corona y cristal abombado caja.</p>
<p>Movimiento automático suizo L888 con 72 horas de reserva. Estanqueidad 300m, bisel interno graduado para tiempos de inmersión. Cristal zafiro abombado tratado anti-reflectante. Correa de tela vintage o brazalete acero.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
  613: { // MINI DOLCEVITA
    name: 'Longines Mini DolceVita',
    description: `<p><strong>Longines Mini DolceVita</strong> es la reinterpretación moderna del icónico reloj rectangular Art Déco de los años 20. Caja rectangular de 21.5x29mm en acero o acero PVD oro rosa, ideal para muñecas finas.</p>
<p>Movimiento cuarzo suizo de alta precisión. Cristal zafiro, estanqueidad 30m. Esfera Roman numerals con tratamiento sun-ray, índices aplicados. Brazalete acero o correa cuero italiano. Variantes con diamantes en bisel y/o esfera de nácar para piezas de gala.</p>
<p>Distribuidor oficial Longines en Joyería Royo, Albacete.</p>`,
  },
  // Seiko
  637: { // PREMIER
    name: 'Seiko Premier',
    description: `<p><strong>Seiko Premier</strong> es la línea de relojería elegante de la manufactura japonesa. Caja delgada de 38mm a 42mm con acabados pulidos espejo, esferas con tratamiento sun-ray e índices aplicados.</p>
<p>Movimiento <strong>Kinetic Direct Drive</strong> exclusivo de Seiko (carga manual con corona que genera energía cinética hacia el rotor) o cuarzo solar Eco-Drive según referencia. Cristal zafiro abombado, estanqueidad 100m. Caja en acero o acero PVD oro rosa.</p>
<p>Distribuidor oficial Seiko en Joyería Royo, Albacete.</p>`,
  },
};

async function updateCategoryDescription(termId, description) {
  const url = `${WP_BASE}/wp-json/wc/v3/products/categories/${termId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`category ${termId}: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function callMu(path, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', SECRET).update(ts + ':' + path + ':' + body).digest('hex');
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
  return { status: res.status, body: await res.text() };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('[init] Sprint 3M — 8 sub-cats restantes (Tissot/Longines/Seiko)');
  let applied = 0, errors = 0;
  for (const [termId, info] of Object.entries(SUBCATS)) {
    try {
      await updateCategoryDescription(parseInt(termId), info.description);
      console.log(`  ✓ ${info.name} (id=${termId})`);
      applied++;
      await sleep(400);
    } catch (err) {
      console.error(`  ✗ ${info.name}: ${err.message}`);
      errors++;
    }
  }
  const c = await callMu('/pacame/v1/cache/clear', {});
  console.log(`\n[done] applied=${applied}/${Object.keys(SUBCATS).length} errors=${errors} cache=${c.status}`);
})().catch(err => { console.error('FATAL:', err); process.exit(1); });
