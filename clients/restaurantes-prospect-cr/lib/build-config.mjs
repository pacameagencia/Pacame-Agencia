/**
 * build-config.mjs — config de demo por lead. EXTRAÍDO de worker.mjs para
 * poder generar demos sin arrancar el worker (worker.mjs tiene efectos de
 * módulo: pg.connect, heartbeat, bucle). Esta lib NO tiene efectos:
 * solo lee (try/catch) el cache de screenshots al cargar.
 *
 * Export: buildConfig(lead), getWebScreenshot(url)
 * Reutilizado por: scripts/worker.mjs y scripts/build-outreach-board.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickHeroByType, pickPalette, pickSkin } from '../scripts/menus.mjs';
import { auditSite, buildImprovements } from '../scripts/site-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// === Screenshot de la web actual del lead (microlink free) ===
const SCREENSHOT_CACHE_PATH = resolve(root, 'data/screenshot-cache.json');
let screenshotCache = {};
try { screenshotCache = JSON.parse(readFileSync(SCREENSHOT_CACHE_PATH, 'utf8')); } catch {}
function saveScreenshotCache() {
  try { writeFileSync(SCREENSHOT_CACHE_PATH, JSON.stringify(screenshotCache, null, 2)); } catch {}
}
export async function getWebScreenshot(websiteUrl) {
  if (!websiteUrl) return null;
  if (screenshotCache[websiteUrl]) return screenshotCache[websiteUrl];
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(websiteUrl)}&screenshot=true&meta=false&viewport.width=1280&viewport.height=800`;
    const r = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const data = await r.json();
    const url = data?.data?.screenshot?.url || null;
    if (url) {
      screenshotCache[websiteUrl] = url;
      saveScreenshotCache();
    }
    return url;
  } catch (e) {
    console.warn('[screenshot] error:', e.message);
    return null;
  }
}

// === Build config (igual que pipeline.mjs) ===
export async function buildConfig(lead) {
  const palette = pickPalette(lead.slug);
  const hero_image = pickHeroByType(lead);
  const before_screenshot = await getWebScreenshot(lead.website || lead.web_url);
  // Auditoría real de su web (fail-safe) → mejoras personalizadas + skin por tipo
  const siteAudit = await auditSite(lead.website || lead.web_url);
  const improvements = buildImprovements(lead, siteAudit);
  const skin = pickSkin(lead);
  const isRegional = (lead.cuisine || '').toLowerCase().match(/regional|spanish|manchego|asturian|catalan|basque|gallego|valencian/);
  const isPub = lead.type === 'pub' || /beer|cerveza|brewery/i.test(lead.name);
  const isBrasa = /asador|brasa|grill|parrilla/i.test(lead.name);

  let eyebrow, h1l1, h1l2, sub, pillarHeading, pillars, bookingDesc;
  if (isPub) {
    eyebrow = `${lead.city || 'España'} · cervezas y cocina`;
    h1l1 = 'Cerveza,'; h1l2 = 'cocina y mesa larga';
    sub = `Cervezas seleccionadas, cocina honesta y buena compañía. ${lead.name}: el sitio donde se queda uno más rato del que pensaba.`;
    pillarHeading = 'Tres motivos para entrar';
    pillars = [
      { icon: '🍺', title: 'Cervezas con criterio', text: 'Selección rotativa de artesanas y clásicas internacionales. Te aconsejamos según lo que te apetece.' },
      { icon: '🍔', title: 'Cocina abierta', text: 'Burgers, raciones y bocados pensados para acompañar la cerveza. Producto fresco cada día.' },
      { icon: '🎶', title: 'Buen rollo', text: 'Música, partidos en pantalla y mesa larga. Sitio donde quedas con amigos sin agenda.' },
    ];
    bookingDesc = `Pásate cuando quieras o reserva grupo si vais varios. ${lead.name} abierto tarde-noche.`;
  } else if (isBrasa) {
    eyebrow = `${lead.city || 'España'} · asador a la brasa`;
    h1l1 = 'Brasa, leña'; h1l2 = 'y producto de aquí';
    sub = `Carnes maduras a la brasa, cordero asado y arroces lentos. ${lead.name}: cocina con tiempo, como toca.`;
    pillarHeading = 'Por qué la brasa importa';
    pillars = [
      { icon: '🔥', title: 'Brasa de leña', text: 'Sin atajos: carbón natural y mucho oficio. La diferencia se nota en el primer bocado.' },
      { icon: '🥩', title: 'Carne madura', text: 'Chuletón con maduración propia, cordero lechal y solomillo. Trazabilidad total.' },
      { icon: '🍷', title: 'Vino para acompañar', text: 'Bodega con tintos seleccionados. Pregunta y elegimos juntos.' },
    ];
    bookingDesc = 'Reserva mesa por teléfono o pásate. Para grupos, llámanos antes y te preparamos la sala.';
  } else if (isRegional || /mesón|meson|taberna|casa /i.test(lead.name)) {
    eyebrow = `${lead.city || 'España'} · cocina de toda la vida`;
    h1l1 = 'Cocina honesta'; h1l2 = 'de la tierra';
    sub = `Recetas de toda la vida, productos de la tierra y trato cercano. ${lead.name}: donde se come de verdad.`;
    pillarHeading = 'Tres motivos por los que vuelves';
    pillars = [
      { icon: '🌾', title: 'Producto local', text: 'Carnes, quesos y aceite de productores de la zona. Sabor real.' },
      { icon: '🍷', title: 'Vinos seleccionados', text: 'Bodega con denominaciones locales. Vino al vaso para que pruebes lo que quieras.' },
      { icon: '👨‍🍳', title: 'Cocina lenta', text: 'Recetas familiares. Sin atajos, sin salsas industriales. Tiempo y fuego lento.' },
    ];
    bookingDesc = 'Reserva por teléfono o pásate. Atendemos comidas, cenas y eventos privados.';
  } else {
    eyebrow = `${lead.city || 'España'} · cocina de mercado`;
    h1l1 = 'Cocina honesta'; h1l2 = 'producto fresco';
    sub = `${lead.name}: cocina de mercado con producto fresco diario. Recetas trabajadas, técnica sólida, sin pretensiones.`;
    pillarHeading = 'Lo que somos';
    pillars = [
      { icon: '🥗', title: 'Producto fresco', text: 'Mercado diario y proveedores locales. Carta que cambia con la temporada.' },
      { icon: '👩‍🍳', title: 'Cocina con criterio', text: 'Recetas trabajadas y mucho mimo en cada plato.' },
      { icon: '🤝', title: 'Trato cercano', text: 'Llevamos años haciendo amigos en la sala. Aquí no eres una mesa, eres alguien.' },
    ];
    bookingDesc = 'Llámanos o pásate sin compromiso. Para grupos y celebraciones, mejor con reserva previa.';
  }

  const phoneClean = (lead.phone || '+34 900 000 000').trim();
  const phoneDisplay = phoneClean.replace(/^\+34\s?/, '').trim() || '900 000 000';
  return {
    skin, improvements,
    slug: lead.slug, name: lead.name, tagline: pillarHeading,
    meta_desc: `${lead.name} en ${lead.city || 'España'}. Reservas y carta digital`,
    phone: phoneClean, phone_display: phoneDisplay,
    address_short: lead.address || lead.city || 'España',
    address_full: lead.address || lead.city || 'España',
    city: lead.city || 'España', postal: lead.postal || '',
    rating: '4,5', review_count: '120', hero_image, before_screenshot, has_current_web: !!before_screenshot, font_display: palette.font,
    palette: { primary: palette.primary, dark: palette.dark, deep: palette.deep, cream: palette.cream, cream_warm: palette.cream_warm, accent: palette.accent, accent_bright: palette.accent_bright, accent_deep: palette.accent_deep, earth: palette.earth, text_muted: palette.text_muted },
    eyebrow, hero_title_line1: h1l1, hero_title_line2: h1l2, hero_subtitle: sub,
    pillar_eyebrow: 'Nuestra esencia', pillar_heading: pillarHeading, pillars,
    cuisine_label: lead.cuisine || 'Mediterránea',
    includes_eyebrow: 'Lo que incluye',
    includes_heading: 'Vuestra web nueva, así de claro',
    booking_heading: 'Reserva tu mesa<br>o llámanos directo', booking_desc: bookingDesc,
    hours: { days: 'Martes a domingo', midday: '13:00 - 16:00', dinner: '20:30 - 23:30' },
  };
}
