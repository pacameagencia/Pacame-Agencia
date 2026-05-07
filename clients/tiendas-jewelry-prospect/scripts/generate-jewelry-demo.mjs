#!/usr/bin/env node
/**
 * generate-jewelry-demo.mjs — genera HTML demo de tienda joyería con productos reales del lead.
 *
 * Uso:
 *   node generate-jewelry-demo.mjs <ruta-config.json>
 *
 * Output: demos/<slug>/index.html
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const configPath = process.argv[2];
if (!configPath) {
  console.error('Usage: node generate-jewelry-demo.mjs <config.json>');
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(resolve(process.cwd(), configPath), 'utf8'));
const tpl = readFileSync(resolve(root, 'templates/ecommerce-shopify-clone.html'), 'utf8');

// Helpers
const escape = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const productHtml = (p, idx) => {
  const badge = idx === 0 ? '<span class="product__badge">Más vendido</span>' :
                idx === 1 ? '<span class="product__badge product__badge--limited">Edición limitada</span>' :
                idx === 2 ? '<span class="product__badge">Nuevo</span>' : '';
  const oldPrice = p.priceCompare ? `<small>${p.priceCompare}€</small>` : '';
  const stock = p.lowStock ? `<div class="product__stock">⚡ Solo quedan ${p.lowStock} unidades</div>` : '';
  const rating = p.rating || (4.5 + (idx % 5) / 10).toFixed(1);
  const reviewCount = p.reviewCount || (12 + (idx * 7));
  const price = p.price || (49 + idx * 18);
  const name = escape(p.name || `Pieza ${idx + 1}`);

  return `
        <div class="product" data-name="${name}" data-price="${price}">
          <div class="product__img-wrap">
            ${badge}
            <img class="product__img" src="${escape(p.image)}" alt="${name}" loading="lazy">
            <button class="product__quick-add" data-add-to-cart>+ Añadir al carrito</button>
          </div>
          <div class="product__body">
            <h3 class="product__name">${name}</h3>
            <div class="product__meta">${escape(p.material || 'Plata 925 · Hecho a mano')}</div>
            <div class="product__price">${price}€${oldPrice}</div>
            <div class="product__rating"><span class="stars">★★★★★</span> <span>${rating} · ${reviewCount} opiniones</span></div>
            ${stock}
          </div>
        </div>`;
};

const reviewHtml = (r) => {
  const initials = r.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}&backgroundColor=ebe0c8&textColor=8a6428`;
  const stars = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
  return `
          <div class="review">
            <div class="review__stars">${stars}</div>
            <p class="review__text">"${escape(r.text)}"</p>
            <div class="review__author">
              <img class="review__avatar" src="${avatar}" alt="${escape(r.name)}" loading="lazy">
              <div>
                <div class="review__name">${escape(r.name)}</div>
                <div class="review__location">${escape(r.city)}</div>
                <div class="review__verified">✓ Compra verificada</div>
              </div>
            </div>
          </div>`;
};

// Pad productos a 8 si hay menos (con placeholders genéricos)
const products = (cfg.products || []).slice(0, 12);
while (products.length < 8 && products.length > 0) {
  products.push({
    ...products[products.length % (cfg.products?.length || 1)],
    name: products[products.length % (cfg.products?.length || 1)].name + ' II',
  });
}

const productsGrid = products.map(productHtml).join('\n');
const reviews = (cfg.reviews || []).map(reviewHtml).join('\n');

const initials = cfg.name.split(' ').filter((w) => w.length > 1).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const heroPriceProduct = products[0];
const heroPrice = heroPriceProduct?.price || 49;
const heroImg = heroPriceProduct?.image || cfg.hero_image || '';

const replacements = {
  BRAND_NAME: cfg.name,
  TAGLINE: cfg.tagline || 'Joyería artesana hecha a mano',
  META_DESC: cfg.meta_desc || `${cfg.name} — Joyería artesana de ${cfg.city || 'España'}`,
  CITY: cfg.city || 'España',
  SLUG: cfg.slug,
  INITIALS: initials,
  HERO_PRODUCT_IMG: heroImg,
  HERO_PRICE: heroPrice,
  HERO_TITLE_LINE1: cfg.hero_title_line1 || 'Joyería que',
  HERO_TITLE_LINE2: cfg.hero_title_line2 || 'cuenta historias',
  HERO_SUBTITLE: cfg.hero_subtitle || `Cada pieza de ${cfg.name} está hecha a mano en ${cfg.city || 'nuestro taller'}. Diseños únicos, materiales nobles, oficio que se nota.`,
  PRODUCTS_GRID: productsGrid,
  REVIEWS: reviews,
  STORY_HEADING: cfg.story_heading || `Detrás de ${cfg.name}`,
  STORY_BODY: cfg.story_body || `${cfg.name} nace de la pasión por el oficio. Cada pieza pasa por nuestras manos antes de llegar a ti, con materiales seleccionados y diseños pensados para durar generaciones. No hacemos series infinitas: hacemos piezas que importan.`,
  PALETTE_PRIMARY: cfg.palette.primary,
  PALETTE_DARK: cfg.palette.dark,
  PALETTE_DEEP: cfg.palette.deep,
  PALETTE_ACCENT: cfg.palette.accent,
  PALETTE_CREAM: cfg.palette.cream,
  PALETTE_CREAM_WARM: cfg.palette.cream_warm,
  PALETTE_PRIMARY_RGB: cfg.palette.primary_rgb,
};

let html = tpl;
for (const [k, v] of Object.entries(replacements)) {
  html = html.split(`{{${k}}}`).join(String(v ?? ''));
}

const outDir = resolve(root, `demos/${cfg.slug}`);
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'index.html'), html);

console.log(`✓ ${cfg.slug} → demos/${cfg.slug}/index.html (${html.length} bytes, ${products.length} productos, ${cfg.reviews?.length || 0} reviews)`);
