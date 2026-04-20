/**
 * LLM call observability — inserta cada llamada en `llm_calls`.
 *
 * Fire-and-forget: nunca bloquea la respuesta al caller. Nunca lanza.
 * Captura requestId via AsyncLocalStorage si esta disponible.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getContext } from "@/lib/observability/request-context";
import { getLogger } from "@/lib/observability/logger";
import type { LLMTier, LLMStrategy, LLMProvider } from "./resolver";

export interface LlmCallRecord {
  call_site: string;
  tier: LLMTier;
  strategy?: LLMStrategy;
  provider: LLMProvider;
  model: string;
  tokens_in: number;
  tokens_out: number;
  tokens_thinking?: number;
  cost_usd?: number;
  latency_ms: number;
  fallback_used?: boolean;
  success: boolean;
  error_message?: string;
  actor_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Registra un call de LLM en la tabla llm_calls. Nunca lanza.
 */
export function recordLlmCall(record: LlmCallRecord): void {
  // Fire-and-forget — no await. Si falla, solo warn log.
  void (async () => {
    try {
      const supabase = createServerSupabase();
      const ctx = getContext();
      await supabase.from("llm_calls").insert({
        call_site: record.call_site,
        tier: record.tier,
        strategy: record.strategy || null,
        provider: record.provider,
        model: record.model,
        tokens_in: record.tokens_in,
        tokens_out: record.tokens_out,
        tokens_thinking: record.tokens_thinking || 0,
        cost_usd: record.cost_usd ?? 0,
        latency_ms: record.latency_ms,
        fallback_used: record.fallback_used ?? false,
        success: record.success,
        error_message: record.error_message || null,
        request_id: ctx?.requestId || null,
        actor_id: record.actor_id || null,
        metadata: record.metadata || {},
      });
    } catch (err) {
      getLogger().warn(
        { err, call_site: record.call_site },
        "[llm-observability] insert fallo (swallowed)"
      );
    }
  })();
}

/**
 * Pricing estimado por provider + modelo (USD por 1K tokens).
 * Actualizado 2026-04. Si el provider/modelo no esta en la tabla,
 * se devuelve 0 (logueable pero no bloqueante).
 */
const PRICING_USD_PER_1K: Record<string, { in: number; out: number; thinking?: number }> = {
  // Claude
  "claude-opus-4-6": { in: 0.015, out: 0.075, thinking: 0.075 },
  "claude-sonnet-4-6": { in: 0.003, out: 0.015, thinking: 0.015 },
  "claude-haiku-4-5-20251001": { in: 0.0008, out: 0.004 },
  // Nebius (estimado — Nebius cobra por GPU-time, esto es aprox)
  "moonshotai/Kimi-K2.5": { in: 0.0006, out: 0.0024 },
  "moonshotai/Kimi-K2.5-fast": { in: 0.0008, out: 0.003 },
  "deepseek-ai/DeepSeek-V3.2": { in: 0.00027, out: 0.0011 },
  "deepseek-ai/DeepSeek-V3.2-fast": { in: 0.00035, out: 0.0014 },
  "Qwen/Qwen3-235B-A22B-Instruct-2507": { in: 0.0002, out: 0.0006 },
  "Qwen/Qwen3-Next-80B-A3B-Thinking-fast": { in: 0.00015, out: 0.0006 },
  "Qwen/Qwen3-32B": { in: 0.00008, out: 0.00024 },
  "Qwen/Qwen3-30B-A3B-Instruct-2507": { in: 0.00006, out: 0.00024 },
  "meta-llama/Meta-Llama-3.1-8B-Instruct": { in: 0.00002, out: 0.00005 },
  // Gemma self-hosted = gratis
};

/**
 * Calcula coste USD aproximado de una llamada.
 * Para modelos no listados devuelve 0 (se loggea el call pero sin cost).
 */
export function estimateCostUsd(
  model: string,
  tokensIn: number,
  tokensOut: number,
  tokensThinking = 0
): number {
  const price = PRICING_USD_PER_1K[model];
  if (!price) return 0;
  const cost =
    (tokensIn / 1000) * price.in +
    (tokensOut / 1000) * price.out +
    (tokensThinking / 1000) * (price.thinking ?? price.out);
  // Redondeo a 6 decimales para que quepa en NUMERIC(10,6)
  return Math.round(cost * 1_000_000) / 1_000_000;
}
