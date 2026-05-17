#!/usr/bin/env node
/**
 * Digest diario a Pablo por Telegram. Lo corre cron 1x/día (09:00 CET).
 *
 * Manda: funnel últimas 24h + acumulado + lista de "hot leads" (entraron al
 * demo o abrieron el handoff en las últimas 72h pero NO han dicho sí/no ni
 * respondido) para que Pablo haga su ronda manual de WhatsApp de 5 min.
 *
 * No envía emails. Solo lee BD + 1 mensaje Telegram. Fail-safe (nunca peta cron).
 *
 * Uso: node scripts/daily-digest.mjs
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
loadEnv(resolve(here, '.env'));
loadEnv(resolve(here, '..', '.env'));

const DATABASE_URL = process.env.DATABASE_URL;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '';
if (!DATABASE_URL) { console.error('[digest] sin DATABASE_URL'); process.exit(1); }

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) { console.warn('[digest] sin TELEGRAM_*; imprimo y salgo:\n' + text); return; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!r.ok) console.error('[digest] telegram HTTP', r.status, await r.text().catch(() => ''));
  } catch (e) { console.error('[digest] telegram error:', e.message); }
}

const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await pg.connect();

  const f = (await pg.query(`
    select
      count(*) filter (where sent_at        > now() - interval '24 hours') as d_sent,
      count(*) filter (where first_opened_at  > now() - interval '24 hours') as d_open,
      count(*) filter (where first_clicked_at > now() - interval '24 hours') as d_click,
      count(*) filter (where replied_at       > now() - interval '24 hours') as d_reply,
      count(*) filter (where bounced_at       > now() - interval '24 hours') as d_bounce,
      count(*) filter (where sent_at is not null)     as t_sent,
      count(*) filter (where first_opened_at is not null)  as t_open,
      count(*) filter (where first_clicked_at is not null) as t_click,
      count(*) filter (where replied_at is not null)  as t_reply,
      count(*) filter (where bounced_at is not null)  as t_bounce,
      count(*) filter (where closed_won_at is not null) as t_won
    from prospect_leads
  `)).rows[0];

  const ev = (await pg.query(`
    select
      count(*) filter (where event_type = 'demo.intent_yes') as iyes,
      count(*) filter (where event_type = 'demo.intent_no')  as ino,
      count(*) filter (where event_type = 'demo.cta_click')  as cta
    from email_events
    where occurred_at > now() - interval '24 hours'
  `)).rows[0];

  const hot = (await pg.query(`
    select slug, name, city, phone, last_clicked_at
    from prospect_leads
    where first_clicked_at > now() - interval '72 hours'
      and reply_intent is null
      and replied_at is null
      and (do_not_contact is null or do_not_contact = false)
      and status not in ('replied','won','unsubscribed','bounced','complained')
    order by last_clicked_at desc nulls last
    limit 15
  `)).rows;

  const hotLines = hot.length
    ? hot.map((h) => `· <b>${esc(h.name || h.slug)}</b>${h.city ? ' · ' + esc(h.city) : ''} · 📞 ${esc(h.phone || '—')}\n  https://demos.pacameagencia.com/${esc(h.slug)}/`).join('\n')
    : 'Nadie pendiente ahora mismo. Todo seguido. 👌';

  const msg =
    `📊 <b>PACAME restaurantes — resumen 24h</b>\n\n` +
    `<b>Últimas 24h</b>: ✉️ ${f.d_sent} env · 👀 ${f.d_open} open · 🖱️ ${f.d_click} click\n` +
    `👍 ${ev.iyes} sí · 👎 ${ev.ino} no · 📱 ${ev.cta} handoff · 💬 ${f.d_reply} reply · ⚠️ ${f.d_bounce} bounce\n\n` +
    `<b>Acumulado</b>: ${f.t_sent} env · ${f.t_open} open · ${f.t_click} click · ${f.t_reply} reply · ${f.t_bounce} bounce · 🏆 ${f.t_won} cerrados\n\n` +
    `🔥 <b>Para escribir HOY por WhatsApp</b> (${hot.length}):\n${hotLines}\n\n` +
    `Dale caña: un mensaje corto a cada uno antes de comer.`;

  await sendTelegram(msg);
  console.log('[digest] enviado:', f.d_sent, 'env24h /', hot.length, 'hot');
} catch (e) {
  console.error('[digest] error:', e.message);
} finally {
  try { await pg.end(); } catch {}
}
