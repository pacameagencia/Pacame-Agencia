#!/usr/bin/env node
/**
 * Auto-mejora diaria: analiza qué subject/preheader variants funcionan mejor
 * y guarda un reporte que el worker puede leer para sesgar la selección.
 *
 * Frecuencia: cron diario 04:00 (España).
 *
 * Output:
 *  - tabla learning_reports (id, date, metrics jsonb)
 *  - tabla variant_performance (variant_type, idx, sent, opened, clicked, open_rate)
 *  - logs/auto-improve.log
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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }

const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();

// Ensure tables
await pg.query(`
  create table if not exists public.learning_reports (
    id uuid primary key default gen_random_uuid(),
    report_date date default current_date,
    metrics jsonb,
    insights text,
    created_at timestamptz default now()
  );
`);
await pg.query(`
  create table if not exists public.variant_performance (
    variant_type text not null,
    variant_idx integer not null,
    variant_text text,
    sent integer default 0,
    delivered integer default 0,
    opened integer default 0,
    clicked integer default 0,
    bounced integer default 0,
    open_rate numeric(5,2) default 0,
    click_rate numeric(5,2) default 0,
    bounce_rate numeric(5,2) default 0,
    last_updated timestamptz default now(),
    primary key (variant_type, variant_idx)
  );
`);

// === Análisis subject variants ===
const sa = await pg.query(`
  select subject_variant, subject_text, count(*) as sent,
    count(*) filter (where delivered_at is not null) as delivered,
    count(*) filter (where first_opened_at is not null) as opened,
    count(*) filter (where first_clicked_at is not null) as clicked,
    count(*) filter (where bounced_at is not null) as bounced
  from prospect_leads
  where subject_variant is not null
  group by subject_variant, subject_text
  order by subject_variant
`);
console.log(`\n=== SUBJECT VARIANTS ===`);
for (const r of sa.rows) {
  const openR = r.sent > 0 ? Number((r.opened / r.sent * 100).toFixed(2)) : 0;
  const clickR = r.sent > 0 ? Number((r.clicked / r.sent * 100).toFixed(2)) : 0;
  const bounceR = r.sent > 0 ? Number((r.bounced / r.sent * 100).toFixed(2)) : 0;
  console.log(`#${r.subject_variant} sent=${r.sent} open=${openR}% click=${clickR}% bounce=${bounceR}% — "${(r.subject_text||'').slice(0,60)}"`);
  await pg.query(`
    insert into variant_performance (variant_type, variant_idx, variant_text, sent, delivered, opened, clicked, bounced, open_rate, click_rate, bounce_rate, last_updated)
    values ('subject', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
    on conflict (variant_type, variant_idx) do update set
      variant_text = excluded.variant_text,
      sent = excluded.sent,
      delivered = excluded.delivered,
      opened = excluded.opened,
      clicked = excluded.clicked,
      bounced = excluded.bounced,
      open_rate = excluded.open_rate,
      click_rate = excluded.click_rate,
      bounce_rate = excluded.bounce_rate,
      last_updated = now()
  `, [r.subject_variant, r.subject_text, r.sent, r.delivered, r.opened, r.clicked, r.bounced, openR, clickR, bounceR]);
}

// === Análisis preheader variants ===
const pa = await pg.query(`
  select preheader_variant, preheader_text, count(*) as sent,
    count(*) filter (where delivered_at is not null) as delivered,
    count(*) filter (where first_opened_at is not null) as opened,
    count(*) filter (where first_clicked_at is not null) as clicked,
    count(*) filter (where bounced_at is not null) as bounced
  from prospect_leads
  where preheader_variant is not null
  group by preheader_variant, preheader_text
  order by preheader_variant
`);
console.log(`\n=== PREHEADER VARIANTS ===`);
for (const r of pa.rows) {
  const openR = r.sent > 0 ? Number((r.opened / r.sent * 100).toFixed(2)) : 0;
  const clickR = r.sent > 0 ? Number((r.clicked / r.sent * 100).toFixed(2)) : 0;
  const bounceR = r.sent > 0 ? Number((r.bounced / r.sent * 100).toFixed(2)) : 0;
  console.log(`#${r.preheader_variant} sent=${r.sent} open=${openR}% click=${clickR}% — "${(r.preheader_text||'').slice(0,60)}"`);
  await pg.query(`
    insert into variant_performance (variant_type, variant_idx, variant_text, sent, delivered, opened, clicked, bounced, open_rate, click_rate, bounce_rate, last_updated)
    values ('preheader', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
    on conflict (variant_type, variant_idx) do update set
      variant_text = excluded.variant_text,
      sent = excluded.sent,
      delivered = excluded.delivered,
      opened = excluded.opened,
      clicked = excluded.clicked,
      bounced = excluded.bounced,
      open_rate = excluded.open_rate,
      click_rate = excluded.click_rate,
      bounce_rate = excluded.bounce_rate,
      last_updated = now()
  `, [r.preheader_variant, r.preheader_text, r.sent, r.delivered, r.opened, r.clicked, r.bounced, openR, clickR, bounceR]);
}

// === Análisis por ciudad/tipo ===
const cityStats = await pg.query(`
  select city, count(*) as sent,
    count(*) filter (where first_opened_at is not null) as opened,
    round(count(*) filter (where first_opened_at is not null)::numeric / count(*) * 100, 2) as open_rate
  from prospect_leads
  where sent_at is not null and city is not null
  group by city
  having count(*) >= 3
  order by open_rate desc nulls last
  limit 10
`);
console.log(`\n=== TOP CIUDADES POR OPEN RATE ===`);
for (const r of cityStats.rows) {
  console.log(`${r.city.padEnd(20)} sent=${r.sent} open=${r.open_rate}%`);
}

const typeStats = await pg.query(`
  select type, count(*) as sent,
    count(*) filter (where first_opened_at is not null) as opened,
    round(count(*) filter (where first_opened_at is not null)::numeric / nullif(count(*),0) * 100, 2) as open_rate
  from prospect_leads
  where sent_at is not null and type is not null
  group by type
  order by open_rate desc nulls last
`);
console.log(`\n=== TIPOS DE LOCAL POR OPEN RATE ===`);
for (const r of typeStats.rows) {
  console.log(`${(r.type||'unknown').padEnd(20)} sent=${r.sent} open=${r.open_rate}%`);
}

// === Reporte global ===
const total = await pg.query(`
  select count(*) as sent,
    count(*) filter (where delivered_at is not null) as delivered,
    count(*) filter (where first_opened_at is not null) as opened,
    count(*) filter (where first_clicked_at is not null) as clicked,
    count(*) filter (where replied_at is not null) as replied,
    count(*) filter (where bounced_at is not null) as bounced
  from prospect_leads
  where sent_at is not null
`);
const t = total.rows[0];
const globalOpenR = t.sent > 0 ? (t.opened / t.sent * 100).toFixed(2) : 0;
const globalClickR = t.sent > 0 ? (t.clicked / t.sent * 100).toFixed(2) : 0;
const globalReplyR = t.sent > 0 ? (t.replied / t.sent * 100).toFixed(2) : 0;
console.log(`\n=== GLOBAL ===`);
console.log(`Sent: ${t.sent} | Delivered: ${t.delivered} | Opened: ${t.opened} (${globalOpenR}%) | Clicked: ${t.clicked} (${globalClickR}%) | Replied: ${t.replied} (${globalReplyR}%) | Bounced: ${t.bounced}`);

// === Insights automáticos ===
const insights = [];
if (sa.rows.length >= 2) {
  const sorted = [...sa.rows].sort((a, b) => (b.opened/b.sent || 0) - (a.opened/a.sent || 0));
  if (sorted[0].sent >= 5) {
    insights.push(`Subject ganador: #${sorted[0].subject_variant} con ${(sorted[0].opened/sorted[0].sent*100).toFixed(1)}% open rate.`);
  }
  if (sorted[sorted.length-1].sent >= 5 && (sorted[sorted.length-1].opened/sorted[sorted.length-1].sent) < 0.10) {
    insights.push(`Subject a retirar: #${sorted[sorted.length-1].subject_variant} con solo ${(sorted[sorted.length-1].opened/sorted[sorted.length-1].sent*100).toFixed(1)}% (<10%).`);
  }
}
if (Number(globalOpenR) > 0 && Number(globalOpenR) < 15) {
  insights.push(`Open rate global ${globalOpenR}% está bajo (target 25-40% B2B). Considerar warmup IP, mejorar deliverability, o cambiar from name.`);
} else if (Number(globalOpenR) >= 25) {
  insights.push(`Open rate global ${globalOpenR}% es saludable.`);
}

const metrics = {
  global: { sent: t.sent, delivered: t.delivered, opened: t.opened, clicked: t.clicked, replied: t.replied, bounced: t.bounced, open_rate: globalOpenR, click_rate: globalClickR, reply_rate: globalReplyR },
  subjects: sa.rows,
  preheaders: pa.rows,
  cities_top: cityStats.rows,
  types: typeStats.rows,
};
await pg.query(`insert into learning_reports (metrics, insights) values ($1, $2)`, [JSON.stringify(metrics), insights.join('\n')]);

console.log(`\n=== INSIGHTS ===`);
for (const ins of insights) console.log(`• ${ins}`);

console.log(`\n[auto-improve] reporte guardado en learning_reports`);
await pg.end();
