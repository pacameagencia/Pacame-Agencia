import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});

// Productos PACAME con precios base (en centimos EUR)
export const PACAME_PRODUCTS = {
  landing: {
    name: "Landing Page",
    description: "Diseno y desarrollo de landing page profesional",
    minPrice: 30000, // 300€
  },
  web: {
    name: "Web Corporativa",
    description: "Diseno y desarrollo de web corporativa completa",
    minPrice: 80000, // 800€
  },
  social_monthly: {
    name: "Gestion RRSS Mensual",
    description: "Gestion profesional de redes sociales con IA",
    minPrice: 19700, // 197€/mes
    recurring: true,
  },
  pack_web_social: {
    name: "Pack Web + RRSS",
    description: "Web corporativa + gestion mensual de RRSS (15% dto)",
    minPrice: 80000, // web base
    recurring: true,
    discount: 15,
  },
  seo_monthly: {
    name: "SEO Mensual",
    description: "Estrategia SEO y optimizacion continua",
    minPrice: 29700, // 297€/mes
    recurring: true,
  },
  custom: {
    name: "Servicio Personalizado",
    description: "Servicio a medida segun necesidades del cliente",
    minPrice: 0,
  },
} as const;

export type ProductKey = keyof typeof PACAME_PRODUCTS;
