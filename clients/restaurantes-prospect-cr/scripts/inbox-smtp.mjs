/**
 * Mini SMTP receiver para hello@replies.pacameagencia.com.
 * Cuando alguien responde a un email, llega aquí, parseamos intent, persistimos
 * en email_events + actualizamos prospect_leads.
 *
 * Puerto 25 (SMTP) — requiere root o capabilities. Aceptamos en localhost
 * y delegamos en nginx stream/iptables si es necesario.
 *
 * Trigger Resend: el reply_to de cada email es replies@pacameagencia.com
 * y el MX de replies.pacameagencia.com apunta a 72.62.185.125.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const localRequire = createRequire(resolve(here, '..', 'package.json'));
const { SMTPServer } = localRequire('smtp-server');
const { simpleParser } = localRequire('mailparser');
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
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const SMTP_PORT = Number(process.env.SMTP_PORT || 25);

const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();
console.log('[inbox-smtp] pg connected');

// === Intent detector ===
function detectIntent(text) {
  if (!text) return { intent: 'unknown', confidence: 0 };
  const t = text.toLowerCase().trim();
  // Patrones STOP/NO (prioritarios)
  if (/\b(stop|no me interes[ae]|borrar(me)?|baja|unsubscribe|no me escrib[ae]|no insist|no gracias|d[eé]jame|d[eé]janos|fuera|spam|denuncia)\b/i.test(t)) {
    return { intent: 'stop', confidence: 0.9 };
  }
  // Patrones SI / consent
  if (/\b(s[ií]|ok|claro|interesa|interesad[oa]s?|adelante|me apunto|cu[eé]ntame|m[áa]s info|h[aá]blame|llama|whatsapp|wasap|tel[eé]fono|dame|encantad[oa]|me gusta|env[ií]a)\b/i.test(t) && t.length < 500) {
    return { intent: 'yes', confidence: 0.85 };
  }
  // Pregunta sobre precio/info — interés
  if (/\b(precio|cu[aá]nto|cu[aá]nta|pago|coste|cuesta|tarifa|presupuesto|m[aá]s informaci[oó]n)\b/i.test(t)) {
    return { intent: 'info', confidence: 0.8 };
  }
  // Auto-reply / fuera de oficina
  if (/\b(out of office|fuera de la oficina|de vacaciones|automatic reply|respuesta autom[aá]tica)\b/i.test(t)) {
    return { intent: 'auto_reply', confidence: 0.95 };
  }
  return { intent: 'reply_unclear', confidence: 0.3 };
}

async function processEmail(parsed, raw) {
  const from = (parsed.from?.value?.[0]?.address || '').toLowerCase().trim();
  const to = (parsed.to?.value?.[0]?.address || '').toLowerCase().trim();
  const subject = parsed.subject || '';
  const text = parsed.text || parsed.html || '';

  console.log(`[inbox-smtp] ← from=${from} to=${to} subject="${subject.slice(0,60)}"`);

  // Buscar lead por email
  const r = await pg.query('select id, slug, name, status from prospect_leads where lower(email) = $1 limit 1', [from]);
  if (!r.rows[0]) {
    console.log(`[inbox-smtp] sin lead asociado a ${from}, ignoro`);
    return;
  }
  const lead = r.rows[0];

  const { intent, confidence } = detectIntent(text);
  const occurred = parsed.date || new Date();

  // Append email_event
  await pg.query(
    `insert into email_events (lead_id, event_type, occurred_at, raw)
     values ($1, $2, $3, $4)`,
    [lead.id, 'email.replied', occurred, JSON.stringify({ from, to, subject, intent, confidence, text: text.slice(0, 4000) })]
  );

  // Update prospect_leads según intent
  const updates = ['reply_received_at = $2', 'reply_text = $3', 'reply_intent = $4'];
  const params = [lead.id, occurred, text.slice(0, 4000), intent];

  if (intent === 'yes' || intent === 'info') {
    updates.push("status = 'replied'", 'wa_consent = true', 'wa_consent_at = now()', "wa_consent_source = 'email_reply'");
  } else if (intent === 'stop') {
    updates.push("status = 'unsubscribed'", 'do_not_contact = true', "do_not_contact_reason = 'reply: stop/no/borrar'", 'unsubscribed_at = now()');
  } else if (intent === 'auto_reply') {
    // No marcar nada permanente, solo log
  } else {
    updates.push("status = 'replied'");
  }

  await pg.query(`update prospect_leads set ${updates.join(', ')} where id = $1`, params);
  console.log(`[inbox-smtp] ${lead.slug} ← ${intent} (conf ${confidence})`);
}

const server = new SMTPServer({
  authOptional: true,
  banner: 'PACAME inbox',
  size: 10 * 1024 * 1024, // 10MB max
  onData(stream, session, callback) {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', async () => {
      const raw = Buffer.concat(chunks);
      try {
        const parsed = await simpleParser(raw);
        await processEmail(parsed, raw);
      } catch (e) {
        console.error('[inbox-smtp] parse error:', e.message);
      }
      callback();
    });
  },
  onMailFrom(address, session, callback) { callback(); },
  onRcptTo(address, session, callback) {
    // Aceptar solo emails a replies.pacameagencia.com o pacameagencia.com
    const addr = address.address.toLowerCase();
    if (addr.endsWith('@replies.pacameagencia.com') || addr.endsWith('@pacameagencia.com')) return callback();
    return callback(new Error('550 relay denied'));
  },
});

server.listen(SMTP_PORT, () => {
  console.log(`[inbox-smtp] listening on :${SMTP_PORT}`);
});

server.on('error', (e) => console.error('[inbox-smtp] server error:', e.message));

const shutdown = async () => {
  console.log('[inbox-smtp] shutdown');
  server.close();
  await pg.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
