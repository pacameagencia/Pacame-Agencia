/**
 * Finder recommend engine — pure function.
 *
 * Input: QuizAnswers from 5-step quiz.
 * Output: Recommendation {persona_slug, vertical_slug, bundle, totals}.
 *
 * Zero side effects, fully testeable. DB persistence lives en API route.
 */

import {
  type QuizAnswers,
  type ServiceBundleItem,
  PERSONA_RULES,
  GOAL_SERVICES,
  BUDGET_MAX_CENTS,
  URGENCY_TIMELINE,
  BUNDLE_DISCOUNT_PCT,
} from "./rules";

export interface Recommendation {
  vertical_slug: string | null; // null si "otro"
  persona_slug: string | null;
  bundle: ServiceBundleItem[];
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  timeline_days: number;
  headline: string; // personalized copy
}

/**
 * Selecciona persona_slug segun (sector, size). Devuelve null si sector="otro".
 */
export function pickPersona(
  sector: QuizAnswers["sector"],
  size: QuizAnswers["size"]
): { vertical: string | null; persona: string | null } {
  if (sector === "otro") return { vertical: null, persona: null };
  const rules = PERSONA_RULES[sector];
  if (!rules) return { vertical: sector, persona: null };
  const persona = rules[size] ?? Object.values(rules)[0] ?? null;
  return { vertical: sector, persona };
}

/**
 * Construye bundle filtrado por goal + budget. Corta items si total excede budget max.
 */
export function buildBundle(
  goal: QuizAnswers["goal"],
  budget: QuizAnswers["budget"]
): ServiceBundleItem[] {
  const candidates = GOAL_SERVICES[goal] ?? [];
  const maxCents = BUDGET_MAX_CENTS[budget];

  // Greedy: incluye items hasta que el subtotal exceda budget.
  const bundle: ServiceBundleItem[] = [];
  let runningTotal = 0;
  for (const item of candidates) {
    if (runningTotal + item.price_cents <= maxCents) {
      bundle.push(item);
      runningTotal += item.price_cents;
    }
  }

  // Si bundle vacio (budget low + todos items costosos), incluye el mas barato.
  if (bundle.length === 0 && candidates.length > 0) {
    const cheapest = [...candidates].sort((a, b) => a.price_cents - b.price_cents)[0];
    bundle.push(cheapest);
  }

  return bundle;
}

/**
 * Computa totals con bundle discount si aplica.
 */
export function computeTotals(bundle: ServiceBundleItem[]): {
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
} {
  const subtotal_cents = bundle.reduce((s, i) => s + i.price_cents, 0);
  const hasDiscount = bundle.length >= 2;
  const discount_cents = hasDiscount
    ? Math.round(subtotal_cents * (BUNDLE_DISCOUNT_PCT / 100))
    : 0;
  const total_cents = subtotal_cents - discount_cents;
  return { subtotal_cents, discount_cents, total_cents };
}

/**
 * Genera headline personalizado para el result page.
 */
export function makeHeadline(
  sector: QuizAnswers["sector"],
  goal: QuizAnswers["goal"]
): string {
  const sectorLabel: Record<string, string> = {
    restaurante: "restaurante",
    hotel: "hotel",
    clinica: "clinica",
    gym: "gimnasio o box",
    inmobiliaria: "inmobiliaria",
    ecommerce: "ecommerce",
    formacion: "academia o coach",
    saas: "SaaS",
    otro: "negocio",
  };
  const goalLabel: Record<QuizAnswers["goal"], string> = {
    "mas-leads": "capturar mas leads",
    "mejor-conversion": "convertir mejor",
    "ahorrar-tiempo": "ahorrar tiempo operativo",
    "expandir-canales": "expandir a mas canales",
    "todo-en-uno": "un sistema completo",
  };
  return `Para tu ${sectorLabel[sector] ?? "negocio"}, recomendamos ${goalLabel[goal]}.`;
}

/**
 * Orquesta todo: input answers, output recommendation completa.
 */
export function recommend(answers: QuizAnswers): Recommendation {
  const { vertical, persona } = pickPersona(answers.sector, answers.size);
  const bundle = buildBundle(answers.goal, answers.budget);
  const totals = computeTotals(bundle);
  const timeline_days = URGENCY_TIMELINE[answers.urgency];
  const headline = makeHeadline(answers.sector, answers.goal);

  return {
    vertical_slug: vertical,
    persona_slug: persona,
    bundle,
    subtotal_cents: totals.subtotal_cents,
    discount_cents: totals.discount_cents,
    total_cents: totals.total_cents,
    timeline_days,
    headline,
  };
}

/**
 * Generador de slug 8-char para share links. Colisiones muy improbables.
 */
export function generateShareSlug(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // sin 0/o/1/i/l
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return slug;
}
