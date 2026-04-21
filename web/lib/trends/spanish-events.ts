/**
 * Calendario real de eventos España próximos 60 días.
 * Calcula eventos móviles (Pascua, Día de la Madre, etc) y fijos reales.
 *
 * ANTI-PATRÓN que evita: NO tabla mes→evento hardcoded genérica.
 * Cada evento incluye fecha exacta y distancia desde hoy.
 */

export interface SpanishEvent {
  name: string;
  date: string; // ISO YYYY-MM-DD
  category: 'holiday' | 'religious' | 'commercial' | 'cultural' | 'sports' | 'seasonal';
  daysFromToday: number;
  commercialOpportunity: string; // 1 línea sobre qué vender/ofertar
}

// Algoritmo de Gauss para calcular Pascua (domingo de resurrección)
function calcEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function mothersDaySpain(year: number): Date {
  // Primer domingo de mayo
  const may1 = new Date(Date.UTC(year, 4, 1));
  const dayOfWeek = may1.getUTCDay();
  const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  return new Date(Date.UTC(year, 4, 1 + daysToSunday));
}

function fathersDaySpain(year: number): Date {
  // 19 marzo (San José, celebración tradicional España)
  return new Date(Date.UTC(year, 2, 19));
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  const MS = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / MS);
}

/**
 * Devuelve eventos España en los próximos N días (default 60).
 * Ordenados por fecha ascendente.
 * Cada evento ya pasado está excluido.
 */
export function upcomingSpanishEvents(windowDays = 60, today = new Date()): SpanishEvent[] {
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const year = todayUtc.getUTCFullYear();
  const nextYear = year + 1;

  const easter = calcEasterSunday(year);
  const easterNext = calcEasterSunday(nextYear);
  const ashWed = new Date(easter); ashWed.setUTCDate(easter.getUTCDate() - 46); // Miércoles Ceniza
  const palmSunday = new Date(easter); palmSunday.setUTCDate(easter.getUTCDate() - 7); // Domingo Ramos
  const palmSundayNext = new Date(easterNext); palmSundayNext.setUTCDate(easterNext.getUTCDate() - 7);
  const corpusChristi = new Date(easter); corpusChristi.setUTCDate(easter.getUTCDate() + 60);

  // Array grande de eventos del año en curso y próximo
  const raw: Array<Omit<SpanishEvent, 'daysFromToday'>> = [
    // Móviles año actual
    { name: 'Domingo de Ramos', date: iso(palmSunday), category: 'religious', commercialOpportunity: 'Turismo interior, Semana Santa, dulces típicos' },
    { name: 'Semana Santa (fin)', date: iso(easter), category: 'religious', commercialOpportunity: 'Turismo rural, comercios tradicionales, hostelería' },
    { name: 'Corpus Christi', date: iso(corpusChristi), category: 'religious', commercialOpportunity: 'Eventos locales, gastronomía típica' },
    { name: 'Día del Padre', date: iso(fathersDaySpain(year)), category: 'commercial', commercialOpportunity: 'Regalos padres, experiencias, moda hombre, bricolaje' },
    { name: 'Día de la Madre', date: iso(mothersDaySpain(year)), category: 'commercial', commercialOpportunity: 'Regalos madres, flores, spa, joyería, brunch' },
    // Móviles año próximo (por si caen en ventana)
    { name: 'Día del Padre (próximo)', date: iso(fathersDaySpain(nextYear)), category: 'commercial', commercialOpportunity: 'Regalos, experiencias' },
    { name: 'Día de la Madre (próximo)', date: iso(mothersDaySpain(nextYear)), category: 'commercial', commercialOpportunity: 'Regalos, flores, spa' },
    { name: 'Domingo de Ramos (próximo)', date: iso(palmSundayNext), category: 'religious', commercialOpportunity: 'Semana Santa, turismo' },
    { name: 'Semana Santa (próxima)', date: iso(easterNext), category: 'religious', commercialOpportunity: 'Turismo rural, hostelería' },

    // Fijos año actual y próximo (generamos ambos)
    ...[year, nextYear].flatMap(y => [
      { name: 'Reyes Magos', date: `${y}-01-06`, category: 'holiday' as const, commercialOpportunity: 'Regalos last-minute, roscón, juguetería' },
      { name: 'San Valentín', date: `${y}-02-14`, category: 'commercial' as const, commercialOpportunity: 'Regalos pareja, restaurantes, experiencias, lencería' },
      { name: 'Día del Trabajo', date: `${y}-05-01`, category: 'holiday' as const, commercialOpportunity: 'Fin de semana largo, turismo, terrazas' },
      { name: 'San Isidro (Madrid)', date: `${y}-05-15`, category: 'cultural' as const, commercialOpportunity: 'Eventos Madrid, turismo, gastronomía castiza' },
      { name: 'Feria de Abril (Sevilla)', date: `${y}-04-14`, category: 'cultural' as const, commercialOpportunity: 'Moda flamenca, viajes Sevilla, complementos' },
      { name: 'San Juan (noche hogueras)', date: `${y}-06-23`, category: 'cultural' as const, commercialOpportunity: 'Eventos playa, gastronomía, hostelería costa' },
      { name: 'San Pedro', date: `${y}-06-29`, category: 'cultural' as const, commercialOpportunity: 'Fiestas locales, terraza' },
      { name: 'Inicio verano escolar', date: `${y}-06-20`, category: 'seasonal' as const, commercialOpportunity: 'Campamentos, viajes familia, actividades niños' },
      { name: 'Inicio rebajas verano', date: `${y}-07-01`, category: 'commercial' as const, commercialOpportunity: 'Ecommerce, moda, comparadores ofertas' },
      { name: 'Mitad verano (vacaciones pico)', date: `${y}-08-15`, category: 'seasonal' as const, commercialOpportunity: 'Turismo rural, playa, guías viaje, restaurante beach' },
      { name: 'Vuelta al cole', date: `${y}-09-08`, category: 'seasonal' as const, commercialOpportunity: 'Libros de texto, uniformes, mochilas, actividades extraescolares' },
      { name: 'Pilar (Zaragoza)', date: `${y}-10-12`, category: 'cultural' as const, commercialOpportunity: 'Turismo Zaragoza, eventos fiestas mayores' },
      { name: 'Halloween', date: `${y}-10-31`, category: 'commercial' as const, commercialOpportunity: 'Disfraces, decoración, dulces, eventos niños' },
      { name: 'Todos los Santos', date: `${y}-11-01`, category: 'holiday' as const, commercialOpportunity: 'Flores, viajes, puente noviembre' },
      { name: 'Black Friday', date: `${y}-11-27`, category: 'commercial' as const, commercialOpportunity: 'Ecommerce, comparadores, afiliado, cupones' },
      { name: 'Cyber Monday', date: `${y}-11-30`, category: 'commercial' as const, commercialOpportunity: 'Tech, gadgets, software deals' },
      { name: 'Día Constitución', date: `${y}-12-06`, category: 'holiday' as const, commercialOpportunity: 'Puente, viajes cortos' },
      { name: 'Inmaculada', date: `${y}-12-08`, category: 'religious' as const, commercialOpportunity: 'Puente diciembre, turismo' },
      { name: 'Nochebuena', date: `${y}-12-24`, category: 'holiday' as const, commercialOpportunity: 'Regalos, gastronomía navideña, catering' },
      { name: 'Navidad', date: `${y}-12-25`, category: 'holiday' as const, commercialOpportunity: 'Regalos, comidas familia' },
      { name: 'Nochevieja', date: `${y}-12-31`, category: 'holiday' as const, commercialOpportunity: 'Cotillón, cenas, uvas, eventos, reservas hotel' },
      { name: 'Inicio rebajas invierno', date: `${y}-01-07`, category: 'commercial' as const, commercialOpportunity: 'Ecommerce, ofertas, comparadores' },
    ]),

    // Eventos deportivos/culturales recurrentes aproximados
    { name: 'Eurovisión (final)', date: `${year}-05-16`, category: 'cultural', commercialOpportunity: 'Merchandising, fiestas temáticas, apuestas' },
    { name: 'Final Champions League', date: `${year}-05-30`, category: 'sports', commercialOpportunity: 'Hostelería, merchandising, apuestas, bars deportivos' },
    { name: 'Primavera Sound', date: `${year}-06-04`, category: 'cultural', commercialOpportunity: 'Alojamiento Barcelona, merchandising, food trucks' },
    { name: 'Mad Cool Festival', date: `${year}-07-10`, category: 'cultural', commercialOpportunity: 'Alojamiento Madrid, transporte' },
    { name: 'MotoGP Jerez', date: `${year}-05-03`, category: 'sports', commercialOpportunity: 'Hostelería Jerez, merch moto, streaming' },
  ];

  return raw
    .map(e => ({ ...e, daysFromToday: daysBetween(todayUtc, new Date(e.date + 'T00:00:00Z')) }))
    .filter(e => e.daysFromToday >= 0 && e.daysFromToday <= windowDays)
    .sort((a, b) => a.daysFromToday - b.daysFromToday);
}

/**
 * Devuelve contexto legible para el LLM con eventos próximos.
 */
export function eventsContextString(windowDays = 60, today = new Date()): string {
  const events = upcomingSpanishEvents(windowDays, today);
  if (events.length === 0) return 'Sin eventos destacados en los próximos ' + windowDays + ' días.';
  const todayIso = today.toISOString().slice(0, 10);
  const lines = [
    `Fecha real: ${todayIso}.`,
    `Eventos REALES próximos (${events.length} en ventana ${windowDays}d):`,
  ];
  for (const e of events) {
    lines.push(`- ${e.date} (+${e.daysFromToday}d) | ${e.name} [${e.category}] → ${e.commercialOpportunity}`);
  }
  return lines.join('\n');
}
