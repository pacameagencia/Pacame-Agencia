/**
 * LLM budget guard — caps diarios por tier en EUR.
 *
 * Modo soft: 80% → warn + notifyPablo. 100% → throw LlmBudgetExceeded.
 * Override: env LLM_BUDGET_OVERRIDE=true o opts.skipBudgetCheck=true.
 *
 * getDailySpendEur() usa la view v_llm_today_by_tier. Si la query falla
 * (DB down, etc.) devolvemos 0 (fail-open) para no romper servicio.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { notifyPablo } from "@/lib/resend";
import type { LLMTier } from "./resolver";

export class LlmBudgetExceeded extends Error {
  readonly tier: LLMTier;
  readonly spentEur: number;
  readonly capEur: number;
  constructor(tier: LLMTier, spentEur: number, capEur: number) {
    super(
      `[llm-budget] tier=${tier} excedido: ${spentEur.toFixed(
        2
      )}€ gastados / ${capEur.toFixed(2)}€ cap`
    );
    this.name = "LlmBudgetExceeded";
    this.tier = tier;
    this.spentEur = spentEur;
    this.capEur = capEur;
  }
}

/** Convertidor simple USD→EUR — lazy read para testabilidad. */
function usdToEur(): number {
  const v = Number(process.env.LLM_USD_TO_EUR);
  return Number.isFinite(v) && v > 0 ? v : 0.92;
}

const DEFAULT_BUDGETS_EUR: Record<LLMTier, number> = {
  reasoning: 15,
  titan: 20,
  premium: 30,
  standard: 10,
  economy: 3,
};

function budgetCapEur(tier: LLMTier): number {
  const envKey = `LLM_BUDGET_${tier.toUpperCase()}_EUR_DAILY`;
  const fromEnv = process.env[envKey];
  const parsed = fromEnv !== undefined ? Number(fromEnv) : NaN;
  if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  return DEFAULT_BUDGETS_EUR[tier];
}

let warnedTiers = new Set<string>(); // reset cada dia — ver below

/**
 * Devuelve spend hoy (EUR) para un tier. Fail-open si DB error.
 */
export async function getDailySpendEur(tier: LLMTier): Promise<number> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("v_llm_today_by_tier")
      .select("cost_usd")
      .eq("tier", tier)
      .maybeSingle();
    if (error) {
      getLogger().warn({ err: error, tier }, "[llm-budget] query fallo");
      return 0;
    }
    const usd = Number(data?.cost_usd) || 0;
    return usd * usdToEur();
  } catch (err) {
    getLogger().warn({ err, tier }, "[llm-budget] exception (fail-open)");
    return 0;
  }
}

export interface BudgetCheckResult {
  allowed: boolean;
  tier: LLMTier;
  spentEur: number;
  capEur: number;
  /** Fraccion 0-1 o null si cap<=0 */
  usagePct: number | null;
  override: boolean;
  warning: boolean;
}

/**
 * Consulta si el call puede proceder. No lanza — el caller decide.
 * Cachear resultado por tier en una sola request seria ideal pero
 * no lo hacemos aqui (simple).
 */
export async function checkBudget(
  tier: LLMTier,
  opts: { skipBudgetCheck?: boolean } = {}
): Promise<BudgetCheckResult> {
  const override =
    opts.skipBudgetCheck === true ||
    process.env.LLM_BUDGET_OVERRIDE === "true";
  const capEur = budgetCapEur(tier);
  const spentEur = await getDailySpendEur(tier);
  const usagePct = capEur > 0 ? spentEur / capEur : null;

  // Reset warnings cada dia (simple: fecha en el key)
  const today = new Date().toISOString().slice(0, 10);
  const warnKey = `${today}::${tier}`;

  let warning = false;
  if (usagePct !== null && usagePct >= 0.8 && !warnedTiers.has(warnKey)) {
    warning = true;
    warnedTiers.add(warnKey);
    // Cleanup: si el set crece, reseteamos
    if (warnedTiers.size > 50) warnedTiers = new Set([warnKey]);
    getLogger().warn(
      { tier, spentEur, capEur, usagePct },
      "[llm-budget] 80%+ del cap diario"
    );
    // notifyPablo es async pero no esperamos
    void notifyPablo(
      `LLM budget alerta — tier ${tier}`,
      `<p>Tier <strong>${tier}</strong> ha alcanzado <strong>${(usagePct * 100).toFixed(
        0
      )}%</strong> del cap diario.</p>
       <p>Gastado hoy: <strong>${spentEur.toFixed(2)}€</strong> / cap ${capEur}€.</p>
       <p>Si llegas al 100%, los calls degradan automaticamente al tier inferior. Para override, setea <code>LLM_BUDGET_OVERRIDE=true</code>.</p>`
    );
  }

  const allowed = override || capEur <= 0 || spentEur < capEur;

  return {
    allowed,
    tier,
    spentEur,
    capEur,
    usagePct,
    override,
    warning,
  };
}

/**
 * Version que lanza si no permitido. El caller decide capturar y degradar.
 */
export async function enforceBudget(
  tier: LLMTier,
  opts: { skipBudgetCheck?: boolean } = {}
): Promise<BudgetCheckResult> {
  const result = await checkBudget(tier, opts);
  if (!result.allowed) {
    throw new LlmBudgetExceeded(tier, result.spentEur, result.capEur);
  }
  return result;
}

/** Reset cache interno — util para tests */
export function resetBudgetWarnings(): void {
  warnedTiers = new Set();
}
