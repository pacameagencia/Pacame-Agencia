/**
 * Dark Room Crew · 6 tiers escalonados.
 * Spec canónica: strategy/darkroom/programa-afiliados.md v2.0
 *
 * Reglas duras (no inventar):
 *   - Refs activos = referidos en estado 'active' AHORA (no histórico).
 *   - Al subir/bajar de rango, el rate del nuevo tier aplica al cálculo
 *     recurrente del PRÓXIMO mes. El one_time_amount_cents queda snapshot
 *     del rate vigente cuando el referral pasa pending_30d → active.
 *   - TOPES inviolables: 10€ one-time, 5€/ref/mes recurring.
 *   - Min payout 50€ (5000 cents). Cookie dr_ref 30 días. Pending 30 días
 *     antes de pagar one-time (anti-refund).
 */

export type TierKey =
  | "init"
  | "active"
  | "pro"
  | "director"
  | "producer"
  | "top";

export interface Tier {
  key: TierKey;
  label: string;
  emoji: string;
  refsMin: number;
  refsMax: number | null; // null = sin tope (TOP)
  oneTimeCents: number;
  recurringCents: number;
}

export const TIERS: readonly Tier[] = [
  { key: "init",     label: "Init",     emoji: "🎬", refsMin: 1,  refsMax: 10, oneTimeCents: 500,  recurringCents: 100 },
  { key: "active",   label: "Active",   emoji: "🎞️", refsMin: 11, refsMax: 20, oneTimeCents: 600,  recurringCents: 200 },
  { key: "pro",      label: "Pro",      emoji: "🎥", refsMin: 21, refsMax: 30, oneTimeCents: 700,  recurringCents: 300 },
  { key: "director", label: "Director", emoji: "📽️", refsMin: 31, refsMax: 40, oneTimeCents: 800,  recurringCents: 400 },
  { key: "producer", label: "Producer", emoji: "🎟️", refsMin: 41, refsMax: 50, oneTimeCents: 900,  recurringCents: 500 },
  { key: "top",      label: "TOP",      emoji: "🌟", refsMin: 51, refsMax: null, oneTimeCents: 1000, recurringCents: 500 },
];

export const MIN_PAYOUT_CENTS = 5000; // 50€
export const COOKIE_DAYS = 30;
export const PENDING_30D_DAYS = 30;

/**
 * Devuelve el tier correspondiente al número de refs activos.
 * Si refs = 0 devuelve "init" (no hay rate aplicable, pero el afiliado
 * está en init por defecto hasta que tenga su primer ref).
 */
export function computeTier(refsActive: number): Tier {
  if (refsActive <= 0) return TIERS[0];
  for (const tier of TIERS) {
    if (
      refsActive >= tier.refsMin &&
      (tier.refsMax === null || refsActive <= tier.refsMax)
    ) {
      return tier;
    }
  }
  // Fallback (no debería pasar): si refs > 51 cae en TOP
  return TIERS[TIERS.length - 1];
}

/**
 * Cents totales del cobro recurrente mensual:
 *   refs_active × tier.recurringCents
 * Aplica el rate del tier vigente AHORA a TODOS los refs activos
 * (esa es la "retroactividad" del programa).
 */
export function computeMonthlyRecurring(refsActive: number): number {
  if (refsActive <= 0) return 0;
  const tier = computeTier(refsActive);
  return refsActive * tier.recurringCents;
}

/**
 * Devuelve el siguiente tier al actual (o null si ya está en TOP).
 */
export function nextTier(current: TierKey): Tier | null {
  const idx = TIERS.findIndex((t) => t.key === current);
  if (idx === -1 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

/**
 * Refs que faltan para llegar al siguiente tier (o 0 si en TOP).
 */
export function refsToNextTier(refsActive: number): number {
  const tier = computeTier(refsActive);
  const next = nextTier(tier.key);
  if (!next) return 0;
  return Math.max(0, next.refsMin - refsActive);
}
