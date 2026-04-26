/**
 * /api/pacame-gpt — Endpoint principal de PACAME GPT (Lucía).
 *
 * Modos:
 *   - Anónimo (sin cookie pacame_product_session): rate limit por IP, sin persistencia.
 *   - Autenticado: rate limit por user_id (20 msg/día free, ilimitado trial/premium),
 *     persistencia de mensajes en pacame_gpt_messages, autocreación de conversación
 *     si no se pasa conversationId.
 *
 * Streaming SSE simplificado:
 *   data: {"type":"meta","conversationId":"...","tier":"...","remaining":N}  ← primera línea
 *   data: {"type":"text","delta":"..."}    ← deltas de texto
 *   data: {"type":"done","fullText":"..."} ← cierre con texto completo sanitizado
 *   data: {"type":"limit","upgradeUrl":"...","resetIn":"..."} ← si superó cuota
 *   data: {"type":"error","message":"..."} ← upstream/server error
 *
 * Plan completo: .claude/plans/piensa-como-seria-un-tranquil-cerf.md
 */

import { NextRequest } from "next/server";
import { LUCIA_FULL_PROMPT } from "@/lib/prompts/lucia";
import { llmChat, type LLMMessage } from "@/lib/llm";
import { getCurrentProductUser } from "@/lib/products/session";
import {
  checkAndIncrementDailyUsage,
  getOrCreateConversation,
  loadSubscription,
  persistMessage,
  type UsageGate,
} from "@/lib/lucia/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Rate limit anónimo por IP (modo demo / SEO landing) ───────────
const RATE_WINDOW_MS = 5 * 60_000;
const RATE_MAX = 12;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function rateLimitIP(ip: string): { ok: boolean; remaining: number; resetIn: number } {
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

// ── Sanitización de salida ────────────────────────────────────────
const FORBIDDEN_OUT_PATTERNS: RegExp[] = [
  /\b(DIOS|NOVA|ATLAS|NEXUS|PIXEL|CORE|PULSE|SAGE|COPY|LENS)\b/g,
  /\b(supabase|vercel|nebius|claude\s*api|anthropic|deepseek|gemma|ollama|VPS|hostinger|hetzner|n8n)\b/gi,
  /\b(ecomglobalbox|c[eé]sar\s*veld|caleta|dark\s*room|darkroom|mindset)\b/gi,
  /\b(pablodesarrolloweb|pablo@gmail|@protonmail|@pm\.me)\b/gi,
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /\b\d{16,}\b/g,
];
function sanitizeOut(text: string): string {
  let out = text;
  for (const re of FORBIDDEN_OUT_PATTERNS) out = out.replace(re, "[…]");
  return out;
}

const EN_HINTS =
  /\b(the|and|are|with|that|this|your|cannot|please|sorry|hello|business|prompt|system)\b/gi;
function looksNonSpanish(text: string): boolean {
  const lower = text.toLowerCase();
  const hasSpanishMarkers =
    /[áéíóúñ¿¡]/.test(text) ||
    /\b(hola|gracias|por|para|qué|negocio|cuéntame|ayudo|vale|venga|mira|tranqui|señor)\b/.test(lower);
  if (hasSpanishMarkers) return false;
  const matches = text.match(EN_HINTS);
  return !!matches && matches.length >= 3;
}

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const DEFAULT_MODEL = "claude-sonnet-4-6";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface RequestBody {
  messages?: ChatMessage[];
  model?: string;
  stream?: boolean;
  /** Si el user está logueado y quiere continuar una conversación existente. */
  conversationId?: string | null;
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

  // ── Auth: cookie de producto SaaS ─────────────────────────────
  const user = await getCurrentProductUser();

  // Rama anónima: rate limit IP + sin persistencia (modo demo).
  if (!user) {
    const rl = rateLimitIP(ip);
    if (!rl.ok) {
      return jsonResponse(
        {
          ok: false,
          error: "rate_limited",
          reply:
            "Has hablado mucho conmigo en poco rato. Crea cuenta gratis para no tener este límite.",
          resetIn: rl.resetIn,
        },
        429
      );
    }
    if (!CLAUDE_API_KEY) {
      return runFallbackNonStreaming(messages, "no_api_key", null);
    }
    if (wantStream) {
      try {
        return await streamFromAnthropic(messages, model, null, null);
      } catch (err) {
        return runFallbackNonStreaming(
          messages,
          err instanceof Error ? err.message : "stream_error",
          null
        );
      }
    }
    return runFallbackNonStreaming(messages, "stream_disabled", null);
  }

  // Rama autenticada: rate limit por user + persistencia.
  const sub = await loadSubscription(user.id);
  const gate = await checkAndIncrementDailyUsage(user, sub);
  if (!gate.ok) {
    if (gate.reason === "limit_reached") {
      return jsonResponse(
        {
          ok: false,
          error: "daily_limit_reached",
          reply:
            "Has llegado a los 20 mensajes gratis de hoy. Vuelve mañana o pásate a Premium (9,90€/mes ilimitado, factura española).",
          upgradeUrl: "/pacame-gpt/cuenta",
          resetIn: gate.resetIn,
        },
        402
      );
    }
    return jsonResponse(
      { ok: false, error: gate.reason, reply: "No puedo atenderte ahora mismo." },
      402
    );
  }

  // Conversación: la pasada por el cliente, o una nueva.
  const lastUser = messages[messages.length - 1].content;
  const conv = await getOrCreateConversation(user.id, body?.conversationId, lastUser);
  // Persistimos el mensaje del usuario antes de pedirle a Claude.
  await persistMessage(conv.id, "user", lastUser);

  if (!CLAUDE_API_KEY) {
    return runFallbackNonStreaming(messages, "no_api_key", { convId: conv.id, gate });
  }

  if (wantStream) {
    try {
      return await streamFromAnthropic(messages, model, conv.id, gate);
    } catch (err) {
      return runFallbackNonStreaming(
        messages,
        err instanceof Error ? err.message : "stream_error",
        { convId: conv.id, gate }
      );
    }
  }
  return runFallbackNonStreaming(messages, "stream_disabled", { convId: conv.id, gate });
}

// ─────────────────────────────────────────────────────────────────
//                       Streaming SSE
// ─────────────────────────────────────────────────────────────────

interface AuthCtx {
  convId: string;
  gate: Extract<UsageGate, { ok: true }>;
}

async function streamFromAnthropic(
  messages: ChatMessage[],
  model: string,
  convId: string | null,
  gate: Extract<UsageGate, { ok: true }> | null
): Promise<Response> {
  const startedAt = Date.now();
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

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamReader = upstream.body.getReader();
  let usageIn = 0;
  let usageOut = 0;
  let modelReturned = model;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let fullText = "";
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      // Primera línea: meta con contexto (conversación, plan, mensajes restantes).
      send({
        type: "meta",
        conversationId: convId,
        tier: gate?.tier ?? "anonymous",
        remaining: gate?.remaining ?? null,
      });

      try {
        while (true) {
          const { value, done } = await upstreamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const block = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            const jsonStr = dataLine.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            let evt: any;
            try {
              evt = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (evt.type === "message_start") {
              modelReturned = evt.message?.model || modelReturned;
              usageIn = evt.message?.usage?.input_tokens ?? usageIn;
            } else if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta" &&
              typeof evt.delta.text === "string"
            ) {
              const safeDelta = sanitizeOut(evt.delta.text);
              fullText += safeDelta;
              send({ type: "text", delta: safeDelta });
            } else if (evt.type === "message_delta") {
              usageOut = evt.usage?.output_tokens ?? usageOut;
            } else if (evt.type === "message_stop") {
              if (looksNonSpanish(fullText)) {
                const canned = "Solo hablo español, perdona. ¿Qué te ayudo a hacer?";
                send({ type: "drift", reason: "non_spanish", replacement: canned });
                send({ type: "done", fullText: canned });
                if (convId) {
                  await persistMessage(convId, "assistant", canned, {
                    llm_provider: "claude",
                    llm_model: modelReturned,
                    tokens_in: usageIn,
                    tokens_out: usageOut,
                    latency_ms: Date.now() - startedAt,
                  });
                }
              } else {
                send({ type: "done", fullText });
                if (convId) {
                  await persistMessage(convId, "assistant", fullText, {
                    llm_provider: "claude",
                    llm_model: modelReturned,
                    tokens_in: usageIn,
                    tokens_out: usageOut,
                    latency_ms: Date.now() - startedAt,
                  });
                }
              }
            } else if (evt.type === "error") {
              send({ type: "error", message: evt.error?.message || "upstream_error" });
            }
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream_failed";
        send({ type: "error", message: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─────────────────────────────────────────────────────────────────
//                      Fallback non-streaming
// ─────────────────────────────────────────────────────────────────

async function runFallbackNonStreaming(
  messages: ChatMessage[],
  reason: string,
  ctx: AuthCtx | null
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

    let reply = sanitizeOut(result.content);
    if (looksNonSpanish(reply)) {
      reply = "Solo hablo español, perdona. ¿Qué te ayudo a hacer?";
    }

    if (ctx) {
      await persistMessage(ctx.convId, "assistant", reply, {
        llm_provider: result.provider,
        llm_model: result.model,
        tokens_in: result.tokensIn,
        tokens_out: result.tokensOut,
        latency_ms: result.latencyMs,
      });
    }

    return jsonResponse({
      ok: true,
      reply,
      conversationId: ctx?.convId ?? null,
      tier: ctx?.gate.tier ?? "anonymous",
      remaining: ctx?.gate.remaining ?? null,
      model: result.model,
      provider: result.provider,
      streamed: false,
      fallback_reason: reason,
    });
  } catch {
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
