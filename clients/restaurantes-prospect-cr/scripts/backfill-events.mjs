/**
 * Backfill: trae el last_event de Resend API y lo persiste en email_events.
 * Para cada lead con resend_message_id, consulta Resend y registra los timestamps.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const localRequire = createRequire(resolve(here, 'package.json'));
const { Client } = localRequire('pg');

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnvFile(resolve(here, '..', '.env'));

const RESEND_KEY = process.env.RESEND_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
if (!RESEND_KEY || !DATABASE_URL) {
  console.error('Missing env'); process.exit(1);
}

const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();
console.log('[backfill] pg connected');

const r = await pg.query(`
  select id, slug, resend_message_id, sent_at, first_opened_at, first_clicked_at, status
  from prospect_leads
  where resend_message_id is not null
  order by sent_at desc
`);
console.log(`[backfill] ${r.rows.length} leads with message_id`);

let opened = 0, clicked = 0, delivered = 0, bounced = 0, failed = 0;

for (const lead of r.rows) {
  try {
    const resp = await fetch(`https://api.resend.com/emails/${lead.resend_message_id}`, {
      headers: { Authorization: `Bearer ${RESEND_KEY}` },
    });
    if (!resp.ok) {
      failed++;
      console.warn(`[backfill] ${lead.slug}: HTTP ${resp.status}`);
      continue;
    }
    const data = await resp.json();
    const lastEvent = data.last_event;
    const sentAt = data.created_at;

    // Insertar email_event con last_event si no existe ya
    const eventType = `email.${lastEvent}`;
    await pg.query(
      `insert into email_events (lead_id, resend_message_id, event_type, occurred_at, raw)
       select $1, $2, $3, $4::timestamptz, $5
       where not exists (
         select 1 from email_events
         where resend_message_id=$2 and event_type=$3
       )`,
      [lead.id, lead.resend_message_id, eventType, sentAt, JSON.stringify({ source: 'backfill', last_event: lastEvent, raw: data })]
    );

    // Update prospect_leads según estado
    const updates = [];
    const params = [lead.id];
    if (lastEvent === 'delivered' || lastEvent === 'sent') {
      delivered++;
      if (lead.status === 'pending' || lead.status === 'sent') {
        updates.push(`status='delivered'`, `delivered_at=coalesce(delivered_at,$${params.length+1}::timestamptz)`);
        params.push(sentAt);
      }
    } else if (lastEvent === 'opened') {
      opened++;
      updates.push(
        `first_opened_at=coalesce(first_opened_at,$${params.length+1}::timestamptz)`,
        `last_opened_at=$${params.length+1}::timestamptz`,
        `open_count=greatest(open_count,1)`,
        `status=case when status in ('clicked','replied','won') then status else 'opened' end`
      );
      params.push(sentAt);
    } else if (lastEvent === 'clicked') {
      clicked++;
      updates.push(
        `first_clicked_at=coalesce(first_clicked_at,$${params.length+1}::timestamptz)`,
        `last_clicked_at=$${params.length+1}::timestamptz`,
        `click_count=greatest(click_count,1)`,
        `status=case when status in ('replied','won') then status else 'clicked' end`
      );
      params.push(sentAt);
    } else if (lastEvent === 'bounced') {
      bounced++;
      updates.push(`status='bounced'`, `bounced_at=$${params.length+1}::timestamptz`);
      params.push(sentAt);
    }
    if (updates.length > 0) {
      await pg.query(`update prospect_leads set ${updates.join(', ')} where id=$1`, params);
    }
    console.log(`[backfill] ${lead.slug}: ${lastEvent}`);
  } catch (e) {
    failed++;
    console.error(`[backfill] ${lead.slug}: ${e.message}`);
  }
  // Throttle Resend (10 req/s)
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`\n[backfill] Done.`);
console.log(`  Opened:   ${opened}`);
console.log(`  Clicked:  ${clicked}`);
console.log(`  Delivered:${delivered}`);
console.log(`  Bounced:  ${bounced}`);
console.log(`  Failed:   ${failed}`);

await pg.end();
