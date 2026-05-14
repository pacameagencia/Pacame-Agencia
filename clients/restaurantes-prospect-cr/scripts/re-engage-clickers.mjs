#!/usr/bin/env node
/**
 * Re-engagement clickers: a los leads que clicaron al demo en las últimas
 * 24-72h Y no han contestado, envía un 2º email muy corto preguntando qué
 * les pareció.
 *
 * Reglas:
 * - first_clicked_at entre 24h y 7 días atrás (mínimo 24h para no agobiar)
 * - replied_at IS NULL (no contestaron aún)
 * - bounced_at IS NULL (no rebotó)
 * - status NOT IN ('replied','complained','unsubscribed','won','lost')
 * - re_engaged_at IS NULL (no se ha enviado 2º ya — mismo flag que re-engage.mjs)
 * - do_not_contact = false
 * - rate limit: max 5 leads por ejecución
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const localRequire = createRequire(resolve(here, 'package.json'));
const { Client } = localRequire('pg');

function loadEnv(p) {
  try {
    const raw = readFileSync(p, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv(resolve(here, '..', '.env'));

const RESEND_KEY = process.env.RESEND_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://demos.pacameagencia.com';
if (!RESEND_KEY || !DATABASE_URL) { console.error('Missing env'); process.exit(1); }

const FROM = 'PABLO <hola@pacameagencia.com>';
const REPLY_TO = 'responder@replies.pacameagencia.com';
const PABLO_WA = 'https://wa.me/34722669381';

// Subjects específicos para clickers
const CLICKER_SUBJECTS = [
  (name) => `Vi que entraste a ${name}`,
  (name) => `${name} — ¿qué te pareció?`,
  (name) => `Pequeña pregunta sobre ${name}`,
  (name) => `${name}: 1 minuto y te dejo en paz`,
  (name) => `Hablamos sobre ${name}?`,
];

const CLICKER_PREHEADERS = [
  () => `Vi que entraste a la demo. ¿Te encajó o paso?`,
  () => `Solo quería saber: sí o no. Si no, os borro al instante.`,
  () => `Sin agobiar, pero me da pena no saber qué te pareció.`,
  () => `Dos respuestas valen: \"sí, hablamos\" o \"no, gracias\". Ambas perfectas.`,
];

function hash(s) { let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return Math.abs(h); }
const pick = (slug, suffix, arr) => arr[hash(slug + suffix) % arr.length];

function buildClickerBody(lead, demoUrl) {
  const name = lead.name;
  const clickedDate = lead.first_clicked_at
    ? new Date(lead.first_clicked_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    : 'hace un par de días';

  const text = `Hola ${name},

Pablo aquí. Vi que entraste a la demo que os monté el ${clickedDate}.

¿Qué te pareció?

Si tienes 1 minuto, cuéntame:
  · "sí, hablamos" → te llamo o WhatsApp directo
  · "no, gracias" → os borro de la lista al instante

Las dos respuestas son perfectas. Lo importante es saber.

La demo sigue ahí:
   ${demoUrl}

Y si prefieres WhatsApp directo:
   ${PABLO_WA}

Saludos,
Pablo
PACAME · pacameagencia.com
+34 722 669 381`;

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const URL_PH = '@@@URL@@@';
  const WA_PH = '@@@WA@@@';
  const tokenized = text.split(demoUrl).join(URL_PH).split(PABLO_WA).join(WA_PH);
  const escaped = escape(tokenized);
  const html = escaped
    .split(/\n\n/g)
    .map((p) => p.trim() ? `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>` : '')
    .join('')
    .replace(/\bpacameagencia\.com\b/g, '<a href="https://pacameagencia.com" style="color:#666;">pacameagencia.com</a>')
    .split(URL_PH).join(`<a href="${demoUrl}" style="color:#c9181f;font-weight:600;text-decoration:underline;">${demoUrl}</a>`)
    .split(WA_PH).join(`<a href="${PABLO_WA}" style="color:#25d366;font-weight:600;">${PABLO_WA}</a>`);

  return { text, html };
}

const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();

// Buscar clickers candidatos
const r = await pg.query(`
  select id, slug, name, email, city, first_clicked_at, vercel_url
  from prospect_leads
  where first_clicked_at < now() - interval '24 hours'
    and first_clicked_at > now() - interval '7 days'
    and replied_at is null
    and bounced_at is null
    and complained_at is null
    and unsubscribed_at is null
    and (do_not_contact is null or do_not_contact = false)
    and re_engaged_at is null
    and status not in ('replied','won','lost','complained','bounced','unsubscribed')
  order by first_clicked_at asc
  limit 5
`);

console.log(`[re-engage-clickers] candidatos: ${r.rows.length}`);

let sent = 0;
for (const lead of r.rows) {
  try {
    const demoUrl = lead.vercel_url || `${PUBLIC_BASE_URL}/${lead.slug}`;
    const subject = pick(lead.slug, ':csubject', CLICKER_SUBJECTS)(lead.name);
    const preheader = pick(lead.slug, ':cpreheader', CLICKER_PREHEADERS)();
    const body = buildClickerBody(lead, demoUrl);

    const unsubMailto = `mailto:${REPLY_TO}?subject=Unsubscribe%20${encodeURIComponent(lead.email)}`;
    const trackerPixel = `<img src="https://demos.pacameagencia.com/t/${lead.slug}.gif" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px;" />`;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.65;color:#222;background:#f7f5f0;margin:0;padding:0;"><div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff;">${preheader}</div><div style="max-width:600px;margin:0 auto;padding:24px 20px;background:#fff;font-size:15px;">${body.html}</div>${trackerPixel}</body></html>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [lead.email], reply_to: REPLY_TO,
        subject, text: body.text, html,
        headers: {
          'List-Unsubscribe': `<${unsubMailto}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Entity-Ref-ID': `${lead.slug}-clickfollowup`,
          'Message-ID': `<${lead.slug}-clickfollowup-${Date.now()}@pacameagencia.com>`,
        },
        tags: [
          { name: 'campaign', value: 'restaurantes-spain-2026-05' },
          { name: 'lead_slug', value: lead.slug.slice(0, 50) },
          { name: 'sequence', value: 'clicker-followup' },
        ],
      }),
    });
    const data = await resp.json();
    if (!data.id) throw new Error('Resend: ' + (data.message || JSON.stringify(data)));

    await pg.query(`update prospect_leads set re_engaged_at = now() where id = $1`, [lead.id]);
    sent++;
    console.log(`[re-engage-clickers] ${lead.slug}: sent ${data.id.slice(0,8)} (subject: ${subject})`);
  } catch (e) {
    console.error(`[re-engage-clickers] ${lead.slug}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 2000));
}

console.log(`[re-engage-clickers] enviados: ${sent}/${r.rows.length}`);
await pg.end();
