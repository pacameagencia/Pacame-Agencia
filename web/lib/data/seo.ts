// =============================================
// PACAME SEO Programatico — Datos para generar
// paginas {servicio}-{sector}-{ciudad}
// =============================================

export interface ServiceSEO {
  slug: string;
  name: string;
  nameShort: string;
  description: string;
  icon: string;
  color: string;
  keywords: string[];
  benefits: string[];
  priceFrom: string;
}

export interface SectorSEO {
  slug: string;
  name: string;
  namePlural: string;
  tier: 1 | 2 | 3;
  problems: string[];
  starServices: string[];
  keywords: string[];
}

export interface CitySEO {
  slug: string;
  name: string;
  province: string;
  population: number;
  priority: 1 | 2 | 3;
  localFact: string;
}

// =============================================
// SERVICIOS
// =============================================

export const seoServices: ServiceSEO[] = [
  {
    slug: "diseno-web",
    name: "Diseño web profesional",
    nameShort: "Diseño web",
    description: "Webs rápidas, modernas y optimizadas para convertir visitantes en clientes. Desarrolladas con tecnología de última generación y diseño a medida.",
    icon: "Monitor",
    color: "#06B6D4",
    keywords: ["diseño web", "pagina web", "web profesional", "crear web"],
    benefits: [
      "Diseño responsive que se ve perfecto en móvil",
      "Carga en menos de 2 segundos",
      "Optimizada para SEO desde el primer día",
      "Panel de administración fácil de usar",
      "Entrega en 5-10 días laborables",
    ],
    priceFrom: "desde 300€",
  },
  {
    slug: "seo-posicionamiento",
    name: "SEO y posicionamiento en Google",
    nameShort: "SEO",
    description: "Posicionamos tu negocio en los primeros resultados de Google. Más visibilidad, más visitas, más clientes. Sin atajos, con resultados medibles.",
    icon: "Search",
    color: "#2563EB",
    keywords: ["posicionamiento SEO", "posicionamiento Google", "SEO local", "aparecer en Google"],
    benefits: [
      "Auditoría SEO completa de tu web",
      "Optimización on-page y técnica",
      "Contenido optimizado mensual",
      "Reporting con métricas reales",
      "Resultados visibles en 60-90 días",
    ],
    priceFrom: "desde 397€/mes",
  },
  {
    slug: "gestion-redes-sociales",
    name: "Gestión de redes sociales",
    nameShort: "Redes sociales",
    description: "Contenido profesional para tus redes. Creamos, publicamos y gestionamos tu presencia en Instagram, Facebook, LinkedIn y TikTok.",
    icon: "Share2",
    color: "#EC4899",
    keywords: ["gestion redes sociales", "community manager", "social media", "instagram empresas"],
    benefits: [
      "Contenido original y profesional",
      "Calendario editorial estratégico",
      "Gestión de comentarios y comunidad",
      "Reporting mensual de resultados",
      "Stories, reels y carruseles incluidos",
    ],
    priceFrom: "desde 197€/mes",
  },
  {
    slug: "publicidad-meta-ads",
    name: "Publicidad en Meta Ads",
    nameShort: "Meta Ads",
    description: "Campañas de Facebook e Instagram Ads que generan clientes reales. Segmentación precisa, creativos profesionales y optimización continua.",
    icon: "Megaphone",
    color: "#EA580C",
    keywords: ["meta ads", "facebook ads", "instagram ads", "publicidad facebook"],
    benefits: [
      "Campañas optimizadas para conversión",
      "Segmentación avanzada de audiencia",
      "Creativos profesionales incluidos",
      "Optimización diaria del presupuesto",
      "Reporting semanal de rendimiento",
    ],
    priceFrom: "desde 297€/mes + inversión",
  },
  {
    slug: "chatbot-whatsapp-ia",
    name: "Chatbot de WhatsApp con IA",
    nameShort: "Chatbot WhatsApp",
    description: "Un asistente inteligente que atiende a tus clientes por WhatsApp 24/7. Responde preguntas, toma reservas y cualifica leads mientras tú duermes.",
    icon: "MessageSquare",
    color: "#16A34A",
    keywords: ["chatbot whatsapp", "whatsapp business", "atencion cliente whatsapp", "bot whatsapp"],
    benefits: [
      "Atención 24/7 sin contratar personal",
      "Respuestas personalizadas con IA",
      "Integración con tu agenda y reservas",
      "Derivación a humano cuando sea necesario",
      "Panel de conversaciones y métricas",
    ],
    priceFrom: "desde 500€ + 97€/mes",
  },
];

// =============================================
// SECTORES
// =============================================

export const seoSectors: SectorSEO[] = [
  {
    slug: "restaurantes",
    name: "restaurante",
    namePlural: "restaurantes",
    tier: 1,
    problems: [
      "Mesas vacías entre semana y dependencia del boca a boca",
      "Reseñas negativas en Google sin gestionar",
      "Sin presencia en redes sociales o con cuentas abandonadas",
      "Web anticuada o directamente sin página web propia",
      "No aparece en búsquedas locales de Google Maps",
    ],
    starServices: ["diseno-web", "gestion-redes-sociales", "seo-posicionamiento"],
    keywords: ["marketing restaurantes", "agencia marketing hosteleria"],
  },
  {
    slug: "clinicas",
    name: "clínica",
    namePlural: "clínicas",
    tier: 1,
    problems: [
      "Los pacientes no encuentran la clínica en Google",
      "La web no transmite confianza ni profesionalidad",
      "Sin estrategia de captación de nuevos pacientes",
      "Reseñas desatendidas que afectan a la reputación",
      "Dependencia de pacientes por recomendación personal",
    ],
    starServices: ["seo-posicionamiento", "diseno-web", "publicidad-meta-ads"],
    keywords: ["marketing clinicas", "marketing dental", "agencia marketing salud"],
  },
  {
    slug: "abogados",
    name: "despacho de abogados",
    namePlural: "abogados",
    tier: 1,
    problems: [
      "Web genérica que no diferencia del resto de despachos",
      "Sin posicionamiento en Google para búsquedas de servicios legales",
      "No aprovechan LinkedIn como canal de captación",
      "Presupuesto de marketing mal invertido en directorios que no funcionan",
      "Dificultad para captar clientes jóvenes que buscan online",
    ],
    starServices: ["diseno-web", "seo-posicionamiento", "publicidad-meta-ads"],
    keywords: ["marketing abogados", "web abogados", "SEO despacho abogados"],
  },
  {
    slug: "inmobiliarias",
    name: "inmobiliaria",
    namePlural: "inmobiliarias",
    tier: 1,
    problems: [
      "Competencia feroz en portales como Idealista y Fotocasa",
      "Leads caros y de baja calidad desde portales",
      "Web propia que no genera contactos directos",
      "Sin estrategia de contenido para redes sociales",
      "No aprovechan WhatsApp para gestionar consultas",
    ],
    starServices: ["diseno-web", "publicidad-meta-ads", "chatbot-whatsapp-ia"],
    keywords: ["marketing inmobiliarias", "web inmobiliaria", "leads inmobiliarios"],
  },
  {
    slug: "tiendas",
    name: "tienda",
    namePlural: "tiendas y comercios",
    tier: 1,
    problems: [
      "No venden online y pierden cuota frente a Amazon",
      "Instagram sin estrategia ni contenido profesional",
      "Web que no convierte visitas en ventas",
      "No hacen email marketing ni fidelizan clientes",
      "Sin presupuesto ni conocimiento para ads",
    ],
    starServices: ["diseno-web", "gestion-redes-sociales", "publicidad-meta-ads"],
    keywords: ["marketing tiendas", "ecommerce", "tienda online"],
  },
  {
    slug: "gimnasios",
    name: "gimnasio",
    namePlural: "gimnasios",
    tier: 1,
    problems: [
      "Alta rotación de socios y baja retención",
      "Captación estancada con los mismos canales de siempre",
      "Web sin sistema de reservas ni horarios actualizados",
      "Redes sociales sin contenido profesional ni estrategia",
      "No comunican valor diferencial frente a cadenas low-cost",
    ],
    starServices: ["gestion-redes-sociales", "diseno-web", "publicidad-meta-ads"],
    keywords: ["marketing gimnasios", "captacion socios gimnasio"],
  },
  {
    slug: "hoteles",
    name: "hotel",
    namePlural: "hoteles",
    tier: 1,
    problems: [
      "Dependencia total de Booking y Expedia (comisiones del 15-25%)",
      "Web propia que no genera reservas directas",
      "Sin estrategia SEO para aparecer en búsquedas de destino",
      "Google Ads mal configurado y presupuesto desperdiciado",
      "Reseñas online sin gestionar profesionalmente",
    ],
    starServices: ["seo-posicionamiento", "diseno-web", "publicidad-meta-ads"],
    keywords: ["marketing hoteles", "reservas directas hotel", "web hotel"],
  },
  {
    slug: "talleres",
    name: "taller",
    namePlural: "talleres y concesionarios",
    tier: 1,
    problems: [
      "Los clientes buscan en Google y no les encuentran",
      "Sin web o con web muy anticuada",
      "No tienen ficha de Google Business optimizada",
      "No hacen seguimiento de clientes ni fidelización",
      "Cero presencia en redes sociales",
    ],
    starServices: ["seo-posicionamiento", "diseno-web", "chatbot-whatsapp-ia"],
    keywords: ["marketing talleres", "web taller mecanico", "marketing automocion"],
  },
];

// =============================================
// CIUDADES (Top 10 — Fase 1)
// =============================================

export const seoCities: CitySEO[] = [
  { slug: "madrid", name: "Madrid", province: "Madrid", population: 3300000, priority: 1, localFact: "Con más de 3,3 millones de habitantes y una de las economías más dinámicas de Europa, Madrid concentra miles de negocios que compiten por la atención digital." },
  { slug: "barcelona", name: "Barcelona", province: "Barcelona", population: 1600000, priority: 1, localFact: "Barcelona, capital tecnológica del sur de Europa, tiene un ecosistema empresarial enorme donde destacar online es imprescindible." },
  { slug: "valencia", name: "Valencia", province: "Valencia", population: 800000, priority: 1, localFact: "Valencia vive un boom empresarial y turístico. La competencia digital crece y los negocios locales necesitan diferenciarse." },
  { slug: "sevilla", name: "Sevilla", province: "Sevilla", population: 690000, priority: 1, localFact: "Sevilla, motor económico de Andalucía, combina turismo y comercio local. La presencia digital es clave para destacar." },
  { slug: "zaragoza", name: "Zaragoza", province: "Zaragoza", population: 680000, priority: 1, localFact: "Zaragoza, punto estratégico entre Madrid y Barcelona, tiene un tejido empresarial sólido que empieza a digitalizarse." },
  { slug: "malaga", name: "Málaga", province: "Málaga", population: 580000, priority: 1, localFact: "Málaga se ha convertido en hub tecnológico y turístico. La demanda de servicios digitales crece cada año." },
  { slug: "murcia", name: "Murcia", province: "Murcia", population: 460000, priority: 1, localFact: "Murcia, con su economía agrícola e industrial, tiene miles de pymes que todavía no han dado el salto digital." },
  { slug: "palma", name: "Palma de Mallorca", province: "Baleares", population: 420000, priority: 1, localFact: "Palma vive del turismo y el comercio. Tener presencia digital profesional marca la diferencia en temporada alta y baja." },
  { slug: "las-palmas", name: "Las Palmas de Gran Canaria", province: "Las Palmas", population: 380000, priority: 1, localFact: "Las Palmas, puerta de Europa a las Canarias, tiene negocios que necesitan competir tanto localmente como con el turismo internacional." },
  { slug: "bilbao", name: "Bilbao", province: "Vizcaya", population: 350000, priority: 1, localFact: "Bilbao, referente en innovación y transformación urbana, tiene un tejido empresarial que valora la calidad y el profesionalismo digital." },
];

// =============================================
// HELPERS
// =============================================

export function generateSlug(service: ServiceSEO, sector: SectorSEO, city: CitySEO): string {
  return `${service.slug}-${sector.slug}-${city.slug}`;
}

export function generateTitle(service: ServiceSEO, sector: SectorSEO, city: CitySEO): string {
  return `${service.nameShort} para ${sector.namePlural} en ${city.name}`;
}

export function generateMetaDescription(service: ServiceSEO, sector: SectorSEO, city: CitySEO): string {
  return `Somos PACAME, tu equipo de IA especializado en ${service.nameShort.toLowerCase()} para ${sector.namePlural} en ${city.name}. Resultados en semanas, no meses. Pide tu diagnóstico gratuito.`;
}

// Generar todas las combinaciones Fase 1 (5 servicios x 8 sectores x 10 ciudades = 400 paginas)
export function generateAllCombinations() {
  const combinations: { service: ServiceSEO; sector: SectorSEO; city: CitySEO; slug: string }[] = [];
  for (const service of seoServices) {
    for (const sector of seoSectors) {
      for (const city of seoCities) {
        combinations.push({
          service,
          sector,
          city,
          slug: generateSlug(service, sector, city),
        });
      }
    }
  }
  return combinations;
}
