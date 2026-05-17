/**
 * PACAME LLM Resolver — tier + strategy → (provider, model, extras)
 *
 * Sprint v0.10.30 (2026-05-17) — Stack 100% Anthropic primary + Nebius fallback.
 * Eliminado provider `gemma` (Ollama VPS deprecated en v0.10.29).
 *
 * Pure: no side effects, no network, no reads of runtime env except via
 * the explicit `env` arg passed in. Makes it trivially testable.
 *
 * Strategy actual:
 *  - quality-first (default): Claude primary para TODOS los tiers, Nebius fallback.
 *  - cost-first (opt-in): Nebius primary para todo, Claude como último fallback.
 *
 * Mapping tier → modelo Claude (default; override por env CLAUDE_MODEL_*):
 *  - reasoning → Opus 4.6 (extended thinking habilitada)
 *  - titan     → Opus 4.6
 *  - premium   → Sonnet 4.6
 *  - standard  → Sonnet 4.6
 *  - economy   → Haiku 4.5
 *
 * Por qué quitamos gemma:
 *  - Ollama (Gemma 4 e2b) consumía 2-4 GB RAM en VPS Hostinger
 *  - Claude Haiku 4.5 es mejor calidad y cuesta <0,80€/1M tokens (irrelevante para nuestro volumen)
 *  - 1 proveedor primario = menos puntos de fallo + más simple
 */

export type LLMTier = "reasoning" | "titan" | "premium" | "standard" | "economy";
export type LLMStrategy = "quality-first" | "cost-first";
export type LLMProvider = "claude" | "nebius";

export interface ResolvedTier {
  /** Orden de providers a intentar. El primero es el primary. */
  providerOrder: LLMProvider[];
  /** Modelo por provider. */
  models: Partial<Record<LLMProvider, string>>;
  /** Extras para el provider primary (ej. extended thinking) */
  extras?: {
    extendedThinking?: { budgetTokens: number };
  };
}

/** Defaults claude — pueden override por env */
const DEFAULT_CLAUDE_MODELS: Record<LLMTier, string> = {
  reasoning: "claude-opus-4-6",
  titan: "claude-opus-4-6",
  premium: "claude-sonnet-4-6",
  standard: "claude-sonnet-4-6",
  economy: "claude-haiku-4-5-20251001",
};

/** Defaults nebius — pueden override por env */
const DEFAULT_NEBIUS_MODELS: Record<LLMTier, string> = {
  reasoning: "Qwen/Qwen3-Next-80B-A3B-Thinking-fast",
  titan: "moonshotai/Kimi-K2.5",
  premium: "Qwen/Qwen3-235B-A22B-Instruct-2507",
  standard: "Qwen/Qwen3-Next-80B-A3B-Thinking-fast",
  economy: "Qwen/Qwen3-30B-A3B-Instruct-2507",
};

/** Extended thinking por tier. Solo reasoning lo usa por default. */
const DEFAULT_THINKING_BUDGETS: Partial<Record<LLMTier, number>> = {
  reasoning: 5000,
};

export interface ResolverEnv {
  CLAUDE_MODEL_REASONING?: string;
  CLAUDE_MODEL_TITAN?: string;
  CLAUDE_MODEL_PREMIUM?: string;
  CLAUDE_MODEL_STANDARD?: string;
  CLAUDE_MODEL_ECONOMY?: string;
  NEBIUS_MODEL_REASONING?: string;
  NEBIUS_MODEL_TITAN?: string;
  NEBIUS_MODEL_PREMIUM?: string;
  NEBIUS_MODEL_STANDARD?: string;
  NEBIUS_MODEL_ECONOMY?: string;
  LLM_STRATEGY?: string;
  LLM_THINKING_BUDGET_TOKENS?: string;
}

function claudeModel(tier: LLMTier, env: ResolverEnv): string {
  const key = `CLAUDE_MODEL_${tier.toUpperCase()}` as keyof ResolverEnv;
  return (env[key] as string) || DEFAULT_CLAUDE_MODELS[tier];
}

function nebiusModel(tier: LLMTier, env: ResolverEnv): string {
  const key = `NEBIUS_MODEL_${tier.toUpperCase()}` as keyof ResolverEnv;
  return (env[key] as string) || DEFAULT_NEBIUS_MODELS[tier];
}

/**
 * Resolver principal.
 * - Valida tier
 * - Elige providerOrder segun strategy
 * - Rellena models + extras
 */
export function resolveTierToModel(
  tier: LLMTier,
  strategy: LLMStrategy = "quality-first",
  env: ResolverEnv = {}
): ResolvedTier {
  const validTiers: LLMTier[] = ["reasoning", "titan", "premium", "standard", "economy"];
  if (!validTiers.includes(tier)) {
    throw new Error(`[llm-resolver] tier invalido: "${tier}"`);
  }

  const cm = claudeModel(tier, env);
  const nm = nebiusModel(tier, env);

  let providerOrder: LLMProvider[];

  if (strategy === "cost-first") {
    // Cost-first: Nebius primary para todo, Claude fallback
    providerOrder = ["nebius", "claude"];
  } else {
    // Quality-first (default): Claude primary SIEMPRE, Nebius fallback de resiliencia
    providerOrder = ["claude", "nebius"];
  }

  // Extras: extended thinking solo cuando Claude es primary Y tier es reasoning
  const extras: ResolvedTier["extras"] = {};
  const thinkingBudget = tier === "reasoning"
    ? Number(env.LLM_THINKING_BUDGET_TOKENS) || DEFAULT_THINKING_BUDGETS[tier] || 0
    : 0;
  if (thinkingBudget > 0 && providerOrder[0] === "claude") {
    extras.extendedThinking = { budgetTokens: thinkingBudget };
  }

  return {
    providerOrder,
    models: {
      claude: cm,
      nebius: nm,
    },
    extras: Object.keys(extras).length > 0 ? extras : undefined,
  };
}

/**
 * Determina la strategy efectiva para un call dado.
 * Prioridad: opts.strategy > env.LLM_STRATEGY > "quality-first"
 */
export function resolveStrategy(
  optStrategy: LLMStrategy | undefined,
  env: ResolverEnv
): LLMStrategy {
  if (optStrategy === "quality-first" || optStrategy === "cost-first") {
    return optStrategy;
  }
  const envStrategy = env.LLM_STRATEGY;
  if (envStrategy === "cost-first") return "cost-first";
  return "quality-first";
}

/**
 * Degradacion automatica: si un tier hits budget cap, devuelve el tier
 * inmediatamente inferior. Util como fallback "soft" para no romper
 * el servicio cuando se alcanza el cap diario.
 */
export function degradeTier(tier: LLMTier): LLMTier | null {
  const chain: Record<LLMTier, LLMTier | null> = {
    reasoning: "titan",
    titan: "premium",
    premium: "standard",
    standard: "economy",
    economy: null, // ya es el minimo
  };
  return chain[tier];
}
