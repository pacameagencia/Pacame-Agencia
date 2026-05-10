#!/usr/bin/env node
/**
 * Sprint 3N — Crear pages de servicios SEO local.
 *
 * Sobre Nosotros menciona "Tasación", "Reparación", "Diseño a medida" como
 * servicios pero NO existen como pages independientes. SEO de cola larga
 * desperdiciado: "tasación joyas Albacete", "reparación relojes Albacete",
 * "diseño joyas medida Albacete".
 *
 * Crea 3 pages nuevas vía wp/v2/pages con:
 *   - Slug descriptivo SEO local (incluye Albacete)
 *   - Copy autoridad 350-450 palabras con keyword density natural
 *   - Trust signals (50 años, taller propio, presupuesto sin compromiso)
 *   - CTA WhatsApp al final + dirección + horario
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/create-service-pages.mjs
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

const PAGES = [
  {
    slug: 'tasacion-joyas-albacete',
    title: 'Tasación de Joyas en Albacete',
    excerpt: 'Tasación profesional de joyas en Albacete por Joyería Royo. Más de 50 años valorando oro, diamantes y piedras preciosas con criterio, transparencia y sin compromiso.',
    content: `
<h1 class="royo-page-title">Tasación de Joyas en Albacete</h1>

<p class="royo-lead">Tasamos joyas de oro, diamantes, esmeraldas, rubíes, zafiros y perlas con criterio profesional, transparencia total y sin compromiso. Más de 50 años trabajando con piezas únicas en el corazón de Albacete.</p>

<h2>Cómo trabajamos</h2>

<p>Cada pieza se valora individualmente en nuestro taller de la <a href="/sobre-nosotros-joyeria-albacete/">Calle Tesifonte Gallego, 2</a>. Examinamos el material (oro de 18kt, 14kt, 9kt, plata, platino), pesamos en gramos, identificamos los punzonados oficiales y analizamos cada gema con lupa de joyero y, si es necesario, con tester profesional de diamantes y piedras preciosas.</p>

<p>El proceso dura entre 15 y 30 minutos según la complejidad de la pieza. <strong>La tasación es gratuita y sin compromiso de venta</strong>. Te entregamos la valoración por escrito si lo deseas.</p>

<h2>Qué tasamos</h2>

<ul class="royo-brand-list">
  <li><strong>Joyería de oro</strong>: anillos, sortijas, alianzas, solitarios, pendientes, pulseras, colgantes, gargantillas, cadenas, medallas. 18kt, 14kt, 9kt, oro blanco, amarillo y rosa.</li>
  <li><strong>Diamantes y piedras preciosas</strong>: diamantes naturales con o sin certificado GIA/HRD, esmeraldas, rubíes, zafiros, topacios, aguamarinas, perlas naturales y cultivadas.</li>
  <li><strong>Joyería antigua y de herencia</strong>: piezas de generaciones anteriores, valoradas con respeto a su historia y posible valor como antigüedad.</li>
  <li><strong>Plata fina y vermeil</strong>: cuberterías, joyería contemporánea, piezas de diseño.</li>
  <li><strong>Relojería de marca</strong>: tasamos relojes de las grandes manufacturas suizas y japonesas (Tissot, Longines, Omega, Rolex, Seiko, Cartier...).</li>
</ul>

<h2>Compra de joyas usadas</h2>

<p>Si decides vender tu pieza tras la tasación, te hacemos una <strong>oferta justa el mismo día en efectivo o transferencia inmediata</strong>. Sin presiones ni regateos: el precio se calcula sobre la valoración real del material, las gemas y el estado de conservación.</p>

<p>Aceptamos joyas en oro, plata, platino y relojería de marca. La operación queda registrada legalmente con factura y documentación de identidad por normativa anti-blanqueo.</p>

<h2>Tasaciones para herencias y peritajes</h2>

<p>Realizamos también tasaciones para reparto de herencias, divorcios o peritajes legales con valoración escrita formal y firma profesional. Si necesitas un peritaje certificado, contáctanos para concertar cita previa.</p>

<h2>Ven a Joyería Royo</h2>

<p>
  <strong>Calle Tesifonte Gallego, 2 — 02002 Albacete</strong><br>
  Lunes a viernes: 10:00 — 13:30 y 17:00 — 20:30<br>
  Sábado: 10:00 — 13:30<br>
  Teléfono: <a href="tel:+34967217903">+34 967 21 79 03</a>
</p>

<p class="royo-page-cta">
  <a href="https://wa.me/34967217903?text=Hola%2C+me+gustar%C3%ADa+pedir+una+tasaci%C3%B3n+de+una+pieza" target="_blank" rel="noopener" class="royo-btn-primary royo-btn-whatsapp">Pedir cita por WhatsApp</a>
  <a href="/contacto-joyeria-royo-albacete/" class="royo-btn-secondary">Cómo llegar</a>
</p>
`.trim(),
  },
  {
    slug: 'reparacion-relojes-albacete',
    title: 'Reparación de Relojes en Albacete',
    excerpt: 'Reparación oficial de relojes Tissot, Longines, Seiko, Casio, Hamilton y otras marcas en Albacete. Distribuidor autorizado con servicio post-venta y garantía.',
    content: `
<h1 class="royo-page-title">Reparación de Relojes en Albacete</h1>

<p class="royo-lead">Servicio técnico autorizado para relojes de las grandes manufacturas suizas y japonesas. Cambio de pila, ajuste de pulsera, revisión de estanqueidad, reparación de movimiento y restauración de piezas vintage.</p>

<h2>Servicios disponibles</h2>

<ul class="royo-brand-list">
  <li><strong>Cambio de pila</strong>: 10-15 minutos en tienda con test de estanqueidad. Pilas Renata Swiss Made originales para todas las marcas.</li>
  <li><strong>Cambio y ajuste de pulsera</strong>: ajuste de eslabones, sustitución completa de brazalete o correa por modelo original de marca o equivalente.</li>
  <li><strong>Test y restauración de estanqueidad</strong>: prueba de presión hasta 10 ATM con sustitución de juntas tóricas si es necesario.</li>
  <li><strong>Revisión completa de movimiento</strong>: limpieza ultrasonidos, lubricación con aceites profesionales, ajuste de marcha. Para automáticos y mecánicos.</li>
  <li><strong>Reparación de cristal</strong>: sustitución de cristal mineral, zafiro o acrílico vintage.</li>
  <li><strong>Reparación esfera y agujas</strong>: cambio de agujas, restauración de esferas vintage, reposición de índices luminosos.</li>
  <li><strong>Servicio oficial de marca</strong>: para relojes Tissot, Longines, Hamilton, Oris, Omega, Seiko (entre otras), gestionamos el servicio en la manufactura suiza/japonesa cuando es necesario.</li>
</ul>

<h2>Distribuidor oficial autorizado</h2>

<p>Joyería Royo es <strong>distribuidor oficial</strong> de las principales manufacturas relojeras: <a href="/categoria-producto/relojes/marcas/tissot/">Tissot</a>, <a href="/categoria-producto/relojes/marcas/longines/">Longines</a>, <a href="/categoria-producto/relojes/marcas/hamilton/">Hamilton</a>, <a href="/categoria-producto/relojes/marcas/oris/">Oris</a>, <a href="/categoria-producto/relojes/marcas/omega/">Omega</a>, <a href="/categoria-producto/relojes/marcas/seiko/">Seiko</a>, <a href="/categoria-producto/relojes/marcas/citizen/">Citizen</a> y <a href="/categoria-producto/relojes/marcas/casio/">Casio</a>. Esto significa que cualquier reloj de estas marcas puede recibir <strong>servicio técnico autorizado con garantía oficial</strong>, gestionado directamente desde nuestra tienda.</p>

<h2>Presupuesto sin compromiso</h2>

<p>Tras revisar el reloj te damos un presupuesto detallado por escrito antes de iniciar la reparación. <strong>No se cobra nada si decides no proceder</strong>. La estimación incluye plazo previsto y garantía sobre el trabajo realizado.</p>

<h2>Reparación de relojes vintage</h2>

<p>También trabajamos relojes antiguos: bolsillo, automáticos suizos clásicos, cronógrafos vintage de los 60-80, modelos heredados de generaciones anteriores. Restauramos respetando la pieza original sin sustituir partes innecesariamente.</p>

<h2>Ven a Joyería Royo</h2>

<p>
  <strong>Calle Tesifonte Gallego, 2 — 02002 Albacete</strong><br>
  Lunes a viernes: 10:00 — 13:30 y 17:00 — 20:30<br>
  Sábado: 10:00 — 13:30<br>
  Teléfono: <a href="tel:+34967217903">+34 967 21 79 03</a>
</p>

<p class="royo-page-cta">
  <a href="https://wa.me/34967217903?text=Hola%2C+necesito+reparar+un+reloj" target="_blank" rel="noopener" class="royo-btn-primary royo-btn-whatsapp">Consultar reparación por WhatsApp</a>
  <a href="/contacto-joyeria-royo-albacete/" class="royo-btn-secondary">Cómo llegar</a>
</p>
`.trim(),
  },
  {
    slug: 'diseno-joyas-medida-albacete',
    title: 'Diseño de Joyas a Medida en Albacete',
    excerpt: 'Diseño y fabricación de joyas a medida en Albacete. Anillos de compromiso, alianzas grabadas, colgantes con piedra de herencia. Oro 18kt, diamantes y gemas seleccionadas.',
    content: `
<h1 class="royo-page-title">Diseño de Joyas a Medida en Albacete</h1>

<p class="royo-lead">Convertimos tu idea en una joya única. Diseñamos y fabricamos en oro 18kt anillos de compromiso, alianzas personalizadas, colgantes con piedras de herencia y piezas únicas para regalos especiales. Trabajamos contigo desde el boceto hasta el acabado final.</p>

<h2>Cómo funciona el proceso</h2>

<ol class="royo-brand-list">
  <li><strong>Conversación inicial</strong> en tienda o por <a href="https://wa.me/34967217903" target="_blank" rel="noopener">WhatsApp</a>. Nos cuentas la idea, el motivo (compromiso, aniversario, regalo, herencia) y el presupuesto orientativo.</li>
  <li><strong>Boceto y propuesta</strong>: nuestros joyeros artesanos trabajan un primer diseño en papel o renderizado 3D según la complejidad. Te presentamos opciones de material, gemas y acabado.</li>
  <li><strong>Aprobación y presupuesto cerrado</strong>: con el diseño finalizado, te damos un presupuesto detallado y un plazo realista (típicamente 3-6 semanas).</li>
  <li><strong>Fabricación artesanal</strong>: la pieza se fabrica en taller con técnicas tradicionales (cera perdida, microfusión, soldadura, engastado a mano). Cada pieza se controla individualmente.</li>
  <li><strong>Entrega y certificado</strong>: recibirás la joya con su estuche premium y certificado de autenticidad. Si incluye diamantes, también el certificado de gemología.</li>
</ol>

<h2>Qué hacemos a medida</h2>

<ul class="royo-brand-list">
  <li><strong>Anillos de compromiso</strong>: solitarios clásicos, halos, trilogías, anillos princesa, esmeraldas o zafiros centrales con diamantes laterales.</li>
  <li><strong>Alianzas de boda</strong>: lisas, talladas, con diamantes, en oro blanco/amarillo/rosa, con grabado interior personalizado (nombre, fecha, mensaje).</li>
  <li><strong>Colgantes con piedra de herencia</strong>: ¿tienes un brillante o esmeralda de tu abuela? Diseñamos un colgante o anillo nuevo respetando la piedra original.</li>
  <li><strong>Pendientes y pulseras</strong>: piezas únicas con motivos personales (iniciales, fechas, símbolos familiares).</li>
  <li><strong>Restauración y rediseño</strong>: piezas antiguas que se transforman en una joya contemporánea conservando el oro y las gemas originales.</li>
</ul>

<h2>Materiales y gemas</h2>

<p>Trabajamos exclusivamente con <strong>oro de 18 quilates</strong> (puede ser blanco, amarillo o rosa) y <strong>diamantes naturales con certificado GIA o HRD</strong> para piezas grandes. También esmeraldas Colombia, rubíes Birmania, zafiros Ceilán, topacios, aguamarinas, perlas Akoya y perlas Australia. Si lo prefieres, también platino y oro 14kt.</p>

<h2>Más de 50 años de oficio</h2>

<p>En <a href="/">Joyería Royo</a> hemos diseñado piezas a medida durante más de cinco décadas. Trabajamos con joyeros artesanos locales que conocen el oficio desde generaciones. Cada anillo, cada colgante, cada pulsera lleva el cuidado de la artesanía tradicional aplicada a un diseño contemporáneo.</p>

<h2>Ven a Joyería Royo</h2>

<p>
  <strong>Calle Tesifonte Gallego, 2 — 02002 Albacete</strong><br>
  Lunes a viernes: 10:00 — 13:30 y 17:00 — 20:30<br>
  Sábado: 10:00 — 13:30<br>
  Teléfono: <a href="tel:+34967217903">+34 967 21 79 03</a>
</p>

<p class="royo-page-cta">
  <a href="https://wa.me/34967217903?text=Hola%2C+me+gustar%C3%ADa+dise%C3%B1ar+una+joya+a+medida" target="_blank" rel="noopener" class="royo-btn-primary royo-btn-whatsapp">Empezar diseño por WhatsApp</a>
  <a href="/contacto-joyeria-royo-albacete/" class="royo-btn-secondary">Cómo llegar</a>
</p>
`.trim(),
  },
];

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

async function createPage(page) {
  const url = `${WP_BASE}/wp-json/wp/v2/pages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', 'User-Agent': PACAME_UA },
    body: JSON.stringify({
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt,
      status: 'publish',
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`page ${page.slug}: ${res.status} ${t.slice(0, 250)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('[init] Sprint 3N — crear pages servicios SEO local');
  let created = 0, errors = 0, skipped = 0;
  for (const page of PAGES) {
    try {
      // Verificar si ya existe
      const checkUrl = `${WP_BASE}/wp-json/wp/v2/pages?slug=${page.slug}&_fields=id,slug`;
      const check = await fetch(checkUrl);
      const existing = await check.json();
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`  [skip] ${page.slug} ya existe (id=${existing[0].id})`);
        skipped++;
        continue;
      }
      const result = await createPage(page);
      console.log(`  ✓ ${page.slug} created (id=${result.id})`);
      console.log(`    permalink: ${result.link}`);
      created++;
      await sleep(500);
    } catch (err) {
      console.error(`  ✗ ${page.slug}: ${err.message}`);
      errors++;
    }
  }
  const c = await callMu('/pacame/v1/cache/clear', {});
  console.log(`\n[done] created=${created} skipped=${skipped} errors=${errors} cache=${c.status}`);
  console.log('\nVerificar:');
  for (const page of PAGES) console.log(`  https://joyeriaroyo.com/${page.slug}/`);
})().catch(err => { console.error('FATAL:', err); process.exit(1); });
