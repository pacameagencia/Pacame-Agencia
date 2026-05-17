#!/usr/bin/env node
/**
 * generate-demo.mjs — genera un index.html por restaurante a partir de
 * `templates/restaurante-base.html` + un config JSON.
 *
 * Uso:
 *   node generate-demo.mjs <ruta-config.json>
 *
 * Output: demos/<slug>/index.html
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const configPath = process.argv[2];
if (!configPath) {
  console.error('Usage: node generate-demo.mjs <config.json>');
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(resolve(process.cwd(), configPath), 'utf8'));

// Skin adaptativo por tipo de cocina. Fallback seguro a la plantilla base
// si la skin no existe o no está reconocida (no rompe nunca).
const SKIN_FILES = {
  clean: 'templates/skin-clean.html',
  editorial: 'templates/skin-editorial.html',
  dark: 'templates/skin-dark.html',
};
const skinRel = SKIN_FILES[cfg.skin];
const tplRel = skinRel && existsSync(resolve(root, skinRel)) ? skinRel : 'templates/restaurante-base.html';
const tpl = readFileSync(resolve(root, tplRel), 'utf8');

// Helpers
const hexToRgb = (hex) => {
  const m = hex.replace('#', '').match(/.{1,2}/g);
  return m ? m.map((x) => parseInt(x, 16)).join(', ') : '0, 0, 0';
};
const rgba = (hex, a) => `rgba(${hexToRgb(hex)}, ${a})`;

const pillarHtml = (p) => `
  <div class="pillar">
    <div class="pillar__icon">${p.icon}</div>
    <h3>${p.title}</h3>
    <p>${p.text}</p>
  </div>`;

// Bloque "qué mejoro en VUESTRA web y por qué" (auditoría real personalizada)
const auditHtml = (a) => `
  <div class="audit">
    <span class="audit__n">${a.n}</span>
    <div class="audit__body"><h3>${a.what}</h3><p>${a.why}</p></div>
  </div>`;
const improvements = Array.isArray(cfg.improvements) ? cfg.improvements : [];

// Variables a sustituir
const phoneTel = (cfg.phone || '').replace(/\s/g, '');
const phoneWa = phoneTel.replace(/^\+/, '');
const waMsg = encodeURIComponent(`Hola, quería reservar mesa en ${cfg.name}`);
const palette = cfg.palette;
const nameParts = cfg.name.split(' ');
const namePart1 = nameParts[0];
const namePart2 = nameParts.slice(1).join(' ') || '';
const initials = (namePart1.charAt(0) + (namePart2.charAt(0) || namePart1.charAt(1) || '')).toUpperCase();

const fontDisplay = cfg.font_display || 'Playfair Display';
const fontDisplayUrl = fontDisplay.replace(/ /g, '+');

const cuisineLabel = ((cfg.cuisine_label) || cfg.menu_heading || 'Spanish').replace(/[<>"]/g, '');
const ratingNum = (cfg.rating || '4.5').replace(',', '.');

const replacements = {
  SLUG: cfg.slug,
  CUISINE_LABEL: cuisineLabel,
  RATING_NUM: ratingNum,
  POSTAL: cfg.postal || '',
  NAME: cfg.name,
  NAME_PART1: namePart1,
  NAME_PART2: namePart2,
  INITIALS: initials,
  TAGLINE: cfg.tagline,
  META_DESC: cfg.meta_desc || cfg.tagline,
  ADDRESS_SHORT: cfg.address_short || cfg.address_full,
  ADDRESS_FULL: cfg.address_full,
  POSTAL_CITY: `${cfg.postal} ${cfg.city}`,
  CITY: cfg.city,
  PHONE: cfg.phone,
  PHONE_DISPLAY: cfg.phone_display || cfg.phone,
  PHONE_TEL: phoneTel,
  PHONE_WA: phoneWa,
  WA_MSG: waMsg,
  HERO_IMAGE: cfg.hero_image,
  BEFORE_SCREENSHOT: cfg.before_screenshot || "",
  EYEBROW: cfg.eyebrow,
  HERO_TITLE_LINE1: cfg.hero_title_line1,
  HERO_TITLE_LINE2: cfg.hero_title_line2,
  HERO_SUBTITLE: cfg.hero_subtitle,
  RATING: cfg.rating || '4.6',
  REVIEW_COUNT: cfg.review_count || '+150',
  PILLAR_EYEBROW: cfg.pillar_eyebrow || 'Nuestra esencia',
  PILLAR_HEADING: cfg.pillar_heading,
  PILLAR_BLOCKS: cfg.pillars.map(pillarHtml).join('\n'),
  IMPROVEMENTS_EYEBROW: cfg.improvements_eyebrow || 'Me he mirado la vuestra',
  IMPROVEMENTS_HEADING: cfg.improvements_heading || 'Qué cambiaría en vuestra web (y por qué)',
  IMPROVEMENTS_INTRO: cfg.improvements_intro || 'No es una plantilla: he entrado en lo que tenéis hoy. Esto es lo concreto que mejoro y el motivo.',
  IMPROVEMENTS_BLOCKS: improvements.length ? improvements.map(auditHtml).join('\n') : '',
  // includes section (sustituye el bloque menu/reviews fake)
  INCLUDES_EYEBROW: cfg.includes_eyebrow || 'Lo que incluye',
  INCLUDES_HEADING: cfg.includes_heading || 'Vuestra web nueva, así de claro',
  BOOKING_HEADING: cfg.booking_heading || 'Reserva tu mesa<br>o llámanos directo',
  BOOKING_DESC: cfg.booking_desc,
  HOURS_DAYS: cfg.hours.days,
  HOURS_MIDDAY: cfg.hours.midday,
  HOURS_DINNER: cfg.hours.dinner,
  MAPS_QUERY: encodeURIComponent(`${cfg.name} ${cfg.address_full} ${cfg.city}`),
  FONT_DISPLAY: fontDisplay,
  FONT_DISPLAY_URL: fontDisplayUrl,
  // Paleta — todos los formatos rgba que necesita el template
  PALETTE_PRIMARY: palette.primary,
  PALETTE_DARK: palette.dark,
  PALETTE_DEEP: palette.deep,
  PALETTE_CREAM: palette.cream,
  PALETTE_CREAM_WARM: palette.cream_warm,
  PALETTE_ACCENT: palette.accent,
  PALETTE_ACCENT_BRIGHT: palette.accent_bright,
  PALETTE_ACCENT_DEEP: palette.accent_deep,
  PALETTE_EARTH: palette.earth,
  PALETTE_TEXT_MUTED: palette.text_muted,
  PALETTE_PRIMARY_RGBA40: rgba(palette.primary, 0.4),
  PALETTE_PRIMARY_RGBA50: rgba(palette.primary, 0.5),
  PALETTE_PRIMARY_RGBA40_BIS: rgba(palette.primary, 0.4),
  PALETTE_DEEP_RGBA40: rgba(palette.deep, 0.4),
  PALETTE_DEEP_RGBA85: rgba(palette.deep, 0.85),
  PALETTE_ACCENT_RGBA10: rgba(palette.accent, 0.1),
  PALETTE_ACCENT_RGBA12: rgba(palette.accent, 0.12),
  PALETTE_ACCENT_RGBA15: rgba(palette.accent, 0.15),
  PALETTE_ACCENT_RGBA20: rgba(palette.accent, 0.2),
  PALETTE_ACCENT_RGBA25: rgba(palette.accent, 0.25),
  PALETTE_ACCENT_RGBA30: rgba(palette.accent, 0.3),
  PALETTE_ACCENT_RGBA40: rgba(palette.accent, 0.4),
};

let out = tpl;
for (const [k, v] of Object.entries(replacements)) {
  out = out.split(`{{${k}}}`).join(String(v));
}

const slug = cfg.slug;
const outDir = resolve(root, `demos/${slug}`);
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'index.html'), out, 'utf8');

console.log(`✓ Generated demos/${slug}/index.html (${out.length} bytes)`);
console.log(`  Open: file://${resolve(outDir, 'index.html').replace(/\\/g, '/')}`);
