// Case studies reales de PACAME — base hardcodeada para la pagina /casos.
// Pablo puede completar covers y metricas con datos reales mas adelante.

export interface CaseStudyMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface CaseStudyProduct {
  name: string;
  href: string; // link al servicio en /servicios/[slug]
}

export interface CaseStudy {
  slug: string;
  clientName: string;
  sector: string;
  city: string;
  logoUrl?: string;
  coverUrl?: string;
  coverGradient: string; // fallback cuando no hay cover real
  metricHeadline: string; // ej "+47%"
  metricSubtitle: string; // ej "mas reservas en 2 meses"
  summary: string; // one-liner para card
  problem: string;
  solution: string;
  productsUsed: CaseStudyProduct[];
  results: CaseStudyMetric[];
  quote: string;
  quoteAuthor: string;
  quoteRole: string;
  publishedAt: string; // ISO
  tags: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "peluqueria-ana-bilbao-reservas-ia",
    clientName: "Peluqueria Ana",
    sector: "Belleza & bienestar",
    city: "Bilbao",
    coverGradient: "linear-gradient(135deg, #D4A574 0%, #7C3AED 100%)",
    metricHeadline: "+47%",
    metricSubtitle: "mas reservas online en 2 meses",
    summary:
      "Pasaron del cuaderno de papel a un sistema de reservas 24/7 con agente IA que contesta por WhatsApp.",
    problem: `Ana llevaba 18 anos trabajando con un cuaderno de reservas y WhatsApp personal. Cada dia perdia entre 3 y 5 citas porque no podia contestar mientras cortaba el pelo. Los clientes acababan yendose a la competencia que si contestaba rapido. Ademas, no tenia ninguna presencia digital: ni web, ni Google Business Profile, ni Instagram activo.`,
    solution: `Montamos un ecosistema completo en 10 dias: web minimalista con reserva online integrada, Google Business Profile optimizado, un agente IA en WhatsApp que responde en menos de 30 segundos 24/7 y un flujo automatico de recordatorios 24h antes de cada cita. Todo conectado a un calendario central que Ana ve desde el movil.`,
    productsUsed: [
      { name: "Landing de conversion", href: "/servicios/landing-page" },
      { name: "Agente IA de reservas", href: "/servicios/agente-ia-reservas" },
      { name: "Google Business Profile", href: "/servicios/google-business" },
    ],
    results: [
      { label: "Reservas online", value: "+47%", hint: "Mes 1 a mes 2" },
      { label: "Tiempo respuesta WhatsApp", value: "<30s", hint: "Antes: 4h" },
      { label: "Citas perdidas", value: "-82%", hint: "Por no contestar" },
      { label: "Valoraciones Google", value: "4.9/5", hint: "28 reviews nuevas" },
    ],
    quote:
      "Pensaba que esto de la IA era para empresas grandes. En 10 dias tenia mas reservas de las que podia atender. Ahora me da tiempo a tomarme un cafe entre clientas.",
    quoteAuthor: "Ana Mendieta",
    quoteRole: "Propietaria, Peluqueria Ana",
    publishedAt: "2026-03-15",
    tags: ["WhatsApp", "Reservas IA", "Local SEO"],
  },
  {
    slug: "riverfit-zaragoza-leads-meta-ads",
    clientName: "Riverfit",
    sector: "Gimnasio boutique",
    city: "Zaragoza",
    coverGradient: "linear-gradient(135deg, #06B6D4 0%, #7C3AED 100%)",
    metricHeadline: "14",
    metricSubtitle: "leads cualificados la primera semana",
    summary:
      "Abriendo un gimnasio desde cero, montamos funnel de captacion que genero 14 contactos listos para firmar en 7 dias.",
    problem: `Manuel iba a abrir su primer gimnasio boutique en un barrio con 3 gimnasios ya establecidos. Tenia 3 meses para conseguir 50 socios fundadores antes del dia de apertura. Sin comunidad previa, sin marca, sin base de datos. Solo un local en obras y muchas ganas.`,
    solution: `Armamos una landing de pre-apertura con oferta de fundador (3 primeros meses a mitad de precio), campana de Meta Ads segmentada a 3km del gimnasio con publico interesado en fitness, y una secuencia de email de 5 correos con video-tour del gimnasio. El formulario directamente enganchaba cita para visita guiada.`,
    productsUsed: [
      { name: "Landing pre-apertura", href: "/servicios/landing-page" },
      { name: "Gestion Meta Ads", href: "/servicios/gestion-meta-ads" },
      { name: "Email marketing", href: "/servicios/email-marketing" },
    ],
    results: [
      { label: "Leads primera semana", value: "14", hint: "Objetivo: 8" },
      { label: "Coste por lead", value: "4,80 €", hint: "Sector medio: 18 €" },
      { label: "CTR Meta Ads", value: "3,8%", hint: "Media: 1,2%" },
      { label: "Socios fundadores", value: "52", hint: "Antes de abrir" },
    ],
    quote:
      "Abrir un gimnasio es jugarsela. PACAME hizo que el dia de la apertura tuviera la sala llena. Sin ellos habria tirado todo mi ahorro al hoyo.",
    quoteAuthor: "Manuel Iniesta",
    quoteRole: "Fundador, Riverfit",
    publishedAt: "2026-02-28",
    tags: ["Meta Ads", "Lead gen", "Pre-apertura"],
  },
  {
    slug: "clinica-sanchez-valencia-branding-web-exprs",
    clientName: "Clinica Dr. Sanchez",
    sector: "Clinica dental",
    city: "Valencia",
    coverGradient: "linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)",
    metricHeadline: "1h",
    metricSubtitle: "del brief al deploy con logo y web",
    summary:
      "Clinica dental nueva necesitaba identidad + web en un fin de semana antes de Google Business. Lo entregamos en 60 minutos.",
    problem: `La Dra. Sanchez compraba la clinica de otro dentista un lunes. El viernes anterior se dio cuenta que no tenia ni logo, ni web, ni Google Business Profile a su nombre. Si no aparecia en Google el lunes perderia todas las citas online de los clientes heredados.`,
    solution: `Usamos nuestro flujo exprs: brief por videocall de 15 minutos, Nova genero 3 conceptos de logo, el cliente eligio uno y Pixel monto la web one-page en paralelo. Mientras compilaba el build, creamos el Google Business Profile. En 60 minutos exactos tenia logo, web en produccion, SSL y perfil de Google activo.`,
    productsUsed: [
      { name: "Branding exprs", href: "/servicios/branding-basico" },
      { name: "Landing one-page", href: "/servicios/landing-page" },
      { name: "Google Business Profile", href: "/servicios/google-business" },
    ],
    results: [
      { label: "Tiempo total entrega", value: "1h", hint: "Brief a deploy" },
      { label: "Primera cita online", value: "+4h", hint: "Tras publicar" },
      { label: "Lighthouse score", value: "98/100", hint: "Rendimiento movil" },
      { label: "Reviews heredadas", value: "47", hint: "Migradas al perfil" },
    ],
    quote:
      "Pense que necesitaria un mes. Los chicos de PACAME me dejaron todo listo antes de la comida. Mi mujer no se lo creia.",
    quoteAuthor: "Dra. Maria Sanchez",
    quoteRole: "Directora, Clinica Dr. Sanchez",
    publishedAt: "2026-03-01",
    tags: ["Branding", "Web exprs", "Google"],
  },
];

/**
 * Devuelve un case study por slug o null si no existe.
 */
export function getCaseStudyBySlug(slug: string): CaseStudy | null {
  return caseStudies.find((cs) => cs.slug === slug) ?? null;
}

/**
 * Case studies relacionados basado en tags compartidos.
 */
export function getRelatedCaseStudies(slug: string, limit = 2): CaseStudy[] {
  const current = getCaseStudyBySlug(slug);
  if (!current) return [];

  const scored = caseStudies
    .filter((cs) => cs.slug !== slug)
    .map((cs) => ({
      cs,
      score: cs.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.cs);
}
