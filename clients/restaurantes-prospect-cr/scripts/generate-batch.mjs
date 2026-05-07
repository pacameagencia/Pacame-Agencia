#!/usr/bin/env node
/**
 * Genera configs JSON + demos HTML para todos los leads de leads-with-email.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { MENUS, pickMenu, pickHero, pickPalette } from './menus.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const leads = JSON.parse(readFileSync(resolve(root, 'data/leads-with-email.json'), 'utf8'));
console.log(`Generating ${leads.length} demos...`);

function buildConfig(lead) {
  const menu = pickMenu(lead);
  const palette = pickPalette(lead.slug);
  const hero_image = pickHero(lead.slug);

  const isRegional = (lead.cuisine || '').toLowerCase().includes('regional');
  const isPub = lead.type === 'pub' || /beer|cerveza/i.test(lead.name);
  const isBrasa = /asador|brasa/i.test(lead.name);

  // Eyebrow + hero copy ajustados al tipo
  let eyebrow, h1l1, h1l2, sub, pillarHeading, pillars, bookingDesc;
  if (isPub) {
    eyebrow = `${lead.city || 'Ciudad Real'} · cervezas artesanas`;
    h1l1 = 'Cerveza,';
    h1l2 = 'cocina y mesa larga';
    sub = `Cervezas artesanas, hamburguesas y cocina de mercado. ${lead.name}: el sitio donde se queda uno más rato del que pensaba.`;
    pillarHeading = 'Tres motivos para entrar';
    pillars = [
      { icon: '🍺', title: 'Cervezas artesanas', text: 'Pale Ales, IPAs, stouts y rotativos del mes. Te aconsejamos según lo que te apetece.' },
      { icon: '🍔', title: 'Cocina abierta', text: 'Burgers, pizzas y bocados pensados para acompañar la cerveza. Ingrediente fresco cada día.' },
      { icon: '🎶', title: 'Buen rollo', text: 'Música, conciertos y partidos en pantalla. Sitio donde quedas con amigos sin agenda.' },
    ];
    bookingDesc = `Pásate cuando quieras o reserva grupo si vais varios. ${lead.name} abierto tarde-noche.`;
  } else if (isBrasa) {
    eyebrow = `${lead.city || 'Ciudad Real'} · asador de leña`;
    h1l1 = 'Brasa, leña';
    h1l2 = 'y producto de aquí';
    sub = `Carnes maduras a la brasa de encina, cordero asado y arroces de domingo. ${lead.name}: cocina lenta como toca.`;
    pillarHeading = 'Por qué la brasa importa';
    pillars = [
      { icon: '🔥', title: 'Brasa de encina', text: 'Sin atajos: carbón natural y mucho oficio. La diferencia se nota en el primer bocado.' },
      { icon: '🥩', title: 'Carne madura', text: 'Chuletón con maduración propia, cordero lechal y solomillo de buey. Trazabilidad total.' },
      { icon: '🍷', title: 'Vino para acompañar', text: 'Bodega con tintos de la Mancha y Ribera. Pregunta y elegimos juntos.' },
    ];
    bookingDesc = `Reserva mesa por teléfono o pásate. Para grupos, llámanos antes y te preparamos la sala.`;
  } else if (isRegional || /mesón|meson|taberna/i.test(lead.name)) {
    eyebrow = `${lead.city || 'Ciudad Real'} · cocina de toda la vida`;
    h1l1 = 'Cocina manchega';
    h1l2 = 'sin pretensiones';
    sub = `Recetas de toda la vida, productos de la tierra y trato cercano. ${lead.name}: donde se come de verdad.`;
    pillarHeading = 'Tres motivos por los que vuelves';
    pillars = [
      { icon: '🌾', title: 'Producto local', text: 'Cordero manchego, queso de Ciudad Real, aceite de la sierra. De productores de aquí.' },
      { icon: '🍷', title: 'Bodega de la zona', text: 'Vinos DO La Mancha, Valdepeñas y Manchuela. Contados al vaso para que pruebes.' },
      { icon: '👨‍🍳', title: 'Cocina lenta', text: 'Recetas familiares. Sin atajos, sin salsas industriales. Tiempo y fuego lento.' },
    ];
    bookingDesc = `Reserva por teléfono o pásate. Atendemos comidas, cenas y eventos privados.`;
  } else {
    eyebrow = `${lead.city || 'Ciudad Real'} · cocina de mercado`;
    h1l1 = 'Cocina honesta';
    h1l2 = 'producto de la tierra';
    sub = `${lead.name}: cocina de mercado con producto fresco diario. Recetas trabajadas, sin pretensiones, con alma.`;
    pillarHeading = 'Lo que somos';
    pillars = [
      { icon: '🥗', title: 'Producto fresco', text: 'Mercado diario y proveedores locales. Carta que cambia con la temporada.' },
      { icon: '👩‍🍳', title: 'Cocina con criterio', text: 'Sin atajos. Recetas trabajadas, técnica sólida y mucho mimo en cada plato.' },
      { icon: '🤝', title: 'Trato cercano', text: 'Llevamos años haciendo amigos en la sala. Aquí no eres una mesa, eres alguien.' },
    ];
    bookingDesc = `Llámanos o pásate sin compromiso. Para grupos y celebraciones, mejor con reserva previa.`;
  }

  return {
    slug: lead.slug,
    name: lead.name,
    tagline: pillarHeading,
    meta_desc: `${lead.name} en ${lead.city || 'Ciudad Real'}. Reservas y carta digital`,
    phone: lead.phone || '+34 926 000 000',
    phone_display: (lead.phone || '+34 926 000 000').replace('+34 ', '').trim(),
    address_short: lead.address || lead.city || 'Ciudad Real',
    address_full: lead.address || `${lead.city || 'Ciudad Real'}`,
    city: lead.city || 'Ciudad Real',
    postal: '13001',
    rating: '4,5',
    review_count: '120',
    hero_image,
    font_display: palette.font,
    palette: {
      primary: palette.primary,
      dark: palette.dark,
      deep: palette.deep,
      cream: palette.cream,
      cream_warm: palette.cream_warm,
      accent: palette.accent,
      accent_bright: palette.accent_bright,
      accent_deep: palette.accent_deep,
      earth: palette.earth,
      text_muted: palette.text_muted,
    },
    eyebrow,
    hero_title_line1: h1l1,
    hero_title_line2: h1l2,
    hero_subtitle: sub,
    pillar_eyebrow: 'Nuestra esencia',
    pillar_heading: pillarHeading,
    pillars,
    menu_heading: menu.menu_heading,
    tab1_label: menu.tab1_label,
    tab2_label: menu.tab2_label,
    tab3_label: menu.tab3_label,
    menu: menu.menu,
    reviews_heading: 'Lo que dicen los clientes',
    reviews: [
      { stars: 5, text: 'Trato muy cercano y la comida bien hecha. Repetiremos seguro.', author: 'Juan M.', date: 'Hace 2 semanas' },
      { stars: 5, text: 'Sitio con buen ambiente, raciones generosas y precios honestos. Recomendable.', author: 'Carmen R.', date: 'Hace 1 mes' },
      { stars: 4, text: 'Cocina rica y atención personal. Volveremos.', author: 'Pedro G.', date: 'Hace 1 mes' },
    ],
    booking_heading: 'Reserva tu mesa<br>o llámanos directo',
    booking_desc: bookingDesc,
    hours: { days: 'Martes a domingo', midday: '13:00 - 16:00', dinner: '20:30 - 23:30' },
  };
}

let ok = 0;
for (const lead of leads) {
  try {
    const cfg = buildConfig(lead);
    writeFileSync(resolve(root, `data/${lead.slug}.json`), JSON.stringify(cfg, null, 2));
    execSync(`node "${resolve(root, 'scripts/generate-demo.mjs')}" "${resolve(root, `data/${lead.slug}.json`)}"`, { stdio: 'pipe' });
    console.log(`✓ ${lead.slug}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${lead.slug}: ${e.message}`);
  }
}
console.log(`\nDone. ${ok}/${leads.length} demos generated.`);
