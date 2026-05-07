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
const tpl = readFileSync(resolve(root, 'templates/restaurante-base.html'), 'utf8');

// Helpers
const hexToRgb = (hex) => {
  const m = hex.replace('#', '').match(/.{1,2}/g);
  return m ? m.map((x) => parseInt(x, 16)).join(', ') : '0, 0, 0';
};
const rgba = (hex, a) => `rgba(${hexToRgb(hex)}, ${a})`;

const dishHtml = (d) => {
  const imageBlock = d.image
    ? `<div class="dish__image" style="background-image: url('${d.image}');"></div>`
    : `<div class="dish__image dish__image--placeholder" aria-hidden="true">
         <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
           <path d="M4 18h24M6 18a10 10 0 0 1 20 0M16 8v2M12 4v2M20 4v2M2 22h28v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-2z"/>
         </svg>
       </div>`;
  return `
  <div class="dish">
    ${imageBlock}
    <div class="dish__body">
      <div class="dish__head"><span class="dish__name">${d.name}</span><span class="dish__price">${d.price}</span></div>
      <p class="dish__desc">${d.desc}</p>
      ${d.tags && d.tags.length ? `<div class="dish__tags">${d.tags.map((t) => `<span class="dish__tag">${t}</span>`).join('')}</div>` : ''}
    </div>
  </div>`;
};

const pillarHtml = (p) => `
  <div class="pillar">
    <div class="pillar__icon">${p.icon}</div>
    <h3>${p.title}</h3>
    <p>${p.text}</p>
  </div>`;

const reviewHtml = (r) => `
  <div class="review">
    <div class="review__stars">${'★'.repeat(r.stars || 5)}</div>
    <p class="review__text">"${r.text}"</p>
    <div class="review__author">
      <div class="review__avatar">${(r.author || '?').charAt(0)}</div>
      <div>
        <div class="review__name">${r.author}</div>
        <div class="review__date">${r.date}</div>
      </div>
    </div>
  </div>`;

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
  EYEBROW: cfg.eyebrow,
  HERO_TITLE_LINE1: cfg.hero_title_line1,
  HERO_TITLE_LINE2: cfg.hero_title_line2,
  HERO_SUBTITLE: cfg.hero_subtitle,
  RATING: cfg.rating || '4.6',
  REVIEW_COUNT: cfg.review_count || '+150',
  PILLAR_EYEBROW: cfg.pillar_eyebrow || 'Nuestra esencia',
  PILLAR_HEADING: cfg.pillar_heading,
  PILLAR_BLOCKS: cfg.pillars.map(pillarHtml).join('\n'),
  MENU_HEADING: cfg.menu_heading,
  TAB1_LABEL: cfg.tab1_label || 'Para empezar',
  TAB2_LABEL: cfg.tab2_label || 'Principales',
  TAB3_LABEL: cfg.tab3_label || 'Dulces',
  TAB1_DISHES: cfg.menu.entrantes.map(dishHtml).join('\n'),
  TAB2_DISHES: cfg.menu.principales.map(dishHtml).join('\n'),
  TAB3_DISHES: cfg.menu.postres.map(dishHtml).join('\n'),
  REVIEWS_HEADING: cfg.reviews_heading || 'Cocina con alma · servicio cercano',
  REVIEW_BLOCKS: cfg.reviews.map(reviewHtml).join('\n'),
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
