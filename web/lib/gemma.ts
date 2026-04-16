/**
 * PACAME — Cliente Gemma 4 (Ollama self-hosted en VPS Hostinger KVM2)
 *
 * Uso: drop-in replacement de Claude/OpenAI para tareas masivas y baratas.
 * Modelo actual: gemma4:e2b (8GB RAM, 2 cores AMD EPYC, ~14 tok/s hot)
 *
 * Endpoint: https://gemma.pacameagencia.com
 * Auth: Bearer token en env GEMMA_API_TOKEN
 */

export interface GemmaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GemmaOptions {
  model?: "gemma4:e2b" | "gemma4:e4b" | "gemma4:26b" | "gemma2:2b";
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  /**
   * Gemma 4 genera cadena de razonamiento (thinking) por defecto.
   * Para produccion lo apagamos: consume tokens y latencia sin aportar al
   * output final. Activa solo en tareas complejas (estrategia, debugging).
   */
  think?: boolean;
}

export interface GemmaResponse {
  content: string;
  model: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  tokensPerSec: number;
}

const GEMMA_URL =
  process.env.GEMMA_API_URL || "https://gemma.pacameagencia.com";
const GEMMA_TOKEN = process.env.GEMMA_API_TOKEN || "";

if (!GEMMA_TOKEN && typeof process !== "undefined") {
  console.warn(
    "[gemma] GEMMA_API_TOKEN no definido; las llamadas fallaran con 401"
  );
}

/**
 * Llamada basica a Gemma con mensajes tipo chat.
 * Usa /api/chat de Ollama — gemma4:e2b requiere chat template con markers
 * <start_of_turn> y el endpoint /api/chat los aplica automaticamente.
 */
export async function gemmaChat(
  messages: GemmaMessage[],
  opts: GemmaOptions = {}
): Promise<GemmaResponse> {
  const model = opts.model || "gemma4:e2b";
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 512;
  const think = opts.think ?? false;

  const started = Date.now();

  const res = await fetch(`${GEMMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMMA_TOKEN}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      think,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[gemma] HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const latencyMs = Date.now() - started;
  const tokensOut = data.eval_count ?? 0;
  const evalNs = data.eval_duration ?? 1;
  const tokensPerSec = evalNs > 0 ? (tokensOut / evalNs) * 1e9 : 0;

  // Ollama /api/chat devuelve { message: { role, content } }
  const content = (data.message?.content || data.response || "").trim();

  return {
    content,
    model,
    latencyMs,
    tokensIn: data.prompt_eval_count ?? 0,
    tokensOut,
    tokensPerSec: Number(tokensPerSec.toFixed(2)),
  };
}

/**
 * Helper: clasificar / etiquetar texto con Gemma.
 * Ideal para tareas masivas donde Claude es caro.
 *
 * @example
 * await gemmaClassify("Quiero pagar menos impuestos", ["fiscal","legal","ventas"])
 * // => "fiscal"
 */
export async function gemmaClassify(
  text: string,
  categories: string[],
  context = "Clasifica el siguiente mensaje en una de estas categorias"
): Promise<string> {
  const res = await gemmaChat(
    [
      {
        role: "system",
        content: `${context}: ${categories.join(
          ", "
        )}. Responde SOLO con el nombre de la categoria, sin explicaciones.`,
      },
      { role: "user", content: text },
    ],
    { temperature: 0.1, maxTokens: 20 }
  );
  const answer = res.content.toLowerCase().trim();
  return categories.find((c) => answer.includes(c.toLowerCase())) || categories[0];
}

/**
 * Router multi-LLM PACAME.
 * Decide automaticamente Claude / Gemini / Gemma segun la tarea.
 */
export type LLMTask =
  | "copy-masivo"         // 100+ piezas de copy → Gemma (barato)
  | "seo-keywords"        // brainstorm keywords → Gemma
  | "clasificacion"       // etiquetar emails, leads → Gemma
  | "estrategia"          // plan estrategico cliente → Claude Opus
  | "copy-premium"        // copy de landing hero → Claude Sonnet
  | "auditoria-web"       // auditoria completa → Claude Sonnet
  | "imagen"              // generacion imagen → Gemini / Freepik
  | "voz"                 // TTS → ElevenLabs / Google
  | "analisis-datos"      // analizar CSV, reportes → Claude Sonnet
  | "chat-cliente";       // widget chat en web → Gemma (latencia)

export const LLM_ROUTER: Record<LLMTask, "gemma" | "nebius" | "claude-opus" | "claude-sonnet" | "claude-haiku" | "gemini" | "openai"> = {
  "copy-masivo": "gemma",         // Gemma 4 e2b — gratis, 14 tok/s
  "seo-keywords": "gemma",        // Gemma 4 e2b — brainstorm rapido
  "clasificacion": "gemma",       // Gemma 4 e2b — ultra-barato, tarea simple
  "chat-cliente": "gemma",        // Gemma 4 e2b — baja latencia, gratis
  "copy-premium": "claude-sonnet",
  "auditoria-web": "claude-sonnet",
  "analisis-datos": "claude-sonnet",
  "estrategia": "claude-opus",
  "imagen": "gemini",
  "voz": "openai",
};

/**
 * Health check del endpoint Gemma.
 */
export async function gemmaHealth(): Promise<{
  ok: boolean;
  version?: string;
  models?: string[];
  error?: string;
}> {
  try {
    const version = await fetch(`${GEMMA_URL}/api/version`, {
      headers: { Authorization: `Bearer ${GEMMA_TOKEN}` },
    }).then((r) => (r.ok ? r.json() : null));
    const tags = await fetch(`${GEMMA_URL}/api/tags`, {
      headers: { Authorization: `Bearer ${GEMMA_TOKEN}` },
    }).then((r) => (r.ok ? r.json() : null));
    return {
      ok: true,
      version: version?.version,
      models: tags?.models?.map((m: any) => m.name) || [],
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
