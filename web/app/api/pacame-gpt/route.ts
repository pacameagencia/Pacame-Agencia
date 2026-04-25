/**
 * /api/pacame-gpt — Endpoint principal de PACAME GPT (Lucía).
 *
 * Producto: réplica de ChatGPT pensada para el español de pie. Endpoint público
 * (sin auth en Fase 1), streaming SSE simplificado al cliente.
 *
 * En Fase 1 NO hay:
 *   - Autenticación (eso entra en Sprint 3)
 *   - Persistencia en Supabase (Sprint 3)
 *   - Pago (Sprint 3)
 *
 * En Fase 1 SÍ hay:
 *   - Persona Lucía cargada como system prompt (lib/prompts/lucia.ts)
 *   - Streaming SSE simplificado: emitimos `data: {"type":"text","delta":"..."}`
 *     y el frontend solo tiene que escuchar `delta` para pintar.
 *   - Sanitización de salida (filtra leaks de prompt/PACAME interno)
 *   - Detección de drift al inglés (si el LLM se desvía → respuesta canned)
 *   - Rate limit por IP (12 req/5min) para evitar abuso
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

// === Sanitización de salida (defensa en profundidad) ===
// Filtra leaks del system prompt, anglicismos masivos no detectados, nombres
// de agentes internos PACAME que no deben salir en producto público.
const FORBIDDEN_OUT_PATTERNS: RegExp[] = [
  // Nombres internos PACAME — Lucía es el único nombre público.
  /\b(DIOS|NOVA|ATLAS|NEXUS|PIXEL|CORE|PULSE|SAGE|COPY|LENS)\b/g,
  // Infra interna que un usuario público no debe ver.
  /\b(supabase|vercel|nebius|claude\s*api|anthropic|deepseek|gemma|ollama|VPS|hostinger|hetzner|n8n)\b/gi,
  // Datos de clientes / proyectos privados.
  /\b(ecomglobalbox|c[eé]sar\s*veld|caleta|dark\s*room|darkroom|mindset)\b/gi,
  // Correos internos de Pablo y proveedores.
  /\b(pablodesarrolloweb|pablo@gmail|@protonmail|@pm\.me)\b/gi,
  // API keys / tokens.
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /\b\d{16,}\b/g,
];

function sanitizeOut(text: string): string {
  let out = text;
  for (const re of FORBIDDEN_OUT_PATTERNS) out = out.replace(re, "[…]");
  return out;
}

// Heurística de drift al inglés: si la respuesta contiene >3 palabras inglesas
// muy comunes y NO contiene marcadores españoles claros → la consideramos drift.
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
  /** Override modelo. Default: claude-sonnet-4-6. */
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
      return await streamFromAnthropicSimplified(messages, model);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "stream_error";
      return runFallbackNonStreaming(messages, reason);
    }
  }

  return runFallbackNonStreaming(messages, "stream_disabled");
}

/**
 * Streaming SSE simplificado.
 *
 * El cliente no debe pelearse con el formato Anthropic. Le pasamos solo los
 * eventos que necesita para pintar la respuesta, y al final un evento `done`
 * con la respuesta completa sanitizada (por si el frontend quiere hacer
 * post-proceso al final, ej. copiar al portapapeles).
 *
 * Eventos que emitimos:
 *   data: {"type":"text","delta":"..."}     ← un trocito de texto, lo concatena
 *   data: {"type":"done","fullText":"..."}   ← respuesta completa sanitizada
 *   data: {"type":"error","message":"..."}   ← si algo falla a media respuesta
 */
async function streamFromAnthropicSimplified(
  messages: ChatMessage[],
  model: string
): Promise<Response> {
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let fullText = "";

      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        while (true) {
          const { value, done } = await upstreamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // El SSE de Anthropic separa eventos por "\n\n".
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const block = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);

            // Cada bloque tiene líneas "event: X" y "data: {json}".
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

            // Solo nos interesa el delta de texto.
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta" &&
              typeof evt.delta.text === "string"
            ) {
              const safeDelta = sanitizeOut(evt.delta.text);
              fullText += safeDelta;
              send({ type: "text", delta: safeDelta });
            } else if (evt.type === "message_stop") {
              // Cerramos con la versión completa sanitizada.
              if (looksNonSpanish(fullText)) {
                // El modelo se nos fue al inglés a pesar del prompt → canned.
                const canned = "Solo hablo español, perdona. ¿Qué te ayudo a hacer?";
                send({ type: "drift", reason: "non_spanish", replacement: canned });
                send({ type: "done", fullText: canned });
              } else {
                send({ type: "done", fullText });
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

/**
 * Fallback non-streaming: llmChat() con tier premium (Nebius DeepSeek primero,
 * Claude después). Devuelve JSON simple con la respuesta completa.
 * Aplica las mismas defensas que el modo streaming (sanitización + drift).
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

    let reply = sanitizeOut(result.content);
    if (looksNonSpanish(reply)) {
      reply = "Solo hablo español, perdona. ¿Qué te ayudo a hacer?";
    }

    return jsonResponse({
      ok: true,
      reply,
      model: result.model,
      provider: result.provider,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      latencyMs: result.latencyMs,
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
