export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: ServiceItem[];
  category: string;
}

export interface ServiceItem {
  name: string;
  description: string;
  includes: string[];
  deadline: string;
  price: string;
  featured?: boolean;
}

export interface Package {
  id: string;
  name: string;
  subtitle: string;
  target: string;
  price: string;
  deadline: string;
  includes: string[];
  savings: string;
  featured?: boolean;
  color: string;
}

export const services: Service[] = [
  {
    id: "web",
    name: "Desarrollo Web",
    description: "Webs que convierten, construidas con el stack del futuro. Next.js, Tailwind, Supabase. Sin WordPress.",
    icon: "Monitor",
    category: "Producto Digital",
    items: [
      {
        name: "Landing Page",
        description: "Diseñada para convertir. Cargada para volar.",
        includes: [
          "Diseño responsive personalizado",
          "Copywriting persuasivo",
          "Formulario de contacto",
          "SEO on-page básico",
          "Hosting 1 año incluido",
        ],
        deadline: "2-3 días",
        price: "300 – 600 €",
      },
      {
        name: "Web Corporativa",
        description: "Tu presencia digital profesional. 3-5 páginas.",
        includes: [
          "Diseño personalizado",
          "Contenido SEO incluido",
          "Blog listo para publicar",
          "Formularios e integraciones",
          "Panel de administración",
        ],
        deadline: "5-7 días",
        price: "800 – 1.500 €",
        featured: true,
      },
      {
        name: "Web Premium",
        description: "Todo lo anterior más animaciones, multi-idioma e integraciones avanzadas.",
        includes: [
          "Animaciones y microinteracciones",
          "Multi-idioma (ES/EN)",
          "Integraciones avanzadas (CRM, etc.)",
          "Dashboard de administración",
          "Optimización de performance avanzada",
        ],
        deadline: "7-14 días",
        price: "1.500 – 3.000 €",
      },
      {
        name: "E-commerce",
        description: "Tu tienda online. Checkout con Stripe, gestión de pedidos.",
        includes: [
          "Catálogo de productos",
          "Carrito y checkout con Stripe",
          "Gestión de pedidos",
          "Diseño responsive",
          "Integración logística",
        ],
        deadline: "10-15 días",
        price: "2.000 – 4.000 €",
      },
      {
        name: "App Web / SaaS",
        description: "Software a medida. Desde un CRM hasta un ERP completo.",
        includes: [
          "Análisis y diseño UX/UI",
          "Desarrollo full-stack",
          "Base de datos y backend",
          "Autenticación y roles",
          "Deploy en producción",
        ],
        deadline: "20-40 días",
        price: "5.000 – 15.000 €",
      },
    ],
  },
  {
    id: "seo",
    name: "SEO",
    description: "Visibilidad orgánica que genera demanda real. Sin trucos, sin atajos.",
    icon: "Search",
    category: "Marketing Orgánico",
    items: [
      {
        name: "Auditoría SEO",
        description: "Diagnóstico completo de tu presencia en buscadores.",
        includes: [
          "Análisis técnico completo",
          "Keyword research exhaustivo",
          "Análisis de competencia",
          "Plan de acción priorizado",
          "Informe ejecutivo",
        ],
        deadline: "3-5 días",
        price: "300 – 500 €",
      },
      {
        name: "SEO Mensual Básico",
        description: "Posicionamiento continuo. Resultados compuestos.",
        includes: [
          "4 artículos optimizados/mes",
          "Optimización on-page continua",
          "Reporting mensual",
          "Seguimiento de posiciones",
        ],
        deadline: "Mensual",
        price: "400 – 600 €/mes",
        featured: true,
      },
      {
        name: "SEO Premium",
        description: "Máxima inversión en orgánico. Para liderar tu sector.",
        includes: [
          "8 artículos optimizados/mes",
          "Link building activo",
          "SEO técnico avanzado",
          "Schema markup completo",
          "Reporting avanzado semanal",
        ],
        deadline: "Mensual",
        price: "800 – 1.200 €/mes",
      },
    ],
  },
  {
    id: "redes",
    name: "Redes Sociales",
    description: "Tu marca en conversación constante. Contenido que conecta y convierte.",
    icon: "Share2",
    category: "Social Media",
    items: [
      {
        name: "Plan Starter",
        description: "Una red, presencia constante.",
        includes: [
          "12 posts/mes (copy + diseño)",
          "Calendario editorial",
          "Métricas básicas mensuales",
        ],
        deadline: "Mensual",
        price: "300 – 500 €/mes",
      },
      {
        name: "Plan Growth",
        description: "Dos redes, crecimiento real.",
        includes: [
          "20 posts/mes",
          "Reels y Stories",
          "Community management",
          "Reporting mensual",
        ],
        deadline: "Mensual",
        price: "500 – 800 €/mes",
        featured: true,
      },
      {
        name: "Plan Scale",
        description: "3+ redes, estrategia cross-platform.",
        includes: [
          "30+ posts/mes",
          "Estrategia cross-platform",
          "Influencer outreach",
          "Dashboard en vivo",
        ],
        deadline: "Mensual",
        price: "800 – 1.500 €/mes",
      },
    ],
  },
  {
    id: "ads",
    name: "Publicidad Digital",
    description: "Paid media que trabaja mientras tú duermes. ROI medible desde el primer día.",
    icon: "Megaphone",
    category: "Paid Media",
    items: [
      {
        name: "Setup de Campaña",
        description: "Todo configurado para lanzar. Solo una vez.",
        includes: [
          "Estrategia y segmentación",
          "Creativos de campaña",
          "Landing page optimizada",
          "Tracking e integración CRM",
        ],
        deadline: "3-5 días",
        price: "500 – 800 €",
      },
      {
        name: "Gestión Meta Ads",
        description: "Facebook e Instagram Ads optimizados sin parar.",
        includes: [
          "Optimización continua",
          "A/B testing de creativos",
          "Reporting semanal",
          "Nuevos creativos mensuales",
        ],
        deadline: "Mensual",
        price: "400 – 800 €/mes + inversión",
        featured: true,
      },
      {
        name: "Embudo Completo",
        description: "Landing + email + ads + automatización. Todo conectado.",
        includes: [
          "Landing page de captación",
          "Secuencia de email marketing",
          "Campañas Meta + Google",
          "Automatización y CRM setup",
          "Dashboard de métricas",
        ],
        deadline: "7-14 días setup",
        price: "1.500 – 3.000 €",
      },
    ],
  },
  {
    id: "branding",
    name: "Branding",
    description: "Tu identidad visual desde cero. Una marca que se recuerda.",
    icon: "Palette",
    category: "Identidad de Marca",
    items: [
      {
        name: "Logo + Identidad Básica",
        description: "Lo esencial para comunicar quién eres.",
        includes: [
          "Logotipo profesional",
          "Paleta de colores",
          "Tipografía de marca",
          "Usos básicos",
        ],
        deadline: "3-5 días",
        price: "400 – 800 €",
      },
      {
        name: "Branding Completo",
        description: "Tu manual de marca. Consistencia en todo.",
        includes: [
          "Todo lo del básico",
          "Manual de marca completo",
          "Aplicaciones (tarjetas, docs, etc.)",
          "Templates para redes sociales",
        ],
        deadline: "5-10 días",
        price: "800 – 1.500 €",
        featured: true,
      },
      {
        name: "Rebranding",
        description: "Nueva identidad. Nueva era.",
        includes: [
          "Análisis de marca actual",
          "Nueva identidad completa",
          "Transición guiada",
          "Comunicación del cambio",
        ],
        deadline: "10-15 días",
        price: "1.200 – 2.500 €",
      },
    ],
  },
];

export const packages: Package[] = [
  {
    id: "despega",
    name: "Despega",
    subtitle: "Para negocios nuevos",
    target: "Startups y emprendedores que necesitan presencia digital desde cero",
    price: "1.800 – 2.500 €",
    deadline: "10-15 días",
    savings: "25% de ahorro",
    color: "#7C3AED",
    includes: [
      "Web corporativa (5 páginas)",
      "Logo + identidad visual básica",
      "SEO on-page en toda la web",
      "Perfil de Google Business optimizado",
      "1 mes de redes sociales incluido",
    ],
  },
  {
    id: "escala",
    name: "Escala",
    subtitle: "Para negocios que quieren crecer",
    target: "Empresas con web que quieren más tráfico y más clientes",
    price: "3.500 – 5.000 €",
    deadline: "15-20 días setup + 3 meses gestión",
    savings: "30% de ahorro",
    color: "#EA580C",
    featured: true,
    includes: [
      "Rediseño web o nueva web premium",
      "Auditoría SEO + 3 meses SEO mensual",
      "Setup Meta Ads + 1 mes de gestión",
      "Embudo de captación de leads",
      "Dashboard de métricas",
    ],
  },
  {
    id: "domina",
    name: "Domina",
    subtitle: "Transformación digital completa",
    target: "Empresas que quieren liderar su mercado online",
    price: "8.000 – 15.000 €",
    deadline: "20-30 días setup + 6 meses acompañamiento",
    savings: "35% de ahorro",
    color: "#06B6D4",
    includes: [
      "Web premium o e-commerce",
      "Branding completo",
      "SEO Premium 6 meses",
      "Redes sociales 6 meses",
      "Campañas Meta + Google 6 meses",
      "Embudo con automatización",
      "Dashboard de métricas personalizado",
      "Reuniones mensuales de estrategia",
    ],
  },
];
