/**
 * enrich-contact.mjs — resuelve el MEJOR canal directo del dueño para
 * WhatsApp, sin LinkedIn (red equivocada para este público) y sin inventar.
 *
 * Prioridad del número WhatsApp:
 *   1. wa.me hallado en SU web      → usan WhatsApp de verdad (máximo)
 *   2. móvil 6xx/7xx del campo phone OSM (sitios familiares = dueño)
 *   3. tel: móvil hallado en SU web
 *   (solo fijo → null: fuera del lote "móvil directo")
 *
 * resolveContact(lead, audit) — audit = salida de auditSite (puede traer
 * audit.contact de extractContact). Puro, no hace fetch.
 *
 * Export: resolveContact(lead, audit) -> { wa, wa_source, owner_name,
 *   instagram, confidence }
 */
import { esMobile } from './site-audit.mjs';

function phoneMobiles(phone) {
  return String(phone || '')
    .split(/[;,/]+/)
    .map((p) => esMobile(p))
    .filter(Boolean);
}

export function resolveContact(lead, audit) {
  const c = (audit && audit.contact) || {};
  const osmMobiles = phoneMobiles(lead.phone);

  let wa = null;
  let wa_source = null;
  if (c.waSite) { wa = c.waSite; wa_source = 'site_whatsapp'; }
  else if (osmMobiles.length) { wa = osmMobiles[0]; wa_source = 'osm_mobile'; }
  else if (c.telMobiles && c.telMobiles.length) { wa = c.telMobiles[0]; wa_source = 'site_tel'; }

  // Instagram handle (fallback manual si WhatsApp no responde). Limpia URL/@.
  let ig = lead.instagram || c.instagram || null;
  if (ig) {
    ig = String(ig).trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/[/?#].*$/, '')
      .replace(/^@/, '');
    if (!/^[a-zA-Z0-9_.]{2,30}$/.test(ig)) ig = null;
  }

  const confidence = wa_source === 'site_whatsapp' ? 'alta'
    : wa_source === 'osm_mobile' ? 'alta'
    : wa_source === 'site_tel' ? 'media'
    : 'nula';

  return {
    wa,
    wa_source,
    owner_name: (c.ownerName && String(c.ownerName).trim()) || null,
    instagram: ig,
    confidence,
  };
}
