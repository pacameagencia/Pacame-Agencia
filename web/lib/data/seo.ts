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
  // ---- FASE 2: Nuevos sectores ----
  {
    slug: "peluquerias",
    name: "peluquería",
    namePlural: "peluquerías y centros de estética",
    tier: 2,
    problems: [
      "Dependencia de clientes habituales sin captar nuevos",
      "Sin sistema de reservas online ni agenda automatizada",
      "Instagram con fotos de baja calidad que no atraen",
      "No aparecen en búsquedas locales de Google",
      "Competencia con cadenas low-cost que invierten en marketing",
    ],
    starServices: ["diseno-web", "gestion-redes-sociales", "seo-posicionamiento"],
    keywords: ["marketing peluquerias", "web peluqueria", "reservas online peluqueria"],
  },
  {
    slug: "dentistas",
    name: "clínica dental",
    namePlural: "dentistas y clínicas dentales",
    tier: 2,
    problems: [
      "Pacientes eligen por precio sin conocer tu diferencial",
      "Web que no transmite confianza ni muestra casos reales",
      "Sin estrategia de contenido educativo que genere autoridad",
      "Google Ads caro con bajo retorno de inversión",
      "Reseñas negativas sin respuesta que ahuyentan pacientes",
    ],
    starServices: ["seo-posicionamiento", "diseno-web", "publicidad-meta-ads"],
    keywords: ["marketing dental", "web clinica dental", "SEO dentistas"],
  },
  {
    slug: "academias",
    name: "academia",
    namePlural: "academias y centros de formación",
    tier: 2,
    problems: [
      "Matrículas estancadas y dependencia del boca a boca",
      "Web sin información clara de cursos ni precios",
      "No captan alumnos por canales digitales",
      "Sin embudo de captación automatizado",
      "Competencia con plataformas online como Udemy o Coursera",
    ],
    starServices: ["publicidad-meta-ads", "diseno-web", "gestion-redes-sociales"],
    keywords: ["marketing academias", "captacion alumnos", "web academia"],
  },
  {
    slug: "asesoria-gestoria",
    name: "asesoría",
    namePlural: "asesorías y gestorías",
    tier: 2,
    problems: [
      "Clientes no entienden el valor de tus servicios frente a apps gratuitas",
      "Web genérica sin diferenciación de la competencia",
      "No captan autónomos ni pymes por internet",
      "Sin presencia en LinkedIn ni contenido de autoridad",
      "Pérdida de clientes que migran a gestorías online",
    ],
    starServices: ["seo-posicionamiento", "diseno-web", "gestion-redes-sociales"],
    keywords: ["marketing asesoria", "web gestoria", "captacion clientes asesoria"],
  },
  {
    slug: "veterinarias",
    name: "clínica veterinaria",
    namePlural: "veterinarias",
    tier: 2,
    problems: [
      "Dificultad para destacar frente a clínicas de cadenas grandes",
      "Sin sistema de recordatorios ni fidelización digital",
      "Web que no permite pedir cita online",
      "Redes sociales sin contenido que conecte con dueños de mascotas",
      "No aprovechan el marketing emocional del sector",
    ],
    starServices: ["diseno-web", "gestion-redes-sociales", "chatbot-whatsapp-ia"],
    keywords: ["marketing veterinarias", "web clinica veterinaria", "redes sociales veterinario"],
  },
  {
    slug: "arquitectos",
    name: "estudio de arquitectura",
    namePlural: "arquitectos y estudios",
    tier: 2,
    problems: [
      "Portfolio online que no hace justicia a tus proyectos",
      "Dependencia de contactos personales para conseguir obras",
      "Web sin SEO que no aparece en búsquedas de servicios",
      "No aprovechan Instagram como escaparate visual",
      "Sin estrategia de captación de clientes particulares",
    ],
    starServices: ["diseno-web", "seo-posicionamiento", "gestion-redes-sociales"],
    keywords: ["marketing arquitectos", "web estudio arquitectura", "portfolio arquitecto online"],
  },
  {
    slug: "psicologos",
    name: "consulta de psicología",
    namePlural: "psicólogos y terapeutas",
    tier: 2,
    problems: [
      "Pacientes buscan en Google y no te encuentran",
      "Directorios genéricos que no muestran tu especialización",
      "Web sin información que genere confianza antes de la primera cita",
      "Sin estrategia de contenido sobre salud mental",
      "No aprovechan la terapia online como diferencial",
    ],
    starServices: ["seo-posicionamiento", "diseno-web", "gestion-redes-sociales"],
    keywords: ["marketing psicologos", "web psicologo", "captacion pacientes psicologo"],
  },
  {
    slug: "autoescuelas",
    name: "autoescuela",
    namePlural: "autoescuelas",
    tier: 2,
    problems: [
      "Alumnos eligen solo por precio sin conocer tu tasa de aprobados",
      "Web anticuada que no permite inscripción online",
      "Sin presencia en redes donde están los jóvenes",
      "No comunican diferencial frente a autoescuelas online",
      "Dependencia de localización física para captar alumnos",
    ],
    starServices: ["publicidad-meta-ads", "diseno-web", "gestion-redes-sociales"],
    keywords: ["marketing autoescuelas", "web autoescuela", "captacion alumnos autoescuela"],
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
  // ---- FASE 2: Ciudades 50k-250k ----
  { slug: "alicante", name: "Alicante", province: "Alicante", population: 337000, priority: 2, localFact: "Alicante combina turismo, comercio y un sector tech emergente. Miles de pymes necesitan presencia digital profesional." },
  { slug: "cordoba", name: "Córdoba", province: "Córdoba", population: 326000, priority: 2, localFact: "Córdoba, patrimonio de la humanidad, tiene negocios turísticos y locales que necesitan competir en el mundo digital." },
  { slug: "valladolid", name: "Valladolid", province: "Valladolid", population: 298000, priority: 2, localFact: "Valladolid, motor industrial de Castilla y León, tiene un tejido empresarial que está dando el salto al marketing digital." },
  { slug: "vigo", name: "Vigo", province: "Pontevedra", population: 296000, priority: 2, localFact: "Vigo, la ciudad más poblada de Galicia, lidera en industria pesquera y naval. Sus pymes necesitan digitalizarse." },
  { slug: "gijon", name: "Gijón", province: "Asturias", population: 270000, priority: 2, localFact: "Gijón apuesta por la tecnología y el emprendimiento. Sus negocios locales necesitan una presencia digital que esté a la altura." },
  { slug: "granada", name: "Granada", province: "Granada", population: 232000, priority: 2, localFact: "Granada, entre turismo y universidad, tiene negocios que necesitan destacar en un mercado cada vez más competitivo." },
  { slug: "vitoria", name: "Vitoria-Gasteiz", province: "Álava", population: 254000, priority: 2, localFact: "Vitoria, capital verde de Europa, tiene un ecosistema empresarial comprometido con la innovación y la sostenibilidad." },
  { slug: "santander", name: "Santander", province: "Cantabria", population: 172000, priority: 2, localFact: "Santander, entre banca y turismo, tiene pymes que compiten con presupuestos limitados y necesitan soluciones digitales asequibles." },
  { slug: "san-sebastian", name: "San Sebastián", province: "Guipúzcoa", population: 188000, priority: 2, localFact: "San Sebastián, referente gastronómico mundial, tiene negocios premium que necesitan una imagen digital a la altura de su reputación." },
  { slug: "pamplona", name: "Pamplona", province: "Navarra", population: 203000, priority: 2, localFact: "Pamplona, conocida mundialmente por San Fermín, tiene un tejido empresarial diverso que empieza a apostar fuerte por lo digital." },
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

// Generar todas las combinaciones (5 servicios x 16 sectores x 20 ciudades = 1600 paginas)
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
