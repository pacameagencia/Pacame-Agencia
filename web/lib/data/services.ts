export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: ServiceItem[];
  category: string;
}

export interface ProcessStep {
  step: string;
  description: string;
}

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceItem {
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  includes: string[];
  process: ProcessStep[];
  deliverables: string[];
  faq: ServiceFaq[];
  relatedAgents: string[];
  deadline: string;
  price: string;
  startingPrice?: number;
  stripeProduct?: string;
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
        slug: "landing-page",
        description: "Diseñada para convertir. Cargada para volar.",
        longDescription: "Una pagina web de una sola pagina, diseñada con un unico objetivo: que el visitante te contacte o compre. Ideal para lanzar un producto, captar leads o promocionar un servicio concreto. Incluye copywriting persuasivo, diseño profesional y formulario de contacto.",
        includes: [
          "Diseño responsive personalizado",
          "Copywriting persuasivo",
          "Formulario de contacto",
          "SEO on-page básico",
          "Hosting 1 año incluido",
        ],
        process: [
          { step: "Briefing", description: "Nos cuentas tu negocio, tu publico y tu objetivo" },
          { step: "Diseño", description: "Creamos el diseño visual adaptado a tu marca" },
          { step: "Desarrollo", description: "Construimos la pagina con tecnologia moderna" },
          { step: "Entrega", description: "La publicamos y te damos acceso al panel" },
        ],
        deliverables: ["1 pagina web responsive", "Textos persuasivos", "Formulario funcional", "Hosting configurado", "Certificado SSL"],
        faq: [
          { q: "Puedo editarla yo despues?", a: "Si. Te damos un panel sencillo para cambiar textos e imagenes." },
          { q: "Incluye dominio?", a: "No, pero te ayudamos a comprar y configurar el tuyo (coste aparte: 10-15 euros/ano)." },
        ],
        relatedAgents: ["pixel", "nova"],
        deadline: "2-3 días",
        price: "300 – 600 €",
        startingPrice: 300,
        stripeProduct: "landing",
      },
      {
        name: "Web Corporativa",
        slug: "web-corporativa",
        description: "Tu presencia digital profesional. 3-5 páginas.",
        longDescription: "La web que tu negocio necesita: pagina de inicio, servicios, sobre nosotros, blog y contacto. Diseño profesional que transmite confianza, contenido optimizado para Google y un panel donde puedes actualizar todo tu mismo sin saber de tecnologia.",
        includes: [
          "Diseño personalizado",
          "Contenido SEO incluido",
          "Blog listo para publicar",
          "Formularios e integraciones",
          "Panel de administración",
        ],
        process: [
          { step: "Briefing", description: "Entendemos tu negocio, competencia y objetivos" },
          { step: "Estructura", description: "Definimos las paginas y el flujo de navegacion" },
          { step: "Diseño", description: "Creamos el diseño visual completo de tu web" },
          { step: "Contenido", description: "Escribimos textos SEO para cada pagina" },
          { step: "Desarrollo", description: "Construimos y probamos todo" },
          { step: "Entrega", description: "Publicamos y te formamos en el panel" },
        ],
        deliverables: ["3-5 paginas web", "Textos SEO profesionales", "Blog configurado", "Formulario de contacto", "Panel de administracion", "Hosting y SSL"],
        faq: [
          { q: "Cuantas paginas incluye?", a: "Entre 3 y 5 paginas. Si necesitas mas, te hacemos presupuesto a medida." },
          { q: "Puedo anadir paginas despues?", a: "Si. Ampliar tu web es facil y economico una vez esta construida." },
        ],
        relatedAgents: ["pixel", "atlas", "nova"],
        deadline: "5-7 días",
        price: "800 – 1.500 €",
        startingPrice: 800,
        stripeProduct: "web",
        featured: true,
      },
      {
        name: "Web Premium",
        slug: "web-premium",
        description: "Todo lo anterior más animaciones, multi-idioma e integraciones avanzadas.",
        longDescription: "Para negocios que quieren destacar. Incluye todo lo de la web corporativa mas animaciones, soporte multi-idioma, integraciones con CRM y un nivel de acabado visual superior. Ideal para empresas que compiten a nivel nacional o internacional.",
        includes: [
          "Animaciones y microinteracciones",
          "Multi-idioma (ES/EN)",
          "Integraciones avanzadas (CRM, etc.)",
          "Dashboard de administración",
          "Optimización de performance avanzada",
        ],
        process: [
          { step: "Analisis", description: "Analizamos tu marca, competencia y objetivos" },
          { step: "Arquitectura", description: "Diseñamos la estructura y flujo de usuario" },
          { step: "Diseño premium", description: "Creamos un diseño visual de alto nivel" },
          { step: "Desarrollo", description: "Construimos con animaciones y multi-idioma" },
          { step: "Testing", description: "Probamos en todos los dispositivos y navegadores" },
          { step: "Lanzamiento", description: "Publicamos con optimizacion de velocidad" },
        ],
        deliverables: ["6-10 paginas web", "Animaciones profesionales", "Soporte ES/EN", "Integraciones CRM", "Dashboard admin", "Performance optimizada"],
        faq: [
          { q: "Que diferencia hay con la web corporativa?", a: "Mas paginas, animaciones, multi-idioma e integraciones avanzadas. Un nivel visual superior." },
          { q: "Cuantos idiomas soporta?", a: "Español e ingles por defecto. Podemos añadir mas idiomas con un coste adicional." },
        ],
        relatedAgents: ["pixel", "nova", "core"],
        deadline: "7-14 días",
        price: "1.500 – 3.000 €",
        startingPrice: 1500,
      },
      {
        name: "E-commerce",
        slug: "e-commerce",
        description: "Tu tienda online. Checkout con Stripe, gestión de pedidos.",
        longDescription: "Tu tienda online profesional con catalogo de productos, carrito de compra, pago seguro con tarjeta y gestion de pedidos. Diseñada para vender desde el primer dia, con un panel donde gestionas productos, stock y envios sin complicaciones.",
        includes: [
          "Catálogo de productos",
          "Carrito y checkout con Stripe",
          "Gestión de pedidos",
          "Diseño responsive",
          "Integración logística",
        ],
        process: [
          { step: "Briefing", description: "Definimos productos, categorias y logistica" },
          { step: "Diseño", description: "Creamos la experiencia de compra ideal" },
          { step: "Catalogo", description: "Subimos y organizamos tus productos" },
          { step: "Pagos", description: "Configuramos pasarela de pago segura" },
          { step: "Testing", description: "Probamos todo el flujo de compra" },
          { step: "Lanzamiento", description: "Publicamos tu tienda lista para vender" },
        ],
        deliverables: ["Tienda online completa", "Catalogo de hasta 50 productos", "Pago con tarjeta", "Gestion de pedidos", "Panel de administracion", "Integracion logistica"],
        faq: [
          { q: "Cuantos productos puedo tener?", a: "Hasta 50 productos incluidos. Para mas, te hacemos presupuesto de e-commerce avanzado." },
          { q: "Que metodos de pago acepta?", a: "Tarjeta de credito y debito via Stripe. Seguro y facil para ti y tus clientes." },
        ],
        relatedAgents: ["pixel", "core", "nexus"],
        deadline: "10-15 días",
        price: "2.000 – 4.000 €",
        startingPrice: 2000,
      },
      {
        name: "App Web / SaaS",
        slug: "app-web-saas",
        description: "Software a medida. Desde un CRM hasta un ERP completo.",
        longDescription: "Desarrollo de software a medida para tu negocio. Desde un CRM para gestionar clientes hasta un sistema completo de gestion. Analisis, diseño, desarrollo y despliegue. Tu herramienta digital hecha exactamente como la necesitas.",
        includes: [
          "Análisis y diseño UX/UI",
          "Desarrollo full-stack",
          "Base de datos y backend",
          "Autenticación y roles",
          "Deploy en producción",
        ],
        process: [
          { step: "Descubrimiento", description: "Entendemos tu problema y definimos la solucion" },
          { step: "Diseño UX/UI", description: "Diseñamos la interfaz y la experiencia" },
          { step: "Desarrollo", description: "Construimos frontend, backend y base de datos" },
          { step: "Testing", description: "Probamos a fondo antes de lanzar" },
          { step: "Deploy", description: "Desplegamos en produccion con monitorizacion" },
          { step: "Soporte", description: "Te acompañamos los primeros 30 dias" },
        ],
        deliverables: ["Aplicacion web completa", "Panel de administracion", "Base de datos", "API documentada", "Deploy en produccion", "30 dias de soporte"],
        faq: [
          { q: "Cuanto tarda un proyecto SaaS?", a: "Entre 20 y 40 dias dependiendo de la complejidad. Te damos un plazo concreto en el briefing." },
          { q: "Puedo ampliar funcionalidades despues?", a: "Si. Construimos con tecnologia moderna que permite escalar sin problemas." },
        ],
        relatedAgents: ["core", "pixel", "sage"],
        deadline: "20-40 días",
        price: "5.000 – 15.000 €",
        startingPrice: 5000,
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
        slug: "auditoria-seo",
        description: "Diagnóstico completo de tu presencia en buscadores.",
        longDescription: "Analizamos tu web de arriba a abajo: problemas tecnicos, palabras clave, competencia y oportunidades. Te entregamos un informe con un plan de accion priorizado para mejorar tu posicionamiento en Google.",
        includes: ["Análisis técnico completo", "Keyword research exhaustivo", "Análisis de competencia", "Plan de acción priorizado", "Informe ejecutivo"],
        process: [
          { step: "Rastreo", description: "Escaneamos tu web buscando errores tecnicos" },
          { step: "Keywords", description: "Investigamos que buscan tus clientes" },
          { step: "Competencia", description: "Analizamos que hacen tus competidores" },
          { step: "Informe", description: "Te entregamos un plan de accion claro" },
        ],
        deliverables: ["Informe tecnico completo", "Lista de keywords prioritarias", "Analisis de competencia", "Plan de accion con prioridades"],
        faq: [
          { q: "Necesito web para hacer la auditoria?", a: "Si, necesitas una web publicada. Si no la tienes, primero te la creamos." },
          { q: "Incluye la implementacion?", a: "No, la auditoria es el diagnostico. La implementacion es el SEO mensual." },
        ],
        relatedAgents: ["atlas"],
        deadline: "3-5 días",
        price: "300 – 500 €",
        startingPrice: 300,
      },
      {
        name: "SEO Mensual Básico",
        slug: "seo-mensual",
        description: "Posicionamiento continuo. Resultados compuestos.",
        longDescription: "Cada mes creamos contenido optimizado, mejoramos tu web tecnicamente y hacemos seguimiento de tus posiciones en Google. Los resultados del SEO son acumulativos: cada mes estas mejor que el anterior.",
        includes: ["4 artículos optimizados/mes", "Optimización on-page continua", "Reporting mensual", "Seguimiento de posiciones"],
        process: [
          { step: "Planificacion", description: "Seleccionamos las keywords del mes" },
          { step: "Contenido", description: "Escribimos articulos optimizados" },
          { step: "Optimizacion", description: "Mejoramos paginas existentes" },
          { step: "Reporting", description: "Te enviamos informe con resultados" },
        ],
        deliverables: ["4 articulos SEO", "Optimizaciones on-page", "Informe mensual", "Seguimiento de rankings"],
        faq: [
          { q: "Cuanto tarda en dar resultados?", a: "Los primeros resultados se ven en 60-90 dias. En 6 meses los resultados son claros y sostenibles." },
          { q: "Puedo cancelar cuando quiera?", a: "Si, sin permanencia. Pero recomendamos minimo 6 meses para resultados solidos." },
        ],
        relatedAgents: ["atlas", "copy"],
        deadline: "Mensual",
        price: "400 – 600 €/mes",
        startingPrice: 400,
        stripeProduct: "seo_monthly",
        featured: true,
      },
      {
        name: "SEO Premium",
        slug: "seo-premium",
        description: "Máxima inversión en orgánico. Para liderar tu sector.",
        longDescription: "El plan SEO completo para dominar tu sector en Google. El doble de contenido, link building activo, SEO tecnico avanzado y reporting semanal. Para negocios que quieren ser los primeros en todas las busquedas de su sector.",
        includes: ["8 artículos optimizados/mes", "Link building activo", "SEO técnico avanzado", "Schema markup completo", "Reporting avanzado semanal"],
        process: [
          { step: "Estrategia", description: "Diseñamos plan de dominacion SEO" },
          { step: "Contenido", description: "8 articulos de alta calidad al mes" },
          { step: "Link building", description: "Conseguimos enlaces de sitios relevantes" },
          { step: "Tecnico", description: "Optimizaciones avanzadas de velocidad y estructura" },
          { step: "Reporting", description: "Informe semanal con metricas clave" },
        ],
        deliverables: ["8 articulos SEO", "Link building activo", "SEO tecnico avanzado", "Schema markup", "Reporting semanal"],
        faq: [
          { q: "Que diferencia hay con el basico?", a: "El doble de contenido, link building activo, SEO tecnico avanzado y reportes semanales en vez de mensuales." },
        ],
        relatedAgents: ["atlas", "copy", "core"],
        deadline: "Mensual",
        price: "800 – 1.200 €/mes",
        startingPrice: 800,
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
        slug: "redes-starter",
        description: "Una red, presencia constante.",
        longDescription: "Gestionamos una red social de tu negocio con 12 publicaciones al mes. Copy profesional, diseño atractivo y calendario editorial. Tu marca activa sin que tu tengas que hacer nada.",
        includes: ["12 posts/mes (copy + diseño)", "Calendario editorial", "Métricas básicas mensuales"],
        process: [{ step: "Briefing", description: "Definimos tono, estilo y objetivos" }, { step: "Calendario", description: "Planificamos las 12 publicaciones del mes" }, { step: "Creacion", description: "Diseñamos y escribimos cada post" }, { step: "Publicacion", description: "Publicamos en los mejores horarios" }],
        deliverables: ["12 posts diseñados", "Calendario editorial", "Informe mensual"],
        faq: [{ q: "Que red social gestionais?", a: "La que mas convenga a tu negocio: Instagram, Facebook, LinkedIn o TikTok." }],
        relatedAgents: ["pulse", "nova"],
        deadline: "Mensual",
        price: "300 – 500 €/mes",
        startingPrice: 300,
        stripeProduct: "social_monthly",
      },
      {
        name: "Plan Growth",
        slug: "redes-growth",
        description: "Dos redes, crecimiento real.",
        longDescription: "Gestion profesional de 2 redes sociales con 20 publicaciones, reels, stories y community management. Para negocios que quieren crecer su audiencia y convertir seguidores en clientes.",
        includes: ["20 posts/mes", "Reels y Stories", "Community management", "Reporting mensual"],
        process: [{ step: "Estrategia", description: "Definimos objetivos y estrategia por red" }, { step: "Contenido", description: "Creamos posts, reels y stories" }, { step: "Comunidad", description: "Respondemos comentarios y mensajes" }, { step: "Reporting", description: "Informe mensual con metricas" }],
        deliverables: ["20 posts", "Reels y Stories", "Community management", "Informe mensual"],
        faq: [{ q: "Respondeis los mensajes privados?", a: "Si, gestionamos comentarios y DMs como parte del community management." }],
        relatedAgents: ["pulse", "nova", "copy"],
        deadline: "Mensual",
        price: "500 – 800 €/mes",
        startingPrice: 500,
        featured: true,
      },
      {
        name: "Plan Scale",
        slug: "redes-scale",
        description: "3+ redes, estrategia cross-platform.",
        longDescription: "Gestion integral de 3 o mas redes sociales con estrategia cross-platform, influencer outreach y dashboard en vivo. Para marcas que quieren dominar las redes en su sector.",
        includes: ["30+ posts/mes", "Estrategia cross-platform", "Influencer outreach", "Dashboard en vivo"],
        process: [{ step: "Estrategia", description: "Plan cross-platform personalizado" }, { step: "Contenido", description: "30+ piezas de contenido mensual" }, { step: "Influencers", description: "Identificamos y contactamos influencers" }, { step: "Dashboard", description: "Metricas en tiempo real" }],
        deliverables: ["30+ posts", "Estrategia cross-platform", "Contacto influencers", "Dashboard en vivo"],
        faq: [{ q: "Que redes incluye?", a: "Las 3 que mejor funcionen para tu negocio. Normalmente Instagram, Facebook/TikTok y LinkedIn." }],
        relatedAgents: ["pulse", "nova", "copy", "nexus"],
        deadline: "Mensual",
        price: "800 – 1.500 €/mes",
        startingPrice: 800,
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
        slug: "setup-campana",
        description: "Todo configurado para lanzar. Solo una vez.",
        longDescription: "Configuramos todo lo necesario para lanzar campañas de publicidad digital: estrategia, segmentacion, creativos, landing page y tracking. Una vez, bien hecho.",
        includes: ["Estrategia y segmentación", "Creativos de campaña", "Landing page optimizada", "Tracking e integración CRM"],
        process: [{ step: "Estrategia", description: "Definimos publico, mensaje y presupuesto" }, { step: "Creativos", description: "Diseñamos anuncios que convierten" }, { step: "Landing", description: "Creamos pagina de aterrizaje optimizada" }, { step: "Tracking", description: "Configuramos medicion de resultados" }],
        deliverables: ["Estrategia de campana", "3-5 creativos", "Landing page", "Tracking configurado"],
        faq: [{ q: "Incluye la gestion mensual?", a: "No, el setup es el lanzamiento. La gestion mensual es un servicio aparte." }],
        relatedAgents: ["nexus", "pixel", "nova"],
        deadline: "3-5 días",
        price: "500 – 800 €",
        startingPrice: 500,
      },
      {
        name: "Gestión Meta Ads",
        slug: "gestion-meta-ads",
        description: "Facebook e Instagram Ads optimizados sin parar.",
        longDescription: "Gestionamos tus campañas de Facebook e Instagram Ads cada dia. Optimizamos presupuesto, testamos creativos, segmentamos audiencias y te enviamos reportes semanales. Tu dinero trabaja al maximo.",
        includes: ["Optimización continua", "A/B testing de creativos", "Reporting semanal", "Nuevos creativos mensuales"],
        process: [{ step: "Analisis", description: "Evaluamos campanas actuales o diseñamos nuevas" }, { step: "Optimizacion", description: "Mejoramos segmentacion y creativos cada dia" }, { step: "Testing", description: "Probamos variantes para maximizar resultados" }, { step: "Reporting", description: "Informe semanal con metricas clave" }],
        deliverables: ["Gestion diaria de campanas", "A/B testing continuo", "Reportes semanales", "Creativos nuevos cada mes"],
        faq: [{ q: "El presupuesto de ads esta incluido?", a: "No. Nosotros gestionamos las campanas, tu pones el presupuesto publicitario que quieras (recomendamos minimo 300 euros/mes)." }],
        relatedAgents: ["nexus", "nova"],
        deadline: "Mensual",
        price: "400 – 800 €/mes + inversión",
        startingPrice: 400,
        featured: true,
      },
      {
        name: "Embudo Completo",
        slug: "embudo-completo",
        description: "Landing + email + ads + automatización. Todo conectado.",
        longDescription: "El sistema completo de captacion: landing page que convierte, secuencia de emails que nutre, campanas de ads que traen trafico y automatizaciones que cualifican leads. Todo conectado y midiendo resultados.",
        includes: ["Landing page de captación", "Secuencia de email marketing", "Campañas Meta + Google", "Automatización y CRM setup", "Dashboard de métricas"],
        process: [{ step: "Estrategia", description: "Diseñamos el embudo completo" }, { step: "Landing", description: "Creamos pagina de captacion" }, { step: "Emails", description: "Escribimos secuencia de nurturing" }, { step: "Ads", description: "Lanzamos campanas de trafico" }, { step: "Automatizacion", description: "Conectamos todo con CRM" }],
        deliverables: ["Landing page", "Secuencia de 5+ emails", "Campanas Meta + Google", "CRM configurado", "Dashboard de metricas"],
        faq: [{ q: "Necesito tener CRM?", a: "No. Te lo configuramos nosotros con herramientas modernas incluidas en el precio." }],
        relatedAgents: ["nexus", "pixel", "copy", "core"],
        deadline: "7-14 días setup",
        price: "1.500 – 3.000 €",
        startingPrice: 1500,
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
        slug: "logo-identidad",
        description: "Lo esencial para comunicar quién eres.",
        longDescription: "Tu logo profesional con paleta de colores y tipografia. Lo esencial para que tu negocio tenga una imagen coherente y profesional desde el primer dia. Incluye variantes para web, redes y tarjetas.",
        includes: ["Logotipo profesional", "Paleta de colores", "Tipografía de marca", "Usos básicos"],
        process: [{ step: "Briefing", description: "Entendemos tu negocio, valores y publico" }, { step: "Conceptos", description: "Diseñamos 2-3 propuestas de logo" }, { step: "Refinamiento", description: "Ajustamos el concepto elegido" }, { step: "Entrega", description: "Archivos finales en todos los formatos" }],
        deliverables: ["Logo en todos los formatos", "Paleta de colores", "Tipografia de marca", "Guia de uso basico"],
        faq: [{ q: "Cuantas propuestas de logo recibo?", a: "2-3 propuestas iniciales. Elegimos una y la refinamos hasta que estes 100% satisfecho." }],
        relatedAgents: ["nova"],
        deadline: "3-5 días",
        price: "400 – 800 €",
        startingPrice: 400,
      },
      {
        name: "Branding Completo",
        slug: "branding-completo",
        description: "Tu manual de marca. Consistencia en todo.",
        longDescription: "Identidad visual completa con manual de marca, aplicaciones en tarjetas, documentos y templates para redes sociales. Tu marca coherente en todos los puntos de contacto con el cliente.",
        includes: ["Todo lo del básico", "Manual de marca completo", "Aplicaciones (tarjetas, docs, etc.)", "Templates para redes sociales"],
        process: [{ step: "Investigacion", description: "Analizamos sector, competencia y publico" }, { step: "Identidad", description: "Logo, colores, tipografia y estilo" }, { step: "Manual", description: "Documentamos todas las reglas de uso" }, { step: "Aplicaciones", description: "Diseñamos tarjetas, docs y templates" }],
        deliverables: ["Logo completo", "Manual de marca", "Tarjetas de visita", "Plantillas documentos", "Templates redes sociales"],
        faq: [{ q: "Que incluye el manual de marca?", a: "Logo y variantes, colores exactos, tipografias, espaciados, usos correctos e incorrectos, y aplicaciones." }],
        relatedAgents: ["nova", "pulse"],
        deadline: "5-10 días",
        price: "800 – 1.500 €",
        startingPrice: 800,
        featured: true,
      },
      {
        name: "Rebranding",
        slug: "rebranding",
        description: "Nueva identidad. Nueva era.",
        longDescription: "Rediseño completo de tu marca: analizamos lo que no funciona, creamos una nueva identidad y te guiamos en la transicion. Para negocios que han crecido y su marca se ha quedado atras.",
        includes: ["Análisis de marca actual", "Nueva identidad completa", "Transición guiada", "Comunicación del cambio"],
        process: [{ step: "Auditoria", description: "Evaluamos tu marca actual y la percepcion" }, { step: "Estrategia", description: "Definimos la nueva direccion" }, { step: "Diseño", description: "Creamos la nueva identidad completa" }, { step: "Transicion", description: "Plan de cambio progresivo" }],
        deliverables: ["Nueva identidad completa", "Manual de marca", "Plan de transicion", "Comunicados de cambio"],
        faq: [{ q: "Cuanto dura la transicion?", a: "La nueva identidad se crea en 10-15 dias. La transicion total puede llevar 1-2 meses dependiendo de cuantos materiales tengas." }],
        relatedAgents: ["nova", "sage", "pulse"],
        deadline: "10-15 días",
        price: "1.200 – 2.500 €",
        startingPrice: 1200,
      },
    ],
  },
];

/** Find a service item by slug */
export function getServiceBySlug(slug: string): { service: Service; item: ServiceItem } | undefined {
  for (const service of services) {
    const item = service.items.find((i) => i.slug === slug);
    if (item) return { service, item };
  }
  return undefined;
}

/** Get all service slugs for generateStaticParams */
export function getAllServiceSlugs(): string[] {
  return services.flatMap((s) => s.items.map((i) => i.slug));
}

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
