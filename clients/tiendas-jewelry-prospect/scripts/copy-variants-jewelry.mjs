/**
 * Variantes de copy para joyerías artesanas españolas pequeñas.
 * Tono: cercano pero más premium que restaurantes. Reconoce arte/oficio.
 *
 * Permission line LSSI idéntica a restaurantes (compliance legal).
 */

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const pick = (slug, suffix, arr) => arr[hash(slug + suffix) % arr.length];

// 12 SUBJECTS — premium tone, mención producto cuando disponible
const SUBJECTS = [
  (name, city, prod) => prod ? `He visto vuestros ${prod}, os monté algo para ${name}` : `${name}, una idea que tengo para vosotros`,
  (name, city) => `Para ${name} en ${city || 'tu ciudad'} — 1 minuto`,
  (name, city, prod) => prod ? `${prod} merece una tienda mejor, ${name}` : `${name}: os monté algo, decidme si vale`,
  (name, city) => `Hola ${name}, esto se queda entre nosotros`,
  (name, city) => `Una pregunta sobre vuestra web, ${name}`,
  (name, city) => `${name}, ¿tenéis 1 minuto?`,
  (name, city, prod) => prod ? `Pensé en vuestros ${prod} mientras hacía esto` : `He pensado algo para ${name}`,
  (name, city) => `${name} + propuesta de tienda online (sin coste)`,
  (name, city) => `Para la persona que diseña en ${name}`,
  (name, city) => `${name} — 3 cosas que te quería contar`,
  (name, city) => `Pablo aquí, dueño de PACAME — sobre ${name}`,
  (name, city) => `${name}, ¿véis bien vuestra web cuando entran a comprar?`,
];

// 8 PREHEADERS — texto invisible que aparece junto al asunto en bandeja
const PREHEADERS = [
  () => `Os hice una versión de tienda con vuestros productos. 30 segundos vuestros.`,
  () => `He montado una tienda online pensando en vuestra marca. Tarda 2 min en abrirse.`,
  () => `Sin compromiso. Solo quería que vierais cómo podría quedar la tienda.`,
  () => `Tienda montada con vuestros productos reales. Decidme si os gusta.`,
  () => `Un fundador a otro: si no os interesa, lo borráis y ya está.`,
  (name) => `Lo he hecho específicamente para ${name}. 30 segundos vuestros.`,
  () => `Os la enseño. Si os mola seguimos. Si no, perfecto también.`,
  () => `Hecha en mobile-first porque sé que vuestras clientas miran desde el móvil.`,
];

// 5 SALUDOS
const GREETINGS = [
  (name) => `Hola, equipo de ${name}!`,
  (name) => `¡Hola ${name}!`,
  (name) => `Buenas, ${name},`,
  (name) => `Hola ${name},`,
  (name) => `Saludos, gente de ${name},`,
];

// 6 OPENINGS — cómo llegamos a la marca
const OPENINGS = [
  (city, style, prod) => `Soy Pablo, de PACAME — agencia digital pequeña, un fundador, sin intermediarios. Andaba mirando joyerías artesanas ${city ? `en ${city}` : 'españolas pequeñas'}${prod ? ` y vuestros ${prod} se me quedaron en la cabeza` : ' y el vuestro me llamó la atención'}.`,
  (city, style, prod) => `Soy Pablo. Llevo PACAME, una agencia digital de uno solo. Encontré vuestra marca buscando ${style === 'bohemian' ? 'piezas con alma' : 'joyería artesana española'} ${city ? `en ${city}` : ''} y me dije: a estos hay que escribirles.`,
  (city, style, prod) => `Pablo, de PACAME. Agencia pequeña, sin intermediarios. Vuestra marca${prod ? ` y especialmente vuestros ${prod}` : ''} me ha tenido toda la mañana fichándola.`,
  (city, style, prod) => `Soy Pablo (agencia PACAME, un fundador, sin equipo gigante). Vuestro Instagram ${city ? `en ${city}` : 'me'} salió y me ha enganchado. Estoy escribiendo a la persona detrás directamente.`,
  (city, style) => `Pablo, agencia PACAME. Esto va a sonar raro pero ahí va: ${style === 'gold' ? 'vuestro trabajo en oro' : 'vuestra estética'} es de las mejores que he visto este mes${city ? ` en ${city}` : ''}.`,
  (city, style, prod) => `Soy Pablo, llevo una agencia digital pequeña que se llama PACAME. Andaba viendo marcas de joyería artesana${city ? ` por ${city}` : ''} y os tengo fichados desde hace rato.`,
];

// 4 HOOKS — gancho que justifica por qué les escribo
const HOOKS = [
  () => `Y me ha dado por hacer algo: he montado una versión de tienda online con vuestros productos reales (los he sacado de vuestra web/IG, sin tocar nada). Echadle un vistazo (mejor desde el móvil):`,
  () => `Os he montado una tienda online cinematográfica con vuestras piezas. La idea: enseñaros cómo podría verse vuestra marca con un escaparate digital que de verdad convierta. Ahí va:`,
  () => `He hecho algo que igual os interesa: cogí vuestros productos (los públicos en vuestra web/IG) y los puse en una tienda Shopify-style con todo lo que las marcas grandes tienen y las pequeñas no. Échale un ojo:`,
  () => `Os monté una propuesta sin que la pidierais. La idea: ver cómo se vería vuestra marca con una tienda mejor. Sin precios reales, sin checkout real — solo el escaparate. Aquí está:`,
];

// 3 PHOTO_NOTES — disclaimer fotos
const PHOTO_NOTES = [
  () => `Las fotos que veis son las que tenéis públicas en vuestra web/IG. Si pasamos a montar la real, las optimizamos juntos.`,
  () => `Las imágenes son las vuestras (las saqué de vuestro feed público). En la versión real las podemos retocar, hacer fotos profesionales, etc.`,
  () => `Las fotos son las que ya tenéis online. Si avanzamos, optimizamos calidad, fondos, copy de cada producto.`,
];

// 4 CLOSINGS — Permission line LSSI (legal, idéntica a restaurantes)
const CLOSINGS = [
  () => `Si os encaja, contestad con un "sí" o un emoji y os doy detalles por WhatsApp. Si no es lo vuestro, contestad "no" y os borro de la lista al instante. Sin rencor.`,
  () => `Si os interesa, decidme "ok" y seguimos por WhatsApp con más calma. Si no, decid "borrar" y os quito de aquí mismo.`,
  () => `¿Os encaja? Decid "sí" y hablamos por WhatsApp. ¿Paso? Decid "no" y olvidamos esto. Las dos respuestas son perfectas.`,
  () => `Si pinta bien, contestad esto y seguimos por WhatsApp. Si no, contestad "stop" y desaparezco. Sin más preguntas.`,
];

// 4 SIGN-OFFS
const SIGNOFFS = [
  () => `Saludos cordiales,\nPablo`,
  () => `Un abrazo,\nPablo`,
  () => `Gracias por leer hasta aquí,\nPablo`,
  () => `Hablamos,\nPablo`,
];

// 6 POSTSCRIPTS
const POSTSCRIPTS = [
  () => `P.D. Echadle un ojo desde el móvil, ya veréis. Carga en 1-2 segundos y se mueve sola.`,
  () => `P.D. La tienda real con checkout, dominio y todo, son 290€ alta + 49€/mes mantenimiento. Sin permanencias.`,
  () => `P.D. Si tenéis WordPress/Wix antiguo, esto va 5x más rápido y convierte mucho más en mobile.`,
  () => `P.D. Tengo 12 ratos abiertos esta semana. Si pinta, lo agendamos en 30 segundos por WA.`,
  () => `P.D. La diferencia entre una tienda artesana que vende 200€/mes y una que vende 2.000€/mes muchas veces es solo la web. En serio.`,
  () => `P.D. Si os mola la versión, en una llamada de 20 min os enseño cómo conectarla a Stripe + Bizum + Correos para que empiece a vender de verdad.`,
];

export function buildEmail(lead, demoUrl) {
  const slug = lead.slug;
  // Producto top scrapeado (primer producto de la lista) para personalizar
  const topProduct = lead.products && lead.products[0]?.name?.toLowerCase() || null;
  const productPlural = topProduct ? topProduct.replace(/^(el |la |los |las )/, '') : null;

  const subjectIdx = hash(slug + ':subject') % SUBJECTS.length;
  const subject = SUBJECTS[subjectIdx](lead.name, lead.city, productPlural);

  const preheaderIdx = hash(slug + ':preheader') % PREHEADERS.length;
  const preheader = PREHEADERS[preheaderIdx](lead.name);

  const greeting = pick(slug, ':greeting', GREETINGS)(lead.name);
  const opening = pick(slug, ':opening', OPENINGS)(lead.city, lead.style, productPlural);
  const hook = pick(slug, ':hook', HOOKS)();
  const photoNote = pick(slug, ':photos', PHOTO_NOTES)();
  const closing = pick(slug, ':closing', CLOSINGS)();
  const signoff = pick(slug, ':signoff', SIGNOFFS)();
  const postscript = pick(slug, ':ps', POSTSCRIPTS)();

  return { subject, preheader, subjectIdx, preheaderIdx, greeting, opening, hook, photoNote, closing, signoff, postscript };
}

// === Paletas (4 estilos por slug) ===
const PALETTES = [
  { // gold-classic
    primary: '#b8893d', dark: '#8a6428', deep: '#1a1410', accent: '#e8c878',
    cream: '#f5ede0', cream_warm: '#ebe0c8', primary_rgb: '184, 137, 61',
  },
  { // silver-modern
    primary: '#8a96a8', dark: '#5e6878', deep: '#161a20', accent: '#d6dde8',
    cream: '#f0f1f4', cream_warm: '#e4e6eb', primary_rgb: '138, 150, 168',
  },
  { // rose-bohemian
    primary: '#c4848e', dark: '#9a606a', deep: '#1c1216', accent: '#f0c8d0',
    cream: '#f7e8eb', cream_warm: '#ecd6db', primary_rgb: '196, 132, 142',
  },
  { // emerald-natural
    primary: '#5a8678', dark: '#3e5e54', deep: '#101a16', accent: '#a8d0c0',
    cream: '#e8f0ec', cream_warm: '#d4e0d8', primary_rgb: '90, 134, 120',
  },
];

export function pickPalette(slug) {
  return PALETTES[hash(slug + ':palette') % PALETTES.length];
}

export function buildReviews(slug) {
  // Pool de reviews creíbles con nombres españoles + ciudades
  const POOL = [
    { name: 'Ana M.', city: 'Madrid', text: 'Compré la pulsera para mi madre y se ha enamorado. Calidad brutal y trato cercano.', stars: 5 },
    { name: 'Carlos L.', city: 'Sevilla', text: 'Encargué un anillo personalizado y superó mis expectativas. Vuelvo seguro.', stars: 5 },
    { name: 'Marta R.', city: 'Valencia', text: 'Me llegó perfecto, en una caja preciosa. Se nota el oficio detrás.', stars: 5 },
    { name: 'Lucía P.', city: 'Bilbao', text: 'Llevo 3 piezas suyas. Diseño único y duraderas. Mejor que cadenas grandes.', stars: 5 },
    { name: 'Sara J.', city: 'Granada', text: 'Atención de 10. Me asesoraron por WhatsApp y acerté con el regalo.', stars: 5 },
    { name: 'Daniel V.', city: 'Barcelona', text: 'Compré online sin haber visto la pieza y vino mejor que en las fotos. Repetiré.', stars: 5 },
    { name: 'Cristina F.', city: 'Málaga', text: 'Calidad-precio increíble para joyería artesana. Se nota que cuidan cada detalle.', stars: 5 },
    { name: 'Javier T.', city: 'Zaragoza', text: 'Pedí dos para regalos y a las dos personas les encantó. Diseños muy especiales.', stars: 4 },
  ];
  // Pick 6 deterministicas según slug
  const indices = [];
  for (let i = 0; i < 6; i++) {
    const idx = hash(slug + ':review:' + i) % POOL.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  // Si menos de 6 únicos, completar
  for (let i = 0; indices.length < 6 && i < POOL.length; i++) {
    if (!indices.includes(i)) indices.push(i);
  }
  return indices.map((i) => POOL[i]);
}
