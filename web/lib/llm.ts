/**
 * PACAME — Dispatcher LLM Unificado (quality-first)
 *
 * Routing segun (tier, strategy):
 *   reasoning → Claude Opus extended thinking → Nebius Qwen-80B-Thinking fallback
 *   titan     → Claude Opus primary → Nebius Kimi-K2.5 fallback (quality-first)
 *   premium   → Claude Sonnet primary → Nebius Qwen-235B fallback (quality-first)
 *   standard  → Nebius Qwen-80B primary → Claude Haiku fallback
 *   economy   → Gemma self-hosted → Nebius Qwen-30B → Claude Haiku
 *
 * cost-first (opt-in): titan/premium pasan a Nebius primary.
 *
 * Observabilidad: cada call se registra en `llm_calls` via recordLlmCall (async fire-and-forget).
 * Budget: cada call verifica cap diario por tier; si se excede, degrada al tier inferior.
 */

import { nebiusChat, type NebiusMessage } from "./nebius";
import { gemmaChat, type GemmaMessage } from "./gemma";
import { getLogger } from "@/lib/observability/logger";
import {
  resolveTierToModel,
  resolveStrategy,
  degradeTier,
  type LLMTier,
  type LLMStrategy,
  type LLMProvider,
  type ResolverEnv,
} from "./llm/resolver";
import { recordLlmCall, estimateCostUsd } from "./llm/observability";
import { checkBudget, LlmBudgetExceeded } from "./llm/budget-guard";

export type { LLMTier, LLMStrategy } from "./llm/resolver";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  tier: LLMTier;
  maxTokens?: number;
  temperature?: number;
  /** Override strategy por call (default: env LLM_STRATEGY o quality-first) */
  strategy?: LLMStrategy;
  /** Forzar proveedor (omitir routing) */
  forceProvider?: LLMProvider;
  /** Saltar Gemma aunque el tier sea economy */
  skipGemma?: boolean;
  /** Saltar budget check (emergencia) */
  skipBudgetCheck?: boolean;
  /** Etiqueta para observability (ej. "outreach/cold_email") */
  callSite?: string;
  /** Cliente/actor para attribution */
  actorId?: string | null;
  /** Metadata extra para llm_calls.metadata */
  metadata?: Record<string, unknown>;
}

export interface LLMResult {
  content: string;
  provider: LLMProvider;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tokensThinking?: number;
  /** Extended thinking content (solo reasoning tier + Claude) */
  thinkingContent?: string;
  latencyMs: number;
  fallback: boolean;
  tier: LLMTier;
  strategy: LLMStrategy;
  costUsd: number;
  degraded?: LLMTier | null;
}

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";

/**
 * Entry point unificado.
 * Maneja: strategy resolution, budget, provider fallback chain, observability,
 * auto-degrade on budget exceeded.
 */
export async function llmChat(
  messages: LLMMessage[],
  opts: LLMOptions
): Promise<LLMResult> {
  const startAll = Date.now();
  const {
    maxTokens = 1024,
    temperature = 0.7,
    forceProvider,
    skipGemma,
    skipBudgetCheck,
    callSite = "unknown",
    actorId = null,
    metadata,
  } = opts;

  const envShim: ResolverEnv = {
    CLAUDE_MODEL_REASONING: process.env.CLAUDE_MODEL_REASONING,
    CLAUDE_MODEL_TITAN: process.env.CLAUDE_MODEL_TITAN,
    CLAUDE_MODEL_PREMIUM: process.env.CLAUDE_MODEL_PREMIUM,
    CLAUDE_MODEL_STANDARD: process.env.CLAUDE_MODEL_STANDARD,
    CLAUDE_MODEL_ECONOMY: process.env.CLAUDE_MODEL_ECONOMY,
    NEBIUS_MODEL_REASONING: process.env.NEBIUS_MODEL_REASONING,
    NEBIUS_MODEL_TITAN: process.env.NEBIUS_MODEL_TITAN,
    NEBIUS_MODEL_PREMIUM: process.env.NEBIUS_MODEL_PREMIUM,
    NEBIUS_MODEL_STANDARD: process.env.NEBIUS_MODEL_STANDARD,
    NEBIUS_MODEL_ECONOMY: process.env.NEBIUS_MODEL_ECONOMY,
    LLM_STRATEGY: process.env.LLM_STRATEGY,
    LLM_THINKING_BUDGET_TOKENS: process.env.LLM_THINKING_BUDGET_TOKENS,
  };
  const strategy = resolveStrategy(opts.strategy, envShim);

  // Budget check + auto-degrade
  let tier: LLMTier = opts.tier;
  let degraded: LLMTier | null = null;
  if (!forceProvider) {
    const budget = await checkBudget(tier, { skipBudgetCheck });
    if (!budget.allowed) {
      const nextTier = degradeTier(tier);
      if (nextTier) {
        getLogger().warn(
          { from: tier, to: nextTier, spent: budget.spentEur, cap: budget.capEur },
          "[llm] budget exceeded, auto-degrade tier"
        );
        degraded = tier;
        tier = nextTier;
      } else {
        throw new LlmBudgetExceeded(tier, budget.spentEur, budget.capEur);
      }
    }
  }

  // Resolver tier → provider order + models + extras
  const resolved = resolveTierToModel(tier, strategy, envShim);

  // Si forceProvider, saltamos chain y vamos directo
  const providerOrder: LLMProvider[] = forceProvider
    ? [forceProvider]
    : resolved.providerOrder.filter(
        (p) => !(p === "gemma" && (skipGemma || tier !== "economy"))
      );

  const log = getLogger();
  let lastError: Error | null = null;

  for (let i = 0; i < providerOrder.length; i++) {
    const provider = providerOrder[i];
    const isPrimary = i === 0;
    try {
      const result = await callProvider(provider, {
        messages,
        model: resolved.models[provider] || "",
        maxTokens,
        temperature,
        extras: isPrimary ? resolved.extras : undefined,
      });
      const cost = estimateCostUsd(
        result.model,
        result.tokensIn,
        result.tokensOut,
        result.tokensThinking || 0
      );
      const final: LLMResult = {
        ...result,
        latencyMs: Date.now() - startAll,
        fallback: !isPrimary,
        tier,
        strategy,
        costUsd: cost,
        degraded,
      };
      recordLlmCall({
        call_site: callSite,
        tier,
        strategy,
        provider: result.provider,
        model: result.model,
        tokens_in: result.tokensIn,
        tokens_out: result.tokensOut,
        tokens_thinking: result.tokensThinking || 0,
        cost_usd: cost,
        latency_ms: final.latencyMs,
        fallback_used: !isPrimary,
        success: true,
        actor_id: actorId,
        metadata: { ...(metadata || {}), degraded },
      });
      return final;
    } catch (err) {
      lastError = err as Error;
      log.warn(
        { err, provider, tier, isPrimary, callSite },
        `[llm] provider ${provider} fallo${isPrimary ? " (primary)" : " (fallback)"}`
      );
    }
  }

  // Todos los providers fallaron — registrar y lanzar
  recordLlmCall({
    call_site: callSite,
    tier,
    strategy,
    provider: providerOrder[providerOrder.length - 1] || "claude",
    model: "unknown",
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
    latency_ms: Date.now() - startAll,
    fallback_used: true,
    success: false,
    error_message: lastError?.message?.slice(0, 500) || "all providers failed",
    actor_id: actorId,
    metadata: { ...(metadata || {}), degraded },
  });
  throw lastError || new Error("[llm] all providers failed");
}

// ─── Provider wrappers ──────────────────────────────────────────

interface ProviderCallArgs {
  messages: LLMMessage[];
  model: string;
  maxTokens: number;
  temperature: number;
  extras?: { extendedThinking?: { budgetTokens: number } };
}

async function callProvider(
  provider: LLMProvider,
  args: ProviderCallArgs
): Promise<Omit<LLMResult, "latencyMs" | "fallback" | "tier" | "strategy" | "costUsd">> {
  if (provider === "gemma") {
    return callGemma(args.messages, args.maxTokens, args.temperature);
  }
  if (provider === "nebius") {
    return callNebius(args.messages, args.model, args.maxTokens, args.temperature);
  }
  return callClaude(
    args.messages,
    args.model,
    args.maxTokens,
    args.temperature,
    args.extras?.extendedThinking?.budgetTokens
  );
}

async function callGemma(
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number
): Promise<Omit<LLMResult, "latencyMs" | "fallback" | "tier" | "strategy" | "costUsd">> {
  const res = await gemmaChat(messages as GemmaMessage[], { maxTokens, temperature });
  if (!res.content || res.content.length === 0) {
    throw new Error("[llm] Gemma devolvio respuesta vacia");
  }
  return {
    content: res.content,
    provider: "gemma",
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
  };
}

async function callNebius(
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<Omit<LLMResult, "latencyMs" | "fallback" | "tier" | "strategy" | "costUsd">> {
  const res = await nebiusChat(messages as NebiusMessage[], { model, maxTokens, temperature });
  return {
    content: res.content,
    provider: "nebius",
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
  };
}

async function callClaude(
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
  temperature: number,
  thinkingBudgetTokens = 0
): Promise<Omit<LLMResult, "latencyMs" | "fallback" | "tier" | "strategy" | "costUsd">> {
  if (!CLAUDE_API_KEY) {
    throw new Error("[llm] CLAUDE_API_KEY no configurada");
  }

  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemMsg) body.system = systemMsg.content;

  // Extended thinking — cuando se activa, temperature debe ser 1
  if (thinkingBudgetTokens > 0) {
    body.thinking = { type: "enabled", budget_tokens: thinkingBudgetTokens };
    // Claude exige temperature=1 con extended thinking
    body.temperature = 1;
    // max_tokens debe ser mayor que thinking budget
    if (maxTokens < thinkingBudgetTokens + 1024) {
      body.max_tokens = thinkingBudgetTokens + 1024;
    }
  } else if (temperature !== 0.7) {
    body.temperature = temperature;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[llm] Claude HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  // Extraer content + thinking_content (si hay)
  const blocks: Array<{ type: string; text?: string; thinking?: string }> =
    data.content || [];
  const textBlock = blocks.find((b) => b.type === "text");
  const thinkingBlock = blocks.find((b) => b.type === "thinking");
  const content = (textBlock?.text || "").trim();
  const thinkingContent = thinkingBlock?.thinking || undefined;
  const usage = data.usage || {};

  return {
    content,
    provider: "claude",
    model: data.model || model,
    tokensIn: usage.input_tokens ?? 0,
    tokensOut: usage.output_tokens ?? 0,
    tokensThinking:
      usage.cache_creation_input_tokens && thinkingBudgetTokens > 0
        ? thinkingBudgetTokens
        : thinkingContent
        ? Math.round((thinkingContent.length || 0) / 4) // estimacion basada en chars
        : 0,
    thinkingContent,
  };
}

/**
 * Helper: extraer JSON de respuesta LLM (los modelos a veces meten texto extra).
 */
export function extractJSON<T = Record<string, unknown>>(text: string): T | null {
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]") + 1;
  if (arrStart >= 0 && arrEnd > arrStart) {
    try { return JSON.parse(text.slice(arrStart, arrEnd)) as T; } catch { /* continue */ }
  }
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}") + 1;
  if (objStart >= 0 && objEnd > objStart) {
    try { return JSON.parse(text.slice(objStart, objEnd)) as T; } catch { /* continue */ }
  }
  return null;
}

export { LlmBudgetExceeded } from "./llm/budget-guard";
