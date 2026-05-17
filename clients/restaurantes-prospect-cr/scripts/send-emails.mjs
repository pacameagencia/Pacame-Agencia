#!/usr/bin/env node
/**
 * Envía emails outreach a los leads con demo personalizada vía Resend.
 * Uso: node send-emails.mjs [--dry] [--only=slug1,slug2]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '../..');

const env = readFileSync(resolve(repoRoot, 'web/.env.local'), 'utf8');
const RESEND_KEY = env.match(/RESEND_API_KEY=["']?([^"'\n]+)/)?.[1];
if (!RESEND_KEY) { console.error('No RESEND_API_KEY'); process.exit(1); }

const FROM = 'PACAME <hola@pacameagencia.com>';
const REPLY_TO = 'hola@pacameagencia.com';
const PABLO_WA = 'https://wa.me/34722669381';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const onlyArg = args.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.split('=')[1].split(',')) : null;

const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-with-email.json'), 'utf8'));

function emailFor(lead) {
  const url = `https://${lead.slug}.vercel.app`;
  const firstName = lead.name.split(/\s+/)[0];
  const subject = `Os hice una web a ${lead.name} (échale un vistazo)`;
  const text = `Hola, equipo de ${lead.name}!

Soy Pablo, de PACAME — una agencia digital pequeña, de un solo fundador, sin intermediarios. Andaba mirando los restaurantes de Ciudad Real y me llamó la atención el vuestro: por las reseñas en Google y por la pinta del sitio.

Os he montado una propuesta de web. Sin que la pidierais, lo sé. La he hecho con vuestros datos reales (nombre, dirección, teléfono, ciudad) y le he puesto una carta digital de ejemplo + reseñas para que veáis cómo quedaría todo:

   ${url}

Lo que incluye:
• Hero grande con vuestro nombre y datos
• Carta digital navegable (ahorra cartón impreso)
• Reseñas Google integradas
• Botón reservar por WhatsApp directo
• Mapa para llegar
• Mobile-first (el 78% busca restaurante desde el móvil)

Una cosa importante sobre las fotos: las que veis NO son del local. He puesto unos placeholders elegantes y fotos genéricas porque por privacidad y derechos de imagen NO uso fotos vuestras sin permiso. La idea es que, si os mola la web, me mandéis vuestras fotos reales (interior, platos, equipo) y yo las pongo. Queda mil veces mejor con vuestras fotos.

Cómo seguimos: si os encaja, os llamo o escribo y en 5 minutos os cuento cómo la dejamos vuestra de verdad — vuestro dominio, vuestras fotos, todo. El precio os lo digo ahí mismo: es menos de lo que estáis pensando y sin permanencia. Si queréis ir directos, me escribís por WhatsApp:

   ${PABLO_WA}

Y si no es lo vuestro, no pasa nada — borráis este email y aquí no ha pasado nada.

Un saludo,
Pablo
PACAME · pacameagencia.com
+34 722 669 381

P.D. Si abrís el enlace desde el móvil se ve mejor que en el ordenador. Tarda 1-2 segundos en cargar y se navega entera con el dedo.`;

  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>')
    .replace(new RegExp(url, 'g'), `<a href="${url}" style="color:#c9181f;font-weight:600;">${url}</a>`)
    .replace(new RegExp(PABLO_WA, 'g'), `<a href="${PABLO_WA}" style="color:#25d366;font-weight:600;">${PABLO_WA}</a>`)
    .replace(/\bpacameagencia\.com\b/g, '<a href="https://pacameagencia.com" style="color:#666;">pacameagencia.com</a>');

  const htmlWrapped = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:20px;font-size:15px;"><p>${html}</p></body></html>`;

  return { subject, text, html: htmlWrapped, url };
}

async function send(to, lead, payload) {
  const body = {
    from: FROM,
    to: [to],
    reply_to: REPLY_TO,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    tags: [
      { name: 'campaign', value: 'restaurantes-cr-2026-05' },
      { name: 'lead_slug', value: lead.slug },
    ],
  };
  if (DRY) return { dry: true, subject: payload.subject, to, url: payload.url };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return { status: r.status, ...data };
}

(async () => {
  const log = [];
  for (const lead of leads) {
    if (ONLY && !ONLY.has(lead.slug)) continue;
    const payload = emailFor(lead);
    try {
      const result = await send(lead.email, lead, payload);
      console.log(`${result.id || result.dry ? (result.id || 'DRY') : 'ERR'} · ${lead.slug} → ${lead.email}`);
      log.push({ slug: lead.slug, to: lead.email, url: payload.url, result });
    } catch (e) {
      console.log(`ERR · ${lead.slug} → ${lead.email} :: ${e.message}`);
      log.push({ slug: lead.slug, to: lead.email, error: e.message });
    }
    // Throttle: 3 segundos entre envíos para no parecer spam
    await new Promise(r => setTimeout(r, 3000));
  }
  writeFileSync(resolve(root, 'data/send-log.json'), JSON.stringify({ at: new Date().toISOString(), dry: DRY, log }, null, 2));
  console.log(`\nDone. Log → data/send-log.json`);
})();
