import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLimiter, getClientIp } from "@/lib/security/rate-limit";
import { createBooking } from "@/lib/apps/agenda/bookings";
import { getLogger } from "@/lib/observability/logger";

/**
 * POST /api/apps/pacame-agenda/book
 *
 * Endpoint publico para el widget embebido. Anti-abuse:
 *   - rate limit 10 req/min por IP.
 *   - honeypot: si el campo `_hp` viene con valor, ignoramos silenciosamente.
 *   - CORS *.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookLimiter = createLimiter("agenda-book", {
  window: "1 m",
  tokens: 10,
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

const BookBodySchema = z.object({
  instance_id: z.string().uuid(),
  service_slug: z.string().min(1).max(120),
  scheduled_at: z.string().min(10),
  customer_name: z.string().min(1).max(160),
  customer_email: z.string().email().max(200),
  customer_phone: z.string().max(40).optional(),
  customer_notes: z.string().max(2000).optional(),
  // Honeypot anti-bot: debe venir vacio.
  _hp: z.string().max(0).optional().or(z.literal("")),
  utm_source: z.string().max(80).optional(),
  utm_medium: z.string().max(80).optional(),
  utm_campaign: z.string().max(80).optional(),
  utm_term: z.string().max(80).optional(),
  utm_content: z.string().max(80).optional(),
});

export async function POST(request: NextRequest) {
  // 1. Rate limit.
  const ip = getClientIp(request);
  const rl = await bookLimiter.limit(ip);
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

  // 2. Parse + validate.
  let parsed: z.infer<typeof BookBodySchema>;
  try {
    const raw = await request.json();
    const res = BookBodySchema.safeParse(raw);
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

  // 3. Honeypot: si viene con contenido, fingimos OK sin crear nada.
  if (parsed._hp && parsed._hp.length > 0) {
    getLogger().info({ ip }, "[agenda/book] honeypot hit — silent 200");
    return NextResponse.json(
      { ok: true, booking: null },
      { headers: CORS_HEADERS }
    );
  }

  // 4. UTM params.
  const utm: Record<string, string> = {};
  for (const k of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ] as const) {
    const v = parsed[k];
    if (typeof v === "string" && v.length > 0) utm[k] = v;
  }

  // 5. Crear reserva.
  const result = await createBooking({
    instanceId: parsed.instance_id,
    serviceSlug: parsed.service_slug,
    scheduledAt: parsed.scheduled_at,
    customer: {
      name: parsed.customer_name,
      email: parsed.customer_email,
      phone: parsed.customer_phone,
      notes: parsed.customer_notes,
    },
    source: "widget",
    utmParams: utm,
  });

  if (!result.ok || !result.booking) {
    return NextResponse.json(
      { error: result.error || "No se pudo crear la reserva" },
      { status: 409, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      booking: {
        id: result.booking.id,
        booking_number: result.booking.booking_number,
        confirmation_token: result.booking.confirmation_token,
        status: result.booking.status,
        scheduled_at: result.booking.scheduled_at,
      },
    },
    { headers: CORS_HEADERS }
  );
}
