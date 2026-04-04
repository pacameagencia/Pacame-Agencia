export interface Agent {
  id: string;
  name: string;
  role: string;
  roleEn: string;
  color: string;
  icon: string;
  description: string;
  skills: string[];
  personality: string;
  deliverables: string[];
}

export const agents: Agent[] = [
  {
    id: "nova",
    name: "Nova",
    role: "Directora Creativa",
    roleEn: "Creative Director",
    color: "#7C3AED",
    icon: "Sparkles",
    description:
      "Construye la identidad visual de tu marca desde cero. Diseña sistemas visuales que cuentan tu historia y conectan con tu audiencia.",
    skills: ["Branding", "Identidad Visual", "Dirección de Arte", "UI/UX Design", "Sistemas de Diseño"],
    personality: "Visionaria, audaz, estética",
    deliverables: [
      "Manual de marca completo",
      "Paleta de colores y tipografía",
      "Logotipo y variantes",
      "Templates para redes sociales",
      "Guía de estilo web",
    ],
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "Estratega SEO",
    roleEn: "SEO Strategist",
    color: "#2563EB",
    icon: "Globe",
    description:
      "Construye visibilidad orgánica rentable. Analiza keywords, optimiza contenidos y diseña arquitecturas web que Google adora.",
    skills: ["SEO Técnico", "Keyword Research", "Link Building", "SEO Local", "Content Strategy"],
    personality: "Analítico, paciente, meticuloso",
    deliverables: [
      "Auditoría SEO completa",
      "Arquitectura web optimizada",
      "Plan de contenidos con keywords",
      "Reporting mensual de rankings",
      "Schema markup implementado",
    ],
  },
  {
    id: "nexus",
    name: "Nexus",
    role: "Head of Growth",
    roleEn: "Growth Director",
    color: "#EA580C",
    icon: "TrendingUp",
    description:
      "Convierte demanda en revenue. Diseña embudos de captación, gestiona campañas de paid media y optimiza cada conversión.",
    skills: ["Meta Ads", "Google Ads", "Embudos de Venta", "Email Marketing", "CRO"],
    personality: "Persuasivo, orientado a datos, intenso",
    deliverables: [
      "Embudo de captación completo",
      "Campañas Meta/Google Ads",
      "Secuencias de email",
      "A/B testing continuo",
      "Dashboard de métricas en vivo",
    ],
  },
  {
    id: "pixel",
    name: "Pixel",
    role: "Lead Frontend",
    roleEn: "Frontend Developer",
    color: "#06B6D4",
    icon: "Layout",
    description:
      "Convierte estrategia y diseño en experiencias digitales rápidas, claras y que convierten. Next.js, React, Tailwind — sin código legacy.",
    skills: ["Next.js", "React", "Tailwind CSS", "Animaciones Web", "Performance"],
    personality: "Perfeccionista, visual, detallista",
    deliverables: [
      "Landing pages de alta conversión",
      "Webs corporativas completas",
      "E-commerce a medida",
      "Core Web Vitals en verde",
      "Diseño 100% responsive",
    ],
  },
  {
    id: "core",
    name: "Core",
    role: "Backend Architect",
    roleEn: "Backend Architect",
    color: "#16A34A",
    icon: "Terminal",
    description:
      "Diseña y mantiene la infraestructura técnica. APIs robustas, bases de datos optimizadas, integraciones sólidas. Silencioso pero potente.",
    skills: ["Node.js", "Supabase", "PostgreSQL", "APIs REST/GraphQL", "Seguridad"],
    personality: "Lógico, robusto, silencioso pero potente",
    deliverables: [
      "APIs RESTful documentadas",
      "Base de datos diseñada y optimizada",
      "Integraciones con terceros",
      "Autenticación y autorización",
      "Deploy y CI/CD configurado",
    ],
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "Head of Social Media",
    roleEn: "Social Media Director",
    color: "#EC4899",
    icon: "Heart",
    description:
      "Convierte tu marca en conversación y demanda. Estrategia de contenidos, calendarios editoriales y community management multiplataforma.",
    skills: ["Instagram", "LinkedIn", "TikTok", "Copywriting", "Community Management"],
    personality: "Expresivo, trend-aware, social",
    deliverables: [
      "Calendario editorial mensual",
      "Posts diseñados y redactados",
      "Reels y Stories",
      "Reporting de engagement",
      "Estrategia de crecimiento",
    ],
  },
  {
    id: "sage",
    name: "Sage",
    role: "Chief Strategy Officer",
    roleEn: "Chief Strategy Officer",
    color: "#D97706",
    icon: "Compass",
    description:
      "Transforma contexto de negocio en decisiones ejecutables. Diagnóstico, estrategia, gobernanza de proyectos y reporting ejecutivo.",
    skills: ["Estrategia Digital", "Análisis Competitivo", "Business Planning", "KPIs", "Gestión de Proyectos"],
    personality: "Reflexivo, panorámico, mentor",
    deliverables: [
      "Diagnóstico de negocio completo",
      "Plan estratégico a 90 días",
      "Análisis competitivo",
      "Definición de KPIs",
      "Reporting ejecutivo mensual",
    ],
  },
];
