/**
 * wa-outreach-queue.mjs — cola de outreach WhatsApp 1:1 priorizada por INTENCIÓN.
 *
 * NO envía nada. Solo genera datos + copy. El envío (con guardarraíles,
 * ritmo y parada ante bloqueo) es un paso aparte y con OK explícito.
 *
 * Qué hace:
 *  - Lee data/leads-qualified.json (los 512 cualificados, dominio propio).
 *  - Audita la web real de cada uno (site-audit, fail-safe).
 *  - Puntúa por gravedad: web rota/sin web = más receptivo = prioridad alta
 *    ("tu web está rota / no apareces, mira lo que te he montado").
 *  - Construye un mensaje WhatsApp 1:1 HONESTO citando SU hallazgo real
 *    + link al demo. Mensaje corto, humano, con salida ("si no, sin problema").
 *  - Escribe data/wa-outreach.json ordenado por score desc.
 *
 * Uso: node scripts/wa-outreach-queue.mjs [--limit=N] [--concurrency=8]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSite } from './site-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const arg = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const LIMIT = Number(arg('limit', 0)) || Infinity;
const CONCURRENCY = Number(arg('concurrency', 8));
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://demos.pacameagencia.com';

const waNumber = (phone) => {
  let d = String(phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
  if (!d) return null;
  if (d.startsWith('+')) d = d.slice(1);
  if (!d.startsWith('34') && d.length === 9) d = '34' + d; // ES por defecto
  return d.length >= 11 && d.length <= 15 ? d : null;
};

const tipoOf = (lead) => {
  const c = ((lead.cuisine || '') + ' ' + (lead.type || '')).toLowerCase();
  if (/pub|beer|cerve/.test(c)) return 'cervecería';
  if (/cafe|coffee/.test(c)) return 'cafetería';
  if (/bar/.test(c)) return 'bar';
  return 'restaurante';
};

// Hallazgo principal honesto + score de gravedad (más alto = mejor target)
function diagnose(lead, audit) {
  if (!audit || !audit.reachable) {
    return {
      score: 55,
      finding: `no tenéis web propia: quien os busca en Google solo ve la ficha a medias y acaba en otro sitio`,
      kind: 'no-web',
    };
  }
  let score = 8;
  const f = [];
  if (audit.pdfMenu) { score += 16; f.push('la carta es un PDF que en el móvil no hay quien lo lea'); }
  if (!audit.responsive) { score += 30; f.push('no está adaptada al móvil'); }
  if (!audit.https) { score += 26; f.push('no tiene candado de seguridad y Chrome la marca como "no segura"'); }
  if (!audit.hasReservation && !audit.hasWhatsapp) { score += 14; f.push('no hay forma de reservar sin llamar'); }
  if (audit.builder) { score += 10; f.push(`está montada en plantilla de ${audit.builder}`); }
  if (audit.sec >= 3.2) { score += 14; f.push('el servidor va lento al abrir'); }
  if (!audit.hasTel) { score += 5; }
  return {
    score,
    finding: f[0] || 'se le puede sacar bastante más partido',
    kind: f.length ? 'web-rota' : 'web-ok',
  };
}

function waMessage(lead, diag) {
  const name = lead.name || 'vuestro local';
  const url = `${PUBLIC_BASE}/${lead.slug}/`;
  if (diag.kind === 'no-web') {
    const tipo = tipoOf(lead);
    const city = lead.city || 'la zona';
    return `Hola, soy Pablo (PACAME). Buscando ${tipo} en ${city} vi que ${name} no tiene web propia — quien os busca solo ve la ficha de Google a medias y se va al de al lado. Me he tomado la libertad de montaros una de muestra, mirad cómo quedaría (mejor desde el móvil):\n${url}\n\nSi os encaja, hablamos. Si no es lo vuestro, me lo decís y no insisto. Un saludo.`;
  }
  return `Hola, soy Pablo (PACAME). Vi la web de ${name} y ${diag.finding}. Sin que me lo pidierais os he montado una propuesta nueva — echadle un ojo, mejor desde el móvil:\n${url}\n\nSi os encaja, hablamos. Si no, me lo decís y desaparezco. Un saludo.`;
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }));
  return out;
}

const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-qualified.json'), 'utf8'));
const subset = leads.slice(0, LIMIT === Infinity ? leads.length : LIMIT);
console.log(`Auditando ${subset.length} cualificados para cola WhatsApp (concurrency=${CONCURRENCY})...`);

let done = 0;
const rows = await pool(subset, CONCURRENCY, async (lead) => {
  const wa = waNumber(lead.phone);
  const audit = await auditSite(lead.website || lead.web_url);
  const diag = diagnose(lead, audit);
  done++;
  if (done % 50 === 0) console.log(`  ${done}/${subset.length}`);
  return {
    slug: lead.slug,
    name: lead.name,
    city: lead.city || '',
    phone: lead.phone || '',
    wa,
    website: lead.website || lead.web_url || '',
    score: diag.score,
    kind: diag.kind,
    finding: diag.finding,
    demo_url: `${PUBLIC_BASE}/${lead.slug}/`,
    message: waMessage(lead, diag),
  };
});

// Solo los contactables por WhatsApp, ordenados por gravedad (mejor target arriba)
const queue = rows.filter((r) => r.wa).sort((a, b) => b.score - a.score);
writeFileSync(resolve(root, 'data/wa-outreach.json'), JSON.stringify(queue, null, 2));

const byKind = {};
for (const r of queue) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
console.log('\n===== COLA WHATSAPP =====');
console.log(`Cualificados auditados : ${rows.length}`);
console.log(`Con WhatsApp válido    : ${queue.length}`);
console.log(`Sin teléfono usable    : ${rows.length - queue.length}`);
console.log('Por tipo de hallazgo:');
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(10)} ${v}`);
console.log('\nTop 5 (mejor target primero):');
for (const r of queue.slice(0, 5)) console.log(`  [${r.score}] ${r.name} (${r.city}) — ${r.finding.slice(0, 60)}`);
console.log(`\nEscrito: data/wa-outreach.json (${queue.length} leads, peor web primero)`);
