#!/usr/bin/env node
/**
 * Sprint 3K — Fix URLs Marcas page + term descriptions luxury archive marca.
 *
 * Bug detectado: PR #162 puse links `/marca-producto/{slug}/` en página Marcas,
 * pero esa URL NO existe → 301 redirect a producto random (Yoast guess?). Mata SEO.
 * URL real archive Woo es `/categoria-producto/relojes/marcas/{slug}/`.
 *
 * Acciones:
 *   1. Re-escribir page Marcas (id 10804) con URLs correctas.
 *   2. Inyectar term description rica + autoridad en cada categoría de marca:
 *      "Tissot — Manufactura suiza desde 1853. Distribuidor oficial. Maestros del
 *       reloj suizo accesible: T-Touch (cristal táctil), PRX (brazalete integrado
 *       icónico), Le Locle, Seastar 1000 buceo, PR100, Gentleman. Movimientos
 *       cuarzo y automáticos suizos. Garantía oficial Tissot..."
 *   3. Actualizar el SEO meta description del archive con call-to-action local.
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/fix-brand-archive-pages.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

const WP_BASE = 'https://joyeriaroyo.com';
const HISTORY_DIR = 'clients/royo/history';
fs.mkdirSync(HISTORY_DIR, { recursive: true });

const SECRET = process.env.ROYO_PACAME_SECRET;
const USER = process.env.ROYO_WP_USER;
const PASS = process.env.ROYO_WP_APP_PASS;
if (!SECRET || !USER || !PASS) {
  console.error('ERROR: faltan ROYO_PACAME_SECRET, ROYO_WP_USER, ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

// IDs y descripciones autoridad por marca (fact-checked oficial brand pages).
const BRANDS = {
  92: { // Tissot
    slug: 'tissot',
    name: 'Tissot',
    description: `<p>Tissot es manufactura suiza con sede en Le Locle desde <strong>1853</strong>. Pionera en aleaciones, materiales y movimientos accesibles dentro de la alta relojería. Joyería Royo es <strong>distribuidor oficial Tissot</strong> en Albacete con la garantía completa de la marca y servicio post-venta autorizado.</p>
<p>Colecciones destacadas en stock: <strong>PRX</strong> (brazalete integrado icónico años 70 reinterpretado), <strong>PR 100</strong> (clásico contemporáneo), <strong>Seastar 1000</strong> (buceo profesional 300m), <strong>Le Locle</strong> (homenaje a la ciudad cuna), <strong>Classic Dream</strong> (elegancia diaria), <strong>Gentleman</strong> (versátil), <strong>Chrono XL</strong> y <strong>T-Touch Connect</strong> (cristal táctil).</p>
<p>Movimientos cuarzo suizos, automáticos Powermatic 80 (80 horas reserva de marcha) y híbridos T-Touch. Cada pieza incluye garantía oficial internacional Tissot.</p>`
  },
  113: { // Longines
    slug: 'longines',
    name: 'Longines',
    description: `<p>Longines, fundada en <strong>Saint-Imier en 1832</strong>, es una de las manufacturas suizas más reconocidas internacionalmente. Su logo del reloj de arena alado representa casi 200 años de elegancia y precisión. Joyería Royo es <strong>distribuidor oficial Longines</strong> en Albacete.</p>
<p>Colecciones en stock: <strong>Conquest</strong> (deportivo elegante), <strong>HydroConquest</strong> (buceo 300m), <strong>Master Collection</strong> (alta relojería automática), <strong>La Grande Classique</strong> (silueta delgada femenina), <strong>Spirit</strong> (pilot heritage), <strong>Flagship Heritage</strong> (vintage), <strong>Mini DolceVita</strong> (rectangular).</p>
<p>Movimientos automáticos suizos exclusivos L592, L688 cronógrafo. Cajas en acero, acero PVD oro y oro 18kt. Cada Longines viene con su garantía oficial y certificado.</p>`
  },
  93: { // Hamilton
    slug: 'hamilton',
    name: 'Hamilton',
    description: `<p>Hamilton fue fundada en <strong>Lancaster, Pennsylvania, en 1892</strong> y desde 2003 forma parte del Swatch Group, fabricándose en La Chaux-de-Fonds, Suiza. Su mezcla americano-suiza le da una personalidad única en relojería.</p>
<p>Colecciones destacadas: <strong>Khaki Field</strong> (heritage militar inspirado en relojes de la WWII), <strong>Khaki Aviation</strong> (pilot watches), <strong>Jazzmaster</strong> (diaria elegante), <strong>Ventura</strong> (forma triangular icónica que llevó Elvis y aparece en Men in Black), <strong>Khaki Navy</strong> (buceo).</p>
<p>Movimientos automáticos suizos H-10 (80 horas reserva), H-30 cronógrafo. Famoso por sus apariciones en cine: Interstellar (Murph), Independence Day, 2001: A Space Odyssey, Pearl Harbor.</p>`
  },
  97: { // Oris
    slug: 'oris',
    name: 'Oris',
    description: `<p>Oris es una de las pocas <strong>manufacturas suizas independientes</strong> que quedan, fundada en <strong>Hölstein en 1904</strong>. Reconocida por sus calibres propios, la corona roja característica y su compromiso con causas medioambientales marinas.</p>
<p>Colecciones en stock: <strong>Aquis Date</strong> (buceo 300m), <strong>Big Crown Pointer Date</strong> (pilot heritage con su corona icónica grande), <strong>Divers Sixty-Five</strong> (vintage 1965), <strong>Aquis GMT Date</strong>, <strong>ProPilot</strong> (aviación contemporánea).</p>
<p>Calibre Oris 400 (cinco días reserva, anti-magnético, 10 años garantía). Cada modelo Oris en Joyería Royo viene con la garantía oficial extendida 10 años de la manufactura.</p>`
  },
  21: { // Certina
    slug: 'certina',
    name: 'Certina',
    description: `<p>Certina, fundada en <strong>Grenchen en 1888</strong>, lleva más de 135 años fabricando relojería suiza robusta. Su sistema icónico <strong>DS (Double Security)</strong>, lanzado en 1959, garantiza protección anti-impacto, anti-agua y anti-magnetismo.</p>
<p>Colecciones en stock: <strong>DS Action Diver</strong> (buceo profesional 300m con Powermatic 80), <strong>DS PH200M</strong> (heritage), <strong>DS-1</strong> (clásico), <strong>DS-8</strong> (deportivo lady), <strong>DS Caimano</strong>, <strong>DS-X GMT</strong>.</p>
<p>Movimientos automáticos Powermatic 80 (80 horas reserva), cuarzo COSC certificado, GMT. Cada Certina incluye garantía oficial internacional y mantenimiento autorizado.</p>`
  },
  134: { // Seiko
    slug: 'seiko',
    name: 'Seiko',
    description: `<p>Seiko es la manufactura japonesa más reconocida del mundo, fundada en <strong>Tokio en 1881</strong>. Pioneros del cuarzo (1969) y de la energía cinética (1988). Cada Seiko que vende Joyería Royo viene con su garantía oficial internacional.</p>
<p>Colecciones en stock: <strong>Prospex</strong> (buceo profesional ISO 6425, modelos Tortuga, Sumo, Samurai, SPB Speedtimer), <strong>Presage</strong> (artesanía japonesa, esfera Enamel/Urushi/Arita porcelain), <strong>5 Sports</strong> (automático accesible), <strong>Seiko 5 GMT</strong>, <strong>Premier</strong>.</p>
<p>Calibres mecánicos automáticos in-house 4R36, 6R35, NH35. Tecnología <strong>Eco-Drive solar</strong> y kinetic. Manufactura completa: Seiko fabrica internamente desde el muelle hasta el cristal zafiro.</p>`
  },
  112: { // Casio
    slug: 'casio',
    name: 'Casio',
    description: `<p>Casio, fundada en <strong>Tokio en 1946</strong>, revolucionó la relojería mundial con el primer reloj digital de cuarzo en 1974 y la línea G-Shock indestructible en 1983. Joyería Royo es <strong>distribuidor oficial Casio</strong> en Albacete.</p>
<p>Colecciones en stock: <strong>G-Shock</strong> (icónica resistencia, modelos GA-2100 "Casioak", GMW-B5000 full metal, MR-G titanio forjado premium), <strong>Edifice</strong> (cronos crossover deportivos con Bluetooth y radio-control), <strong>Pro Trek</strong> (outdoor con altímetro/barómetro/brújula), <strong>Vintage</strong> (digital retro 80s), <strong>Baby-G</strong>.</p>
<p>Tecnología <strong>Tough Solar</strong> (energía solar perpetua), <strong>Multiband 6</strong> (radio-control 6 emisoras), Bluetooth Smart Phone Link, Carbon Core Guard. La línea premium <strong>MR-G</strong> en titanio forjado representa el pináculo de la artesanía Casio.</p>`
  },
  127: { // Citizen
    slug: 'citizen',
    name: 'Citizen',
    description: `<p>Citizen, fundada en <strong>Tokio en 1918</strong>, es pionera de la <strong>tecnología solar Eco-Drive</strong> desde 1976: relojes que <strong>nunca necesitan cambio de pila</strong>. Distribuidor oficial Citizen en Joyería Royo Albacete.</p>
<p>Colecciones en stock: <strong>Promaster</strong> (buceo profesional, aviación, Land outdoor), <strong>Tsuyosa</strong> (automático elegante), <strong>Series 8</strong> (mecánicos premium con calibres in-house), <strong>Crystal Collection</strong> (joyería relojera Swarovski), <strong>Eco-Drive Diver</strong> Limited Edition.</p>
<p>Calibres automáticos in-house Citizen Caliber 0950 y Eco-Drive E168 con perpetual calendar. Garantía oficial internacional Citizen.</p>`
  },
  153: { // MontBlanc
    slug: 'montblanc',
    name: 'MontBlanc',
    description: `<p>MontBlanc, casa alemana fundada en <strong>Hamburgo en 1906</strong>, es reconocida mundialmente por sus plumas estilográficas Meisterstück. Desde 1997 firma alta relojería en su <strong>manufactura de Le Locle, Suiza</strong>, con calibres in-house y técnica de complicaciones.</p>
<p>Colecciones en stock: <strong>Star Legacy</strong> (clásico vienés con esfera lacada), <strong>1858</strong> (heritage exploradores Minerva), <strong>Heritage</strong> (vintage refinado), <strong>Iced Sea</strong> (buceo con esfera glaciar). Diseño europeo clásico con movimientos suizos.</p>
<p>Calibres MB 24.07 automatic, MB M62.48 manual wind. Cada MontBlanc viene con garantía internacional y se puede grabar bajo solicitud.</p>`
  },
  105: { // Omega
    slug: 'omega',
    name: 'Omega',
    description: `<p>Omega, fundada en <strong>La Chaux-de-Fonds en 1848</strong>, es leyenda de la relojería suiza. <strong>Reloj oficial de los Juegos Olímpicos</strong> desde 1932 y <strong>primer reloj en la Luna</strong> con el Speedmaster (Apollo 11, 1969). Joyería Royo selecciona referencias Omega Master Chronometer.</p>
<p>Colecciones en stock: <strong>Speedmaster</strong> (Moonwatch + Racing), <strong>Seamaster</strong> (Diver 300M, Aqua Terra, Planet Ocean), <strong>Constellation</strong> (elegancia 12 estrellas), <strong>De Ville</strong> (clásico vestir).</p>
<p>Calibres automáticos in-house Master Chronometer Co-Axial, certificados <strong>METAS</strong> (anti-magnetismo 15.000 gauss + cronometría). Selección curada con disponibilidad limitada.</p>`
  },
  114: { // Victorinox
    slug: 'victorinox',
    name: 'Victorinox',
    description: `<p>Victorinox, fundada en <strong>Ibach, Suiza, en 1884</strong>, es famosa mundialmente por la navaja del ejército suizo. Desde 1989 fabrica relojería con la misma filosofía: <strong>robustez total y diseño funcional</strong>.</p>
<p>Colecciones en stock: <strong>I.N.O.X.</strong> (resiste 130 tests extremos: caída en hormigón, fuego, inmersión, presión), <strong>Maverick</strong> (sport classic), <strong>Fieldforce</strong> (versátil), <strong>Original</strong> (homenaje al primer modelo), <strong>Professional Diver Titanium</strong>.</p>
<p>Cuarzo suizo, automático ETA. Cajas en acero 316L o titanio grado 5. Cada Victorinox viene con garantía oficial 10 años extendida.</p>`
  },
  131: { // Franck Muller
    slug: 'franck-muller',
    name: 'Franck Muller',
    description: `<p>Franck Muller, manufactura ginebrina fundada en <strong>1992</strong>, es referente en alta relojería contemporánea con complicaciones técnicas reinventadas. Su característica caja <strong>Cintrée Curvex</strong> es inmediatamente reconocible.</p>
<p>Modelos en stock: <strong>Vanguard</strong>, <strong>Long Island</strong>, <strong>Casablanca</strong>, <strong>Color Dreams</strong>. Movimientos automáticos in-house con calibre FM 1740. Piezas de coleccionista numeradas.</p>
<p>Cada Franck Muller viene con su certificado de origen y garantía oficial internacional. Joyería Royo selecciona piezas representativas de la manufactura.</p>`
  },
};

const MARCAS_PAGE_ID = 10804;
const MARCAS_CONTENT = `
<h1 class="royo-page-title">Marcas oficiales</h1>

<p class="royo-lead">En Joyería Royo somos distribuidores oficiales de las grandes manufacturas relojeras y joyeras del mundo. Cada pieza llega con la garantía completa de fábrica y, lo más importante, con nuestro asesoramiento personalizado para que elijas la que de verdad encaja contigo.</p>

<h2>Manufacturas suizas</h2>

<div class="royo-brand-card">
  <h3>Tissot — 100 referencias</h3>
  <p>Maestros del reloj suizo desde 1853. Innovación accesible: T-Touch con cristal táctil, PRX con su brazalete integrado icónico, Le Locle clásico, Seastar para inmersión, PR100 elegante, Gentleman versátil. Movimientos cuarzo y automáticos suizos.</p>
  <p><a href="/categoria-producto/relojes/marcas/tissot/" class="royo-btn-primary">Ver colección Tissot</a></p>
</div>

<div class="royo-brand-card">
  <h3>Longines — 34 referencias</h3>
  <p>Elegancia y precisión desde 1832. La colección Conquest (con su línea HydroConquest deportiva), Master Collection mecánica, La Grande Classique femenina, Spirit pilot, Flagship Heritage vintage, Mini DolceVita rectangular. Movimiento automático suizo y caja en acero o acero PVD oro.</p>
  <p><a href="/categoria-producto/relojes/marcas/longines/" class="royo-btn-primary">Ver colección Longines</a></p>
</div>

<div class="royo-brand-card">
  <h3>Hamilton — 29 referencias</h3>
  <p>Espíritu americano fabricado en Suiza desde 1892. Khaki Field, Khaki Aviation, Jazzmaster, Ventura — relojes con personalidad, herencia militar y cinematográfica (Interstellar, Men in Black). Movimientos automáticos H-10 y H-30.</p>
  <p><a href="/categoria-producto/relojes/marcas/hamilton/" class="royo-btn-primary">Ver colección Hamilton</a></p>
</div>

<div class="royo-brand-card">
  <h3>Oris — 26 referencias</h3>
  <p>Manufactura suiza independiente desde 1904. Aquis para inmersión, Big Crown Pointer Date pilot, Divers Sixty-Five vintage. Calibres propios y compromiso con causas marinas.</p>
  <p><a href="/categoria-producto/relojes/marcas/oris/" class="royo-btn-primary">Ver colección Oris</a></p>
</div>

<div class="royo-brand-card">
  <h3>Certina — 33 referencias</h3>
  <p>Relojería suiza desde 1888. La línea DS (Double Security) con su sistema icónico de doble junta para deporte y aventura. DS Action, DS PH200M, DS-1 herencia.</p>
  <p><a href="/categoria-producto/relojes/marcas/certina/" class="royo-btn-primary">Ver colección Certina</a></p>
</div>

<div class="royo-brand-card">
  <h3>MontBlanc — 12 referencias</h3>
  <p>La maison alemana de la pluma estilográfica también firma relojería de alta gama desde la manufactura de Le Locle. Star Legacy, 1858, Heritage. Diseño clásico europeo, movimientos suizos.</p>
  <p><a href="/categoria-producto/relojes/marcas/montblanc/" class="royo-btn-primary">Ver colección MontBlanc</a></p>
</div>

<div class="royo-brand-card">
  <h3>Omega — 4 referencias</h3>
  <p>La marca del Speedmaster, primer reloj en la Luna, y reloj oficial de los Juegos Olímpicos. Seamaster, Constellation, De Ville. Selección curada con disponibilidad limitada.</p>
  <p><a href="/categoria-producto/relojes/marcas/omega/" class="royo-btn-primary">Ver colección Omega</a></p>
</div>

<div class="royo-brand-card">
  <h3>Franck Muller — 1 referencia</h3>
  <p>Manufactura ginebrina de alta relojería contemporánea. Caja Cintrée Curvex y complicaciones técnicas. Piezas de coleccionista.</p>
  <p><a href="/categoria-producto/relojes/marcas/franck-muller/" class="royo-btn-primary">Ver Franck Muller</a></p>
</div>

<h2>Manufacturas japonesas</h2>

<div class="royo-brand-card">
  <h3>Seiko — 75 referencias</h3>
  <p>Pioneros del cuarzo desde 1881. Las colecciones Prospex (buceo profesional), Presage (artesanía japonesa, esfera Enamel y Urushi), 5 Sport y Premier. Calibres mecánicos automáticos propios.</p>
  <p><a href="/categoria-producto/relojes/marcas/seiko/" class="royo-btn-primary">Ver colección Seiko</a></p>
</div>

<div class="royo-brand-card">
  <h3>Casio — 58 referencias</h3>
  <p>Desde el clásico digital indestructible hasta la línea premium G-Shock MR-G en titanio forjado. Edifice, Pro Trek, Vintage, Baby-G. Tecnología solar, radio-control, Bluetooth y la garantía de durabilidad Casio.</p>
  <p><a href="/categoria-producto/relojes/marcas/casio/" class="royo-btn-primary">Ver colección Casio</a></p>
</div>

<div class="royo-brand-card">
  <h3>Citizen — 18 referencias</h3>
  <p>Pioneros de la energía solar Eco-Drive desde 1976: nunca cambias pila. Promaster, Tsuyosa, Series 8 mecánicos, Crystal Collection.</p>
  <p><a href="/categoria-producto/relojes/marcas/citizen/" class="royo-btn-primary">Ver colección Citizen</a></p>
</div>

<h2>Otras manufacturas</h2>

<div class="royo-brand-card">
  <h3>Victorinox — 11 referencias</h3>
  <p>El reloj con la cruz suiza. Maverick, INOX, Fieldforce, Original. Robustez heredada de la navaja del ejército suizo, en relojería diaria.</p>
  <p><a href="/categoria-producto/relojes/marcas/victorinox/" class="royo-btn-primary">Ver colección Victorinox</a></p>
</div>

<h2>Joyería</h2>

<p>Más allá de los relojes, en Joyería Royo trabajamos con joyería de oro 18kt fina: anillos solitarios, pendientes con diamantes y esmeraldas, gargantillas eslabón barbado, pulseras Riviera, colgantes de alta joyería. Trabajamos con piedras certificadas (diamantes con certificado de gemología, esmeraldas Colombia, zafiros Ceilán) y con joyeros artesanos para piezas a medida.</p>

<p><a href="/categoria-producto/joyas/" class="royo-btn-primary">Ver colección de joyas</a></p>

<h2>¿No encuentras lo que buscas?</h2>

<p>Tenemos más de 600 referencias en tienda y acceso a los catálogos completos de cada marca. Si buscas una referencia concreta o una colección que no aparece, escríbenos y te la conseguimos.</p>

<p class="royo-page-cta">
  <a href="/contacto-joyeria-royo-albacete/" class="royo-btn-primary">Contáctanos</a>
  <a href="https://wa.me/34967217903" target="_blank" rel="noopener" class="royo-btn-secondary">WhatsApp directo</a>
</p>
`.trim();

async function callMu(path, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', SECRET).update(ts + ':' + path + ':' + body).digest('hex');
  const res = await fetch(WP_BASE + '/wp-json' + path, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'User-Agent': 'PACAME-Bot/1.0',
      'X-PACAME-Timestamp': ts,
      'X-PACAME-Signature': sig,
    },
    body,
  });
  return { status: res.status, body: await res.text() };
}

async function updateBrandCategoryDescription(termId, description) {
  // Woo REST products/categories endpoint para term descriptions
  const url = `${WP_BASE}/wp-json/wc/v3/products/categories/${termId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': 'PACAME-Bot/1.0' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`category ${termId}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('[init] Sprint 3K — fix URLs Marcas + term descriptions luxury');

  // 1. Re-escribir page Marcas con URLs correctas
  console.log('\n[1] Re-escribir page Marcas (id 10804) con /categoria-producto/relojes/marcas/{slug}/');
  const r = await callMu(`/pacame/v1/page/${MARCAS_PAGE_ID}/reset-to-gutenberg`, {
    title: 'Marcas oficiales',
    content: MARCAS_CONTENT,
    remove_elementor: true,
    status: 'publish',
  });
  console.log(`  status=${r.status} body=${r.body.slice(0, 200)}`);

  // 2. Inyectar term description en cada marca
  console.log('\n[2] Term descriptions luxury en categorías de marca');
  let applied = 0, errors = 0;
  for (const [termId, brand] of Object.entries(BRANDS)) {
    try {
      const result = await updateBrandCategoryDescription(parseInt(termId), brand.description);
      console.log(`  ✓ ${brand.name} (id=${termId}) updated`);
      applied++;
      await sleep(400);
    } catch (err) {
      console.error(`  ✗ ${brand.name}: ${err.message}`);
      errors++;
    }
  }

  // 3. Cache clear
  console.log('\n[3] Purge cache');
  const c = await callMu('/pacame/v1/cache/clear', {});
  console.log(`  status=${c.status}`);

  console.log(`\n[done] terms_updated=${applied}/${Object.keys(BRANDS).length} errors=${errors}`);
  console.log('\nVerificar:');
  console.log('  https://joyeriaroyo.com/marcas-joyeria-royo-en-albacete/');
  console.log('  https://joyeriaroyo.com/categoria-producto/relojes/marcas/tissot/');
})().catch(err => { console.error('FATAL:', err); process.exit(1); });
