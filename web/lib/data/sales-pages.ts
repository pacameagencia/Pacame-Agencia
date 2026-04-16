export interface SalesPageData {
  slug: string;
  serviceName: string;
  serviceSlug: string;
  headline: string;
  subheadline: string;
  painPoints: { title: string; description: string; icon: string }[];
  solution: { title: string; description: string }[];
  stats: { value: string; label: string }[];
  process: { step: string; title: string; description: string }[];
  guarantee: { title: string; description: string };
  faq: { q: string; a: string }[];
  price: number;
  recurring: boolean;
  product: string;
}

export const salesPages: Record<string, SalesPageData> = {
  "landing-page": {
    slug: "landing-page",
    serviceName: "Landing Page de Alto Rendimiento",
    serviceSlug: "landing-page",
    headline: "Una Landing Page que convierte visitantes en clientes. En 3 dias.",
    subheadline:
      "El 73% de las PYMEs espanolas pierden clientes porque su web no convierte. Nosotros creamos paginas de aterrizaje con copywriting persuasivo, diseno profesional y tecnologia moderna que multiplican tus leads desde el primer dia.",
    painPoints: [
      {
        title: "Tu web no genera ni un lead",
        description:
          "Tienes visitas pero nadie te contacta. Tu pagina parece un folleto digital que no invita a actuar. Sin formularios optimizados, sin llamadas a la accion claras, sin resultado.",
        icon: "TrendingDown",
      },
      {
        title: "Pagas ads que no convierten",
        description:
          "Inviertes en Google o Meta Ads pero el dinero se evapora. La razon: mandas trafico a una pagina generica que no esta disenada para convertir ese trafico en clientes.",
        icon: "BanknoteX",
      },
      {
        title: "Tu competencia te come terreno",
        description:
          "Mientras tu sigues con una web anticuada, tus competidores ya tienen landings optimizadas que captan los clientes que tu estas perdiendo. Cada dia sin actuar es dinero que dejas en la mesa.",
        icon: "Users",
      },
      {
        title: "No tienes tiempo ni equipo",
        description:
          "Disenar, escribir textos, programar, optimizar para movil, configurar formularios... Montar una landing profesional requiere 4-5 perfiles distintos. Tu tienes un negocio que atender.",
        icon: "Clock",
      },
    ],
    solution: [
      {
        title: "Diseno que genera confianza",
        description:
          "Un diseno visual profesional adaptado a tu marca que transmite credibilidad desde el primer segundo. Responsive, rapido y con la estetica que tus clientes esperan.",
      },
      {
        title: "Copywriting que convierte",
        description:
          "Textos escritos por especialistas en persuasion. Cada palabra esta medida para guiar al visitante desde el interes hasta la accion: rellenar el formulario o llamarte.",
      },
      {
        title: "Tecnologia moderna que vuela",
        description:
          "Construida con Next.js y desplegada en servidores globales. Carga en menos de 1 segundo, lo que mejora tu SEO y evita que los visitantes se vayan antes de leer.",
      },
      {
        title: "Formulario inteligente conectado",
        description:
          "Cada lead llega a tu email, tu WhatsApp y tu CRM automaticamente. Sin perder ni un contacto, sin revisar bandejas de spam, sin fallos.",
      },
    ],
    stats: [
      { value: "3 dias", label: "Tiempo de entrega" },
      { value: "12%", label: "Tasa de conversion media" },
      { value: "300€", label: "Desde" },
      { value: "150+", label: "Landings entregadas" },
    ],
    process: [
      {
        step: "01",
        title: "Briefing rapido",
        description:
          "Una llamada de 15 minutos donde nos cuentas tu negocio, tu publico y tu objetivo. Nosotros hacemos las preguntas correctas.",
      },
      {
        step: "02",
        title: "Diseno y textos",
        description:
          "Nuestros agentes de IA crean el diseno visual y escriben los textos persuasivos en paralelo. Tu solo apruebas.",
      },
      {
        step: "03",
        title: "Desarrollo y testing",
        description:
          "Construimos la landing con tecnologia moderna, la probamos en todos los dispositivos y optimizamos la velocidad.",
      },
      {
        step: "04",
        title: "Publicacion y seguimiento",
        description:
          "La publicamos con tu dominio, configuramos el tracking y te ensenamos a ver los resultados en tu dashboard.",
      },
    ],
    guarantee: {
      title: "Garantia de devolucion 15 dias",
      description:
        "Si en los primeros 15 dias no estas satisfecho con el resultado, te devolvemos el 100% del dinero. Sin preguntas, sin letra pequena. Asumimos nosotros el riesgo porque confiamos en nuestro trabajo.",
    },
    faq: [
      {
        q: "Cuanto tarda en estar lista mi landing page?",
        a: "Entre 2 y 3 dias habiles desde que apruebas el briefing. Si tienes prisa, tenemos opcion express en 24 horas con un pequeño suplemento.",
      },
      {
        q: "Necesito tener dominio y hosting?",
        a: "El hosting esta incluido durante 1 ano. Si no tienes dominio, te ayudamos a comprar uno (10-15 euros/ano aparte). Si ya tienes dominio, lo conectamos sin coste.",
      },
      {
        q: "Puedo editar la pagina despues?",
        a: "Si. Te damos acceso a un panel sencillo donde puedes cambiar textos e imagenes sin saber programar. Y si necesitas cambios mas grandes, estamos a un mensaje.",
      },
      {
        q: "Funciona bien en movil?",
        a: "Absolutamente. El 70% del trafico en Espana viene de movil, asi que disenamos mobile-first. Se ve perfecta en cualquier pantalla.",
      },
      {
        q: "Que pasa si no me convence el diseno?",
        a: "Incluimos hasta 2 rondas de revision sin coste extra. Y si aun asi no te convence, activamos la garantia de devolucion de 15 dias.",
      },
      {
        q: "Incluye SEO?",
        a: "Incluye SEO on-page basico: titulo, meta descripcion, velocidad de carga y estructura. Para posicionamiento avanzado, tenemos planes SEO mensuales.",
      },
      {
        q: "Puedo usar la landing para campanas de publicidad?",
        a: "Estan disenadas exactamente para eso. De hecho, el 80% de nuestros clientes usan su landing como destino de campanas Meta o Google Ads.",
      },
    ],
    price: 300,
    recurring: false,
    product: "landing",
  },
};

/**
 * Get a sales page by slug.
 */
export function getSalesPage(slug: string): SalesPageData | undefined {
  return salesPages[slug];
}

/**
 * Get all sales page slugs for generateStaticParams.
 */
export function getAllSalesPageSlugs(): string[] {
  return Object.keys(salesPages);
}
