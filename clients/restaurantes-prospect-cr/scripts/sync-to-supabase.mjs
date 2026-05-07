#!/usr/bin/env node
/**
 * Sync send-log.json → tabla Supabase prospect_leads.
 * Idempotente: upsert por slug.
 * Se ejecuta tras cada pipeline run.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '../..');
const require = createRequire(resolve(repoRoot, 'web/package.json'));
const { Client } = require('pg');

const env = readFileSync(resolve(repoRoot, 'web/.env.local'), 'utf8');
const DATABASE_URL = env.match(/DATABASE_URL=["']?([^"'\n]+)/)?.[1];
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const log = JSON.parse(readFileSync(resolve(root, 'data/send-log.json'), 'utf8'));
const allLeads = JSON.parse(readFileSync(resolve(root, 'data/leads-spain-email.json'), 'utf8'));
const piloto10 = JSON.parse(readFileSync(resolve(root, 'data/leads-with-email.json'), 'utf8'));
const allLeadsBySlug = new Map();
[...piloto10, ...allLeads].forEach(l => allLeadsBySlug.set(l.slug, l));

(async () => {
  const c = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log('Sync start. Log entries:', log.log.length);

  let upserted = 0;
  for (const entry of log.log) {
    if (!entry.slug || !entry.to) continue;
    const lead = allLeadsBySlug.get(entry.slug) || {};
    const messageId = entry.result?.id || null;
    const sentAt = entry.at || new Date().toISOString();
    const url = entry.url || `https://${entry.slug}.vercel.app`;

    try {
      await c.query(`
        insert into public.prospect_leads
          (slug, name, email, city, type, cuisine, phone, postal,
           vercel_url, resend_message_id, sent_at, status, raw)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'sent',$12)
        on conflict (slug) do update set
          email = excluded.email,
          vercel_url = excluded.vercel_url,
          resend_message_id = coalesce(prospect_leads.resend_message_id, excluded.resend_message_id),
          sent_at = coalesce(prospect_leads.sent_at, excluded.sent_at),
          status = case when prospect_leads.status = 'pending' then 'sent' else prospect_leads.status end,
          updated_at = now()
      `, [
        entry.slug, lead.name || entry.slug, entry.to.toLowerCase(),
        lead.city || null, lead.type || null, lead.cuisine || null,
        lead.phone || null, lead.postal || null,
        url, messageId, sentAt, JSON.stringify({ ...lead, log: entry })
      ]);
      upserted++;
    } catch (e) {
      console.log('  ✗', entry.slug, ':', e.message);
    }
  }

  // Métricas
  const m = await c.query('select * from public.prospect_leads_metrics');
  console.log('');
  console.log('✓', upserted, 'leads upserted to Supabase');
  console.log('Métricas live:');
  Object.entries(m.rows[0]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  await c.end();
})();
