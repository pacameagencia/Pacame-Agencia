/**
 * Sistema de variantes de copy con seed determinístico por lead.
 * Cada email es único pero reproducible (si re-ejecutas pipeline, mismo lead = mismo email).
 *
 * Filosofía: "human writer in a hurry" — variaciones naturales, no robóticas.
 * Un humano escribiendo a 20 leads en una mañana cambia el orden de párrafos,
 * usa sinónimos, mete una P.D. distinta cada vez.
 */

// Hash determinístico (string → entero)
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Pick determinístico de un array según seed (slug + sufijo)
const pick = (slug, suffix, arr) => arr[hash(slug + suffix) % arr.length];

// ─────────────────────────────────────────────────────────────────
// SUBJECTS — 8 variantes, todas con tono cercano, sin spam triggers
// ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  (name) => `Os hice una web a ${name} (sin que la pidierais)`,
  (name) => `${name} — esto es lo que se me ocurrió`,
  (name) => `Una propuesta de web para ${name}`,
  (name) => `Hola ${name}, mira esto cuando tengas un rato`,
  (name) => `Me he tomado la libertad de hacer algo para ${name}`,
  (name) => `Para el equipo de ${name} (no os asustéis)`,
  (name) => `${name} — propuesta de web sin compromiso`,
  (name) => `Echadle un ojo a esto, equipo de ${name}`,
];

// ─────────────────────────────────────────────────────────────────
// SALUDOS — 5 variantes
// ─────────────────────────────────────────────────────────────────
const GREETINGS = [
  (name) => `Hola, equipo de ${name}!`,
  (name) => `¡Hola ${name}!`,
  (name) => `Buenas, equipo de ${name},`,
  (name) => `Hola ${name},`,
  (name) => `Saludos, gente de ${name},`,
];

// ─────────────────────────────────────────────────────────────────
// OPENINGS — frase de cómo llegamos al local. 6 variantes según ciudad/tipo.
// ─────────────────────────────────────────────────────────────────
const OPENINGS = [
  (city, type) => `Soy Pablo, de PACAME — agencia digital pequeña, un fundador, sin intermediarios. Andaba mirando ${typeLabelPlural(type)} en ${city || 'la zona'} y me llamó la atención el vuestro.`,
  (city, type) => `Soy Pablo. Llevo PACAME, una agencia digital de uno solo. Vi vuestro sitio buscando ${typeLabelPlural(type)} en ${city || 'la zona'} y me dije: a estos hay que escribirles.`,
  (city, type) => `Pablo, de PACAME. Agencia digital pequeña, sin intermediarios. Vuestro sitio salió buscando ${typeLabelPlural(type)} ${city ? `en ${city}` : 'por aquí'} y se quedó conmigo el resto del día.`,
  (city, type) => `Soy Pablo (agencia PACAME, un fundador, sin equipo gigante). Vi vuestro sitio buscando ${typeLabelPlural(type)} ${city ? `por ${city}` : 'por la zona'} y me ha dado por escribiros.`,
  (city, type) => `Pablo, agencia PACAME. Esto va a sonar raro pero ahí va: estaba revisando la oferta de ${typeLabelPlural(type)} ${city ? `en ${city}` : 'en la zona'} y vuestro nombre se me quedó.`,
  (city, type) => `Soy Pablo, llevo una agencia digital pequeña que se llama PACAME. Andaba viendo ${typeLabelPlural(type)} ${city ? `de ${city}` : 'del entorno'} y os tengo fichados desde hace rato.`,
];

function typeLabelPlural(type) {
  const t = (type || '').toLowerCase();
  if (t === 'pub') return 'cervecerías y locales';
  if (t === 'cafe') return 'cafeterías';
  if (t === 'bar') return 'bares y mesones';
  if (t === 'fast_food') return 'sitios de comida rápida';
  return 'restaurantes';
}

// ─────────────────────────────────────────────────────────────────
// HOOK — frase que enlaza al "os hice una web". 4 variantes
// ─────────────────────────────────────────────────────────────────
const HOOKS = [
  () => `Y me ha dado por hacer algo: os he montado una propuesta de web sin que la pidierais. Echadle un vistazo aquí (mejor desde el móvil):`,
  () => `Total, que me he sentado un rato y os he hecho una propuesta de web. Sin pedírosla, lo sé. Aquí está, mirad cuando podáis:`,
  () => `Y como tenía un rato muerto, os he montado una propuesta de web. Sin compromiso de nada. Echadle un ojo:`,
  () => `Conclusión: os he hecho una web a modo de propuesta. Sin pedírmelo. Aquí está, decidme qué pensáis:`,
];

// ─────────────────────────────────────────────────────────────────
// FOTOS DISCLAIMER — 3 variantes
// ─────────────────────────────────────────────────────────────────
const PHOTO_NOTES = [
  () => `Una cosa importante sobre las fotos: las que veis NO son del local. Puse placeholders elegantes y fotos genéricas porque por privacidad y derechos de imagen NO uso fotos vuestras sin permiso. Si os mola la web, me mandáis vuestras fotos reales (interior, platos, equipo) y las pongo. Queda muchísimo mejor con vuestras fotos.`,
  () => `Aviso sobre las fotos: las que aparecen NO son vuestras. Usé placeholders y stock genérico — no quiero meter fotos del local sin vuestro OK explícito (privacidad y derechos de imagen). Si seguimos adelante, me pasáis 8-12 fotos reales y la web cambia 1000 por ciento.`,
  () => `Las fotos que veis no son del local — son placeholders y stock. Por respeto a vuestra privacidad y derechos de imagen no uso fotos vuestras sin permiso. Cuando pasemos a hacer la web de verdad, me mandáis las vuestras y la diferencia es brutal.`,
];

// ─────────────────────────────────────────────────────────────────
// CLOSINGS — 4 variantes
// ─────────────────────────────────────────────────────────────────
const CLOSINGS = [
  () => `Si no es lo vuestro, no pasa nada — borráis este email y aquí no ha pasado nada.`,
  () => `Si no os encaja, sin problema — borráis y olvidamos que esto pasó.`,
  () => `Y si no es para vosotros, perfecto: no pasa nada por probar.`,
  () => `Si no os interesa, lo dejamos aquí. Sin rencor.`,
];

// ─────────────────────────────────────────────────────────────────
// SIGN-OFFS — 4 variantes
// ─────────────────────────────────────────────────────────────────
const SIGNOFFS = [
  () => `Un saludo,\nPablo`,
  () => `Saludos cordiales,\nPablo`,
  () => `Un abrazo,\nPablo`,
  () => `Hasta luego,\nPablo`,
];

// ─────────────────────────────────────────────────────────────────
// POSTSCRIPTS — 6 variantes, con tono cercano
// ─────────────────────────────────────────────────────────────────
const POSTSCRIPTS = [
  () => `P.D. Si abrís el enlace desde el móvil se ve bastante mejor que en el ordenador. Tarda 1-2 segundos en cargar.`,
  () => `P.D. Mejor desde el móvil — la web está pensada mobile-first y se navega entera con el dedo.`,
  () => `P.D. Echadle un ojo desde el móvil, ya veréis. Carga en 1-2 segundos y se mueve sola.`,
  () => `P.D. La web la veis mejor desde el móvil. Tampoco es nada del otro mundo abrirla, son 2 segundos.`,
  () => `P.D. La diseñé pensando en móvil — lo veis con el dedo, sin clicks raros.`,
  () => `P.D. Si la abrís desde el móvil cargará rapidísimo y se navega genial.`,
];

// ─────────────────────────────────────────────────────────────────
// MENCIÓN CIUDAD — frase opcional adicional según conozcamos algo de la zona
// ─────────────────────────────────────────────────────────────────
const CITY_MENTIONS = {
  Madrid: 'Madrid no necesita explicación — la oferta es brutal pero también la competencia. Con web cuidada se nota.',
  Barcelona: 'Barcelona tiene mucho restaurante pero no tantos con web bien hecha. Hueco hay.',
  Sevilla: 'Sevilla con la calor que viene tiene a la gente buscando terraza online. Web mobile-first cuenta.',
  Granada: 'Granada está llena de gente buscando dónde comer al móvil. La web bien hecha se nota en reservas.',
  Bilbao: 'Bilbao con el turismo que se mueve, la web es el primer contacto. Vale la pena tenerla cuidada.',
  'Donostia / San Sebastián': 'Donostia es Donostia. Pero también ahí el turismo busca por web antes de ir.',
  Valencia: 'València mueve mucho cliente buscando online. Mobile-first es ya básico.',
  València: 'València mueve mucho cliente buscando online. Mobile-first es ya básico.',
  Málaga: 'Málaga con la cantidad de turismo que mete es golf de oportunidad para webs cuidadas.',
  Santander: 'Santander tiene clientela fija pero también mucho turista buscando por web. Web cuidada vende.',
  Pamplona: 'En Pamplona la gente busca cada vez más por web. Tener una bien hecha se nota.',
  'Pamplona/Iruña': 'En Pamplona la gente busca cada vez más por web. Tener una bien hecha se nota.',
  Valladolid: 'Valladolid tiene mucha clientela fija pero también mucho que pasa por web antes.',
  Toledo: 'Toledo turismo todo el año. La web es lo que ven antes de cruzar la puerta.',
  Córdoba: 'Córdoba con turismo todo el año, lo primero que ven los de fuera es la web.',
  Salamanca: 'Salamanca con tanto estudiante y turista, la web es lo primero que mira la gente.',
  Lleida: 'Lleida tiene tráfico de paso constante. Web bien hecha = más reservas.',
  Jaén: 'Jaén tiene mucho que ofrecer y pocas webs cuidadas. Hueco grande.',
};

// ─────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────
export function buildEmail(lead, demoUrl) {
  const slug = lead.slug;
  const subject = pick(slug, ':subject', SUBJECTS)(lead.name);
  const greeting = pick(slug, ':greeting', GREETINGS)(lead.name);
  const opening = pick(slug, ':opening', OPENINGS)(lead.city, lead.type);
  const hook = pick(slug, ':hook', HOOKS)();
  const photoNote = pick(slug, ':photos', PHOTO_NOTES)();
  const closing = pick(slug, ':closing', CLOSINGS)();
  const signoff = pick(slug, ':signoff', SIGNOFFS)();
  const postscript = pick(slug, ':ps', POSTSCRIPTS)();
  const cityMention = lead.city && CITY_MENTIONS[lead.city] ? CITY_MENTIONS[lead.city] : null;

  return { subject, greeting, opening, hook, photoNote, closing, signoff, postscript, cityMention };
}

// Variantes de carta — rota 3-4 platos por lead para evitar carta idéntica
export function rotateMenu(menu, slug) {
  const ROTATION_POOL = {
    entrantes: [
      { name: 'Croquetas variadas (6 ud)', price: '8,90 €', desc: 'Surtido de croquetas: jamón, queso azul y boletus.', tags: ['Casero'] },
      { name: 'Boquerones al limón', price: '7,80 €', desc: 'Boquerones frescos con limón, perejil y aceite de oliva.', tags: ['Fresco'] },
      { name: 'Ensaladilla de la casa', price: '6,50 €', desc: 'Ensaladilla rusa con atún y huevo cocido. Receta familiar.', tags: ['Casero'] },
      { name: 'Gazpacho andaluz', price: '5,80 €', desc: 'Gazpacho casero con tomate de la huerta. Refrescante.', tags: ['Vegetariano'] },
      { name: 'Salmorejo cordobés', price: '6,20 €', desc: 'Salmorejo con jamón y huevo cocido picado por encima.', tags: ['Andaluz'] },
      { name: 'Pulpo a la gallega', price: '14,50 €', desc: 'Pulpo cocido al punto con pimentón dulce y patata.', tags: ['Marisco'] },
    ],
    principales: [
      { name: 'Lubina al horno', price: '17,80 €', desc: 'Lubina entera al horno con patatas panaderas y limón.', tags: ['Pescado'] },
      { name: 'Carrillera ibérica al vino tinto', price: '15,90 €', desc: 'Carrillera ibérica braseada lenta al vino tinto.', tags: ['Especialidad'] },
      { name: 'Arroz negro con calamares', price: '14,50 €', desc: 'Arroz con tinta de calamar y calamares troceados.', tags: ['Arroz'] },
      { name: 'Lasaña de la casa', price: '13,00 €', desc: 'Lasaña casera con bechamel hecha en casa y carne picada.', tags: ['Casero'] },
      { name: 'Risotto de setas', price: '13,50 €', desc: 'Risotto cremoso de boletus con queso parmesano.', tags: ['Vegetariano'] },
      { name: 'Bacalao al ajoarriero', price: '16,80 €', desc: 'Bacalao desmigado con tomate, pimiento y huevo.', tags: ['Bacalao'] },
    ],
    postres: [
      { name: 'Crema catalana', price: '4,50 €', desc: 'Crema casera con costra de azúcar caramelizado.', tags: [] },
      { name: 'Brownie con helado', price: '5,50 €', desc: 'Brownie de chocolate negro con helado de vainilla.', tags: ['Chocolate'] },
      { name: 'Tiramisú casero', price: '5,00 €', desc: 'Tiramisú italiano hecho en casa con mascarpone fresco.', tags: ['Italiano'] },
      { name: 'Sorbete de limón al cava', price: '4,80 €', desc: 'Sorbete de limón con un chorrito de cava brut.', tags: ['Refrescante'] },
    ],
  };

  // Mezclamos: para cada categoría, sustituye 2 platos del menú base por 2 del pool
  const result = JSON.parse(JSON.stringify(menu));
  for (const cat of ['entrantes', 'principales', 'postres']) {
    const pool = ROTATION_POOL[cat];
    if (!result[cat] || result[cat].length < 4) continue;
    const seedBase = hash(slug + ':' + cat);
    const swapIndices = [seedBase % 4, (seedBase + 7) % 4];
    swapIndices.forEach((idx, i) => {
      const poolItem = pool[(seedBase + i * 3) % pool.length];
      result[cat][idx] = poolItem;
    });
  }
  return result;
}
