/**
 * PACAME — Dispatcher LLM Unificado
 *
 * Enruta tareas al modelo mas eficiente segun coste/calidad.
 * Fallback automatico:
 *   economy → Gemma (VPS gratis) → Nebius → Claude Haiku
 *   resto   → Nebius → Claude
 *
 * Tiers:
 *   titan   → Claude Opus/Sonnet (estrategia, decisiones criticas)
 *   premium → Claude Sonnet (propuestas, auditorias complejas)
 *   standard → Nebius DeepSeek/Qwen (content, outreach, copy)
 *   economy → Gemma 4 e2b VPS (clasificacion, DMs, personalizacion) — gratis
 */

import { nebiusChat, NEBIUS_MODELS, type NebiusMessage } from "./nebius";
import { gemmaChat, type GemmaMessage } from "./gemma";

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
  forceProvider?: "claude" | "nebius" | "gemma";
  /**
   * Saltar Gemma aunque el tier sea economy.
   * Util cuando la tarea es multi-idioma complejo o requiere
   * razonamiento que e2b (2B params) no maneja bien.
   */
  skipGemma?: boolean;
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

/** Modelo Nebius por tier — TODO pasa por Nebius primero (mas barato) */
const NEBIUS_TIER_MODELS: Record<LLMTier, string> = {
  titan: NEBIUS_MODELS["deepseek-v3.2"],           // 671B MoE — rival de Opus
  premium: NEBIUS_MODELS["deepseek-v3.2-fast"],     // 671B fast — rival de Sonnet
  standard: NEBIUS_MODELS["qwen-3-32b"],            // 32B — buen balance
  economy: NEBIUS_MODELS["llama-3.1-8b"],           // 8B — ultra-barato
};

/** Modelo Claude por tier — solo como fallback si Nebius falla */
const CLAUDE_FALLBACK_MODELS: Record<LLMTier, string> = {
  titan: "claude-opus-4-6",
  premium: "claude-sonnet-4-6",
  standard: "claude-haiku-4-5-20251001",
  economy: "claude-haiku-4-5-20251001",
};

/**
 * Llamada unificada a LLM con routing y fallback automatico.
 * TODOS los tiers intentan Nebius primero → fallback a Claude.
 */
export async function llmChat(
  messages: LLMMessage[],
  opts: LLMOptions
): Promise<LLMResult> {
  const { tier, maxTokens = 1024, temperature = 0.7, forceProvider, skipGemma } = opts;

  // Forzado explicito
  if (forceProvider === "claude") {
    return callClaude(messages, CLAUDE_FALLBACK_MODELS[tier], maxTokens, temperature);
  }
  if (forceProvider === "gemma") {
    return callGemma(messages, maxTokens, temperature, false);
  }

  // Tier economy → Gemma primero (gratis, ~14 tok/s)
  if (tier === "economy" && !skipGemma && forceProvider !== "nebius") {
    try {
      return await callGemma(messages, maxTokens, temperature, false);
    } catch (err) {
      console.warn("[llm] Gemma fallo (economy), fallback a Nebius:", (err as Error).message);
    }
  }

  // Nebius para el resto de tiers y como fallback de Gemma
  try {
    const nebiusModel = NEBIUS_TIER_MODELS[tier];
    const started = Date.now();
    const res = await nebiusChat(
      messages as NebiusMessage[],
      { model: nebiusModel, maxTokens, temperature }
    );
    return {
      content: res.content,
      provider: "nebius",
      model: res.model,
      tokensIn: res.tokensIn,
      tokensOut: res.tokensOut,
      latencyMs: Date.now() - started,
      fallback: tier === "economy", // marca fallback si veniamos de Gemma
    };
  } catch (err) {
    console.warn(`[llm] Nebius fallo (${tier}), fallback a Claude:`, (err as Error).message);
  }

  // Ultimo fallback: Claude
  return callClaude(messages, CLAUDE_FALLBACK_MODELS[tier], maxTokens, temperature, true);
}

/**
 * Llamada a Gemma 4 via VPS PACAME.
 * Mapea el resultado al formato LLMResult unificado.
 */
async function callGemma(
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number,
  isFallback: boolean
): Promise<LLMResult> {
  const res = await gemmaChat(
    messages as GemmaMessage[],
    { maxTokens, temperature }
  );
  if (!res.content || res.content.length === 0) {
    throw new Error("[llm] Gemma devolvio respuesta vacia");
  }
  return {
    content: res.content,
    provider: "gemma",
    model: res.model,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    latencyMs: res.latencyMs,
    fallback: isFallback,
  };
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
