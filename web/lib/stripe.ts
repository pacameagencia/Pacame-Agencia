import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});

// Productos PACAME con precios base (en centimos EUR)
export const PACAME_PRODUCTS = {
  landing: {
    name: "Landing Page Profesional",
    description:
      "Pagina de aterrizaje de alto rendimiento: diseno responsive, copywriting persuasivo, formulario de contacto, SEO optimizado y hosting incluido 12 meses. Entrega en 2-3 dias laborables.",
    minPrice: 30000, // 300€
  },
  web: {
    name: "Web Corporativa Completa",
    description:
      "Sitio web corporativo de 3-5 paginas: diseno personalizado, contenido optimizado para SEO, formularios, integraciones, blog listo para publicar y panel de administracion. Entrega en 5-7 dias laborables.",
    minPrice: 80000, // 800€
  },
  social_monthly: {
    name: "Gestion de Redes Sociales — Plan Mensual",
    description:
      "Gestion profesional de tus redes sociales: 12-20 publicaciones/mes, diseno grafico, copywriting, calendario editorial, analisis de metricas y reporting mensual.",
    minPrice: 19700, // 197€/mes
    recurring: true,
  },
  pack_web_social: {
    name: "Pack Web + Redes Sociales",
    description:
      "Solucion digital completa: web corporativa profesional + gestion mensual de redes sociales con 15% de descuento. Ideal para lanzar tu presencia digital de cero a profesional.",
    minPrice: 80000, // web base
    recurring: true,
    discount: 15,
  },
  seo_monthly: {
    name: "Posicionamiento SEO — Plan Mensual",
    description:
      "Estrategia SEO profesional: auditoria tecnica, optimizacion on-page, articulos optimizados, link building, schema markup y reporting avanzado con metricas reales.",
    minPrice: 29700, // 297€/mes
    recurring: true,
  },
  custom: {
    name: "Servicio a Medida",
    description:
      "Proyecto personalizado adaptado a las necesidades de tu negocio. Incluye analisis previo, propuesta detallada y seguimiento dedicado por el equipo de PACAME.",
    minPrice: 0,
  },
} as const;

export type ProductKey = keyof typeof PACAME_PRODUCTS;
