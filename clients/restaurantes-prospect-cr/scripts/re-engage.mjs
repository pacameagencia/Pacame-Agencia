#!/usr/bin/env node
/**
 * Re-engagement automático: a los leads que no han abierto en 48-72h, envía
 * un 2º email con asunto y copy alternativos. Lo corre cron cada hora.
 *
 * Reglas:
 * - sent_at entre 48h y 7 días atrás
 * - first_opened_at IS NULL (no abrieron)
 * - bounced_at IS NULL (no rebotó)
 * - status NOT IN ('replied','complained','unsubscribed','won')
 * - re_engaged_at IS NULL (no se ha enviado 2º ya)
 * - rate limit: max 5 leads por ejecución (para no spammear)
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
const REPLY_TO = 'hola@pacameagencia.com';
const PABLO_WA = 'https://wa.me/34722669381';

// Subjects para 2º envío: más cortos, más directos, con curiosity gap fuerte
const FOLLOWUP_SUBJECTS = [
  (n) => `${n}: ¿la viste?`,
  (n) => `Última, lo prometo — ${n}`,
  (n) => `${n}, te queda 1 minuto?`,
  (n) => `Solo por si se quedó sin abrir, ${n}`,
  (n) => `${n} — la web, por si acaso`,
  (n) => `Re: ${n} — me queda esto por intentar`,
];

const FOLLOWUP_PREHEADERS = [
  () => `Por si el primer email se quedó en la marea. 30 segundos, prometido.`,
  () => `Si no os interesa, lo entiendo perfectamente. Solo quería que la vierais.`,
  () => `Dos opciones: la abrís y os gusta. La abrís y no. Las dos están bien.`,
  () => `Tu email del lunes. Sigue ahí. Te dejo el link otra vez.`,
];

function hash(s) { let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return Math.abs(h); }
const pick = (slug, suffix, arr) => arr[hash(slug + suffix) % arr.length];

function buildFollowupBody(lead, url) {
  const name = lead.name;
  const text = `Hola otra vez, ${name}.

Solo escribo por si el primer email se quedó perdido entre los demás (a mí me pasa todo el rato).

La web que os hice sigue ahí, sin compromiso:

   ${url}

Es 30 segundos verla. Si os mola, hablamos. Si no, lo borráis y ya está.

Y si preferís WhatsApp directo:

   ${PABLO_WA}

Pablo
PACAME · pacameagencia.com`;

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const URL_PH = '@@@URL@@@';
  const WA_PH = '@@@WA@@@';
  const tokenized = text.split(url).join(URL_PH).split(PABLO_WA).join(WA_PH);
  const escaped = escape(tokenized);
  const html = escaped
    .split(/\n\n/g)
    .map((p) => p.trim() ? `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>` : '')
    .join('')
    .replace(/\bpacameagencia\.com\b/g, '<a href="https://pacameagencia.com" style="color:#666;">pacameagencia.com</a>')
    .split(URL_PH).join(`<a href="${url}" style="color:#c9181f;font-weight:600;text-decoration:underline;">${url}</a>`)
    .split(WA_PH).join(`<a href="${PABLO_WA}" style="color:#25d366;font-weight:600;">${PABLO_WA}</a>`);

  return { text, html };
}

const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();

// Ensure column re_engaged_at exists
await pg.query(`alter table public.prospect_leads add column if not exists re_engaged_at timestamptz`);

// Find candidates
const r = await pg.query(`
  select id, slug, name, email, city
  from prospect_leads
  where sent_at < now() - interval '48 hours'
    and sent_at > now() - interval '7 days'
    and first_opened_at is null
    and bounced_at is null
    and complained_at is null
    and unsubscribed_at is null
    and re_engaged_at is null
    and status not in ('replied','won','lost','complained','bounced','unsubscribed')
  order by sent_at asc
  limit 5
`);

console.log(`[re-engage] candidatos: ${r.rows.length}`);

let sent = 0;
for (const lead of r.rows) {
  try {
    const url = `${PUBLIC_BASE_URL}/${lead.slug}`;
    const subject = pick(lead.slug, ':fsubject', FOLLOWUP_SUBJECTS)(lead.name);
    const preheader = pick(lead.slug, ':fpreheader', FOLLOWUP_PREHEADERS)();
    const body = buildFollowupBody(lead, url);

    const unsubMailto = `mailto:${REPLY_TO}?subject=Unsubscribe%20${encodeURIComponent(lead.email)}`;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.65;color:#222;background:#f7f5f0;margin:0;padding:0;"><div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff;">${preheader}</div><div style="max-width:600px;margin:0 auto;padding:24px 20px;background:#fff;font-size:15px;">${body.html}</div></body></html>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [lead.email], reply_to: REPLY_TO,
        subject, text: body.text, html,
        headers: {
          'List-Unsubscribe': `<${unsubMailto}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Entity-Ref-ID': `${lead.slug}-followup`,
          'Message-ID': `<${lead.slug}-followup-${Date.now()}@pacameagencia.com>`,
        },
        tags: [
          { name: 'campaign', value: 'restaurantes-spain-2026-05' },
          { name: 'lead_slug', value: lead.slug.slice(0, 50) },
          { name: 'sequence', value: 'followup-1' },
        ],
      }),
    });
    const data = await resp.json();
    if (!data.id) throw new Error('Resend: ' + (data.message || JSON.stringify(data)));

    await pg.query(`update prospect_leads set re_engaged_at = now() where id = $1`, [lead.id]);
    sent++;
    console.log(`[re-engage] ${lead.slug}: sent ${data.id.slice(0,8)} (subject: ${subject})`);
  } catch (e) {
    console.error(`[re-engage] ${lead.slug}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 2000));
}

console.log(`[re-engage] enviados: ${sent}/${r.rows.length}`);
await pg.end();
