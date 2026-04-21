/**
 * Finder rules — mapping (sector + size + goal) to recommended persona + services.
 *
 * Design choice: explicit rule table sin ML. Simple, auditable, editable.
 * Cada rule devuelve persona_slug dentro de un vertical_slug, que luego el
 * engine usa para fetch ficha completa + build bundle.
 */

export type Sector =
  | "restaurante"
  | "hotel"
  | "clinica"
  | "gym"
  | "inmobiliaria"
  | "ecommerce"
  | "formacion"
  | "saas"
  | "otro";

export type BusinessSize = "solo" | "small" | "medium" | "large";

export type Goal =
  | "mas-leads"
  | "mejor-conversion"
  | "ahorrar-tiempo"
  | "expandir-canales"
  | "todo-en-uno";

export type Budget = "low" | "mid" | "high" | "enterprise";

export type Urgency = "urgent" | "1-month" | "3-months" | "exploring";

export interface QuizAnswers {
  sector: Sector;
  size: BusinessSize;
  goal: Goal;
  budget: Budget;
  urgency: Urgency;
}

/**
 * Tabla de reglas (sector, size) -> persona_slug dentro del vertical.
 * Fallback: primera persona del vertical (sort_order 1).
 */
export const PERSONA_RULES: Record<
  string,
  Partial<Record<BusinessSize, string>>
> = {
  restaurante: {
    solo: "food-truck",
    small: "bar-cafeteria",
    medium: "dueno-restaurante",
    large: "dueno-restaurante",
  },
  hotel: {
    solo: "apartamentos-turisticos",
    small: "hostel",
    medium: "hotel-boutique",
    large: "hotel-boutique",
  },
  clinica: {
    solo: "fisioterapeuta",
    small: "dentista",
    medium: "clinica-privada",
    large: "clinica-privada",
  },
  gym: {
    solo: "entrenador-personal",
    small: "crossfit-box",
    medium: "gimnasio",
    large: "gimnasio",
  },
  inmobiliaria: {
    solo: "dueno-airbnb",
    small: "dueno-airbnb",
    medium: "inmobiliaria",
    large: "promotor",
  },
  ecommerce: {
    solo: "marketplace-seller",
    small: "dropshipping",
    medium: "tienda-online",
    large: "tienda-online",
  },
  formacion: {
    solo: "coach-solo",
    small: "coach-solo",
    medium: "academia",
    large: "universidad",
  },
  saas: {
    solo: "early-stage",
    small: "early-stage",
    medium: "scaleup",
    large: "enterprise",
  },
};

/**
 * Bundle recomendado: service slugs que priorizamos segun goal + budget.
 * Cada item incluye price_cents para computar totales + bundle discount.
 */
export interface ServiceBundleItem {
  slug: string;
  name: string;
  price_cents: number;
  why: string; // 1-line explicacion
}

export const GOAL_SERVICES: Record<Goal, ServiceBundleItem[]> = {
  "mas-leads": [
    { slug: "landing-1page", name: "Landing 1 pagina", price_cents: 7900, why: "Convierte visitas en leads en 48h" },
    { slug: "seo-audit-pdf", name: "Auditoria SEO express", price_cents: 2900, why: "Identifica donde pierdes trafico" },
    { slug: "meta-ads-setup", name: "Meta Ads setup", price_cents: 14900, why: "Pixel + campana + creativos tier-1" },
  ],
  "mejor-conversion": [
    { slug: "landing-1page", name: "Landing optimizada", price_cents: 7900, why: "CRO copy + diseno editorial" },
    { slug: "thank-you-page", name: "Thank-you page CRO", price_cents: 2900, why: "Upsell post-conversion automatico" },
    { slug: "copy-hero-cta", name: "Copy hero + CTA", price_cents: 3900, why: "Mensaje que engancha en 3 segundos" },
  ],
  "ahorrar-tiempo": [
    { slug: "contact-form-setup", name: "Contact form anti-spam", price_cents: 2900, why: "Formulario que califica leads solo" },
    { slug: "whatsapp-button", name: "WhatsApp Business auto", price_cents: 1900, why: "Respuestas automaticas 24/7" },
    { slug: "automatizaciones-n8n", name: "Automatizaciones n8n", price_cents: 14900, why: "Conecta 400+ apps sin codigo" },
  ],
  "expandir-canales": [
    { slug: "post-instagram", name: "Pack 4 posts Instagram", price_cents: 3900, why: "Contenido premium mensual" },
    { slug: "post-linkedin", name: "Post LinkedIn profesional", price_cents: 2900, why: "Autoridad B2B" },
    { slug: "post-tiktok", name: "Post TikTok", price_cents: 2500, why: "Alcance organico Gen-Z" },
  ],
  "todo-en-uno": [
    { slug: "landing-1page", name: "Landing 1 pagina", price_cents: 7900, why: "Base de toda conversion digital" },
    { slug: "seo-audit-pdf", name: "Auditoria SEO", price_cents: 2900, why: "Vision global tu presencia digital" },
    { slug: "brand-guidelines-mini", name: "Mini brand guidelines", price_cents: 7900, why: "Identidad coherente cross-channel" },
  ],
};

/**
 * Budget ranges en centimos EUR para filtrar bundle recomendado.
 */
export const BUDGET_MAX_CENTS: Record<Budget, number> = {
  low: 50000,        // <500€
  mid: 200000,       // 500-2k€
  high: 1000000,     // 2k-10k€
  enterprise: 10000000, // 10k+
};

/**
 * Urgency -> timeline days promedio que prometemos.
 */
export const URGENCY_TIMELINE: Record<Urgency, number> = {
  urgent: 7,
  "1-month": 14,
  "3-months": 30,
  exploring: 45,
};

/**
 * Descuento bundle: 15% si bundle tiene 2+ servicios.
 */
export const BUNDLE_DISCOUNT_PCT = 15;
