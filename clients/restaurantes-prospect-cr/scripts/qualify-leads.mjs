#!/usr/bin/env node
/**
 * qualify-leads.mjs — cualifica la lista OSM con verificación SMTP ESTRICTA.
 *
 * Objetivo: bajar bounce de 21% a <5% descartando offline los emails muertos
 * ANTES de gastar reputación de dominio enviando.
 *
 * Estrategia de tier:
 *   tier 1 (oro)  = dominio propio del restaurante + RCPT 250/251 confirmado vivo
 *   tier 2 (medio)= dominio propio + MX OK pero RCPT no concluyente (catch-all)
 *   DESCARTADO    = genérico (info@/contacto@), gmail/hotmail/yahoo (no verificable
 *                   + son los que más rebotan), RCPT 5xx, sin MX
 *
 * Output: data/leads-qualified.json (solo tier 1 y 2, ordenados tier asc)
 *
 * Uso: node scripts/qualify-leads.mjs [--limit=N] [--concurrency=12]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMx } from 'node:dns/promises';
import { createConnection } from 'node:net';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const args = process.argv.slice(2);
const arg = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const LIMIT = Number(arg('limit', 0)) || Infinity;
const CONCURRENCY = Number(arg('concurrency', 12));

const GENERIC = ['info', 'contacto', 'contact', 'no-reply', 'noreply', 'admin',
  'webmaster', 'support', 'soporte', 'sales', 'ventas', 'marketing', 'hello',
  'hola', 'reservas', 'reservations', 'reserva', 'booking', 'pedidos',
  'comercial', 'gerencia', 'direccion', 'administracion', 'rrhh', 'prensa'];

const FREEMAIL = ['gmail.com', 'hotmail.com', 'hotmail.es', 'yahoo.com', 'yahoo.es',
  'outlook.com', 'outlook.es', 'live.com', 'icloud.com', 'msn.com', 'aol.com',
  'telefonica.net', 'terra.es', 'ya.com', 'wanadoo.es'];

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

const mxCache = new Map();
async function getMx(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  let recs = null;
  try {
    recs = await resolveMx(domain);
    recs = Array.isArray(recs) && recs.length ? recs : null;
  } catch { recs = null; }
  mxCache.set(domain, recs);
  return recs;
}

// SMTP RCPT estricto: SOLO devuelve 'alive' si responde 250/251 al RCPT.
// 5xx = 'dead'. Todo lo demás (timeout, 4xx, catch-all sospechoso) = 'unknown'.
function smtpRcptStrict(email, mxRecords, timeoutMs = 7000) {
  return new Promise((res) => {
    const sorted = [...mxRecords].sort((a, b) => (a.priority || 10) - (b.priority || 10));
    const mxHost = sorted[0].exchange;
    const sock = createConnection({ host: mxHost, port: 25, family: 4 });
    let stage = 0, done = false;
    const finish = (v) => {
      if (done) return; done = true;
      try { sock.write('QUIT\r\n'); } catch {}
      try { sock.destroy(); } catch {}
      res(v);
    };
    const timer = setTimeout(() => finish('unknown'), timeoutMs);
    sock.setEncoding('utf8');
    let buf = '';
    sock.on('data', (c) => {
      buf += c;
      const lines = buf.split(/\r?\n/);
      const last = lines.filter((l) => /^\d{3} /.test(l)).pop();
      if (!last) return;
      const code = parseInt(last.slice(0, 3), 10);
      buf = '';
      try {
        if (stage === 0) {
          if (code !== 220) return finish('unknown');
          sock.write('HELO pacameagencia.com\r\n'); stage = 1;
        } else if (stage === 1) {
          if (code !== 250) return finish('unknown');
          sock.write('MAIL FROM:<verify@pacameagencia.com>\r\n'); stage = 2;
        } else if (stage === 2) {
          if (code !== 250) return finish('unknown');
          sock.write('RCPT TO:<' + email + '>\r\n'); stage = 3;
        } else if (stage === 3) {
          clearTimeout(timer);
          if (code === 250 || code === 251) return finish('alive');
          if (code >= 500 && code < 600) return finish('dead');
          return finish('unknown'); // 4xx greylisting/temp → no confiar
        }
      } catch { return finish('unknown'); }
    });
    sock.on('error', () => finish('unknown'));
    sock.on('close', () => finish('unknown'));
  });
}

async function classify(lead) {
  const email = (lead.email || '').toLowerCase().trim();
  if (!email || !EMAIL_RE.test(email)) return { ...lead, qual: 'discard', reason: 'regex' };
  const [localPart, domain] = email.split('@');
  if (GENERIC.includes(localPart)) return { ...lead, qual: 'discard', reason: 'generic' };

  const mx = await getMx(domain);
  if (!mx) return { ...lead, qual: 'discard', reason: 'no-mx' };

  const isFree = FREEMAIL.includes(domain);
  const rcpt = await smtpRcptStrict(email, mx);

  if (rcpt === 'dead') return { ...lead, qual: 'discard', reason: 'rcpt-5xx' };

  // Freemail: solo entra si RCPT confirmado vivo (tier 2). Si unknown → descartar
  // (gmail/hotmail catch-all + son los que más rebotan en nuestros datos).
  if (isFree) {
    if (rcpt === 'alive') return { ...lead, qual_tier: 2, qual: 'keep', reason: 'free-rcpt-alive' };
    return { ...lead, qual: 'discard', reason: 'free-unverifiable' };
  }

  // Dominio propio del restaurante (= negocio serio)
  if (rcpt === 'alive') return { ...lead, qual_tier: 1, qual: 'keep', reason: 'owndomain-alive' };
  // RCPT unknown en dominio propio (catch-all/greylisting) → tier 2, riesgo medio
  return { ...lead, qual_tier: 2, qual: 'keep', reason: 'owndomain-unknown' };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-spain-email.json'), 'utf8'));
const subset = leads.slice(0, LIMIT === Infinity ? leads.length : LIMIT);
console.log(`Cualificando ${subset.length} leads (concurrency=${CONCURRENCY})...`);

let processed = 0;
const results = await pool(subset, CONCURRENCY, async (lead) => {
  const r = await classify(lead);
  processed++;
  if (processed % 100 === 0) console.log(`  ${processed}/${subset.length}`);
  return r;
});

const kept = results.filter((r) => r.qual === 'keep');
const tier1 = kept.filter((r) => r.qual_tier === 1);
const tier2 = kept.filter((r) => r.qual_tier === 2);
const reasons = {};
for (const r of results) reasons[r.reason] = (reasons[r.reason] || 0) + 1;

// Orden: tier1 primero, luego tier2
kept.sort((a, b) => a.qual_tier - b.qual_tier);
writeFileSync(resolve(root, 'data/leads-qualified.json'), JSON.stringify(kept, null, 2));

console.log('\n===== RESULTADO CUALIFICACIÓN =====');
console.log(`Total procesados : ${results.length}`);
console.log(`KEEP (tier1+2)   : ${kept.length}  (${(100 * kept.length / results.length).toFixed(1)}%)`);
console.log(`  tier1 (oro)    : ${tier1.length}  — dominio propio + buzón verificado vivo`);
console.log(`  tier2 (medio)  : ${tier2.length}  — dominio propio catch-all / freemail verificado`);
console.log(`DESCARTADOS      : ${results.length - kept.length}`);
console.log('\nDesglose razones:');
for (const [k, v] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(22)} ${v}`);
}
console.log(`\nEscrito: data/leads-qualified.json (${kept.length} leads, tier1 primero)`);
