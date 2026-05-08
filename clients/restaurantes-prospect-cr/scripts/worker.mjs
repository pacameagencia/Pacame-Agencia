#!/usr/bin/env node
/**
 * Worker continuo: procesa leads sin parar, escribe state en Supabase
 * para que el dashboard vea qué web se está construyendo ahora mismo.
 *
 * Uso:
 *   node scripts/worker.mjs                # default 6 leads/hora (~144/día — ojo Resend free 100/día)
 *   node scripts/worker.mjs --rate=4       # 4 leads/hora = 96/día (free tier safe)
 *   node scripts/worker.mjs --rate=10      # 10 leads/hora = 240/día (requiere Resend Pro)
 *   node scripts/worker.mjs --hours=8-22   # solo durante esas horas (warm-up natural)
 *   node scripts/worker.mjs --max=50       # parar tras procesar 50 (para test)
 *
 * Stop:
 *   Ctrl+C (limpia heartbeat) o kill el proceso.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { hostname } from 'node:os';
import { resolveMx } from 'node:dns/promises';
import { createConnection } from 'node:net';
import { createRequire } from 'node:module';
import { MENUS, pickMenu, pickHero, pickPalette } from './menus.mjs';
import { buildEmail, rotateMenu } from './copy-variants.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '../..');
// pg se resuelve primero desde la carpeta del worker (caso VPS standalone),
// si no, desde web/ (caso dev local en repo).
let Client;
try {
  const localRequire = createRequire(resolve(root, 'package.json'));
  ({ Client } = localRequire('pg'));
} catch {
  const webRequire = createRequire(resolve(repoRoot, 'web/package.json'));
  ({ Client } = webRequire('pg'));
}

// === Args ===
const args = process.argv.slice(2);
const arg = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : args.includes(`--${k}`) ? true : d;
};
const RATE = Number(arg('rate', 4));            // leads/hora
const HOURS = (arg('hours', '0-23')).split('-').map(Number); // [start, end]
const MAX = Number(arg('max', 0));               // 0 = infinito
const DRY = !!arg('dry');

const SLEEP_MS = Math.round((3600 * 1000) / RATE);  // sleep entre leads para distribuir
const MIN_SLEEP = 30 * 1000;
const MAX_SLEEP = 30 * 60 * 1000;

console.log(`Worker started · rate=${RATE}/h · hours=${HOURS[0]}-${HOURS[1]} · max=${MAX || 'unlimited'} · dry=${DRY}`);
console.log(`  Sleep entre leads: ${Math.round(SLEEP_MS / 60000)} min`);

// === Env ===
// Prioriza variables del entorno (caso VPS+pm2). Si no, intenta web/.env.local (caso dev).
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvFile(resolve(root, '.env'));
loadEnvFile(resolve(repoRoot, 'web/.env.local'));
const RESEND_KEY = process.env.RESEND_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
if (!RESEND_KEY && !DRY) { console.error('No RESEND_API_KEY'); process.exit(1); }
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const FROM = 'PACAME <hola@pacameagencia.com>';
const REPLY_TO = 'responder@replies.pacameagencia.com';
const PABLO_WA = 'https://wa.me/34722669381';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://demos.pacameagencia.com';
const PUBLIC_HTML_ROOT = process.env.PUBLIC_HTML_ROOT || '/var/www/demos';
const WORKER_ID = `${hostname()}-${process.pid}`;

// === Supabase pg client (single, long-lived) ===
const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();
console.log(`  Worker ID: ${WORKER_ID}`);

// === Cleanup en shutdown ===
let stopping = false;
const cleanup = async () => {
  if (stopping) return;
  stopping = true;
  console.log('\nStopping worker...');
  try {
    await pg.query("update worker_heartbeat set status='stopping', last_seen_at=now() where worker_id=$1", [WORKER_ID]);
    await pg.end();
  } catch {}
  process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// === Heartbeat ===
let _hbCount = 0;
let _hbErrors = 0;
async function heartbeat(updates = {}) {
  // Upsert simple usando JSONB merge — más robusto que SQL dinámico.
  // Aplica defaults sensatos.
  const status = updates.status || 'working';
  const currentLead = 'current_lead' in updates ? updates.current_lead : null;
  const nextRunAt = updates.next_run_at || null;
  const totalProcessed = updates.total_processed ?? _hbCount;
  const errorsCount = updates.errors ?? _hbErrors;
  if (typeof updates.total_processed === 'number') _hbCount = updates.total_processed;
  if (typeof updates.errors === 'number') _hbErrors = updates.errors;

  try {
    await pg.query(`
      insert into worker_heartbeat (worker_id, hostname, pid, status, current_lead, next_run_at, total_processed, errors, last_seen_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8, now())
      on conflict (worker_id) do update set
        status = excluded.status,
        current_lead = excluded.current_lead,
        next_run_at = excluded.next_run_at,
        total_processed = excluded.total_processed,
        errors = excluded.errors,
        last_seen_at = now()
    `, [WORKER_ID, hostname(), process.pid, status, currentLead, nextRunAt, totalProcessed, errorsCount]);
  } catch (e) {
    console.warn('[heartbeat]', e.message);
  }
}

// Heartbeat inicial para que aparezca en dashboard al instante
await heartbeat({ status: 'starting' });

// Heartbeat periódico (solo updates last_seen_at, no toca el resto)
const heartbeatInterval = setInterval(async () => {
  try {
    await pg.query('update worker_heartbeat set last_seen_at = now() where worker_id = $1', [WORKER_ID]);
  } catch {}
}, 30_000);

// === Build config (igual que pipeline.mjs) ===
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
    slug: lead.slug, name: lead.name, tagline: pillarHeading,
    meta_desc: `${lead.name} en ${lead.city || 'España'}. Reservas y carta digital`,
    phone: phoneClean, phone_display: phoneDisplay,
    address_short: lead.address || lead.city || 'España',
    address_full: lead.address || lead.city || 'España',
    city: lead.city || 'España', postal: lead.postal || '',
    rating: '4,5', review_count: '120', hero_image, font_display: palette.font,
    palette: { primary: palette.primary, dark: palette.dark, deep: palette.deep, cream: palette.cream, cream_warm: palette.cream_warm, accent: palette.accent, accent_bright: palette.accent_bright, accent_deep: palette.accent_deep, earth: palette.earth, text_muted: palette.text_muted },
    eyebrow, hero_title_line1: h1l1, hero_title_line2: h1l2, hero_subtitle: sub,
    pillar_eyebrow: 'Nuestra esencia', pillar_heading: pillarHeading, pillars,
    menu_heading: menu.menu_heading, tab1_label: menu.tab1_label, tab2_label: menu.tab2_label, tab3_label: menu.tab3_label,
    menu: rotateMenu(menu.menu, lead.slug), cuisine_label: lead.cuisine || 'Mediterránea',
    reviews_heading: 'Lo que dicen los clientes',
    reviews: [
      { stars: 5, text: 'Trato muy cercano y la comida bien hecha. Repetiremos seguro.', author: 'Juan M.', date: 'Hace 2 semanas' },
      { stars: 5, text: 'Sitio con buen ambiente, raciones generosas y precios honestos. Recomendable.', author: 'Carmen R.', date: 'Hace 1 mes' },
      { stars: 4, text: 'Cocina rica y atención personal. Volveremos.', author: 'Pedro G.', date: 'Hace 1 mes' },
    ],
    booking_heading: 'Reserva tu mesa<br>o llámanos directo', booking_desc: bookingDesc,
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
  // Placeholders únicos para preservar URLs durante el linkify (evita doble-anchor)
  const URL_PH = '@@@DEMO_URL@@@';
  const WA_PH = '@@@WA_URL@@@';
  const linkifiedUrl = `<a href="${url}" style="color:#c9181f;font-weight:600;text-decoration:underline;">${url}</a>`;
  const linkifiedWa = `<a href="${PABLO_WA}" style="color:#25d366;font-weight:600;">${PABLO_WA}</a>`;
  // 1. Sustituye URLs por placeholders en el texto antes de escapar
  const tokenized = text.split(url).join(URL_PH).split(PABLO_WA).join(WA_PH);
  const escapedText = escape(tokenized);
  // 2. Construye párrafos
  const html = escapedText
    .split(/\n\n/g)
    .map((p) => p.trim() ? `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>` : '')
    .join('')
    // 3. Linkify pacameagencia.com (footer texto plano), antes de meter URLs reales
    .replace(/\bpacameagencia\.com\b/g, '<a href="https://pacameagencia.com" style="color:#666;">pacameagencia.com</a>')
    // 4. Restaura las URLs ya como anchor completo (no las toca el step anterior)
    .split(URL_PH).join(linkifiedUrl)
    .split(WA_PH).join(linkifiedWa);
  return {
    subject: v.subject, preheader: v.preheader, subjectIdx: v.subjectIdx, preheaderIdx: v.preheaderIdx, text,
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.65;color:#222;background:#f7f5f0;margin:0;padding:0;"><div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff;">${v.preheader}</div><div style="max-width:600px;margin:0 auto;padding:24px 20px;background:#fff;font-size:15px;">${html}</div></body></html>`,
  };
}

// === Process one lead ===
async function processLead(lead) {
  const runRes = await pg.query(
    `insert into pipeline_runs (lead_slug, lead_email, lead_name, lead_city, step, worker_id) values ($1,$2,$3,$4,'queued',$5) returning id`,
    [lead.slug, lead.email, lead.name, lead.city || null, WORKER_ID]
  );
  const runId = runRes.rows[0].id;

  await heartbeat({ status: 'working', current_lead: lead.slug });

  try {
    // 1. Generate
    await pg.query(`update pipeline_runs set step='generating', generate_started_at=now() where id=$1`, [runId]);
    const cfg = buildConfig(lead);
    writeFileSync(resolve(root, `data/${lead.slug}.json`), JSON.stringify(cfg, null, 2));
    execSync(`node "${resolve(root, 'scripts/generate-demo.mjs')}" "${resolve(root, `data/${lead.slug}.json`)}"`, { stdio: 'pipe' });
    await pg.query(`update pipeline_runs set generate_completed_at=now() where id=$1`, [runId]);

    // 2. Deploy → Plan B: NO Vercel. Guardamos HTML al disco del VPS (servido
    //    por nginx desde demos.pacameagencia.com) Y a Supabase como respaldo.
    let url;
    if (DRY) {
      url = `${PUBLIC_BASE_URL}/${lead.slug}`;
    } else {
      await pg.query(`update pipeline_runs set step='deploying', deploy_started_at=now() where id=$1`, [runId]);
      const htmlSrc = resolve(root, `demos/${lead.slug}/index.html`);
      if (!existsSync(htmlSrc)) throw new Error(`HTML no encontrado: ${htmlSrc}`);
      const html = readFileSync(htmlSrc, 'utf8');
      // Inyecta tracking pixel + beacon page.view antes de </body>
      const trackingSnippet = `<script>(function(){try{const slug=${JSON.stringify(lead.slug)};const url='${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/rest/v1/email_events';const key='${process.env.SUPABASE_ANON_KEY || ''}';if(!url||!key)return;fetch(url,{method:'POST',keepalive:true,headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({resend_message_id:new URLSearchParams(location.search).get('mid')||slug,event_type:'page.view',user_agent:navigator.userAgent,raw:{slug,referrer:document.referrer}})}).catch(()=>{});}catch(e){}})();</script>`;
      const htmlWithTracking = html.replace(/<\/body>/i, trackingSnippet + '</body>');
      // Escribir al disco público (servido por nginx)
      const outDir = resolve(PUBLIC_HTML_ROOT, lead.slug);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'index.html'), htmlWithTracking);
      lead._renderedHtml = htmlWithTracking;
      lead._renderedConfig = cfg;
      url = `${PUBLIC_BASE_URL}/${lead.slug}`;
      await pg.query(`update pipeline_runs set deploy_completed_at=now(), vercel_url=$2 where id=$1`, [runId, url]);
    }

    // 3. Send
    let messageId = null;
    let payload = null;
    if (!DRY) {
      await pg.query(`update pipeline_runs set step='sending', send_started_at=now() where id=$1`, [runId]);
      payload = emailFor(lead, url);
      const unsubMailto = `mailto:${REPLY_TO}?subject=Unsubscribe%20${encodeURIComponent(lead.email)}`;
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [lead.email], reply_to: REPLY_TO,
          subject: payload.subject, text: payload.text, html: payload.html,
          headers: {
            'List-Unsubscribe': `<${unsubMailto}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Entity-Ref-ID': lead.slug, 'X-Mailer': 'PACAME-Outreach/1.0',
            'Message-ID': `<${lead.slug}-${Date.now()}@pacameagencia.com>`,
          },
          tags: [
            { name: 'campaign', value: 'restaurantes-spain-2026-05' },
            { name: 'lead_slug', value: lead.slug.slice(0, 50) },
            { name: 'lead_type', value: (lead.type || 'unknown').replace(/[^a-z0-9_-]/gi, '-').slice(0, 30) },
          ],
        }),
      });
      const data = await r.json();
      if (!data.id) throw new Error('Resend: ' + (data.message || JSON.stringify(data)));
      messageId = data.id;
      await pg.query(`update pipeline_runs set send_completed_at=now(), resend_message_id=$2 where id=$1`, [runId, messageId]);
    }

    // 4. Sync prospect_leads (incluye config jsonb con HTML pre-renderizado)
    await pg.query(`update pipeline_runs set step='syncing' where id=$1`, [runId]);
    const configPayload = JSON.stringify({
      html: lead._renderedHtml || null,
      cfg: lead._renderedConfig || null,
      generated_at: new Date().toISOString(),
    });
    await pg.query(`
      insert into prospect_leads (slug, name, email, city, type, cuisine, phone, postal, vercel_url, resend_message_id, sent_at, status, raw, config, subject_variant, preheader_variant, subject_text, preheader_text)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),'sent',$11,$12,$13,$14,$15,$16)
      on conflict (slug) do update set
        vercel_url = excluded.vercel_url,
        resend_message_id = coalesce(prospect_leads.resend_message_id, excluded.resend_message_id),
        sent_at = coalesce(prospect_leads.sent_at, excluded.sent_at),
        status = case when prospect_leads.status = 'pending' then 'sent' else prospect_leads.status end,
        config = excluded.config,
        subject_variant = coalesce(prospect_leads.subject_variant, excluded.subject_variant),
        preheader_variant = coalesce(prospect_leads.preheader_variant, excluded.preheader_variant),
        subject_text = coalesce(prospect_leads.subject_text, excluded.subject_text),
        preheader_text = coalesce(prospect_leads.preheader_text, excluded.preheader_text),
        updated_at = now()
    `, [lead.slug, lead.name, lead.email.toLowerCase(), lead.city || null, lead.type || null, lead.cuisine || null, lead.phone || null, lead.postal || null, url, messageId, JSON.stringify(lead), configPayload,
        payload?.subjectIdx ?? null, payload?.preheaderIdx ?? null, payload?.subject ?? null, payload?.preheader ?? null]);

    await pg.query(`update pipeline_runs set step='completed', completed_at=now() where id=$1`, [runId]);
    return { ok: true, url, messageId };
  } catch (e) {
    await pg.query(`update pipeline_runs set step='failed', completed_at=now(), error=$2 where id=$1`, [runId, e.message]);
    throw e;
  }
}


// === Email validation: regex + MX cache ===
const MX_CACHE_PATH = resolve(root, 'data/mx-cache.json');
let mxCache = {};
try { mxCache = JSON.parse(readFileSync(MX_CACHE_PATH, 'utf8')); } catch {}
function saveMxCache() {
  try { writeFileSync(MX_CACHE_PATH, JSON.stringify(mxCache, null, 2)); } catch {}
}
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// SMTP_CHECK_CACHE: pre-flight RCPT TO results por email
const SMTP_CACHE_PATH = resolve(root, 'data/smtp-cache.json');
let smtpCache = {};
try { smtpCache = JSON.parse(readFileSync(SMTP_CACHE_PATH, 'utf8')); } catch {}
function saveSmtpCache() {
  try { writeFileSync(SMTP_CACHE_PATH, JSON.stringify(smtpCache, null, 2)); } catch {}
}

// Pre-flight SMTP RCPT check: conecta al servidor del receptor y pregunta si existe el buzon
// SIN enviar email. Reduce bounces masivamente.
async function smtpRcptCheck(email, mxRecords, timeoutMs = 8000) {
  const cached = smtpCache[email.toLowerCase()];
  if (cached !== undefined) return cached;
  if (!mxRecords || mxRecords.length === 0) return false;

  // Probar el MX de menor priority (mas usado primero)
  const sorted = [...mxRecords].sort((a, b) => (a.priority || 10) - (b.priority || 10));
  const mxHost = sorted[0].exchange;

  return new Promise((resolve) => {
    const sock = createConnection({ host: mxHost, port: 25, family: 4 });
    let stage = 0; // 0=banner 1=helo 2=mailfrom 3=rcptto 4=quit
    let result = null;
    const finish = (ok) => {
      if (result !== null) return;
      result = ok;
      smtpCache[email.toLowerCase()] = ok;
      saveSmtpCache();
      try { sock.write('QUIT\r\n'); } catch {}
      try { sock.end(); } catch {}
      try { sock.destroy(); } catch {}
      resolve(ok);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);

    sock.setEncoding('utf8');
    let buffer = '';
    sock.on('data', (chunk) => {
      buffer += chunk;
      // Esperar response completo (linea termina con codigo + space)
      const lines = buffer.split(/\r?\n/);
      const lastFull = lines.findLast?.((l) => /^\d{3} /.test(l));
      if (!lastFull) return;
      const code = parseInt(lastFull.slice(0, 3), 10);
      buffer = '';
      try {
        if (stage === 0) {
          if (code !== 220) return finish(null);
          sock.write('HELO pacameagencia.com\r\n');
          stage = 1;
        } else if (stage === 1) {
          if (code !== 250) return finish(null);
          sock.write('MAIL FROM:<verify@pacameagencia.com>\r\n');
          stage = 2;
        } else if (stage === 2) {
          if (code !== 250) return finish(null);
          sock.write('RCPT TO:<' + email + '>\r\n');
          stage = 3;
        } else if (stage === 3) {
          // 250 = ok, 251 = forwarded ok
          // 550, 551, 553 = mailbox no existe
          // 450, 452 = temp failure (asumimos OK, mejor no descartar)
          // 421 = greylisting, asumir OK
          clearTimeout(timer);
          if (code === 250 || code === 251) return finish(true);
          if (code === 450 || code === 452 || code === 421) return finish(true); // temp = optimista
          if (code >= 500 && code < 600) return finish(false);
          return finish(null);
        }
      } catch (e) {
        return finish(null);
      }
    });
    sock.on('error', () => finish(null));
    sock.on('close', () => { if (result === null) finish(null); });
  });
}

async function isEmailValid(email) {
  if (!email || !EMAIL_REGEX.test(email)) return false;
  const domain = email.split('@')[1].toLowerCase();

  // 1. MX check (cached)
  let records;
  if (mxCache[domain]) {
    // dominio en cache como ok pero no tenemos los records, los re-resuelvemos para SMTP check
    try { records = await resolveMx(domain); } catch { records = null; }
  } else if (mxCache[domain] === false) {
    return false;
  } else {
    try {
      records = await resolveMx(domain);
      const ok = Array.isArray(records) && records.length > 0;
      mxCache[domain] = ok;
      saveMxCache();
      if (!ok) return false;
    } catch {
      mxCache[domain] = false;
      saveMxCache();
      return false;
    }
  }

  // 2. SMTP RCPT TO check (cached por email)
  // Si null = no concluyente, asumimos OK (mejor enviar a quizas-vivo que descartar todos los lentos)
  // Si false explicito = mailbox no existe, descartar.
  // Si true = mailbox existe, enviar.
  const smtpResult = await smtpRcptCheck(email, records);
  if (smtpResult === false) return false;
  return true;
}

// === Get next pending lead ===
async function getNextPending() {
  const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-spain-email.json'), 'utf8'));
  // Excluir los ya enviados según DB
  const sentRes = await pg.query(`select lower(email) as email from prospect_leads where sent_at is not null or do_not_contact = true`);
  const sentSet = new Set(sentRes.rows.map((row) => row.email));
  // Excluir los enviados según log local (cubre runs en progreso del pipeline.mjs antiguo
  // que aún no han sincronizado a DB)
  try {
    const localLog = JSON.parse(readFileSync(resolve(root, 'data/send-log.json'), 'utf8'));
    localLog.log.forEach((l) => l.to && sentSet.add(l.to.toLowerCase()));
  } catch {
    /* log puede no existir aún */
  }
  // Excluir los actualmente in-flight por otro worker (ventana 15 min)
  const inFlightRes = await pg.query(`select lead_slug from pipeline_runs where step in ('queued','generating','deploying','sending','syncing') and started_at > now() - interval '15 minutes'`);
  const inFlightSet = new Set(inFlightRes.rows.map((r) => r.lead_slug));
  // SAFEGUARD: cargar lista negra absoluta de protected_contacts
  const protectedRes = await pg.query('select lower(email) as email from protected_contacts');
  const protectedSet = new Set(protectedRes.rows.map((r) => r.email));

  // SAFEGUARD: detector Albacete (ningun lead de Albacete jamas)
  const isAlbacete = (l) => {
    const t = ((l.city || '') + ' ' + (l.address || '') + ' ' + (l.province || '')).toLowerCase();
    return /\balbacete\b/.test(t) || /\b02[0-9]{3}\b/.test(l.postal || '');
  };

  // SAFEGUARD: detector emails genericos (info@, contacto@, no-reply@) - skip por baja calidad
  const isGenericEmail = (email) => {
    const local = (email || '').toLowerCase().split('@')[0];
    return ['info', 'contacto', 'no-reply', 'noreply', 'admin', 'webmaster', 'support', 'soporte', 'sales', 'ventas', 'marketing', 'hello', 'hola', 'contact'].includes(local);
  };

  const candidates = leads.filter((l) => {
    const email = (l.email || '').toLowerCase();
    if (sentSet.has(email)) return false;
    if (inFlightSet.has(l.slug)) return false;
    if (protectedSet.has(email)) {
      console.log('  [BLOCKED-PROTECTED] ' + l.slug + ' (' + email + ') - en protected_contacts');
      return false;
    }
    if (isAlbacete(l)) {
      console.log('  [BLOCKED-ALBACETE] ' + l.slug + ' (' + l.city + ')');
      return false;
    }
    if (isGenericEmail(email)) {
      console.log('  [BLOCKED-GENERIC] ' + l.slug + ' (' + email + ') - email generico');
      return false;
    }
    return true;
  });
  for (const lead of candidates) {
    const ok = await isEmailValid(lead.email);
    if (ok) return lead;
    // Email inválido: marcar en DB como bounced para no reintentar
    console.log('  [skip] ' + lead.slug + ' (' + lead.email + ') - email no valido (MX/SMTP check)');
    await pg.query("insert into prospect_leads (slug, name, email, status, bounced_at, bounce_reason, do_not_contact, do_not_contact_reason) values ($1, $2, $3, 'bounced', now(), 'pre-send: email validation failed (MX/SMTP)', true, 'pre-flight check failed') on conflict (slug) do update set status='bounced', bounce_reason='pre-send: email validation failed (MX/SMTP)', do_not_contact=true, do_not_contact_reason='pre-flight check failed'", [lead.slug, lead.name, lead.email.toLowerCase()]);
  }
  return null;
}

// === Within active hours? ===
function inActiveHours() {
  const h = new Date().getHours();
  if (HOURS[0] <= HOURS[1]) return h >= HOURS[0] && h < HOURS[1];
  return h >= HOURS[0] || h < HOURS[1];
}

// === MAIN LOOP ===
let processed = 0;
let errors = 0;
console.log('');
while (!stopping) {
  if (!inActiveHours()) {
    const next = new Date();
    next.setHours(HOURS[0], 0, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    await heartbeat({ status: 'sleeping', next_run_at: next.toISOString(), current_lead: null });
    const ms = next - new Date();
    console.log(`[${new Date().toLocaleTimeString()}] Out of hours, sleeping until ${next.toISOString()} (${Math.round(ms/60000)} min)`);
    await new Promise((r) => setTimeout(r, Math.min(ms, 30 * 60 * 1000)));
    continue;
  }

  const lead = await getNextPending();
  if (!lead) {
    await heartbeat({ status: 'idle', current_lead: null, next_run_at: new Date(Date.now() + 5 * 60_000).toISOString() });
    console.log(`[${new Date().toLocaleTimeString()}] No pending leads. Sleep 5 min.`);
    await new Promise((r) => setTimeout(r, 5 * 60_000));
    continue;
  }

  console.log(`[${new Date().toLocaleTimeString()}] Processing ${lead.slug} (${lead.email})`);
  try {
    const r = await processLead(lead);
    processed++;
    console.log(`  ✓ ${r.url} ${r.messageId ? '(' + r.messageId.slice(0, 8) + ')' : '(dry)'}`);
  } catch (e) {
    errors++;
    console.log(`  ✗ ${e.message}`);
  }
  await heartbeat({ status: 'sleeping', current_lead: null, total_processed: processed, errors, next_run_at: new Date(Date.now() + SLEEP_MS).toISOString() });

  if (MAX > 0 && processed >= MAX) {
    console.log(`Reached max=${MAX}. Stopping.`);
    break;
  }

  // Throttle entre leads (jitter ±15%)
  const jitter = SLEEP_MS * (0.85 + Math.random() * 0.3);
  const wait = Math.max(MIN_SLEEP, Math.min(MAX_SLEEP, jitter));
  console.log(`  Sleep ${Math.round(wait / 60000)} min hasta próximo lead`);
  await new Promise((r) => setTimeout(r, wait));
}

clearInterval(heartbeatInterval);
await cleanup();
