#!/usr/bin/env node
/**
 * Worker JEWELRY: outreach a joyerías artesanas españolas pequeñas.
 * Misma arquitectura que worker.mjs (restaurantes) pero:
 *  - lee data/leads-jewelry-spain.json
 *  - usa generate-jewelry-demo.mjs + ecommerce-shopify-clone.html
 *  - inserta industry='jewelry', campaign='jewelry-spain-2026-05'
 *  - WORKER_ID prefix 'jewelry-' para separar heartbeat
 *  - filtra por do_not_contact + reply_received_at (compliance LSSI)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { hostname } from 'node:os';
import { resolveMx } from 'node:dns/promises';
import { createRequire } from 'node:module';
import { buildEmail, pickPalette, buildReviews } from './copy-variants-jewelry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '../..');

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
const RATE = Number(arg('rate', 4));
const HOURS = (arg('hours', '0-23')).split('-').map(Number);
const MAX = Number(arg('max', 0));
const DRY = !!arg('dry');

const SLEEP_MS = Math.round((3600 * 1000) / RATE);
const MIN_SLEEP = 30 * 1000;
const MAX_SLEEP = 30 * 60 * 1000;

console.log(`Worker JEWELRY started · rate=${RATE}/h · hours=${HOURS[0]}-${HOURS[1]} · max=${MAX || 'unlimited'} · dry=${DRY}`);
console.log(`  Sleep entre leads: ${Math.round(SLEEP_MS / 60000)} min`);

// === Env ===
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
const CAMPAIGN = 'jewelry-spain-2026-05';
const INDUSTRY = 'jewelry';
const WORKER_ID = `jewelry-${hostname()}-${process.pid}`;

// === Postgres ===
const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();
console.log(`  Worker ID: ${WORKER_ID}`);

let stopping = false;
const cleanup = async () => {
  if (stopping) return;
  stopping = true;
  console.log('\nStopping worker JEWELRY...');
  try {
    await pg.query("update worker_heartbeat set status='stopping', last_seen_at=now() where worker_id=$1", [WORKER_ID]);
    await pg.end();
  } catch {}
  process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// === Heartbeat ===
let _hbCount = 0, _hbErrors = 0;
async function heartbeat(updates = {}) {
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
await heartbeat({ status: 'starting' });
const heartbeatInterval = setInterval(async () => {
  try { await pg.query('update worker_heartbeat set last_seen_at = now() where worker_id = $1', [WORKER_ID]); } catch {}
}, 30_000);

// === MX validation ===
const MX_CACHE_PATH = resolve(root, 'data/mx-cache.json');
let mxCache = {};
try { mxCache = JSON.parse(readFileSync(MX_CACHE_PATH, 'utf8')); } catch {}
function saveMxCache() {
  try { writeFileSync(MX_CACHE_PATH, JSON.stringify(mxCache, null, 2)); } catch {}
}
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
async function isEmailValid(email) {
  if (!email || !EMAIL_REGEX.test(email)) return false;
  const domain = email.split('@')[1].toLowerCase();
  if (mxCache[domain] !== undefined) return mxCache[domain];
  try {
    const records = await resolveMx(domain);
    const ok = Array.isArray(records) && records.length > 0;
    mxCache[domain] = ok;
    saveMxCache();
    return ok;
  } catch {
    mxCache[domain] = false;
    saveMxCache();
    return false;
  }
}

// === Build config (jewelry-specific) ===
function buildConfig(lead) {
  const palette = pickPalette(lead.slug);
  const reviews = buildReviews(lead.slug);
  const products = (lead.products || []).slice(0, 12).map((p, i) => ({
    name: p.name,
    image: p.image_url || p.image,
    price: p.price_cents ? Math.round(p.price_cents / 100) : (49 + i * 18),
    priceCompare: p.price_cents ? Math.round((p.price_cents * 1.3) / 100) : null,
    material: p.material || 'Plata 925 · Hecho a mano',
    rating: (4.5 + (i % 5) / 10).toFixed(1),
    reviewCount: 12 + i * 7,
    lowStock: i < 3 ? (3 + i) : null,
    url: p.product_url || p.url,
  }));

  // Hero title según estilo
  let h1l1 = 'Joyería que', h1l2 = 'cuenta historias';
  if (lead.style === 'gold') { h1l1 = 'Oro,'; h1l2 = 'oficio y tiempo'; }
  else if (lead.style === 'silver') { h1l1 = 'Plata,'; h1l2 = 'forma y luz'; }
  else if (lead.style === 'bohemian') { h1l1 = 'Piezas con'; h1l2 = 'alma propia'; }

  return {
    slug: lead.slug,
    name: lead.name,
    city: lead.city || 'España',
    tagline: 'Joyería artesana hecha a mano',
    meta_desc: `${lead.name} — Joyería artesana de ${lead.city || 'España'}. Hecha a mano, con materiales nobles, diseños únicos.`,
    hero_title_line1: h1l1,
    hero_title_line2: h1l2,
    hero_subtitle: `Cada pieza de ${lead.name} está hecha a mano en ${lead.city || 'nuestro taller'}. Diseños únicos, materiales nobles, oficio que se nota desde el primer vistazo.`,
    hero_image: products[0]?.image || lead.hero_image || '',
    story_heading: `Detrás de ${lead.name}`,
    story_body: `${lead.name} nace de la pasión por el oficio joyero. Cada pieza pasa por nuestras manos antes de llegar a ti, con materiales seleccionados y diseños pensados para durar generaciones. No hacemos series infinitas: hacemos piezas que importan.`,
    palette,
    products,
    reviews,
  };
}

// === Email HTML ===
function emailFor(lead, url) {
  const v = buildEmail(lead, url);
  const text = `${v.greeting}

${v.opening}

${v.hook}

   ${url}

${v.photoNote}

Sobre el precio:

  • 290€ de alta única (tienda montada con vuestros productos, dominio propio, hosting, integración Stripe + Bizum, todo).
  • 49€/mes de mantenimiento (cambios de productos, fotos, ofertas, nuevas colecciones).

Si queréis algo más a medida (configurador de personalización, suscripción a la caja del mes, integración con TPV físico), escribidme por WhatsApp:

   ${PABLO_WA}

${v.closing}

${v.signoff}
PACAME · pacameagencia.com
+34 722 669 381

${v.postscript}`;

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const URL_PH = '@@@DEMO_URL@@@';
  const WA_PH = '@@@WA_URL@@@';
  const linkifiedUrl = `<a href="${url}" style="color:#b8893d;font-weight:600;text-decoration:underline;">${url}</a>`;
  const linkifiedWa = `<a href="${PABLO_WA}" style="color:#25d366;font-weight:600;">${PABLO_WA}</a>`;
  const tokenized = text.split(url).join(URL_PH).split(PABLO_WA).join(WA_PH);
  const escapedText = escape(tokenized);
  const html = escapedText
    .split(/\n\n/g)
    .map((p) => p.trim() ? `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>` : '')
    .join('')
    .replace(/\bpacameagencia\.com\b/g, '<a href="https://pacameagencia.com" style="color:#666;">pacameagencia.com</a>')
    .split(URL_PH).join(linkifiedUrl)
    .split(WA_PH).join(linkifiedWa);

  return {
    subject: v.subject,
    preheader: v.preheader,
    subjectIdx: v.subjectIdx,
    preheaderIdx: v.preheaderIdx,
    text,
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
    mkdirSync(resolve(root, 'data'), { recursive: true });
    writeFileSync(resolve(root, `data/${lead.slug}.json`), JSON.stringify(cfg, null, 2));
    execSync(`node "${resolve(root, 'scripts/generate-jewelry-demo.mjs')}" "${resolve(root, `data/${lead.slug}.json`)}"`, { stdio: 'pipe' });
    await pg.query(`update pipeline_runs set generate_completed_at=now() where id=$1`, [runId]);

    // 2. Deploy → escribe HTML al disco público VPS
    let url;
    if (DRY) {
      url = `${PUBLIC_BASE_URL}/${lead.slug}`;
    } else {
      await pg.query(`update pipeline_runs set step='deploying', deploy_started_at=now() where id=$1`, [runId]);
      const htmlSrc = resolve(root, `demos/${lead.slug}/index.html`);
      if (!existsSync(htmlSrc)) throw new Error(`HTML no encontrado: ${htmlSrc}`);
      const html = readFileSync(htmlSrc, 'utf8');
      const trackingSnippet = `<script>(function(){try{const slug=${JSON.stringify(lead.slug)};const url='${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/rest/v1/email_events';const key='${process.env.SUPABASE_ANON_KEY || ''}';if(!url||!key)return;fetch(url,{method:'POST',keepalive:true,headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({resend_message_id:new URLSearchParams(location.search).get('mid')||slug,event_type:'page.view',user_agent:navigator.userAgent,raw:{slug,industry:'jewelry'}})}).catch(()=>{});}catch(e){}})();</script>`;
      const htmlWithTracking = html.replace(/<\/body>/i, trackingSnippet + '</body>');
      const outDir = resolve(PUBLIC_HTML_ROOT, lead.slug);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'index.html'), htmlWithTracking);
      lead._renderedHtml = htmlWithTracking;
      lead._renderedConfig = cfg;
      url = `${PUBLIC_BASE_URL}/${lead.slug}`;
      await pg.query(`update pipeline_runs set deploy_completed_at=now(), vercel_url=$2 where id=$1`, [runId, url]);
    }

    // 3. Send email
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
            { name: 'campaign', value: CAMPAIGN },
            { name: 'industry', value: INDUSTRY },
            { name: 'lead_slug', value: lead.slug.slice(0, 50) },
          ],
        }),
      });
      const data = await r.json();
      if (!data.id) throw new Error('Resend: ' + (data.message || JSON.stringify(data)));
      messageId = data.id;
      await pg.query(`update pipeline_runs set send_completed_at=now(), resend_message_id=$2 where id=$1`, [runId, messageId]);
    }

    // 4. Sync prospect_leads
    await pg.query(`update pipeline_runs set step='syncing' where id=$1`, [runId]);
    const configPayload = JSON.stringify({
      html: lead._renderedHtml ? '(stored separately)' : null,
      cfg: lead._renderedConfig || null,
      generated_at: new Date().toISOString(),
    });
    await pg.query(`
      insert into prospect_leads (slug, name, email, city, type, industry, instagram_url, web_url, vercel_url, resend_message_id, sent_at, status, raw, config, subject_variant, preheader_variant, subject_text, preheader_text, campaign)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),'sent',$11,$12,$13,$14,$15,$16,$17)
      on conflict (slug) do update set
        vercel_url = excluded.vercel_url,
        resend_message_id = coalesce(prospect_leads.resend_message_id, excluded.resend_message_id),
        sent_at = coalesce(prospect_leads.sent_at, excluded.sent_at),
        status = case when prospect_leads.status = 'pending' then 'sent' else prospect_leads.status end,
        config = excluded.config,
        industry = excluded.industry,
        campaign = excluded.campaign,
        subject_variant = coalesce(prospect_leads.subject_variant, excluded.subject_variant),
        preheader_variant = coalesce(prospect_leads.preheader_variant, excluded.preheader_variant),
        subject_text = coalesce(prospect_leads.subject_text, excluded.subject_text),
        preheader_text = coalesce(prospect_leads.preheader_text, excluded.preheader_text),
        updated_at = now()
    `, [
      lead.slug, lead.name, lead.email.toLowerCase(), lead.city || null, 'jewelry',
      INDUSTRY, lead.instagram_url || null, lead.web_url || null,
      url, messageId, JSON.stringify(lead), configPayload,
      payload?.subjectIdx ?? null, payload?.preheaderIdx ?? null,
      payload?.subject ?? null, payload?.preheader ?? null, CAMPAIGN,
    ]);

    // Persistir productos en lead_products
    if (lead.products && lead.products.length > 0) {
      const leadIdRes = await pg.query('select id from prospect_leads where slug = $1', [lead.slug]);
      const leadId = leadIdRes.rows[0]?.id;
      if (leadId) {
        // Borrar previos para idempotencia
        await pg.query('delete from lead_products where lead_id = $1', [leadId]);
        for (let i = 0; i < lead.products.length; i++) {
          const p = lead.products[i];
          await pg.query(
            'insert into lead_products (lead_id, product_url, image_url, name, price_cents, position) values ($1, $2, $3, $4, $5, $6)',
            [leadId, p.product_url || p.url || null, p.image_url || p.image || null, p.name || null, p.price_cents || null, i]
          );
        }
      }
    }

    await pg.query(`update pipeline_runs set step='completed', completed_at=now() where id=$1`, [runId]);
    return { ok: true, url, messageId };
  } catch (e) {
    await pg.query(`update pipeline_runs set step='failed', completed_at=now(), error=$2 where id=$1`, [runId, e.message]);
    throw e;
  }
}

// === Get next pending lead ===
async function getNextPending() {
  const leadsPath = resolve(root, 'data/leads-jewelry-spain.json');
  if (!existsSync(leadsPath)) {
    console.warn('[worker] data/leads-jewelry-spain.json no existe — sin leads que procesar');
    return null;
  }
  const leads = JSON.parse(readFileSync(leadsPath, 'utf8'));

  // Excluir ya enviados o do_not_contact (de cualquier industry)
  const sentRes = await pg.query(`select lower(email) as email from prospect_leads where sent_at is not null or do_not_contact = true`);
  const sentSet = new Set(sentRes.rows.map((row) => row.email));

  // In-flight (cualquier worker)
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
    console.log('  [skip] ' + lead.slug + ' (' + lead.email + ') - dominio sin MX');
    await pg.query(
      "insert into prospect_leads (slug, name, email, status, bounced_at, bounce_reason, do_not_contact, do_not_contact_reason, industry, campaign) values ($1, $2, $3, 'bounced', now(), 'pre-send: dominio sin MX records', true, 'no MX', $4, $5) on conflict (slug) do update set status='bounced', bounce_reason='pre-send: dominio sin MX records', do_not_contact=true, do_not_contact_reason='no MX', industry=$4, campaign=$5",
      [lead.slug, lead.name, lead.email.toLowerCase(), INDUSTRY, CAMPAIGN]
    );
  }
  return null;
}

function inActiveHours() {
  const h = new Date().getHours();
  if (HOURS[0] <= HOURS[1]) return h >= HOURS[0] && h < HOURS[1];
  return h >= HOURS[0] || h < HOURS[1];
}

// === MAIN LOOP ===
let processed = 0, errors = 0;
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
    console.log(`[${new Date().toLocaleTimeString()}] No pending jewelry leads. Sleep 5 min.`);
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

  const jitter = SLEEP_MS * (0.85 + Math.random() * 0.3);
  const wait = Math.max(MIN_SLEEP, Math.min(MAX_SLEEP, jitter));
  console.log(`  Sleep ${Math.round(wait / 60000)} min hasta próximo lead`);
  await new Promise((r) => setTimeout(r, wait));
}

clearInterval(heartbeatInterval);
await cleanup();
