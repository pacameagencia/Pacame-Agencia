#!/usr/bin/env node
/**
 * Pipeline maestro: lee leads-spain-email.json → toma N siguientes pendientes →
 *   1. genera config JSON
 *   2. genera demo HTML (templates/restaurante-base.html)
 *   3. deploy a Vercel
 *   4. envía email via Resend
 *   5. loguea en data/send-log.json (append, idempotente)
 *
 * Uso:
 *   node scripts/pipeline.mjs                    # default cap=30
 *   node scripts/pipeline.mjs --cap=50           # 50 leads
 *   node scripts/pipeline.mjs --dry              # genera+deploy pero NO envía
 *   node scripts/pipeline.mjs --no-deploy --dry  # solo genera (test)
 *   node scripts/pipeline.mjs --resume           # excluye los ya enviados (default)
 *
 * Para correr daily: añadir a cron / GitHub Action.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { MENUS, pickMenu, pickHero, pickPalette } from './menus.mjs';
import { buildEmail, rotateMenu } from './copy-variants.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '../..');

// === Args ===
const args = process.argv.slice(2);
const arg = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : args.includes(`--${k}`) ? true : d;
};
const CAP = Number(arg('cap', 30));
const DRY = !!arg('dry');
const NO_DEPLOY = !!arg('no-deploy');
const NO_SEND = !!arg('no-send') || DRY;

// === Resend key ===
const env = readFileSync(resolve(repoRoot, 'web/.env.local'), 'utf8');
const RESEND_KEY = env.match(/RESEND_API_KEY=["']?([^"'\n]+)/)?.[1];
if (!RESEND_KEY && !NO_SEND) { console.error('No RESEND_API_KEY'); process.exit(1); }

const FROM = 'PACAME <hola@pacameagencia.com>';
const REPLY_TO = 'hola@pacameagencia.com';
const PABLO_WA = 'https://wa.me/34722669381';

// === Cargar leads + log ===
const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-spain-email.json'), 'utf8'));
let log = { at: new Date().toISOString(), runs: [], log: [] };
if (existsSync(resolve(root, 'data/send-log.json'))) {
  log = JSON.parse(readFileSync(resolve(root, 'data/send-log.json'), 'utf8'));
  if (!log.runs) log.runs = [];
  if (!log.log) log.log = [];
}
const sentEmails = new Set(log.log.filter((l) => l.result?.id || l.dry).map((l) => l.to.toLowerCase()));

// Pending = leads cuyo email aún no se envió
const pending = leads.filter((l) => !sentEmails.has(l.email.toLowerCase()));
const batch = pending.slice(0, CAP);
console.log(`Pipeline run: ${new Date().toISOString()}`);
console.log(`  Total leads España con email: ${leads.length}`);
console.log(`  Ya enviados (log): ${log.log.length}`);
console.log(`  Pendientes: ${pending.length}`);
console.log(`  Cap esta run: ${CAP}`);
console.log(`  Batch a procesar: ${batch.length}`);
console.log(`  Modo: ${DRY ? 'DRY' : NO_DEPLOY ? 'no-deploy' : NO_SEND ? 'no-send' : 'FULL'}`);
console.log('');
if (batch.length === 0) { console.log('Nada que hacer. Exit.'); process.exit(0); }

// === Helpers ===
function buildConfig(lead) {
  const menu = pickMenu(lead);
  const palette = pickPalette(lead.slug);
  const hero_image = pickHero(lead.slug);
  const isRegional = (lead.cuisine || '').toLowerCase().match(/regional|spanish|manchego|asturian|catalan|basque|gallego|valencian/);
  const isPub = lead.type === 'pub' || /beer|cerveza|brewery/i.test(lead.name);
  const isBrasa = /asador|brasa|grill|parrilla/i.test(lead.name);

  let eyebrow, h1l1, h1l2, sub, pillarHeading, pillars, bookingDesc;
  if (isPub) {
    eyebrow = `${lead.city || 'España'} · cervezas y cocina`;
    h1l1 = 'Cerveza,'; h1l2 = 'cocina y mesa larga';
    sub = `Cervezas seleccionadas, cocina honesta y buena compañía. ${lead.name}: el sitio donde se queda uno más rato del que pensaba.`;
    pillarHeading = 'Tres motivos para entrar';
    pillars = [
      { icon: '🍺', title: 'Cervezas con criterio', text: 'Selección rotativa de artesanas y clásicas internacionales. Te aconsejamos según lo que te apetece.' },
      { icon: '🍔', title: 'Cocina abierta', text: 'Burgers, raciones y bocados pensados para acompañar la cerveza. Producto fresco cada día.' },
      { icon: '🎶', title: 'Buen rollo', text: 'Música, partidos en pantalla y mesa larga. Sitio donde quedas con amigos sin agenda.' },
    ];
    bookingDesc = `Pásate cuando quieras o reserva grupo si vais varios. ${lead.name} abierto tarde-noche.`;
  } else if (isBrasa) {
    eyebrow = `${lead.city || 'España'} · asador a la brasa`;
    h1l1 = 'Brasa, leña'; h1l2 = 'y producto de aquí';
    sub = `Carnes maduras a la brasa, cordero asado y arroces lentos. ${lead.name}: cocina con tiempo, como toca.`;
    pillarHeading = 'Por qué la brasa importa';
    pillars = [
      { icon: '🔥', title: 'Brasa de leña', text: 'Sin atajos: carbón natural y mucho oficio. La diferencia se nota en el primer bocado.' },
      { icon: '🥩', title: 'Carne madura', text: 'Chuletón con maduración propia, cordero lechal y solomillo. Trazabilidad total.' },
      { icon: '🍷', title: 'Vino para acompañar', text: 'Bodega con tintos seleccionados. Pregunta y elegimos juntos.' },
    ];
    bookingDesc = 'Reserva mesa por teléfono o pásate. Para grupos, llámanos antes y te preparamos la sala.';
  } else if (isRegional || /mesón|meson|taberna|casa /i.test(lead.name)) {
    eyebrow = `${lead.city || 'España'} · cocina de toda la vida`;
    h1l1 = 'Cocina honesta'; h1l2 = 'de la tierra';
    sub = `Recetas de toda la vida, productos de la tierra y trato cercano. ${lead.name}: donde se come de verdad.`;
    pillarHeading = 'Tres motivos por los que vuelves';
    pillars = [
      { icon: '🌾', title: 'Producto local', text: 'Carnes, quesos y aceite de productores de la zona. Sabor real.' },
      { icon: '🍷', title: 'Vinos seleccionados', text: 'Bodega con denominaciones locales. Vino al vaso para que pruebes lo que quieras.' },
      { icon: '👨‍🍳', title: 'Cocina lenta', text: 'Recetas familiares. Sin atajos, sin salsas industriales. Tiempo y fuego lento.' },
    ];
    bookingDesc = 'Reserva por teléfono o pásate. Atendemos comidas, cenas y eventos privados.';
  } else {
    eyebrow = `${lead.city || 'España'} · cocina de mercado`;
    h1l1 = 'Cocina honesta'; h1l2 = 'producto fresco';
    sub = `${lead.name}: cocina de mercado con producto fresco diario. Recetas trabajadas, técnica sólida, sin pretensiones.`;
    pillarHeading = 'Lo que somos';
    pillars = [
      { icon: '🥗', title: 'Producto fresco', text: 'Mercado diario y proveedores locales. Carta que cambia con la temporada.' },
      { icon: '👩‍🍳', title: 'Cocina con criterio', text: 'Recetas trabajadas y mucho mimo en cada plato.' },
      { icon: '🤝', title: 'Trato cercano', text: 'Llevamos años haciendo amigos en la sala. Aquí no eres una mesa, eres alguien.' },
    ];
    bookingDesc = 'Llámanos o pásate sin compromiso. Para grupos y celebraciones, mejor con reserva previa.';
  }

  const phoneClean = (lead.phone || '+34 900 000 000').trim();
  const phoneDisplay = phoneClean.replace(/^\+34\s?/, '').trim() || '900 000 000';
  return {
    slug: lead.slug,
    name: lead.name,
    tagline: pillarHeading,
    meta_desc: `${lead.name} en ${lead.city || 'España'}. Reservas y carta digital`,
    phone: phoneClean,
    phone_display: phoneDisplay,
    address_short: lead.address || lead.city || 'España',
    address_full: lead.address || lead.city || 'España',
    city: lead.city || 'España',
    postal: lead.postal || '',
    rating: '4,5',
    review_count: '120',
    hero_image,
    font_display: palette.font,
    palette: { primary: palette.primary, dark: palette.dark, deep: palette.deep, cream: palette.cream, cream_warm: palette.cream_warm, accent: palette.accent, accent_bright: palette.accent_bright, accent_deep: palette.accent_deep, earth: palette.earth, text_muted: palette.text_muted },
    eyebrow, hero_title_line1: h1l1, hero_title_line2: h1l2, hero_subtitle: sub,
    pillar_eyebrow: 'Nuestra esencia', pillar_heading: pillarHeading, pillars,
    menu_heading: menu.menu_heading, tab1_label: menu.tab1_label, tab2_label: menu.tab2_label, tab3_label: menu.tab3_label,
    menu: rotateMenu(menu.menu, lead.slug),
    cuisine_label: lead.cuisine || 'Mediterránea',
    reviews_heading: 'Lo que dicen los clientes',
    reviews: [
      { stars: 5, text: 'Trato muy cercano y la comida bien hecha. Repetiremos seguro.', author: 'Juan M.', date: 'Hace 2 semanas' },
      { stars: 5, text: 'Sitio con buen ambiente, raciones generosas y precios honestos. Recomendable.', author: 'Carmen R.', date: 'Hace 1 mes' },
      { stars: 4, text: 'Cocina rica y atención personal. Volveremos.', author: 'Pedro G.', date: 'Hace 1 mes' },
    ],
    booking_heading: 'Reserva tu mesa<br>o llámanos directo',
    booking_desc: bookingDesc,
    hours: { days: 'Martes a domingo', midday: '13:00 - 16:00', dinner: '20:30 - 23:30' },
  };
}

function emailFor(lead, url) {
  const v = buildEmail(lead, url);
  const cityPara = v.cityMention ? `\n\n${v.cityMention}` : '';
  const text = `${v.greeting}

${v.opening}${cityPara}

${v.hook}

   ${url}

La he hecho con vuestros datos reales (nombre, dirección, teléfono, ciudad) y le he puesto una carta digital de ejemplo + reseñas para que veáis cómo quedaría todo. Lo que incluye:

• Hero grande con vuestro nombre y datos
• Carta digital navegable (ahorra cartón impreso)
• Reseñas Google integradas
• Botón reservar por WhatsApp directo
• Mapa para llegar
• Mobile-first (78% de la gente busca restaurante desde el móvil)

${v.photoNote}

Sobre el precio:

  • 390€ de alta única (web montada, dominio propio, hosting, fotos colocadas, todo).
  • 19€/mes de mantenimiento (cambios de carta, fotos, reseñas, retoques).

Si queréis algo más a medida (reservas con calendario, pedidos online, integración con TPV, diseño 100% custom), escribidme por WhatsApp y lo hablamos sin compromiso:

   ${PABLO_WA}

${v.closing}

${v.signoff}
PACAME · pacameagencia.com
+34 722 669 381

${v.postscript}`;

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linkifiedUrl = `<a href="${url}" style="color:#c9181f;font-weight:600;text-decoration:underline;">${url}</a>`;
  const linkifiedWa = `<a href="${PABLO_WA}" style="color:#25d366;font-weight:600;">${PABLO_WA}</a>`;
  const escapedText = escape(text);
  const html = escapedText
    .split(/\n\n/g)
    .map((p) => p.trim() ? `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>` : '')
    .join('')
    .replace(escape(url), linkifiedUrl)
    .replace(escape(PABLO_WA), linkifiedWa)
    .replace(/\bpacameagencia\.com\b/g, '<a href="https://pacameagencia.com" style="color:#666;">pacameagencia.com</a>');
  const fullHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head><body style="font-family:-apple-system,Segoe UI,Roboto,'Helvetica Neue',sans-serif;line-height:1.65;color:#222;background:#f7f5f0;margin:0;padding:0;"><div style="max-width:600px;margin:0 auto;padding:24px 20px;background:#fff;font-size:15px;">${html}</div></body></html>`;
  return { subject: v.subject, text, html: fullHtml };
}

async function deployVercel(slug) {
  const dir = resolve(root, `demos/${slug}`);
  if (!existsSync(dir)) throw new Error('demo dir no existe');
  // Crea vercel.json mínimo si no existe
  if (!existsSync(resolve(dir, 'vercel.json'))) {
    writeFileSync(resolve(dir, 'vercel.json'), JSON.stringify({ cleanUrls: true }, null, 2));
  }
  const result = spawnSync('vercel', ['deploy', '--prod', '--yes', '--name', slug.slice(0, 52)], {
    cwd: dir,
    encoding: 'utf8',
    shell: true,
    timeout: 120000,
  });
  const out = (result.stdout || '') + (result.stderr || '');
  const m = out.match(/https:\/\/[a-z0-9-]+\.vercel\.app/g);
  // El alias final lo saca de "Aliased: https://...vercel.app"
  const aliased = out.match(/Aliased:\s+(https:\/\/[a-z0-9-]+\.vercel\.app)/);
  return aliased ? aliased[1] : (m ? m[m.length - 1] : null);
}

async function sendEmail(to, lead, url) {
  const payload = emailFor(lead, url);
  // Headers anti-spam profesionales
  const unsubMailto = `mailto:${REPLY_TO}?subject=Unsubscribe%20${encodeURIComponent(lead.email)}`;
  const messageId = `<${lead.slug}-${Date.now()}@pacameagencia.com>`;
  const body = {
    from: FROM, to: [to], reply_to: REPLY_TO,
    subject: payload.subject,
    text: payload.text,  // plain text first
    html: payload.html,
    headers: {
      'List-Unsubscribe': `<${unsubMailto}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID': lead.slug,
      'X-Mailer': 'PACAME-Outreach/1.0',
      'Message-ID': messageId,
    },
    tags: [
      { name: 'campaign', value: 'restaurantes-spain-2026-05' },
      { name: 'lead_slug', value: lead.slug.slice(0, 50) },
      { name: 'lead_type', value: (lead.type || 'unknown').replace(/[^a-z0-9_-]/gi, '-').slice(0, 30) },
    ],
  };
  if (NO_SEND) return { dry: true };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, ...(await r.json()) };
}

// Throttle entre envíos: tono humano = 45-90s aleatorio (parece persona escribiendo)
function humanThrottle(slug) {
  const min = 45000, max = 90000;
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  const seeded = (Math.abs(h) % 100) / 100;
  return Math.round(min + (max - min) * seeded);
}

// === Run ===
const runStart = new Date().toISOString();
const runResults = [];

for (let i = 0; i < batch.length; i++) {
  const lead = batch[i];
  const idx = i + 1;
  process.stdout.write(`[${idx}/${batch.length}] ${lead.slug} (${lead.email}) ... `);
  try {
    // 1. Generate config + demo
    const cfg = buildConfig(lead);
    writeFileSync(resolve(root, `data/${lead.slug}.json`), JSON.stringify(cfg, null, 2));
    execSync(`node "${resolve(root, 'scripts/generate-demo.mjs')}" "${resolve(root, `data/${lead.slug}.json`)}"`, { stdio: 'pipe' });

    // 2. Deploy Vercel
    let url;
    if (NO_DEPLOY || DRY) {
      url = `https://${lead.slug}.vercel.app`;
    } else {
      url = await deployVercel(lead.slug);
      if (!url) throw new Error('deploy no devolvió URL');
    }

    // 3. Send email
    const sendResult = await sendEmail(lead.email, lead, url);

    runResults.push({ slug: lead.slug, to: lead.email, url, result: sendResult, dry: !!sendResult.dry });
    log.log.push({ slug: lead.slug, to: lead.email, url, result: sendResult, dry: !!sendResult.dry, at: new Date().toISOString() });
    process.stdout.write(`✓ ${url} ${sendResult.id ? '(' + sendResult.id.slice(0, 8) + ')' : '(dry)'}\n`);

    // Throttle humano: 45-90s entre envíos (seeded por slug, parece persona escribiendo)
    if (i < batch.length - 1 && !DRY) {
      const wait = humanThrottle(lead.slug);
      process.stdout.write(`   waiting ${Math.round(wait/1000)}s...\n`);
      await new Promise((r) => setTimeout(r, wait));
    }
  } catch (e) {
    process.stdout.write(`✗ ${e.message}\n`);
    runResults.push({ slug: lead.slug, to: lead.email, error: e.message });
    log.log.push({ slug: lead.slug, to: lead.email, error: e.message, at: new Date().toISOString() });
  }
  // Save log incremental cada lead
  log.runs.push({ at: runStart, batch_size: batch.length });
  log.runs = log.runs.slice(-20);
  log.at = new Date().toISOString();
  writeFileSync(resolve(root, 'data/send-log.json'), JSON.stringify(log, null, 2));
}

console.log('');
console.log(`Done. ${runResults.filter((r) => r.url && !r.error).length}/${runResults.length} OK.`);
console.log(`Log → data/send-log.json (${log.log.length} total)`);
const remaining = pending.length - batch.length;
console.log(`Quedan ${remaining} pendientes. Próxima ejecución: \`node scripts/pipeline.mjs --cap=${CAP}\``);

// Auto-sync a Supabase (idempotente)
try {
  console.log('');
  console.log('Sync to Supabase...');
  execSync(`node "${resolve(here, 'sync-to-supabase.mjs')}"`, { stdio: 'inherit' });
} catch (e) {
  console.log('Sync skipped:', e.message);
}
