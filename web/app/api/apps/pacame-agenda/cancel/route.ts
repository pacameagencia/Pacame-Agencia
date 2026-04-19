import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLimiter, getClientIp } from "@/lib/security/rate-limit";
import { cancelBooking } from "@/lib/apps/agenda/cancel";

/**
 * POST /api/apps/pacame-agenda/cancel
 * Body: { booking_id, token, reason? }
 * CORS * (publico).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cancelLimiter = createLimiter("agenda-cancel", {
  window: "1 m",
  tokens: 20,
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const CancelBodySchema = z.object({
  booking_id: z.string().uuid(),
  token: z.string().min(24).max(128),
  reason: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await cancelLimiter.limit(ip);
  if (!rl.success) {
    const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests", retry_after: retrySec },
      {
        status: 429,
        headers: { ...CORS_HEADERS, "Retry-After": String(retrySec) },
      }
    );
  }

  let parsed: z.infer<typeof CancelBodySchema>;
  try {
    const raw = await request.json();
    const res = CancelBodySchema.safeParse(raw);
    if (!res.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: res.error.issues },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    parsed = res.data;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const result = await cancelBooking(parsed.booking_id, parsed.token, parsed.reason);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "No se pudo cancelar" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
