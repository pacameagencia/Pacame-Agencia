/**
 * /api/pacame-gpt — Endpoint principal de PACAME GPT (Lucía).
 *
 * Producto: réplica de ChatGPT pensada para el español de pie. Endpoint público
 * (sin auth en Fase 1), streaming SSE de Anthropic retransmitido tal cual al cliente.
 *
 * En Fase 1 NO hay:
 *   - Autenticación (eso entra en Sprint 3)
 *   - Persistencia en Supabase (Sprint 3)
 *   - Pago (Sprint 3)
 *
 * En Fase 1 SÍ hay:
 *   - Persona Lucía cargada como system prompt (lib/prompts/lucia.ts)
 *   - Streaming SSE retransmitido del endpoint de Anthropic
 *   - Rate limit por IP (8 req/min) para evitar abuso
 *   - Fallback non-streaming a llmChat() si Anthropic stream falla
 *
 * Plan completo: .claude/plans/piensa-como-seria-un-tranquil-cerf.md
 */

import { NextRequest } from "next/server";
import { LUCIA_FULL_PROMPT } from "@/lib/prompts/lucia";
import { llmChat, type LLMMessage } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// === Rate limit en memoria del proceso ===
// 12 mensajes / 5 min por IP. Suficiente para una conversación cómoda;
// frena bots y abusos básicos. En Sprint 3 esto se sustituye por límite por user_id.
const RATE_WINDOW_MS = 5 * 60_000;
const RATE_MAX = 12;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function rateLimit(ip: string): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, remaining: RATE_MAX - 1, resetIn: RATE_WINDOW_MS };
  }
  b.count++;
  if (b.count > RATE_MAX) return { ok: false, remaining: 0, resetIn: b.resetAt - now };
  return { ok: true, remaining: RATE_MAX - b.count, resetIn: b.resetAt - now };
}

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const DEFAULT_MODEL = "claude-sonnet-4-6";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface RequestBody {
  messages?: ChatMessage[];
  /** Permite override del modelo. Default: claude-sonnet-4-6. */
  model?: string;
  /** Si false, devuelve JSON con la respuesta completa (útil para curl/tests). Default: true. */
  stream?: boolean;
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        m && typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "anon";

  const rl = rateLimit(ip);
  if (!rl.ok) {
    return jsonResponse(
      {
        ok: false,
        error: "rate_limited",
        reply: "Has hablado mucho conmigo en poco rato. Vuelve en unos minutos.",
        resetIn: rl.resetIn,
      },
      429
    );
  }

  const body = (await req.json().catch(() => null)) as RequestBody | null;
  const messages = sanitizeMessages(body?.messages);
  if (messages.length === 0) {
    return jsonResponse({ ok: false, error: "messages requerido" }, 400);
  }
  if (messages[messages.length - 1].role !== "user") {
    return jsonResponse({ ok: false, error: "el último mensaje debe ser del usuario" }, 400);
  }

  const model = typeof body?.model === "string" ? body.model : DEFAULT_MODEL;
  const wantStream = body?.stream !== false;

  if (!CLAUDE_API_KEY) {
    return runFallbackNonStreaming(messages, "no_api_key");
  }

  if (wantStream) {
    try {
      return await streamFromAnthropic(messages, model);
    } catch (err) {
      // Si el streaming falla por cualquier motivo (red, 5xx, formato),
      // caemos a non-streaming via llmChat (que ya tiene fallback Nebius/Claude).
      const reason = err instanceof Error ? err.message : "stream_error";
      return runFallbackNonStreaming(messages, reason);
    }
  }

  // stream: false explícito → JSON simple via llmChat (más fácil de testear con curl)
  return runFallbackNonStreaming(messages, "stream_disabled");
}

/**
 * Pasa el SSE de Anthropic directamente al cliente. El frontend lee con
 * `fetch(...).then(r => r.body.getReader())` y procesa cada chunk.
 *
 * Eventos relevantes que retransmitimos:
 *   - content_block_delta → token de texto (lo que pinta el usuario)
 *   - message_stop → fin de la respuesta
 *   - error → si Anthropic devuelve error a media respuesta
 *
 * Ver formato SSE Anthropic: https://docs.anthropic.com/en/api/messages-streaming
 */
async function streamFromAnthropic(messages: ChatMessage[], model: string): Promise<Response> {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      stream: true,
      system: LUCIA_FULL_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`anthropic_${upstream.status}: ${text.slice(0, 160)}`);
  }

  // Pasamos el ReadableStream tal cual con headers SSE.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Fallback non-streaming: llmChat() con tier premium (Nebius DeepSeek primero,
 * Claude después). Devuelve JSON simple con la respuesta completa.
 */
async function runFallbackNonStreaming(
  messages: ChatMessage[],
  reason: string
): Promise<Response> {
  const llmMessages: LLMMessage[] = [
    { role: "system", content: LUCIA_FULL_PROMPT },
    ...messages,
  ];

  try {
    const result = await llmChat(llmMessages, {
      tier: "premium",
      maxTokens: 1024,
      temperature: 0.7,
      agentId: "lucia-pacame-gpt",
      source: "api/pacame-gpt",
      metadata: { fallback_reason: reason },
    });
    return jsonResponse({
      ok: true,
      reply: result.content,
      model: result.model,
      provider: result.provider,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      latencyMs: result.latencyMs,
      streamed: false,
      fallback_reason: reason,
    });
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: "llm_failed",
        reply: "Ahora mismo no puedo responderte. Inténtalo en un momento, ¿vale?",
      },
      502
    );
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
