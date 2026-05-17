/**
 * Menús genéricos por tipo de restaurante.
 * Sin imágenes (placeholder elegante via template).
 * Cuando el cliente acepte, sustituimos con sus platos reales.
 */

export const MENUS = {
  regional_manchego: {
    tab1_label: 'Para empezar',
    tab2_label: 'Principales',
    tab3_label: 'Postres',
    menu_heading: 'Tradición manchega en cada plato',
    menu: {
      entrantes: [
        { name: 'Pisto manchego', price: '9,50 €', desc: 'Calabacín, pimiento y tomate de la huerta. Con huevo de corral roto por encima.', tags: ['Vegetariano', 'Casero'] },
        { name: 'Tabla de quesos manchegos', price: '14,00 €', desc: 'Selección de 4 quesos: tierno, semicurado, curado y añejo en aceite.', tags: ['DOP Manchego'] },
        { name: 'Migas con uvas', price: '11,00 €', desc: 'Pan del día anterior, panceta, chorizo, ajo y uvas frescas. Receta de la abuela.', tags: ['Tradicional'] },
        { name: 'Atascaburras', price: '10,50 €', desc: 'Plato típico manchego con bacalao, patata y aceite de oliva virgen extra.', tags: ['Bacalao'] },
      ],
      principales: [
        { name: 'Cordero asado al horno', price: '22,00 €', desc: 'Paletilla de cordero manchego asada lenta. Con patatas panaderas y romero.', tags: ['Especialidad'] },
        { name: 'Solomillo a la brasa', price: '19,00 €', desc: 'Solomillo de cerdo macerado en aceite y especias. Con verduras a la brasa.', tags: ['Brasa'] },
        { name: 'Perdiz roja escabechada', price: '21,00 €', desc: 'Perdiz en escabeche tradicional con vinagre de Jerez, laurel y pimienta.', tags: ['Caza'] },
        { name: 'Bacalao a la manchega', price: '18,50 €', desc: 'Lomo de bacalao desalado en casa con pisto y huevo escalfado encima.', tags: ['Bacalao'] },
      ],
      postres: [
        { name: 'Flores manchegas', price: '5,50 €', desc: 'Dulce típico de Semana Santa con miel y azúcar. Hechas en casa.', tags: [] },
        { name: 'Bizcocho borracho', price: '5,00 €', desc: 'Empapado en almíbar de vino dulce de la zona y crema casera.', tags: [] },
        { name: 'Helado de queso manchego', price: '5,80 €', desc: 'Helado artesanal de queso curado con miel de la Alcarria.', tags: ['Especial'] },
        { name: 'Torrijas con sirope de vino', price: '5,50 €', desc: 'Pan brioché casero, leche infusionada y sirope de vino tinto reducido.', tags: [] },
      ],
    },
  },

  tapeo: {
    tab1_label: 'Tapas',
    tab2_label: 'De cuchara',
    tab3_label: 'Postres',
    menu_heading: 'Tapeo tradicional · cocina de siempre',
    menu: {
      entrantes: [
        { name: 'Croquetas caseras de jamón', price: '1,80 €', desc: 'Bechamel hecha en casa, jamón ibérico y empanado fino. Crujientes por fuera, cremosas dentro.', tags: ['Tapa estrella'] },
        { name: 'Morcilla con piñones', price: '2,20 €', desc: 'Morcilla a la plancha con piñones tostados sobre tosta de pan rústico.', tags: ['Casero'] },
        { name: 'Oreja a la plancha', price: '3,50 €', desc: 'Oreja de cerdo a la plancha con pimentón y aceite de Sierra de Alcaraz.', tags: ['Tradicional'] },
        { name: 'Patatas bravas de la casa', price: '3,80 €', desc: 'Patatas confitadas con salsa brava hecha en casa: pimentón, tomate y guindilla.', tags: ['Para compartir'] },
      ],
      principales: [
        { name: 'Callos a la madrileña', price: '9,50 €', desc: 'Callos cocinados durante 6 horas con chorizo y morcilla. Receta de toda la vida.', tags: ['Casa'] },
        { name: 'Cocido manchego', price: '12,00 €', desc: 'Garbanzos, verdura, carne, chorizo, morcilla y tocino. Plato del día los domingos.', tags: ['Domingo'] },
        { name: 'Rabo de toro estofado', price: '14,50 €', desc: 'Rabo de buey al vino tinto durante 4 horas. Se deshace en la boca.', tags: ['Especialidad'] },
        { name: 'Manitas guisadas', price: '11,00 €', desc: 'Manitas de cerdo en salsa de tomate y especias. Pan para mojar.', tags: ['Guiso'] },
      ],
      postres: [
        { name: 'Tarta de queso casera', price: '4,80 €', desc: 'Tarta al horno con queso manchego y mermelada de higos.', tags: [] },
        { name: 'Arroz con leche', price: '4,00 €', desc: 'Cocido a fuego lento con canela y limón. Receta de la abuela.', tags: [] },
        { name: 'Flan de huevo casero', price: '3,80 €', desc: 'Flan al baño maría. Sin trampa ni cartón.', tags: [] },
        { name: 'Orejas de carnaval', price: '4,20 €', desc: 'Dulce frito típico con miel y azúcar. Dulce de antes.', tags: [] },
      ],
    },
  },

  brasa_asador: {
    tab1_label: 'Para empezar',
    tab2_label: 'Brasa',
    tab3_label: 'Dulces',
    menu_heading: 'A la brasa · sabor de leña',
    menu: {
      entrantes: [
        { name: 'Pimientos del Padrón', price: '7,50 €', desc: 'Pimientos del Padrón fritos en aceite de oliva con sal gorda.', tags: ['Vegetariano'] },
        { name: 'Tabla de embutidos ibéricos', price: '16,00 €', desc: 'Selección de jamón, chorizo, lomo y salchichón ibérico de bellota.', tags: ['Ibérico'] },
        { name: 'Ensalada de la huerta', price: '8,90 €', desc: 'Tomate de Daimiel, cebolla dulce, atún y aceitunas. Aceite virgen extra.', tags: ['Fresco'] },
        { name: 'Croquetas caseras', price: '8,50 €', desc: 'De jamón, queso o setas. Bechamel artesana y empanado fino.', tags: ['Casero'] },
      ],
      principales: [
        { name: 'Chuletón de buey a la brasa', price: '32,00 €', desc: 'Chuletón madurado 30 días, hecho a la brasa de encina. 700g aprox.', tags: ['Estrella', 'Brasa'] },
        { name: 'Costillar de cordero asado', price: '24,00 €', desc: 'Costillar de cordero lechal asado al horno con su propio jugo.', tags: ['Cordero'] },
        { name: 'Cochinillo segoviano', price: '25,00 €', desc: 'Cuarto de cochinillo asado a la leña. Crujiente y jugoso.', tags: ['Asador'] },
        { name: 'Solomillo de buey al carbón', price: '28,00 €', desc: 'Solomillo a punto exacto sobre carbón natural, con guarnición de patatas.', tags: ['Brasa'] },
      ],
      postres: [
        { name: 'Tarta de la abuela', price: '5,00 €', desc: 'Tarta de galleta y crema pastelera. La de toda la vida.', tags: [] },
        { name: 'Helado artesanal', price: '4,50 €', desc: 'Helado del día. Mantecado, chocolate o vainilla.', tags: [] },
        { name: 'Cuajada con miel y nueces', price: '4,80 €', desc: 'Cuajada de oveja con miel de la Alcarria y nueces.', tags: ['Casero'] },
        { name: 'Café irlandés', price: '5,50 €', desc: 'Café, whisky irlandés y nata montada.', tags: [] },
      ],
    },
  },

  cerveza_artesana: {
    tab1_label: 'Para picar',
    tab2_label: 'Burgers & más',
    tab3_label: 'Cervezas',
    menu_heading: 'Cervezas artesanas · cocina de mercado',
    menu: {
      entrantes: [
        { name: 'Patatas bravas de bar', price: '5,80 €', desc: 'Patatas crujientes con brava y alioli caseros.', tags: ['Para compartir'] },
        { name: 'Nachos con queso', price: '7,50 €', desc: 'Nachos con queso fundido, jalapeños, guacamole y salsa picante.', tags: ['Picante'] },
        { name: 'Croquetas variadas (6 ud)', price: '8,90 €', desc: 'Surtido de croquetas: jamón, queso azul y boletus.', tags: ['Casero'] },
        { name: 'Tabla de embutidos y quesos', price: '14,00 €', desc: 'Embutido ibérico y quesos curados con grisines artesanos.', tags: ['Tabla'] },
      ],
      principales: [
        { name: 'Burger artesana de la casa', price: '12,50 €', desc: 'Carne 100% buey, cheddar, bacon y salsa secreta. Pan brioche.', tags: ['Estrella'] },
        { name: 'Chicken sliders (3 ud)', price: '10,80 €', desc: 'Mini-burgers de pollo crujiente con miel y mostaza.', tags: ['Picoteo'] },
        { name: 'Rib eye con patatas', price: '18,90 €', desc: 'Entrecot a la brasa con patatas gajo y pimientos asados.', tags: ['Brasa'] },
        { name: 'Nachos burrito grande', price: '13,50 €', desc: 'Burrito de carne, frijoles, aguacate y queso, con nachos al horno.', tags: ['Mexicano'] },
      ],
      postres: [
        { name: 'Stout — cerveza negra de la casa', price: '4,50 €', desc: 'Cerveza artesana stout, tostada y con notas de café.', tags: ['Artesana'] },
        { name: 'IPA tropical', price: '4,80 €', desc: 'India Pale Ale con notas cítricas y maracuyá.', tags: ['Lúpulo'] },
        { name: 'Pale Ale rubia', price: '4,20 €', desc: 'Cerveza rubia equilibrada, fácil de beber.', tags: ['Suave'] },
        { name: 'Cheesecake de fresa', price: '5,50 €', desc: 'Tarta de queso casera con coulis de fresa.', tags: ['Postre'] },
      ],
    },
  },

  mediterraneo_moderno: {
    tab1_label: 'Para empezar',
    tab2_label: 'Principales',
    tab3_label: 'Postres',
    menu_heading: 'Cocina de mercado · sabor mediterráneo',
    menu: {
      entrantes: [
        { name: 'Tartar de atún rojo', price: '14,00 €', desc: 'Atún rojo con aguacate, soja y sésamo. Pan crujiente para untar.', tags: ['Crudo'] },
        { name: 'Ensalada burrata y tomate', price: '12,50 €', desc: 'Burrata fresca con tomate de la huerta, albahaca y aceite virgen extra.', tags: ['Vegetariano'] },
        { name: 'Carpaccio de gambón', price: '14,80 €', desc: 'Gambón rojo con vinagreta de cítricos y huevas de salmón.', tags: ['Mar'] },
        { name: 'Croquetas de chipirón', price: '9,50 €', desc: 'Bechamel de chipirón en su tinta, empanado crujiente.', tags: ['Casero'] },
      ],
      principales: [
        { name: 'Bacalao confitado al pil-pil', price: '19,00 €', desc: 'Lomo de bacalao confitado a baja temperatura con pil-pil tradicional.', tags: ['Bacalao'] },
        { name: 'Arroz meloso de bogavante', price: '24,00 €', desc: 'Arroz cremoso con bogavante fresco y verduras de temporada.', tags: ['Para 2'] },
        { name: 'Solomillo de ternera al café de París', price: '22,50 €', desc: 'Solomillo con mantequilla café de París y verduras asadas.', tags: ['Carne'] },
        { name: 'Tagliatelle al ragú de buey', price: '15,80 €', desc: 'Pasta fresca casera con ragú de buey cocinado 6 horas.', tags: ['Pasta'] },
      ],
      postres: [
        { name: 'Coulant de chocolate', price: '6,50 €', desc: 'Bizcocho tibio con corazón líquido de chocolate y helado de vainilla.', tags: ['Estrella'] },
        { name: 'Tarta de queso al horno', price: '5,80 €', desc: 'Receta de la casa con queso curado y mermelada de higos.', tags: [] },
        { name: 'Sorbete de mandarina', price: '4,50 €', desc: 'Sorbete artesanal de mandarina recién exprimida.', tags: ['Fresco'] },
        { name: 'Café del día con petits fours', price: '3,50 €', desc: 'Café con bombones y galletas caseras.', tags: [] },
      ],
    },
  },
};

// Heros curados POR TIPO de local (más específicos que random).
// URLs Unsplash verificadas: cada una corresponde al ambiente del tipo.
export const HERO_BY_TYPE = {
  pub: [
    'https://images.unsplash.com/photo-1546726747-421c6d69c929?auto=format&fit=crop&w=2400&q=85', // craft beer bar
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=2400&q=85', // beer pub interior
    'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=2400&q=85', // pub warm
  ],
  brasa: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2400&q=85', // grilled steak
    'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=2400&q=85', // brasa fire
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=2400&q=85', // grill close
  ],
  marisco: [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=2400&q=85', // seafood platter
    'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=2400&q=85', // oysters ice
    'https://images.unsplash.com/photo-1565978771542-4cd24e8d7c30?auto=format&fit=crop&w=2400&q=85', // restaurant by sea
  ],
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2400&q=85', // cozy cafe
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=2400&q=85', // marble cafe
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=2400&q=85', // espresso warm
  ],
  tasca: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=85', // tapas warm
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2400&q=85', // tasca interior
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=2400&q=85', // jamón hanging
  ],
  gastro: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=85', // fine dining
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=2400&q=85', // plated dish
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=2400&q=85', // gastronomico
  ],
  default: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=85',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2400&q=85',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2400&q=85',
  ],
};

function detectHeroBucket(lead) {
  const t = (lead.type || '').toLowerCase();
  const n = (lead.name || '').toLowerCase();
  if (t === 'pub' || /beer|cerveza|brewery|brewing|tap|craft/.test(n)) return 'pub';
  if (/asador|brasa|grill|parrilla|carb[oó]n|asado/.test(n)) return 'brasa';
  if (/marisco|pescado|atlantic|atl[aá]ntic|playa|costa|puerto|marina|pulper[ií]a|marisquer[ií]a/.test(n)) return 'marisco';
  if (t === 'cafe' || /caf[eé]|cafeter[ií]a|coffee|bistro/.test(n)) return 'cafe';
  if (/tasca|taberna|mes[oó]n|cantina|venta /.test(n)) return 'tasca';
  if (/gastro|estrella|michelin|fine dining/.test(n)) return 'gastro';
  return 'default';
}

export function pickHeroByType(lead) {
  const bucket = detectHeroBucket(lead);
  const list = HERO_BY_TYPE[bucket] || HERO_BY_TYPE.default;
  return list[hashSlug(lead.slug || '') % list.length];
}

function hashSlug(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

// Heros verificados (interiores/comida real, NUNCA personas)
export const HEROS = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2400&q=85',
];

// 5 paletas verificadas
export const PALETTES = [
  { name: 'vino_ocre', font: 'Playfair Display', primary: '#5c1a1b', dark: '#2a0a0b', deep: '#1a0606', cream: '#f5ede0', cream_warm: '#ede0cb', accent: '#c89651', accent_bright: '#e0a85e', accent_deep: '#8a5e2a', earth: '#2d1810', text_muted: '#6b5848' },
  { name: 'burdeos_oro', font: 'Cormorant Garamond', primary: '#8b1d1d', dark: '#5a0f0f', deep: '#1c0707', cream: '#f7f0e3', cream_warm: '#ebe1cc', accent: '#c89953', accent_bright: '#dcb472', accent_deep: '#7d5a26', earth: '#1f0f0a', text_muted: '#6e5946' },
  { name: 'verde_oliva', font: 'Lora', primary: '#3a5a3e', dark: '#243a27', deep: '#0f1d12', cream: '#f4f0e6', cream_warm: '#e8e0cc', accent: '#c79a3a', accent_bright: '#e0b54a', accent_deep: '#7a5b1f', earth: '#1f2917', text_muted: '#5e6553' },
  { name: 'azul_oceano', font: 'Cormorant Garamond', primary: '#1e3a5f', dark: '#122642', deep: '#06121f', cream: '#f5f1e8', cream_warm: '#e8dfc9', accent: '#d4a437', accent_bright: '#e6bc55', accent_deep: '#8a6920', earth: '#0d1a2b', text_muted: '#5a6b7d' },
  { name: 'tierra_terracota', font: 'Playfair Display', primary: '#8b4226', dark: '#5d2818', deep: '#1f0e08', cream: '#f7f0e4', cream_warm: '#ebdfc8', accent: '#d4a574', accent_bright: '#e8bd87', accent_deep: '#8a5c2e', earth: '#1f1108', text_muted: '#705a48' },
];

// Helper para asignar menú según el tipo/cuisine
export function pickMenu(lead) {
  const t = (lead.type || '').toLowerCase();
  const c = (lead.cuisine || '').toLowerCase();
  const n = (lead.name || '').toLowerCase();
  if (t === 'pub' || n.includes('beer') || n.includes('cerveza')) return MENUS.cerveza_artesana;
  if (n.includes('asador') || n.includes('brasa') || c.includes('barbecue')) return MENUS.brasa_asador;
  if (t === 'bar' || n.includes('mesón') || n.includes('meson') || n.includes('taberna')) return MENUS.tapeo;
  if (c.includes('regional') || c.includes('spanish') || c.includes('manchego')) return MENUS.regional_manchego;
  return MENUS.mediterraneo_moderno;
}

// Heros y paletas rotando con hash del slug
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}
export const pickHero = (slug) => HEROS[hash(slug) % HEROS.length];
export const pickPalette = (slug) => PALETTES[hash(slug + 'p') % PALETTES.length];

// Skin adaptativo por tipo de cocina/local. 3 sistemas de diseño curados:
//   dark      → fine-dining (asador, marisco, alta cocina, japonés)
//   editorial → cálido tradicional (regional, mesón, tasca, casa de comidas)
//   clean     → moderno limpio (resto: bar, café, pub, casual, sin cuisine)
export function pickSkin(lead) {
  const c = (lead.cuisine || '').toLowerCase();
  const n = (lead.name || '').toLowerCase();
  if (/seafood|fish|sushi|japanese|steak_house|barbecue|indian|marisc/.test(c) ||
      /asador|brasa|parrilla|grill|marisquer|steak/.test(n)) return 'dark';
  if (/regional|spanish|tapas|empanada|catalan|local|basque|gallego|valencian|manchego|asturian/.test(c) ||
      /mes[oó]n|taberna|tasca|casa |venta |c[aá]ntico|bodeg[oó]n/.test(n)) return 'editorial';
  return 'clean';
}
