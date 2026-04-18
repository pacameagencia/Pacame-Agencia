/**
 * PACAME — Cliente Nebius AI Studio
 *
 * API de inferencia de modelos open-source (Llama, DeepSeek, Qwen, Mistral...)
 * Compatible con formato OpenAI. Tier intermedio entre Claude y Gemma.
 *
 * Endpoint: https://api.tokenfactory.nebius.com/v1/
 * Auth: Bearer token en env NEBIUS_API_KEY
 */

export interface NebiusMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NebiusOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface NebiusResponse {
  content: string;
  model: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  finishReason: string;
}

/** Modelos disponibles en Nebius AI Studio — verificado 2026-04-16 */
export const NEBIUS_MODELS = {
  // === TITAN: razonamiento profundo, estrategia, analisis ===
  "deepseek-v3.2": "deepseek-ai/DeepSeek-V3.2",           // 671B MoE — bestia
  "deepseek-v3.2-fast": "deepseek-ai/DeepSeek-V3.2-fast",  // idem, inferencia rapida
  "qwen-3.5-397b": "Qwen/Qwen3.5-397B-A17B",              // 397B MoE
  "qwen-3.5-397b-fast": "Qwen/Qwen3.5-397B-A17B-fast",
  "hermes-405b": "NousResearch/Hermes-4-405B",             // 405B function calling
  "nemotron-ultra-253b": "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
  "kimi-k2.5": "moonshotai/Kimi-K2.5",
  "kimi-k2.5-fast": "moonshotai/Kimi-K2.5-fast",
  "glm-5": "zai-org/GLM-5",
  "minimax-m2.5": "MiniMaxAI/MiniMax-M2.5",
  "gpt-oss-120b": "openai/gpt-oss-120b",
  "gpt-oss-120b-fast": "openai/gpt-oss-120b-fast",

  // === MEDIO: copy premium, SEO, auditorias ===
  "llama-3.3-70b": "meta-llama/Llama-3.3-70B-Instruct",
  "hermes-70b": "NousResearch/Hermes-4-70B",
  "qwen-2.5-vl-72b": "Qwen/Qwen2.5-VL-72B-Instruct",     // vision + lenguaje
  "qwen-3-235b": "Qwen/Qwen3-235B-A22B-Instruct-2507",
  "qwen-3-235b-fast": "Qwen/Qwen3-235B-A22B-Thinking-2507-fast",
  "nemotron-super-120b": "nvidia/nemotron-3-super-120b-a12b",
  "intellect-3": "PrimeIntellect/INTELLECT-3",

  // === RAPIDO: copy masivo, chat, clasificacion ===
  "llama-3.1-8b": "meta-llama/Meta-Llama-3.1-8B-Instruct",
  "qwen-3-32b": "Qwen/Qwen3-32B",
  "qwen-3-30b": "Qwen/Qwen3-30B-A3B-Instruct-2507",       // MoE rapido
  "nemotron-nano-30b": "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  "qwen-3-next-80b": "Qwen/Qwen3-Next-80B-A3B-Thinking",
  "qwen-3-next-80b-fast": "Qwen/Qwen3-Next-80B-A3B-Thinking-fast",
  "gemma-3-27b": "google/gemma-3-27b-it",
  "gemma-2-2b": "google/gemma-2-2b-it",

  // === EMBEDDINGS ===
  "qwen-3-embed-8b": "Qwen/Qwen3-Embedding-8B",
} as const;

export type NebiusModelAlias = keyof typeof NEBIUS_MODELS;

import { getLogger } from "@/lib/observability/logger";

const NEBIUS_URL =
  process.env.NEBIUS_API_URL || "https://api.tokenfactory.nebius.com/v1";
const NEBIUS_KEY = process.env.NEBIUS_API_KEY || "";

if (!NEBIUS_KEY && typeof process !== "undefined") {
  getLogger().warn(
    "[nebius] NEBIUS_API_KEY no definido; las llamadas fallaran con 401"
  );
}

/**
 * Chat completions con Nebius AI Studio.
 * Formato OpenAI-compatible — drop-in replacement.
 */
export async function nebiusChat(
  messages: NebiusMessage[],
  opts: NebiusOptions = {}
): Promise<NebiusResponse> {
  const model = opts.model || NEBIUS_MODELS["qwen-3-32b"];
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 1024;

  const started = Date.now();

  const res = await fetch(`${NEBIUS_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NEBIUS_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: opts.topP,
      frequency_penalty: opts.frequencyPenalty,
      presence_penalty: opts.presencePenalty,
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[nebius] HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const usage = data.usage || {};

  return {
    content: choice?.message?.content?.trim() || "",
    model: data.model || model,
    latencyMs: Date.now() - started,
    tokensIn: usage.prompt_tokens ?? 0,
    tokensOut: usage.completion_tokens ?? 0,
    finishReason: choice?.finish_reason || "unknown",
  };
}

/**
 * Generar embeddings con Nebius.
 * Util para busqueda semantica, RAG, memoria de agentes.
 */
export async function nebiusEmbed(
  texts: string[],
  model = NEBIUS_MODELS["qwen-3-embed-8b"]
): Promise<{ embeddings: number[][]; tokensUsed: number }> {
  const res = await fetch(`${NEBIUS_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NEBIUS_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[nebius] Embed HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    embeddings: data.data?.map((d: { embedding: number[] }) => d.embedding) || [],
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}

/**
 * Listar modelos disponibles en tu cuenta Nebius.
 */
export async function nebiusModels(): Promise<string[]> {
  const res = await fetch(`${NEBIUS_URL}/models`, {
    headers: { Authorization: `Bearer ${NEBIUS_KEY}` },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.data?.map((m: { id: string }) => m.id) || [];
}

/**
 * Helper: copy masivo con Nebius.
 * Genera N variaciones de copy para un brief dado.
 */
export async function nebiusCopyBatch(
  brief: string,
  count: number,
  opts: { tone?: string; maxLength?: number } = {}
): Promise<string[]> {
  const systemPrompt = [
    `Eres un copywriter experto en espanol de Espana.`,
    `Tono: ${opts.tone || "profesional y cercano"}.`,
    `Genera exactamente ${count} variaciones de copy.`,
    `Maximo ${opts.maxLength || 150} caracteres cada una.`,
    `Formato: una variacion por linea, numeradas (1. 2. 3. ...).`,
    `Sin explicaciones ni comentarios extra.`,
  ].join(" ");

  const res = await nebiusChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: brief },
    ],
    { model: NEBIUS_MODELS["qwen-3-32b"], temperature: 0.9, maxTokens: count * 200 }
  );

  return res.content
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * Helper: clasificar texto con Nebius (alternativa a gemmaClassify).
 */
export async function nebiusClassify(
  text: string,
  categories: string[],
  context = "Clasifica el siguiente mensaje en una de estas categorias"
): Promise<string> {
  const res = await nebiusChat(
    [
      {
        role: "system",
        content: `${context}: ${categories.join(", ")}. Responde SOLO con el nombre de la categoria.`,
      },
      { role: "user", content: text },
    ],
    { model: NEBIUS_MODELS["llama-3.1-8b"], temperature: 0.1, maxTokens: 20 } // 8B basta para clasificar
  );

  const answer = res.content.toLowerCase().trim();
  return categories.find((c) => answer.includes(c.toLowerCase())) || categories[0];
}

/**
 * Health check del endpoint Nebius.
 */
export async function nebiusHealth(): Promise<{
  ok: boolean;
  models?: string[];
  error?: string;
}> {
  try {
    const models = await nebiusModels();
    return { ok: models.length > 0, models };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
