/**
 * PACAME — Dispatcher LLM Unificado
 *
 * Enruta tareas al modelo mas eficiente segun coste/calidad.
 * Fallback automatico: Nebius → Claude Haiku si falla.
 *
 * Tiers:
 *   titan   → Claude Opus/Sonnet (estrategia, decisiones criticas)
 *   premium → Claude Sonnet (propuestas, auditorias complejas)
 *   standard → Nebius DeepSeek/Qwen (content, outreach, copy)
 *   economy → Nebius Llama 8B (clasificacion, DMs, personalizacion)
 */

import { nebiusChat, NEBIUS_MODELS, type NebiusMessage } from "./nebius";
import { createServerSupabase } from "./supabase/server";

export type LLMTier = "titan" | "premium" | "standard" | "economy";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  tier: LLMTier;
  maxTokens?: number;
  temperature?: number;
  /** Forzar proveedor (omitir routing) */
  forceProvider?: "claude" | "nebius";
  /** Tracking: agente que origina la llamada (para observabilidad) */
  agentId?: string;
  /** Tracking: origen de la llamada (chat | cron | proposal | webhook | ...) */
  source?: string;
  /** Metadata extra para persistir en agent_llm_usage */
  metadata?: Record<string, unknown>;
}

export interface LLMResult {
  content: string;
  provider: "claude" | "nebius" | "gemma";
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  fallback: boolean;
}

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";

/** Modelo Nebius por tier */
const NEBIUS_TIER_MODELS: Record<"standard" | "economy", string> = {
  // Standard: deepseek-v3.2 regular (la variante -fast tiene rate limit
  // agresivo en nuestra cuenta y devolvia 429). La regular funciona sin
  // restricciones y cuesta menos, solo es un pelin mas lenta.
  standard: NEBIUS_MODELS["deepseek-v3.2"],
  economy: NEBIUS_MODELS["llama-3.1-8b"],
};

/** Modelos Nebius alternativos para retry si el principal devuelve 429 */
const NEBIUS_STANDARD_FALLBACK = NEBIUS_MODELS["llama-3.3-70b"];

/** Modelo Claude por tier */
const CLAUDE_TIER_MODELS: Record<LLMTier, string> = {
  titan: "claude-sonnet-4-6",
  premium: "claude-sonnet-4-6",
  standard: "claude-haiku-4-5-20251001",
  economy: "claude-haiku-4-5-20251001",
};

// -------------------------------------------------------------------
// PRICING — USD per 1M tokens (input / output). Valores aproximados
// para estimacion de coste en dashboard de observabilidad.
// -------------------------------------------------------------------
const PRICING_USD_PER_1M: Record<string, { in: number; out: number }> = {
  // Claude
  "claude-sonnet-4-6":          { in: 3.0,  out: 15.0 },
  "claude-haiku-4-5-20251001":  { in: 1.0,  out: 5.0 },
  // Nebius — precios publicos aproximados (input / output por 1M tokens)
  "deepseek-ai/DeepSeek-V3.2":                { in: 0.30, out: 1.00 },
  "deepseek-ai/DeepSeek-V3.2-fast":           { in: 0.40, out: 1.30 },
  "meta-llama/Meta-Llama-3.1-8B-Instruct":    { in: 0.03, out: 0.09 },
  "meta-llama/Llama-3.3-70B-Instruct":        { in: 0.13, out: 0.40 },
  "Qwen/Qwen3-32B":                           { in: 0.10, out: 0.30 },
  "Qwen/Qwen3-30B-A3B-Instruct-2507":         { in: 0.10, out: 0.30 },
};

function estimateCostUSD(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICING_USD_PER_1M[model];
  if (!p) return 0;
  return +(((tokensIn * p.in) + (tokensOut * p.out)) / 1_000_000).toFixed(6);
}

async function logUsage(
  result: LLMResult,
  opts: LLMOptions,
): Promise<void> {
  try {
    const supabase = createServerSupabase();
    const cost = estimateCostUSD(result.model, result.tokensIn, result.tokensOut);
    await supabase.from("agent_llm_usage").insert({
      agent_id: opts.agentId || "unknown",
      provider: result.provider,
      model: result.model,
      tier: opts.tier,
      tokens_in: result.tokensIn,
      tokens_out: result.tokensOut,
      cost_usd: cost,
      latency_ms: result.latencyMs,
      fallback: result.fallback,
      source: opts.source || null,
      metadata: opts.metadata || {},
    });
  } catch {
    // Logging nunca rompe el flujo principal
  }
}

/**
 * Llamada unificada a LLM con routing y fallback automatico.
 * Ademas persiste cada llamada en `agent_llm_usage` para el dashboard
 * de observabilidad (tokens, coste USD, latencia, fallbacks).
 */
export async function llmChat(
  messages: LLMMessage[],
  opts: LLMOptions
): Promise<LLMResult> {
  const result = await llmChatInternal(messages, opts);
  // Fire-and-forget: no bloquea el flujo principal
  logUsage(result, opts);
  return result;
}

async function llmChatInternal(
  messages: LLMMessage[],
  opts: LLMOptions
): Promise<LLMResult> {
  const { tier, maxTokens = 1024, temperature = 0.7, forceProvider } = opts;

  // Titan/Premium → Claude directo (sin fallback a Nebius)
  if ((tier === "titan" || tier === "premium") && forceProvider !== "nebius") {
    return callClaude(messages, CLAUDE_TIER_MODELS[tier], maxTokens, temperature);
  }

  // Standard/Economy → Nebius primero, fallback a Claude Haiku
  if (forceProvider !== "claude") {
    const primaryModel =
      NEBIUS_TIER_MODELS[tier as "standard" | "economy"] || NEBIUS_TIER_MODELS.economy;
    const retryModels: string[] = [primaryModel];
    if (tier === "standard") retryModels.push(NEBIUS_STANDARD_FALLBACK);

    for (const model of retryModels) {
      try {
        const started = Date.now();
        const res = await nebiusChat(
          messages as NebiusMessage[],
          { model, maxTokens, temperature }
        );
        return {
          content: res.content,
          provider: "nebius",
          model: res.model,
          tokensIn: res.tokensIn,
          tokensOut: res.tokensOut,
          latencyMs: Date.now() - started,
          fallback: model !== primaryModel,
        };
      } catch (err) {
        const msg = (err as Error).message;
        // Si es 429 (rate limit) probamos el siguiente modelo Nebius.
        // Si no, caemos a Claude directamente.
        if (!msg.includes("429") && !msg.includes("rate limit")) {
          console.warn(`[llm] Nebius fallo (${tier}, ${model}), fallback a Claude:`, msg);
          break;
        }
        console.warn(`[llm] Nebius 429 (${model}), intentando siguiente`);
      }
    }
  }

  // Fallback a Claude
  return callClaude(messages, CLAUDE_TIER_MODELS[tier], maxTokens, temperature, true);
}

/**
 * Llamada directa a Claude Anthropic API.
 */
async function callClaude(
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
  temperature: number,
  isFallback = false
): Promise<LLMResult> {
  if (!CLAUDE_API_KEY) {
    throw new Error("[llm] CLAUDE_API_KEY no configurada");
  }

  const started = Date.now();

  // Separar system del resto (Claude API usa campo system aparte)
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemMsg) {
    body.system = systemMsg.content;
  }
  if (temperature !== 0.7) {
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
  const content = data.content?.[0]?.text?.trim() || "";
  const usage = data.usage || {};

  return {
    content,
    provider: "claude",
    model: data.model || model,
    tokensIn: usage.input_tokens ?? 0,
    tokensOut: usage.output_tokens ?? 0,
    latencyMs: Date.now() - started,
    fallback: isFallback,
  };
}

/**
 * Helper: extraer JSON de respuesta LLM (los modelos a veces meten texto extra).
 */
export function extractJSON<T = Record<string, unknown>>(text: string): T | null {
  // Intentar array
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]") + 1;
  if (arrStart >= 0 && arrEnd > arrStart) {
    try { return JSON.parse(text.slice(arrStart, arrEnd)) as T; } catch { /* continue */ }
  }
  // Intentar objeto
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}") + 1;
  if (objStart >= 0 && objEnd > objStart) {
    try { return JSON.parse(text.slice(objStart, objEnd)) as T; } catch { /* continue */ }
  }
  return null;
}
