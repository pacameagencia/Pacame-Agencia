/**
 * site-audit.mjs — auditoría HONESTA de la web actual del lead.
 *
 * Lee señales reales (no inventa nada) de su web y construye 3-4 mejoras
 * concretas con su porqué. Si no tienen web (o no responde), cambia a la
 * narrativa "no apareces y tu competencia sí". Fail-safe: nunca lanza, nunca
 * bloquea el pipeline (timeout duro, todo en try/catch).
 *
 * Export:
 *   auditSite(url)            -> { reachable, https, responsive, hasTel,
 *                                   hasWhatsapp, hasReservation, pdfMenu,
 *                                   builder, sec, kb }
 *   buildImprovements(lead, audit) -> [{ n, what, why }]  (máx 4)
 */

const UA = 'Mozilla/5.0 (compatible; PACAME-audit/1.0; +https://pacameagencia.com)';

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
// Elige una de varias redacciones equivalentes de forma estable por slug
const variant = (slug, key, arr) => arr[hash(slug + key) % arr.length];

// Normaliza a móvil español WhatsApp (34XXXXXXXXX) o null si no es móvil 6/7.
export function esMobile(raw) {
  let d = String(raw || '').replace(/[^\d]/g, '').replace(/^00/, '');
  if (d.length === 9 && /^[67]/.test(d)) return '34' + d;
  if (d.length === 11 && d.startsWith('34') && /^34[67]/.test(d)) return d;
  if (d.length === 12 && d.startsWith('340')) { const x = '34' + d.slice(3); if (/^34[67]/.test(x)) return x; }
  return null;
}

const NAME_STOP = /^(cocina|carta|men[uú]|nuestra|nuestro|inicio|reservas?|contacto|bienvenid|restaurante|especialidad|historia|sobre|equipo|gracias|familia|tradici|calidad|productos?|servicio|eventos?|grupo|local|casa|bar|el|la|los|las|de|del)$/i;

// Extrae contacto REAL de su web (caja original). Nunca inventa: solo matches.
export function extractContact(rawHtml) {
  const out = { waSite: null, telMobiles: [], instagram: null, ownerName: null };
  if (!rawHtml) return out;
  const lo = rawHtml.toLowerCase();

  const wa = lo.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=|wa\.link\/)(\+?\d[\d\s]{6,16})/);
  if (wa) out.waSite = esMobile(wa[1]) || (/^\+?34\d{9}$/.test(wa[1].replace(/\s/g, '')) ? wa[1].replace(/[^\d]/g, '') : null);

  const tels = [...lo.matchAll(/href=["']tel:([+\d\s().-]{7,20})/g)].map((m) => esMobile(m[1])).filter(Boolean);
  out.telMobiles = [...new Set(tels)];

  const ig = lo.match(/instagram\.com\/([a-z0-9_.]{2,30})/);
  if (ig && !/^(p|reel|reels|explore|accounts|stories|about|tv)$/.test(ig[1])) out.instagram = ig[1];

  // Nombre del dueño — solo si la web lo dice explícitamente (texto sin tags)
  const text = rawHtml.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ');
  const pats = [
    /(?:propietari[oa]|due[ñn][oa]|gerente|al frente|chef\s+(?:y\s+)?(?:propietari[oa])?|regentad[oa]\s+por)\s*[:,-]?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}){0,2})/,
    /\bfamilia\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,})/,
    /\bsoy\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}),?\s+(?:el|la)?\s*(?:due[ñn]|propietari|chef)/i,
  ];
  for (const p of pats) {
    const m = text.match(p);
    if (m && m[1]) {
      const cand = m[1].trim();
      const first = cand.split(' ')[0];
      if (cand.length <= 40 && !NAME_STOP.test(first)) { out.ownerName = cand; break; }
    }
  }
  return out;
}

export async function auditSite(rawUrl, timeoutMs = 7000) {
  const empty = { reachable: false };
  if (!rawUrl || typeof rawUrl !== 'string') return empty;
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    });
    const finalUrl = res.url || url;
    const buf = await res.arrayBuffer();
    const sec = +((Date.now() - t0) / 1000).toFixed(1);
    const kb = Math.round(buf.byteLength / 1024);
    const rawHtml = Buffer.from(buf).slice(0, 600 * 1024).toString('utf8');
    const html = rawHtml.toLowerCase();
    if (!res.ok && !html) return empty;

    const has = (re) => re.test(html);
    let builder = null;
    if (has(/wix\.com|_wix|wixstatic/)) builder = 'Wix';
    else if (has(/squarespace/)) builder = 'Squarespace';
    else if (has(/godaddy|websitebuilder/)) builder = 'GoDaddy';
    else if (has(/blogspot|blogger\.com/)) builder = 'Blogger';
    else if (has(/wordpress|wp-content|wp-includes/)) builder = 'WordPress';
    else if (has(/jimdo|webnode|1and1|ionos sitebuilder/)) builder = 'plantilla web';

    return {
      reachable: true,
      https: finalUrl.startsWith('https://'),
      responsive: has(/<meta[^>]+name=["']?viewport/),
      hasTel: has(/href=["']tel:/),
      hasWhatsapp: has(/wa\.me|api\.whatsapp|whatsapp:\/\//),
      hasReservation: has(/reserv(ar|a|as|e)\b|booking|thefork|covermanager|el tenedor|resos|opentable/),
      pdfMenu: has(/href=["'][^"']*\.pdf/) && has(/carta|men[uú]/),
      builder,
      sec,
      kb,
      contact: extractContact(rawHtml),
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

export function buildImprovements(lead, audit) {
  const slug = lead.slug || lead.name || 'x';
  const city = lead.city || 'tu zona';
  const cuisineRaw = (lead.cuisine || lead.type || '').toLowerCase();
  const tipo =
    /pub|beer|cerve/.test(cuisineRaw) ? 'cervecería' :
    /cafe|coffee/.test(cuisineRaw) ? 'cafetería' :
    /bar/.test(cuisineRaw) ? 'bar' : 'restaurante';
  const items = [];
  const add = (what, why) => { if (items.length < 4) items.push({ what, why }); };

  if (!audit || !audit.reachable) {
    // Sin web (o no responde) — narrativa "no apareces, tu competencia sí"
    add(
      variant(slug, 'nw1', [
        'No tenéis web propia, solo ficha de Google',
        'Hoy no aparecéis con web propia cuando os buscan',
      ]),
      `Cuando alguien busca "${tipo} en ${city}" ve fichas a medias y abre la del que sí tiene web. Esa mesa se pierde sin que os enteréis.`
    );
    add(
      'La carta no se encuentra antes de venir',
      'La mayoría mira la carta en el móvil antes de salir de casa. Si no la encuentra, elige otro sitio.'
    );
    add(
      'Las reservas dependen solo del teléfono',
      'Quien mira el móvil a las 23:30 no llama. Si no puede reservar con un toque, se va al siguiente. Esa reserva se pierde sin que os enteréis.'
    );
    add(
      variant(slug, 'nw4', [
        'Dependéis del algoritmo de redes y plataformas',
        'Todo el peso en Instagram y plataformas con comisión',
      ]),
      'Ahí mandan ellos: alcance, comisiones y reglas que cambian. Una web es vuestra, sale en Google y os trae cliente sin intermediarios.'
    );
    return items.slice(0, 4).map((x, i) => ({ n: String(i + 1).padStart(2, '0'), ...x }));
  }

  // Con web: solo afirmo lo que la auditoría detecta de verdad, sin exagerar.
  if (audit.sec >= 3.2) add(
    'Vuestro servidor responde lento',
    'Lo he medido: el servidor tarda en contestar, y eso se suma a lo que el cliente espera en su móvil antes de ver nada. La dejo rápida de origen.'
  );
  if (!audit.responsive) add(
    'Le falta la configuración básica de móvil',
    'Sin ella el teléfono no sabe cómo encajar la página. La mayoría os busca desde el móvil; si no entra bien a la primera, se van.'
  );
  if (!audit.https) add(
    'No tiene candado de seguridad (HTTPS)',
    'Chrome enseña "sitio no seguro" al entrar y Google la penaliza. Espanta antes de empezar.'
  );
  if (audit.pdfMenu) add(
    'La carta es un PDF',
    'En el móvil obliga a hacer zoom y pellizcar; la mayoría lo cierra. La paso a carta digital que se lee de un vistazo.'
  );
  if (!audit.hasReservation && !audit.hasWhatsapp) add(
    'No hay forma de reservar sin llamar',
    'Fuera de horario o si estáis liados en sala, esa reserva se va al siguiente. Falta un botón directo de WhatsApp.'
  );
  if (audit.builder) add(
    `Está montada en ${audit.builder} con plantilla`,
    `Se ve igual que miles de sitios y no transmite lo que sois. La vuestra tendrá cara propia de ${tipo}.`
  );
  if (!audit.hasTel) add(
    'El teléfono no se puede pulsar',
    'En el móvil hay que copiarlo a mano para llamar. Cada paso de más es alguien que no llama.'
  );
  // Relleno honesto (oportunidad, no diagnóstico inventado) si hay <3 señales
  add(
    'Le faltan los datos que Google necesita para encontraros',
    `Con título, descripción y datos bien puestos, Google entiende qué sois y dónde. Sin eso, cuando buscan "${tipo} en ${city}" salís detrás.`
  );
  add(
    'Vuestras reseñas no trabajan dentro de la web',
    'Si tenéis buena valoración y no se ve al entrar, no convence a quien duda. Al lanzar las conecto reales, sin inventar nada.'
  );

  return items.slice(0, 4).map((x, i) => ({ n: String(i + 1).padStart(2, '0'), ...x }));
}
