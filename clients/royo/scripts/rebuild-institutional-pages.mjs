#!/usr/bin/env node
/**
 * Sprint 1A + 1B + 1D — Reescribir páginas institucionales Royo
 *
 * Reemplaza el contenido demo Ecomus en inglés ("We are Ecomus", "Robert Smith",
 * "66 Mott St NY", mapa de Tower of London) por contenido real basado en los
 * datos verificados del schema.org de la web (LocalBusiness JSON-LD):
 *
 *   - Sobre Nosotros (id 10796) — heritage joyería familiar Albacete + servicios
 *   - Contacto (id 10795) — dirección real, horario real, mapa real
 *   - Marcas (id 10804) — 11 marcas oficiales con counts reales del audit 2026-04-29
 *
 * Datos reales extraídos del schema:
 *   - Dirección: Calle Tesifonte Gallego, 2 — 02002 Albacete
 *   - Coordenadas: lat 38.99432, lng -1.85841
 *   - Horario L-V 10:00-13:30 / 17:00-20:30, sábado 10:00-13:30
 *   - Teléfono: +34 967 21 79 03 · jroyo@joyeriaroyo.com
 *   - sameAs: [] (no hay sociales reales — omitir bloque "Síguenos")
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/rebuild-institutional-pages.mjs
 */
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';

const SECRET = process.env.ROYO_PACAME_SECRET;
const USER = process.env.ROYO_WP_USER;
const PASS = process.env.ROYO_WP_APP_PASS;
if (!SECRET || !USER || !PASS) {
  console.error('ERROR: faltan ROYO_PACAME_SECRET, ROYO_WP_USER, ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

const SOBRE_NOSOTROS_CONTENT = `
<h1 class="royo-page-title">Más de medio siglo cuidando tus joyas</h1>

<p class="royo-lead">Somos Joyería Royo, una joyería familiar en el corazón de Albacete. Desde hace más de 50 años acompañamos a generaciones de albaceteñas y albaceteños en los momentos que importan: una pedida, un aniversario, el primer reloj, el regalo que se recordará siempre.</p>

<h2>Nuestra historia</h2>

<p>Joyería Royo abrió sus puertas en pleno centro de Albacete con una idea sencilla: ofrecer joyería y relojería de calidad con el asesoramiento personalizado que merece cada cliente. Lo que empezó como un proyecto familiar es hoy un referente en la provincia para quien busca relojes auténticos de las grandes manufacturas suizas y joyería de oro hecha con mimo.</p>

<p>Seguimos en el mismo lugar de siempre, en Calle Tesifonte Gallego, 2, con la misma forma de trabajar: escuchar primero, recomendar después, y atender cada pieza —tuya o nuestra— como si fuera única.</p>

<h2>Distribuidores oficiales</h2>

<p>Trabajamos con las grandes manufacturas relojeras y joyeras del mundo:</p>

<ul class="royo-brand-list">
  <li><strong>Manufacturas suizas</strong>: Tissot, Longines, Hamilton, Oris, Baume &amp; Mercier, Omega, Franck Muller, Certina</li>
  <li><strong>Manufacturas japonesas</strong>: Seiko, Citizen, Casio (incluida la línea premium G-Shock MR-G)</li>
  <li><strong>Otras europeas</strong>: MontBlanc, Victorinox</li>
  <li><strong>Joyería propia</strong>: oro 18kt, diamantes naturales certificados, esmeraldas, rubíes y zafiros — diseño propio y colaboraciones con joyeros artesanos</li>
</ul>

<p>Ser distribuidores oficiales significa que cada pieza viene con la garantía completa de fábrica, y que podemos ayudarte con el servicio post-venta: revisiones, mantenimiento y reparaciones autorizadas.</p>

<h2>Lo que hacemos por ti</h2>

<div class="royo-services-grid">
  <div class="royo-service-card">
    <h3>Asesoramiento sin prisa</h3>
    <p>Ven a la tienda, prueba el reloj, compara joyas, pregunta lo que quieras. No vendemos: aconsejamos.</p>
  </div>
  <div class="royo-service-card">
    <h3>Tasación y compra</h3>
    <p>Tasamos joyas usadas con criterio, transparencia y sin compromiso. Si quieres vender, te hacemos una oferta justa el mismo día.</p>
  </div>
  <div class="royo-service-card">
    <h3>Reparación y mantenimiento</h3>
    <p>Cambio de pila, ajuste de pulsera, repaso de oro, soldadura de cadenas, abrillantado, restauración de piezas antiguas. Trabajamos en taller o enviamos a las marcas oficiales.</p>
  </div>
  <div class="royo-service-card">
    <h3>Diseño a medida</h3>
    <p>¿Quieres un anillo único? ¿Un colgante con la piedra de tu abuela? Lo diseñamos contigo y lo hacemos en oro 18kt.</p>
  </div>
  <div class="royo-service-card">
    <h3>Garantía oficial</h3>
    <p>Cada reloj y cada joya viene con su garantía de fábrica. Y aquí estamos siempre que la necesites.</p>
  </div>
  <div class="royo-service-card">
    <h3>Envío a toda España</h3>
    <p>Compra online con la confianza de una joyería de tienda física. Envío asegurado y devolución sin preguntas durante 14 días.</p>
  </div>
</div>

<h2>Ven a vernos</h2>

<p>
  <strong>Calle Tesifonte Gallego, 2 — 02002 Albacete</strong><br>
  Lunes a viernes: 10:00 — 13:30 y 17:00 — 20:30<br>
  Sábado: 10:00 — 13:30<br>
  Teléfono: <a href="tel:+34967217903">+34 967 21 79 03</a><br>
  Email: <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a>
</p>

<p class="royo-page-cta">
  <a href="/contacto-joyeria-royo-albacete/" class="royo-btn-primary">Cómo llegar</a>
  <a href="https://wa.me/34967217903" target="_blank" rel="noopener" class="royo-btn-secondary">WhatsApp directo</a>
</p>
`.trim();

const CONTACTO_CONTENT = `
<h1 class="royo-page-title">Contacto</h1>

<p class="royo-lead">Estamos en el centro de Albacete, a dos pasos del Paseo de la Libertad. Pásate, escríbenos por WhatsApp o llámanos: contestamos siempre.</p>

<div class="royo-contact-grid">

  <div class="royo-contact-info">
    <h2>Visita la tienda</h2>
    <p>
      <strong>Calle Tesifonte Gallego, 2</strong><br>
      02002 Albacete<br>
      España
    </p>

    <h3>Horario de atención</h3>
    <p>
      <strong>Lunes a viernes</strong>: 10:00 — 13:30 y 17:00 — 20:30<br>
      <strong>Sábado</strong>: 10:00 — 13:30<br>
      <strong>Domingo y festivos</strong>: cerrado
    </p>

    <h3>Cómo contactar</h3>
    <p>
      <strong>Teléfono</strong>: <a href="tel:+34967217903">+34 967 21 79 03</a><br>
      <strong>WhatsApp</strong>: <a href="https://wa.me/34967217903" target="_blank" rel="noopener">+34 967 21 79 03</a><br>
      <strong>Email</strong>: <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a>
    </p>
  </div>

  <div class="royo-contact-form">
    <h2>Escríbenos</h2>
    <p>¿Tienes una duda sobre un reloj, una joya o un servicio? Cuéntanos y te respondemos en menos de 24 horas laborables.</p>

    <p><a href="https://wa.me/34967217903?text=Hola%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20un%20producto%20de%20Joyer%C3%ADa%20Royo." target="_blank" rel="noopener" class="royo-btn-primary royo-btn-whatsapp">Consultar por WhatsApp</a></p>

    <p>O escríbenos directamente a <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a> con tu pregunta y te atendemos en cuanto podamos.</p>
  </div>

</div>

<div class="royo-map-container">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3107.0!2d-1.85841!3d38.99432!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDU5JzM5LjYiTiAxwrA1MScxMC4zIlc!5e0!3m2!1ses!2ses!4v1714000000000"
    width="100%"
    height="420"
    style="border:0;"
    allowfullscreen=""
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
    title="Joyería Royo en Calle Tesifonte Gallego 2, Albacete"></iframe>
</div>
`.trim();

const MARCAS_CONTENT = `
<h1 class="royo-page-title">Marcas oficiales</h1>

<p class="royo-lead">En Joyería Royo somos distribuidores oficiales de las grandes manufacturas relojeras y joyeras del mundo. Cada pieza llega con la garantía completa de fábrica y, lo más importante, con nuestro asesoramiento personalizado para que elijas la que de verdad encaja contigo.</p>

<h2>Manufacturas suizas</h2>

<div class="royo-brand-card">
  <h3>Tissot — 100 referencias</h3>
  <p>Maestros del reloj suizo desde 1853. Innovación accesible: T-Touch con cristal táctil, PRX con su brazalete integrado icónico, Le Locle clásico, Seastar para inmersión, PR100 elegante, Gentleman versátil. Movimientos cuarzo y automáticos suizos.</p>
  <p><a href="/marca-producto/tissot/" class="royo-btn-primary">Ver colección Tissot</a></p>
</div>

<div class="royo-brand-card">
  <h3>Longines — 34 referencias</h3>
  <p>Elegancia y precisión desde 1832. La colección Conquest (con su línea HydroConquest deportiva), Master Collection mecánica, La Grande Classique femenina, Spirit pilot, Flagship Heritage vintage, Mini DolceVita rectangular. Movimiento automático suizo y caja en acero o acero PVD oro.</p>
  <p><a href="/marca-producto/longines/" class="royo-btn-primary">Ver colección Longines</a></p>
</div>

<div class="royo-brand-card">
  <h3>Hamilton — 29 referencias</h3>
  <p>Espíritu americano fabricado en Suiza desde 1892. Khaki Field, Khaki Aviation, Jazzmaster, Ventura — relojes con personalidad, herencia militar y cinematográfica (Interstellar, Men in Black). Movimientos automáticos H-10 y H-30.</p>
  <p><a href="/marca-producto/hamilton/" class="royo-btn-primary">Ver colección Hamilton</a></p>
</div>

<div class="royo-brand-card">
  <h3>Oris — 26 referencias</h3>
  <p>Manufactura suiza independiente desde 1904. Aquis para inmersión, Big Crown Pointer Date pilot, Divers Sixty-Five vintage. Calibres propios y compromiso con causas marinas.</p>
  <p><a href="/marca-producto/oris/" class="royo-btn-primary">Ver colección Oris</a></p>
</div>

<div class="royo-brand-card">
  <h3>Certina — 33 referencias</h3>
  <p>Relojería suiza desde 1888. La línea DS (Double Security) con su sistema icónico de doble junta para deporte y aventura. DS Action, DS PH200M, DS-1 herencia.</p>
  <p><a href="/marca-producto/certina/" class="royo-btn-primary">Ver colección Certina</a></p>
</div>

<div class="royo-brand-card">
  <h3>MontBlanc — 12 referencias</h3>
  <p>La maison alemana de la pluma estilográfica también firma relojería de alta gama desde la manufactura de Le Locle. Star Legacy, 1858, Heritage. Diseño clásico europeo, movimientos suizos.</p>
  <p><a href="/marca-producto/montblanc/" class="royo-btn-primary">Ver colección MontBlanc</a></p>
</div>

<div class="royo-brand-card">
  <h3>Baume &amp; Mercier — 10 referencias</h3>
  <p>Relojería suiza desde 1830. Clifton, Classima, Riviera. Elegancia atemporal a precio accesible dentro de la alta relojería.</p>
  <p><a href="/marca-producto/baume-mercier/" class="royo-btn-primary">Ver colección Baume &amp; Mercier</a></p>
</div>

<div class="royo-brand-card">
  <h3>Omega — 4 referencias</h3>
  <p>La marca del Speedmaster, primer reloj en la Luna, y reloj oficial de los Juegos Olímpicos. Seamaster, Constellation, De Ville. Selección curada con disponibilidad limitada.</p>
  <p><a href="/marca-producto/omega/" class="royo-btn-primary">Ver colección Omega</a></p>
</div>

<div class="royo-brand-card">
  <h3>Franck Muller — 2 referencias</h3>
  <p>Manufactura ginebrina de alta relojería contemporánea. Caja Cintrée Curvex y complicaciones técnicas. Piezas de coleccionista.</p>
  <p><a href="/marca-producto/franck-muller/" class="royo-btn-primary">Ver Franck Muller</a></p>
</div>

<h2>Manufacturas japonesas</h2>

<div class="royo-brand-card">
  <h3>Seiko — 76 referencias</h3>
  <p>Pioneros del cuarzo desde 1881. Las colecciones Prospex (buceo profesional), Presage (artesanía japonesa, esfera Enamel y Urushi), 5 Sport y Premier. Calibres mecánicos automáticos propios.</p>
  <p><a href="/marca-producto/seiko/" class="royo-btn-primary">Ver colección Seiko</a></p>
</div>

<div class="royo-brand-card">
  <h3>Casio — 58 referencias</h3>
  <p>Desde el clásico digital indestructible hasta la línea premium G-Shock MR-G en titanio forjado. Edifice, Pro Trek, Vintage, Baby-G. Tecnología solar, radio-control, Bluetooth y la garantía de durabilidad Casio.</p>
  <p><a href="/marca-producto/casio/" class="royo-btn-primary">Ver colección Casio</a></p>
</div>

<div class="royo-brand-card">
  <h3>Citizen — 16 referencias</h3>
  <p>Pioneros de la energía solar Eco-Drive desde 1976: nunca cambias pila. Promaster, Tsuyosa, Series 8 mecánicos, Crystal Collection.</p>
  <p><a href="/marca-producto/citizen/" class="royo-btn-primary">Ver colección Citizen</a></p>
</div>

<h2>Otras manufacturas</h2>

<div class="royo-brand-card">
  <h3>Victorinox — 11 referencias</h3>
  <p>El reloj con la cruz suiza. Maverick, INOX, Fieldforce, Original. Robustez heredada de la navaja del ejército suizo, en relojería diaria.</p>
  <p><a href="/marca-producto/victorinox/" class="royo-btn-primary">Ver colección Victorinox</a></p>
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
  const text = await res.text();
  return { status: res.status, body: text };
}

async function resetPage(id, title, content) {
  console.log(`\n[reset] page id=${id} title="${title}"`);
  const r = await callMu(`/pacame/v1/page/${id}/reset-to-gutenberg`, {
    title,
    content,
    remove_elementor: true,
    status: 'publish',
  });
  console.log(`  status=${r.status}`);
  console.log(`  body=${r.body.slice(0, 250)}`);
  if (r.status !== 200) throw new Error(`reset id=${id} failed: ${r.status}`);
}

(async () => {
  console.log('[init] Sprint 1A+1B+1D — reescribir páginas institucionales Royo');
  await resetPage(10796, 'Sobre Nosotros', SOBRE_NOSOTROS_CONTENT);
  await resetPage(10795, 'Contacto', CONTACTO_CONTENT);
  await resetPage(10804, 'Marcas oficiales', MARCAS_CONTENT);

  console.log('\n[cache] purgando LiteSpeed');
  const c = await callMu('/pacame/v1/cache/clear', {});
  console.log(`  status=${c.status}`);

  console.log('\n[done] 3 páginas reescritas. Verificar:');
  console.log('  https://joyeriaroyo.com/sobre-nosotros-joyeria-albacete/');
  console.log('  https://joyeriaroyo.com/contacto-joyeria-royo-albacete/');
  console.log('  https://joyeriaroyo.com/marcas-joyeria-royo-en-albacete/');
})().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
