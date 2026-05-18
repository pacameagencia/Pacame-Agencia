#!/usr/bin/env node
/**
 * build-outreach-board.mjs — deja TODO listo para que Pablo solo pulse y envíe.
 *
 * Por lead bueno (móvil directo + peor web): audita su web real, resuelve el
 * mejor WhatsApp del dueño (sin inventar), genera la demo viva con el motor
 * nuevo (3 skins + auditoría) y compone un enlace wa.me con el mensaje ya
 * escrito. Salida = tablero HTML que Pablo abre en el móvil y pulsa.
 *
 * NO envía nada (envío manual de Pablo = humano, sin baneo).
 *
 * Uso: node scripts/build-outreach-board.mjs [--limit=60] [--scan=800] [--concurrency=10]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { auditSite } from './site-audit.mjs';
import { resolveContact } from './enrich-contact.mjs';
import { buildConfig } from '../lib/build-config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '../..');

const args = process.argv.slice(2);
const arg = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const LIMIT = Number(arg('limit', 60));
const SCAN = Number(arg('scan', 800));
const CONCURRENCY = Number(arg('concurrency', 10));

function loadEnv(p) {
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv(resolve(root, '.env'));
loadEnv(resolve(repoRoot, 'web/.env.local'));

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://demos.pacameagencia.com';
const PUBLIC_HTML_ROOT = process.env.PUBLIC_HTML_ROOT || '/var/www/demos';
const DATABASE_URL = process.env.DATABASE_URL;

// === Supresión: no re-contactar a quien ya tocamos o pidió parar ===
async function loadSuppression() {
  const sent = new Set();
  const protectedSet = new Set();
  if (!DATABASE_URL) { console.warn('[board] sin DATABASE_URL — sin filtro de supresión DB'); return { sent, protectedSet }; }
  let Client;
  try { ({ Client } = createRequire(resolve(root, 'package.json'))('pg')); }
  catch { ({ Client } = createRequire(resolve(repoRoot, 'web/package.json'))('pg')); }
  const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pg.connect();
    const a = await pg.query("select lower(email) e, slug from prospect_leads where sent_at is not null or do_not_contact = true");
    a.rows.forEach((r) => { if (r.e) sent.add(r.e); if (r.slug) sent.add('slug:' + r.slug); });
    const b = await pg.query('select lower(email) e from protected_contacts');
    b.rows.forEach((r) => r.e && protectedSet.add(r.e));
  } catch (e) { console.warn('[board] supresión parcial:', e.message); }
  finally { try { await pg.end(); } catch {} }
  return { sent, protectedSet };
}

const isAlbacete = (l) => {
  const t = ((l.city || '') + ' ' + (l.address || '') + ' ' + (l.province || '')).toLowerCase();
  return /\balbacete\b/.test(t) || /\b02[0-9]{3}\b/.test(String(l.postal || ''));
};

// Móvil 6/7 en el campo phone OSM (filtro barato previo a auditar)
const hasOsmMobile = (l) => String(l.phone || '').split(/[;,/]+/).some((p) => {
  const d = p.replace(/[^\d]/g, '').replace(/^00/, '');
  return (d.length === 9 && /^[67]/.test(d)) || (d.length === 11 && /^34[67]/.test(d));
});

// Gravedad de la web (peor = mejor target) + hallazgo honesto principal
function diagnose(lead, audit) {
  if (!audit || !audit.reachable) {
    return { score: 55, finding: `no tenéis web propia y quien os busca solo encuentra fichas de terceros (Maps, TripAdvisor...)`, kind: 'sin-web' };
  }
  let score = 8; const f = [];
  if (audit.pdfMenu) { score += 16; f.push('la carta es un PDF que en el móvil no hay quien lo lea'); }
  if (!audit.responsive) { score += 30; f.push('a la web le falta la configuración básica de móvil y puede no verse bien en el teléfono'); }
  if (!audit.https) { score += 26; f.push('la web no tiene candado de seguridad y Chrome la marca insegura'); }
  if (!audit.hasReservation && !audit.hasWhatsapp) { score += 14; f.push('no hay forma de reservar sin llamar'); }
  if (audit.builder) { score += 10; f.push(`la web está montada en plantilla de ${audit.builder}`); }
  if (audit.sec >= 3.2) { score += 14; f.push('la web tardó varios segundos en cargar cuando la revisé'); }
  return { score, finding: f[0] || 'a la web se le puede sacar bastante más partido', kind: f.length ? 'web-rota' : 'web-ok' };
}

function waMessage(lead, contact, diag, demoUrl) {
  const hi = contact.owner_name ? `Hola ${contact.owner_name}` : 'Hola';
  const intro = diag.kind === 'sin-web'
    ? `vi que ${lead.name} ${diag.finding}`
    : `vi la web de ${lead.name} y ${diag.finding}`;
  return `${hi}, soy Pablo (PACAME). ${intro}. Sin que me lo pidierais os he montado una propuesta nueva — echadle un ojo, mejor desde el móvil:\n${demoUrl}\n\nSi os encaja, hablamos. Si no es lo vuestro, me lo decís y no insisto. Un saludo.`;
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

// === Run ===
const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-spain-email.json'), 'utf8'));
const { sent, protectedSet } = await loadSuppression();

const candidates = leads.filter((l) => {
  const email = (l.email || '').toLowerCase();
  if (sent.has(email) || sent.has('slug:' + l.slug)) return false;
  if (protectedSet.has(email)) return false;
  if (isAlbacete(l)) return false;
  return hasOsmMobile(l) || !!(l.website || l.web_url); // contactable por móvil o con web donde buscar wa
}).slice(0, SCAN);

console.log(`Escaneando ${candidates.length} candidatos (de ${leads.length}) · concurrency=${CONCURRENCY}...`);
let done = 0;
const scored = await pool(candidates, CONCURRENCY, async (lead) => {
  const audit = await auditSite(lead.website || lead.web_url);
  const contact = resolveContact(lead, audit);
  done++;
  if (done % 100 === 0) console.log(`  ${done}/${candidates.length}`);
  if (!contact.wa) return null; // sin móvil directo → fuera (Pablo pidió móvil)
  const diag = diagnose(lead, audit);
  return { lead, audit, contact, diag };
});

const ranked = scored.filter(Boolean).sort((a, b) => b.diag.score - a.diag.score).slice(0, LIMIT);
console.log(`\nCon WhatsApp directo: ${scored.filter(Boolean).length} · genero demo para top ${ranked.length}`);

const TRACK = (slug) => `<script>(function(){try{var s=${JSON.stringify(slug)};var u='${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/rest/v1/email_events';var k='${process.env.SUPABASE_ANON_KEY || ''}';if(!u||!k)return;fetch(u,{method:'POST',keepalive:true,headers:{apikey:k,Authorization:'Bearer '+k,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({resend_message_id:new URLSearchParams(location.search).get('mid')||s,event_type:'page.view',user_agent:navigator.userAgent,raw:{slug:s,src:'wa',referrer:document.referrer}})}).catch(function(){});}catch(e){}})();</script>`;

const rows = [];
for (const r of ranked) {
  const { lead, contact, diag } = r;
  try {
    // Guard defensa: slug solo kebab-case (va a execSync + rutas de fichero)
    if (!/^[a-z0-9-]{1,80}$/.test(lead.slug || '')) { console.warn(`  [skip] slug inválido: ${lead.slug}`); continue; }
    const cfg = await buildConfig(lead);
    writeFileSync(resolve(root, `data/${lead.slug}.json`), JSON.stringify(cfg, null, 2));
    execSync(`node "${resolve(root, 'scripts/generate-demo.mjs')}" "${resolve(root, `data/${lead.slug}.json`)}"`, { stdio: 'pipe' });
    const htmlSrc = resolve(root, `demos/${lead.slug}/index.html`);
    if (!existsSync(htmlSrc)) throw new Error('demo no generada');
    const html = readFileSync(htmlSrc, 'utf8').replace(/<\/body>/i, TRACK(lead.slug) + '</body>');
    const outDir = resolve(PUBLIC_HTML_ROOT, lead.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html);
    const demoUrl = `${PUBLIC_BASE}/${lead.slug}/?mid=${lead.slug}&src=wa`;
    const msg = waMessage(lead, contact, diag, `${PUBLIC_BASE}/${lead.slug}/`);
    rows.push({
      slug: lead.slug, name: lead.name, city: lead.city || '',
      wa: contact.wa, wa_source: contact.wa_source, confidence: contact.confidence,
      owner_name: contact.owner_name, instagram: contact.instagram,
      score: diag.score, kind: diag.kind, finding: diag.finding,
      demo_url: demoUrl, message: msg,
      wa_link: `https://wa.me/${contact.wa}?text=${encodeURIComponent(msg)}`,
    });
  } catch (e) { console.warn(`  [skip] ${lead.slug}: ${e.message}`); }
}

writeFileSync(resolve(root, 'data/outreach-board.json'), JSON.stringify(rows, null, 2));

// === Tablero HTML (Pablo lo abre en el móvil y pulsa) ===
const cards = rows.map((r, i) => `
<div class="c">
  <div class="h"><span class="n">${i + 1}. ${esc(r.name)}</span><span class="b ${r.confidence}">${esc(r.confidence)}</span></div>
  <div class="m">${esc(r.city)} · ${esc(r.owner_name ? 'dueño: ' + r.owner_name : 'sin nombre dueño')} · wa: ${esc(r.wa)} (${esc(r.wa_source)})</div>
  <div class="f">${esc(r.finding)}</div>
  <div class="a">
    <a class="wa" href="${esc(r.wa_link)}" target="_blank" rel="noopener">📲 Abrir WhatsApp listo</a>
    <a class="d" href="${esc(r.demo_url)}" target="_blank" rel="noopener">Ver demo</a>
    ${r.instagram ? `<a class="ig" href="https://instagram.com/${esc(r.instagram)}" target="_blank" rel="noopener">IG @${esc(r.instagram)}</a>` : ''}
  </div>
</div>`).join('');

const board = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Outreach WhatsApp · PACAME (${rows.length})</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f1115;color:#e9e6df;padding:16px;line-height:1.5}h1{font-size:1.15rem;margin-bottom:4px}.sub{color:#8a8f99;font-size:.85rem;margin-bottom:18px}.c{background:#1a1d24;border:1px solid #262a33;border-radius:14px;padding:16px;margin-bottom:12px}.h{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.n{font-weight:700;font-size:1.02rem}.b{font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;padding:3px 9px;border-radius:20px;font-weight:700}.b.alta{background:#0f3d2e;color:#54e0a6}.b.media{background:#3d340f;color:#e0c054}.m{color:#8a8f99;font-size:.8rem;margin-bottom:8px}.f{color:#c9c4b8;font-size:.9rem;margin-bottom:14px}.a{display:flex;flex-wrap:wrap;gap:8px}.a a{text-decoration:none;font-weight:700;font-size:.88rem;padding:11px 16px;border-radius:50px;min-height:44px;display:inline-flex;align-items:center}.wa{background:#25d366;color:#06231a;flex:1;justify-content:center;min-width:200px}.d{background:#262a33;color:#e9e6df}.ig{background:#2a1c33;color:#d99ee0}</style></head>
<body><h1>Outreach WhatsApp — listo para pulsar</h1><div class="sub">${rows.length} leads · móvil directo + peor web primero · pulsa "Abrir WhatsApp listo", revisa y envía tú. Sin envío automático.</div>${cards || '<p>(vacío)</p>'}</body></html>`;

const token = randomBytes(6).toString('hex');
const boardDir = resolve(PUBLIC_HTML_ROOT, `_board-${token}`);
mkdirSync(boardDir, { recursive: true });
writeFileSync(resolve(boardDir, 'index.html'), board);
// Copia local también (por si se inspecciona sin VPS)
try { mkdirSync(resolve(root, 'data'), { recursive: true }); writeFileSync(resolve(root, 'data/outreach-board.html'), board); } catch {}

console.log('\n===== TABLERO LISTO =====');
console.log(`Leads en tablero : ${rows.length}`);
const byk = {}; rows.forEach((r) => { byk[r.kind] = (byk[r.kind] || 0) + 1; });
console.log(`Por hallazgo     : ${JSON.stringify(byk)}`);
console.log(`Con nombre dueño : ${rows.filter((r) => r.owner_name).length}`);
console.log(`\nTABLERO: ${PUBLIC_BASE}/_board-${token}/`);
console.log(`JSON: data/outreach-board.json`);
