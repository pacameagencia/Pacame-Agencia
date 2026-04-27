/**
 * PACAME Studio — endpoint generación (Sprint 28)
 *
 * POST /api/studio/generate
 * Body: { prompt: string, sector?: string, style?: string }
 *
 * Devuelve **Server-Sent Events** stream con progreso:
 *   event: intent       data: { message }
 *   event: structure    data: { brand, sections, estimate }   ← partial
 *   event: image        data: { sectionIndex, imageUrl }      ← cada vez que llega una
 *   event: done         data: { mockup completo }
 *   event: error        data: { error }
 *
 * Rate limit: 3 generaciones por IP / 24h vía Upstash.
 * Coste por gen: ~$0.012-0.015 (Claude Haiku + 3-4 Flux Schnell).
 */

import { NextRequest } from "next/server";
import {
  generateMockupStructure,
  generateMockupImages,
  type StudioBrief,
} from "@/lib/studio/orchestrator";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const maxDuration = 120;

// Rate limiter: 3 req / 24h por IP
let ratelimit: Ratelimit | null = null;
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // fallback: no rate limit en dev
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(3, "24 h"),
    analytics: true,
    prefix: "pacame_studio",
  });
  return ratelimit;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // 1. Rate limit
  const rl = getRatelimit();
  if (rl) {
    const { success, remaining, reset } = await rl.limit(ip);
    if (!success) {
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Has usado tus 3 generaciones gratis del día. Vuelve mañana o agenda llamada.",
          remaining,
          resetAt: reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        },
      );
    }
  }

  // 2. Parse body
  let body: StudioBrief;
  try {
    body = (await req.json()) as StudioBrief;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!body?.prompt || body.prompt.trim().length < 6) {
    return new Response(
      JSON.stringify({ error: "prompt_too_short", message: "Cuéntame al menos en 1 frase qué quieres" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (body.prompt.length > 500) {
    return new Response(
      JSON.stringify({ error: "prompt_too_long" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. Streaming SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sse("intent", { message: "Pensando en tu negocio..." })));

        // Fase 1: Claude estructura
        const mockup = await generateMockupStructure(body);
        controller.enqueue(encoder.encode(sse("structure", mockup)));

        // Fase 2: Imágenes Flux Schnell con progreso
        const totalImages = mockup.sections.filter((s) => s.imagePrompt).length;
        controller.enqueue(
          encoder.encode(sse("images-start", { total: totalImages })),
        );

        let imageIndex = 0;
        await generateMockupImages(mockup, () => {
          imageIndex += 1;
          // Notify which sections now have imageUrl
          mockup.sections.forEach((s, idx) => {
            if (s.imageUrl) {
              controller.enqueue(
                encoder.encode(
                  sse("image", { sectionIndex: idx, imageUrl: s.imageUrl }),
                ),
              );
            }
          });
        });

        controller.enqueue(encoder.encode(sse("done", mockup)));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        console.error("[studio] generation error:", message);
        controller.enqueue(
          encoder.encode(sse("error", { error: "generation_failed", message })),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      endpoint: "/api/studio/generate",
      method: "POST",
      body: {
        prompt: "string (6-500 chars, ej: 'web para clínica dental en Madrid')",
        sector: "optional",
        style: "minimal | bold | editorial | corporate (optional)",
      },
      rateLimit: "3 generations per IP per 24h",
      response: "Server-Sent Events stream (events: intent, structure, images-start, image, done, error)",
      cost: "~$0.012-0.015 per generation",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
