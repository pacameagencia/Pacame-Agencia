/**
 * Nichos rotativos para captacion autonoma.
 * El cron diario elige uno segun dia de año (rotacion deterministica).
 *
 * Cada nicho apunta a 2-3 productos PACAME que resuelven su dolor tipico.
 * El email personalizado menciona esos productos.
 */

export interface Niche {
  slug: string;
  label: string;
  searchQuery: string;            // query exacta para Apify Google Maps
  location: string;               // 'Madrid, Spain' formato Apify
  painPoints: string[];           // dolores tipicos para redactar hook
  targetProductSlugs: string[];   // productos a ofrecer (orden de preferencia)
  entryProductSlug: string;       // primer producto a mencionar (el mas barato/urgente)
  subscriptionHint: "start" | "pro" | "growth";
  sector: string;
}

export const NICHES: Niche[] = [
  {
    slug: "fisios-madrid",
    label: "Fisioterapeutas en Madrid",
    searchQuery: "fisioterapia",
    location: "Madrid, Spain",
    painPoints: [
      "Pacientes que no repiten sesion",
      "Competencia con clinicas grandes sin diferenciacion digital",
      "Web desactualizada sin reservas online",
      "Google Business sin resenas recientes",
    ],
    targetProductSlugs: ["google-business-setup", "landing-1page", "post-instagram"],
    entryProductSlug: "google-business-setup",
    subscriptionHint: "pro",
    sector: "salud",
  },
  {
    slug: "dentistas-valencia",
    label: "Clinicas dentales en Valencia",
    searchQuery: "clinica dental",
    location: "Valencia, Spain",
    painPoints: [
      "Ficha Google sin fotos ni horarios actualizados",
      "Pacientes no saben que tratamientos ofreces",
      "Web antigua que no carga bien en movil",
      "Sin presencia Instagram",
    ],
    targetProductSlugs: ["google-business-setup", "landing-1page", "bio-instagram"],
    entryProductSlug: "google-business-setup",
    subscriptionHint: "pro",
    sector: "salud",
  },
  {
    slug: "academias-idiomas-sevilla",
    label: "Academias de idiomas en Sevilla",
    searchQuery: "academia ingles",
    location: "Sevilla, Spain",
    painPoints: [
      "Matriculas caen en invierno",
      "Sin landing page especifica por nivel/edad",
      "Padres comparan en Google y tu ficha no compite",
      "Instagram abandonado",
    ],
    targetProductSlugs: ["landing-1page", "post-tiktok", "email-sequence-5"],
    entryProductSlug: "landing-1page",
    subscriptionHint: "pro",
    sector: "educacion",
  },
  {
    slug: "restaurantes-malaga",
    label: "Restaurantes con terraza en Malaga",
    searchQuery: "restaurante terraza",
    location: "Malaga, Spain",
    painPoints: [
      "Carta no digitalizada para QR",
      "Sin menu online actualizable",
      "Resenas Google antiguas",
      "Instagram con fotos de 2022",
    ],
    targetProductSlugs: ["google-business-setup", "post-instagram", "post-tiktok"],
    entryProductSlug: "post-instagram",
    subscriptionHint: "pro",
    sector: "hosteleria",
  },
  {
    slug: "asesorias-contables-barcelona",
    label: "Asesorias contables en Barcelona",
    searchQuery: "asesoria fiscal contable",
    location: "Barcelona, Spain",
    painPoints: [
      "Captacion solo por recomendacion, sin funnel digital",
      "Web tipo brochure sin leads",
      "LinkedIn inactivo siendo B2B",
      "Sin email marketing a base de datos propia",
    ],
    targetProductSlugs: ["post-linkedin", "email-sequence-5", "landing-1page"],
    entryProductSlug: "post-linkedin",
    subscriptionHint: "growth",
    sector: "servicios-profesionales",
  },
  {
    slug: "gimnasios-zaragoza",
    label: "Gimnasios y boxes en Zaragoza",
    searchQuery: "gimnasio box crossfit",
    location: "Zaragoza, Spain",
    painPoints: [
      "Fuga de socios en enero-marzo sin campana retention",
      "Captacion solo via flyers de barrio",
      "Sin secuencia email de bienvenida post-alta",
      "Instagram reactivo, no estrategico",
    ],
    targetProductSlugs: ["email-sequence-5", "post-tiktok", "landing-1page"],
    entryProductSlug: "post-tiktok",
    subscriptionHint: "pro",
    sector: "fitness",
  },
  {
    slug: "peluquerias-bilbao",
    label: "Peluquerias de autor en Bilbao",
    searchQuery: "peluqueria estilista",
    location: "Bilbao, Spain",
    painPoints: [
      "Reservas solo por WhatsApp manual",
      "Instagram sin posts regulares",
      "Sin ficha Google completa (categorias, fotos)",
      "Zero presencia en TikTok/Reels",
    ],
    targetProductSlugs: ["whatsapp-button", "post-instagram", "post-tiktok"],
    entryProductSlug: "whatsapp-button",
    subscriptionHint: "start",
    sector: "belleza",
  },
  {
    slug: "inmobiliarias-murcia",
    label: "Inmobiliarias boutique en Murcia",
    searchQuery: "inmobiliaria",
    location: "Murcia, Spain",
    painPoints: [
      "Inmuebles anunciados solo en portales (pagan comision)",
      "Web generica sin casos de exito",
      "Sin formulario contacto con automation",
      "Sin LinkedIn de agentes",
    ],
    targetProductSlugs: ["contact-form-setup", "landing-1page", "post-linkedin"],
    entryProductSlug: "contact-form-setup",
    subscriptionHint: "growth",
    sector: "inmobiliaria",
  },
  {
    slug: "talleres-coche-alicante",
    label: "Talleres de coche en Alicante",
    searchQuery: "taller mecanico",
    location: "Alicante, Spain",
    painPoints: [
      "Ficha Google pobre vs cadenas",
      "Sin presencia en Google Maps estrategica",
      "Web tipo yellow pages sin servicio destacado",
      "Boton WhatsApp inexistente",
    ],
    targetProductSlugs: ["google-business-setup", "whatsapp-button", "landing-1page"],
    entryProductSlug: "google-business-setup",
    subscriptionHint: "pro",
    sector: "automocion",
  },
  {
    slug: "ecommerce-moda-online",
    label: "Ecommerce de moda (Shopify/Woo)",
    searchQuery: "boutique moda online",
    location: "Madrid, Spain",
    painPoints: [
      "Carrito abandonado sin secuencia recovery",
      "Sin pixel Meta bien configurado",
      "Newsletter con aperturas bajo 15%",
      "Sin UGC / Reels para Meta Ads",
    ],
    targetProductSlugs: ["email-sequence-5", "meta-pixel-setup", "post-tiktok"],
    entryProductSlug: "email-sequence-5",
    subscriptionHint: "growth",
    sector: "ecommerce",
  },
  {
    slug: "estudios-yoga-pamplona",
    label: "Estudios de yoga en Pamplona",
    searchQuery: "yoga pilates",
    location: "Pamplona, Spain",
    painPoints: [
      "Comunidad pequena sin nurturing",
      "Web sin reservas ni pack classes",
      "Instagram con contenido generico",
      "Sin newsletter mensual",
    ],
    targetProductSlugs: ["newsletter-1-month", "bio-instagram", "landing-1page"],
    entryProductSlug: "bio-instagram",
    subscriptionHint: "pro",
    sector: "wellness",
  },
  {
    slug: "cafeterias-especialidad-granada",
    label: "Cafeterias de especialidad en Granada",
    searchQuery: "cafeteria specialty coffee",
    location: "Granada, Spain",
    painPoints: [
      "Carta sin online",
      "Ficha Google sin horarios reales",
      "Instagram con fotos moviles sin editar",
      "Sin TikTok aunque son visuales",
    ],
    targetProductSlugs: ["google-business-setup", "post-tiktok", "post-instagram"],
    entryProductSlug: "post-tiktok",
    subscriptionHint: "pro",
    sector: "hosteleria",
  },
  {
    slug: "coaches-ejecutivos",
    label: "Coaches ejecutivos y mentores",
    searchQuery: "coach ejecutivo mentoring",
    location: "Madrid, Spain",
    painPoints: [
      "Posicionamiento identico a todos los coaches",
      "Sin caso de exito visible",
      "LinkedIn con posts genericos",
      "Sin lead magnet ni funnel",
    ],
    targetProductSlugs: ["post-linkedin", "landing-1page", "email-sequence-5"],
    entryProductSlug: "post-linkedin",
    subscriptionHint: "growth",
    sector: "coaching",
  },
  {
    slug: "clinicas-podologia-coruna",
    label: "Clinicas de podologia en A Coruña",
    searchQuery: "podologo",
    location: "A Coruña, Spain",
    painPoints: [
      "Paciente tipo mayor, busca en Google",
      "Ficha Google sin tratamientos destacados",
      "Web lenta sin reservas online",
      "Sin educacion al paciente (blog/video)",
    ],
    targetProductSlugs: ["google-business-setup", "landing-1page", "seo-audit-pdf"],
    entryProductSlug: "google-business-setup",
    subscriptionHint: "pro",
    sector: "salud",
  },
  {
    slug: "abogados-familia-salamanca",
    label: "Abogados de familia en Salamanca",
    searchQuery: "abogado familia divorcio",
    location: "Salamanca, Spain",
    painPoints: [
      "SEO local inexistente",
      "Ficha Google sin resenas",
      "Sin LinkedIn profesional",
      "Web tipo curriculum sin conversion",
    ],
    targetProductSlugs: ["seo-audit-pdf", "google-business-setup", "landing-1page"],
    entryProductSlug: "seo-audit-pdf",
    subscriptionHint: "growth",
    sector: "servicios-juridicos",
  },
];

/** Selecciona el nicho del dia segun dia del año (rotacion deterministica). */
export function getNicheForToday(date: Date = new Date()): Niche {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return NICHES[dayOfYear % NICHES.length];
}

export function getNicheBySlug(slug: string): Niche | undefined {
  return NICHES.find((n) => n.slug === slug);
}
