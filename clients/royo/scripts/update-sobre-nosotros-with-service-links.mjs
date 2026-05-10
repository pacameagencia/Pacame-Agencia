#!/usr/bin/env node
/**
 * Sprint 3N (parte 2) — Actualizar Sobre Nosotros con links a las 3 pages
 * de servicios recién creadas (Sprint 3N parte 1).
 *
 * Convierte los h3 "Tasación", "Reparación", "Diseño a medida" en links
 * activos a /tasacion-joyas-albacete/, /reparacion-relojes-albacete/,
 * /diseno-joyas-medida-albacete/.
 */
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const SECRET = process.env.ROYO_PACAME_SECRET;
const USER = process.env.ROYO_WP_USER;
const PASS = process.env.ROYO_WP_APP_PASS;
if (!SECRET || !USER || !PASS) {
  console.error('ERROR: faltan vars'); process.exit(1);
}
const auth = `Basic ${Buffer.from(`${USER}:${PASS}`).toString('base64')}`;

const SOBRE_NOSOTROS_CONTENT = `
<h1 class="royo-page-title">Más de medio siglo cuidando tus joyas</h1>

<p class="royo-lead">Somos Joyería Royo, una joyería familiar en el corazón de Albacete. Desde hace más de 50 años acompañamos a generaciones de albaceteñas y albaceteños en los momentos que importan: una pedida, un aniversario, el primer reloj, el regalo que se recordará siempre.</p>

<h2>Nuestra historia</h2>

<p>Joyería Royo abrió sus puertas en pleno centro de Albacete con una idea sencilla: ofrecer joyería y relojería de calidad con el asesoramiento personalizado que merece cada cliente. Lo que empezó como un proyecto familiar es hoy un referente en la provincia para quien busca relojes auténticos de las grandes manufacturas suizas y joyería de oro hecha con mimo.</p>

<p>Seguimos en el mismo lugar de siempre, en Calle Tesifonte Gallego, 2, con la misma forma de trabajar: escuchar primero, recomendar después, y atender cada pieza —tuya o nuestra— como si fuera única.</p>

<h2>Distribuidores oficiales</h2>

<p>Trabajamos con las grandes manufacturas relojeras y joyeras del mundo:</p>

<ul class="royo-brand-list">
  <li><strong>Manufacturas suizas</strong>: <a href="/categoria-producto/relojes/marcas/tissot/">Tissot</a>, <a href="/categoria-producto/relojes/marcas/longines/">Longines</a>, <a href="/categoria-producto/relojes/marcas/hamilton/">Hamilton</a>, <a href="/categoria-producto/relojes/marcas/oris/">Oris</a>, <a href="/categoria-producto/relojes/marcas/baume-mercier/">Baume &amp; Mercier</a>, <a href="/categoria-producto/relojes/marcas/omega/">Omega</a>, <a href="/categoria-producto/relojes/marcas/franck-muller/">Franck Muller</a>, <a href="/categoria-producto/relojes/marcas/certina/">Certina</a></li>
  <li><strong>Manufacturas japonesas</strong>: <a href="/categoria-producto/relojes/marcas/seiko/">Seiko</a>, <a href="/categoria-producto/relojes/marcas/citizen/">Citizen</a>, <a href="/categoria-producto/relojes/marcas/casio/">Casio</a> (incluida la línea premium G-Shock MR-G)</li>
  <li><strong>Otras europeas</strong>: <a href="/categoria-producto/relojes/marcas/montblanc/">MontBlanc</a>, <a href="/categoria-producto/relojes/marcas/victorinox/">Victorinox</a></li>
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
    <h3><a href="/tasacion-joyas-albacete/">Tasación y compra</a></h3>
    <p>Tasamos joyas usadas con criterio, transparencia y sin compromiso. Si quieres vender, te hacemos una oferta justa el mismo día.</p>
  </div>
  <div class="royo-service-card">
    <h3><a href="/reparacion-relojes-albacete/">Reparación y mantenimiento</a></h3>
    <p>Cambio de pila, ajuste de pulsera, repaso de oro, soldadura de cadenas, abrillantado, restauración de piezas antiguas. Servicio oficial de marca para Tissot, Longines, Hamilton y otras.</p>
  </div>
  <div class="royo-service-card">
    <h3><a href="/diseno-joyas-medida-albacete/">Diseño a medida</a></h3>
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

(async () => {
  console.log('[init] Update Sobre Nosotros (id 10796) con links a 3 pages servicios');
  const r = await callMu('/pacame/v1/page/10796/reset-to-gutenberg', {
    title: 'Sobre Nosotros',
    content: SOBRE_NOSOTROS_CONTENT,
    remove_elementor: true,
    status: 'publish',
  });
  console.log(`status=${r.status}`);
  console.log(r.body.slice(0, 300));
  const c = await callMu('/pacame/v1/cache/clear', {});
  console.log(`cache=${c.status}`);
})().catch(err => { console.error('FATAL:', err); process.exit(1); });
