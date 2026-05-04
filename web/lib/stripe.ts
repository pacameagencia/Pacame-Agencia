import Stripe from "stripe";

// Build-time tolerant: placeholder key prevents the SDK from throwing at import.
// Runtime calls will fail clearly if STRIPE_SECRET_KEY is missing in production.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build",
  {
    apiVersion: "2025-03-31.basil",
    typescript: true,
  }
);

// Productos PACAME con precios base (en centimos EUR).
// Los IDs reales en Stripe live (creados via MCP) se incluyen para que el
// dashboard/analitica pueda referenciar el price canonico en vez de usar
// solo price_data dinamico. El checkout sigue soportando price_data si se
// necesita un precio ad-hoc.
export const PACAME_PRODUCTS = {
  landing: {
    name: "Landing Page Profesional",
    description:
      "Pagina de aterrizaje de alto rendimiento: diseno responsive, copywriting persuasivo, formulario de contacto, SEO optimizado y hosting incluido 12 meses. Entrega en 2-3 dias laborables.",
    minPrice: 30000, // 300€
    stripeProductId: "prod_ULpyC9L3vNZBiJ",
    stripePriceId: "price_1TN8ImLILWpOzDaij1r2sefo",
  },
  web: {
    name: "Web Corporativa Completa",
    description:
      "Sitio web corporativo de 3-5 paginas: diseno personalizado, contenido optimizado para SEO, formularios, integraciones, blog listo para publicar y panel de administracion. Entrega en 5-7 dias laborables.",
    minPrice: 80000, // 800€
    stripeProductId: "prod_ULpy9o94VbwR4T",
    stripePriceId: "price_1TN8InLILWpOzDaihqvyWpGC",
  },
  social_monthly: {
    name: "Gestion de Redes Sociales — Plan Mensual",
    description:
      "Gestion profesional de tus redes sociales: 12-20 publicaciones/mes, diseno grafico, copywriting, calendario editorial, analisis de metricas y reporting mensual.",
    minPrice: 19700, // 197€/mes
    recurring: true,
    stripeProductId: "prod_ULpy8ASdx2Q04G",
    stripePriceId: "price_1TN8IoLILWpOzDaiFfUMwzTm",
  },
  pack_web_social: {
    name: "Pack Web + Redes Sociales",
    description:
      "Solucion digital completa: web corporativa profesional + gestion mensual de redes sociales con 15% de descuento. Ideal para lanzar tu presencia digital de cero a profesional.",
    minPrice: 80000, // web base
    recurring: true,
    discount: 15,
    stripeProductId: "prod_ULpynbm7l43CcY",
    stripePriceId: "price_1TN8J3LILWpOzDaigbMhWmR4",
  },
  seo_monthly: {
    name: "Posicionamiento SEO — Plan Mensual",
    description:
      "Estrategia SEO profesional: auditoria tecnica, optimizacion on-page, articulos optimizados, link building, schema markup y reporting avanzado con metricas reales.",
    minPrice: 29700, // 297€/mes
    recurring: true,
    stripeProductId: "prod_ULpyAwgpI2O9b0",
    stripePriceId: "price_1TN8IqLILWpOzDaitqGS3zMi",
  },
  custom: {
    name: "Servicio a Medida",
    description:
      "Proyecto personalizado adaptado a las necesidades de tu negocio. Incluye analisis previo, propuesta detallada y seguimiento dedicado por el equipo de PACAME.",
    minPrice: 0,
  },
  // ── Dark Room (Capa 3 SaaS) · creados via tools/darkroom-stripe-setup.mjs ──
  darkroom_pro: {
    name: "DarkRoom Pro",
    description:
      "Group buy legal · 12 herramientas IA premium · 24,90€/mes con 2 días de prueba.",
    minPrice: 2490,
    recurring: true,
    trialDays: 2,
    stripeProductId: "prod_UR6uQwtrIAsFm4",
    stripePriceId: "price_1TSEgQLILWpOzDaiAVGAPm7y",
  },
  darkroom_lifetime: {
    name: "DarkRoom Lifetime",
    description:
      "Group buy legal · 12 herramientas IA premium · acceso de por vida · pago único 349€.",
    minPrice: 34900,
    stripeProductId: "prod_UR6uBGdBcwjZIw",
    stripePriceId: "price_1TSEgRLILWpOzDai7vE3pDSv",
  },
} as const;

export type ProductKey = keyof typeof PACAME_PRODUCTS;

export function getProductDisplayName(key: string): string {
  const product = PACAME_PRODUCTS[key as ProductKey];
  return product?.name || key;
}
