export interface NichePainPoint {
  title: string;
  description: string;
}

export interface NicheSolution {
  title: string;
  description: string;
  agentId: string;
}

export interface NicheFaq {
  q: string;
  a: string;
}

export interface NicheLanding {
  slug: string;
  name: string;
  namePlural: string;
  headline: string;
  subheadline: string;
  heroStat: string;
  painPoints: NichePainPoint[];
  solutions: NicheSolution[];
  recommendedServices: string[]; // service category IDs from services.ts
  recommendedPackage: string;    // package ID from services.ts
  caseStudyIndex?: number;       // index in portfolio
  faq: NicheFaq[];
  metaTitle: string;
  metaDescription: string;
}

export const niches: NicheLanding[] = [
  {
    slug: "restaurantes",
    name: "restaurante",
    namePlural: "restaurantes",
    headline: "Tu restaurante lleno.\nSin depender del boca a boca.",
    subheadline: "Web profesional, redes sociales activas y posicionamiento en Google. Tu restaurante visible para miles de personas que buscan donde comer.",
    heroStat: "El 78% de los clientes buscan restaurantes en Google antes de elegir",
    painPoints: [
      {
        title: "Mesas vacias entre semana",
        description: "Dependes del boca a boca y los fines de semana. Entre semana el local esta medio vacio y los costes fijos siguen corriendo.",
      },
      {
        title: "No apareces en Google Maps",
        description: "Cuando alguien busca 'restaurante cerca de mi' o 'donde comer en [tu ciudad]', salen tus competidores pero tu no.",
      },
      {
        title: "Redes sociales abandonadas",
        description: "Tu cuenta de Instagram tiene la ultima publicacion de hace 3 meses. Los clientes la ven y piensan que has cerrado.",
      },
      {
        title: "Sin web o con web anticuada",
        description: "Tu carta esta en un PDF borroso. No tienes sistema de reservas online. Los clientes buscan tu menu y no lo encuentran.",
      },
    ],
    solutions: [
      {
        title: "Web con carta digital y reservas",
        description: "Una pagina web moderna con tu carta actualizada, fotos profesionales, sistema de reservas y enlace directo a WhatsApp.",
        agentId: "pixel",
      },
      {
        title: "Redes sociales que abren apetito",
        description: "Publicaciones profesionales de tus platos, stories de la cocina, reels que se comparten. Tu restaurante siempre presente.",
        agentId: "pulse",
      },
      {
        title: "Primero en Google Maps",
        description: "Optimizamos tu ficha de Google Business, conseguimos reseñas positivas y posicionamos tu web para busquedas locales.",
        agentId: "atlas",
      },
    ],
    recommendedServices: ["web", "redes", "seo"],
    recommendedPackage: "despega",
    faq: [
      { q: "Cuanto tarda en estar lista mi web?", a: "Entre 5 y 7 dias laborables tienes tu web completa con carta, fotos, reservas y todo configurado." },
      { q: "Puedo actualizar la carta yo mismo?", a: "Si. Te damos acceso a un panel sencillo donde cambias platos, precios y fotos en 2 minutos." },
      { q: "Necesito hacer fotos profesionales?", a: "Ayuda, pero no es obligatorio. Podemos trabajar con las fotos que tengas y mejorarlas con IA." },
      { q: "Cuanto cuesta al mes las redes sociales?", a: "Desde 300 euros al mes por una red social con 12 publicaciones, calendario editorial y metricas." },
    ],
    metaTitle: "Marketing Digital para Restaurantes — Web, SEO y Redes Sociales | PACAME",
    metaDescription: "Llena tu restaurante con marketing digital. Web con carta y reservas en 5 dias, redes sociales profesionales y posicionamiento en Google. Desde 300 euros.",
  },
  {
    slug: "clinicas",
    name: "clinica",
    namePlural: "clinicas",
    headline: "Mas pacientes.\nSin depender de las recomendaciones.",
    subheadline: "Web que transmite confianza, posicionamiento en Google y campanas de captacion. Tu clinica visible para quien busca tus servicios.",
    heroStat: "El 65% de los pacientes eligen clinica tras buscar en Google",
    painPoints: [
      {
        title: "Los pacientes no te encuentran",
        description: "Cuando alguien busca 'dentista en [tu ciudad]' o 'clinica estetica cerca', aparecen otros. Tu clinica es invisible online.",
      },
      {
        title: "Tu web no transmite confianza",
        description: "Los pacientes llegan a tu web y parece de hace 10 anos. No se ven las instalaciones, ni el equipo, ni los tratamientos claros.",
      },
      {
        title: "Solo captas por recomendacion",
        description: "Tu unica fuente de pacientes nuevos es el boca a boca. Si una semana no llegan recomendaciones, la agenda se vacia.",
      },
      {
        title: "Reseñas sin gestionar",
        description: "Tienes 3.8 estrellas en Google con reseñas negativas sin responder. Cada paciente potencial las lee antes de llamar.",
      },
    ],
    solutions: [
      {
        title: "Web profesional que genera confianza",
        description: "Pagina web moderna con tus tratamientos, equipo, instalaciones y sistema de citas online. Transmite profesionalidad desde el primer clic.",
        agentId: "pixel",
      },
      {
        title: "Primero en Google para tu especialidad",
        description: "Posicionamos tu clinica para las busquedas que hacen tus pacientes. 'Dentista en Madrid', 'clinica estetica Sevilla', etc.",
        agentId: "atlas",
      },
      {
        title: "Campanas que llenan tu agenda",
        description: "Anuncios en Facebook e Instagram segmentados por zona, edad e intereses. Captamos pacientes que buscan exactamente tus servicios.",
        agentId: "nexus",
      },
    ],
    recommendedServices: ["web", "seo", "ads"],
    recommendedPackage: "escala",
    caseStudyIndex: 3,
    faq: [
      { q: "Cumple con la normativa sanitaria?", a: "Si. Diseñamos webs que cumplen con la normativa de publicidad sanitaria vigente en España." },
      { q: "Puedo mostrar antes/despues?", a: "Depende de tu especialidad y normativa local. Te asesoramos sobre que se puede publicar y como." },
      { q: "Cuanto tarda en verse resultados del SEO?", a: "En 60-90 dias empiezas a ver mejoras de posicionamiento. En 6 meses los resultados son claros." },
      { q: "Gestionais las reseñas de Google?", a: "Si. Respondemos reseñas, gestionamos las negativas y creamos estrategias para conseguir mas positivas." },
    ],
    metaTitle: "Marketing Digital para Clinicas — Web, SEO y Captacion de Pacientes | PACAME",
    metaDescription: "Consigue mas pacientes para tu clinica con marketing digital. Web profesional, SEO local y campanas de captacion. Resultados medibles desde el primer mes.",
  },
  {
    slug: "abogados",
    name: "despacho de abogados",
    namePlural: "abogados y despachos",
    headline: "Mas clientes para tu despacho.\nSin directorios que no funcionan.",
    subheadline: "Web profesional, posicionamiento en Google y presencia en LinkedIn. Tu despacho visible para quienes necesitan un abogado.",
    heroStat: "El 72% de las personas buscan abogado en Google antes de llamar",
    painPoints: [
      {
        title: "Tu web es igual que la de todos",
        description: "Una web generica con foto de un mazo y textos legales que nadie lee. No te diferencia de los otros 500 despachos de tu ciudad.",
      },
      {
        title: "Pagas directorios sin resultados",
        description: "Estas en 3 directorios de abogados pagando cuotas mensuales. Los leads que llegan son de baja calidad o directamente no llegan.",
      },
      {
        title: "No aprovechas LinkedIn",
        description: "Tu perfil de LinkedIn tiene 200 contactos pero nunca publicas. Es el canal perfecto para captar clientes corporativos y no lo usas.",
      },
      {
        title: "No te encuentran en Google",
        description: "Cuando alguien busca 'abogado laboralista en [tu ciudad]', los primeros resultados son tus competidores.",
      },
    ],
    solutions: [
      {
        title: "Web que transmite autoridad",
        description: "Pagina web profesional con tus areas de practica, equipo, casos de exito y formulario de consulta. Diseño que genera confianza.",
        agentId: "pixel",
      },
      {
        title: "Posicionamiento para busquedas legales",
        description: "SEO especializado en terminos legales. 'Abogado divorcio Madrid', 'reclamar herencia'... Apareces cuando te buscan.",
        agentId: "atlas",
      },
      {
        title: "Anuncios para casos urgentes",
        description: "Campanas en Google Ads para busquedas con intencion de contratar. El cliente necesita un abogado ya y tu apareces primero.",
        agentId: "nexus",
      },
    ],
    recommendedServices: ["web", "seo", "ads"],
    recommendedPackage: "escala",
    faq: [
      { q: "Es mejor invertir en SEO o en Ads?", a: "Para empezar, Ads trae resultados inmediatos. SEO es inversion a medio plazo que crece cada mes. Lo ideal: ambos." },
      { q: "Puedo escribir los textos yo?", a: "Puedes, pero no lo recomendamos. Nuestro equipo escribe copy persuasivo que convierte, no textos legales que aburren." },
      { q: "Cuanto cuesta una web para un despacho?", a: "Desde 800 euros para una web de 5 paginas con formulario de consulta, areas de practica y diseño profesional." },
      { q: "Gestionais LinkedIn?", a: "Si. Publicamos contenido estrategico, optimizamos tu perfil y creamos una presencia profesional que atrae clientes." },
    ],
    metaTitle: "Marketing Digital para Abogados — Web, SEO y Captacion de Clientes | PACAME",
    metaDescription: "Consigue mas clientes para tu despacho de abogados. Web profesional, SEO para busquedas legales y campanas de captacion. Desde 800 euros.",
  },
  {
    slug: "tiendas",
    name: "tienda",
    namePlural: "tiendas y comercios",
    headline: "Vende online.\nSin perder la esencia de tu tienda.",
    subheadline: "Tienda online profesional, redes sociales activas y publicidad que trae clientes. Tu comercio abierto 24 horas, 7 dias.",
    heroStat: "El 67% de los consumidores compra online al menos una vez al mes",
    painPoints: [
      {
        title: "No vendes online",
        description: "Tu tienda cierra a las 8. Amazon y tus competidores venden las 24 horas. Cada dia que no estas online, pierdes ventas.",
      },
      {
        title: "Instagram sin estrategia",
        description: "Subes fotos de productos cuando te acuerdas. Sin hashtags, sin horarios, sin stories. Tus seguidores no crecen ni compran.",
      },
      {
        title: "No fidelizas clientes",
        description: "El cliente compra una vez y no vuelve a saber de ti. No haces email marketing, no tienes programa de fidelizacion.",
      },
      {
        title: "No sabes invertir en publicidad",
        description: "Probaste a 'promocionar' un post en Instagram y no funciono. Piensas que la publicidad online no sirve para tu negocio.",
      },
    ],
    solutions: [
      {
        title: "Tienda online profesional",
        description: "E-commerce con tu catalogo, carrito de compra, pago con tarjeta y gestion de pedidos. Tu tienda abierta 24/7.",
        agentId: "pixel",
      },
      {
        title: "Redes sociales que venden",
        description: "Fotos de producto profesionales, reels de novedades, stories con ofertas. Convertimos tus seguidores en compradores.",
        agentId: "pulse",
      },
      {
        title: "Publicidad que trae compradores",
        description: "Campanas en Instagram y Facebook segmentadas para llegar a gente de tu zona que busca lo que vendes.",
        agentId: "nexus",
      },
    ],
    recommendedServices: ["web", "redes", "ads"],
    recommendedPackage: "despega",
    caseStudyIndex: 2,
    faq: [
      { q: "Puedo gestionar pedidos yo mismo?", a: "Si. Te damos un panel sencillo donde ves pedidos, gestionas stock y controlas envios. Muy facil de usar." },
      { q: "Que metodo de pago acepta?", a: "Tarjeta de credito y debito via Stripe. Seguro, rapido y sin complicaciones para ti ni para el cliente." },
      { q: "Cuanto cuesta montar una tienda online?", a: "Desde 2.000 euros para una tienda con hasta 50 productos, carrito, checkout y diseno profesional." },
      { q: "Haceis fotos de producto?", a: "No hacemos fotografia, pero podemos mejorar tus fotos con IA y crear mockups profesionales de tus productos." },
    ],
    metaTitle: "Marketing Digital para Tiendas — E-commerce, Redes Sociales y Ads | PACAME",
    metaDescription: "Vende online con una tienda profesional. E-commerce desde 2.000 euros, redes sociales activas y publicidad que trae compradores. PACAME, tu equipo digital.",
  },
];

/** Get a niche by slug */
export function getNicheBySlug(slug: string): NicheLanding | undefined {
  return niches.find((n) => n.slug === slug);
}

/** Get all niche slugs for generateStaticParams */
export function getAllNicheSlugs(): string[] {
  return niches.map((n) => n.slug);
}
