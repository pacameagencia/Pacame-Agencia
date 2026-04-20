import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createLimiter, getClientIp } from "@/lib/security/rate-limit";
import { getAvailableSlots } from "@/lib/apps/agenda/availability";
import { getLogger } from "@/lib/observability/logger";

/**
 * GET /api/apps/pacame-agenda/availability
 * Query: instance_id, service_slug, from (YYYY-MM-DD), to (YYYY-MM-DD)
 *
 * Endpoint publico — el widget vive en la web del cliente. Se permite
 * CORS wildcard y se rate-limitea 60 req/min por IP para mitigar abuso.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const availabilityLimiter = createLimiter("agenda-availability", {
  window: "1 m",
  tokens: 60,
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function isIsoDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(request: NextRequest) {
  // Rate limit por IP.
  const ip = getClientIp(request);
  const rl = await availabilityLimiter.limit(ip);
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

  const p = request.nextUrl.searchParams;
  const instanceId = p.get("instance_id");
  const serviceSlug = p.get("service_slug");
  const from = p.get("from");
  const to = p.get("to");

  if (!instanceId || !serviceSlug || !isIsoDate(from) || !isIsoDate(to)) {
    return NextResponse.json(
      {
        error:
          "Parametros requeridos: instance_id, service_slug, from (YYYY-MM-DD), to (YYYY-MM-DD)",
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const supabase = createServerSupabase();

    // Validar instance activa + service.
    const { data: instance } = await supabase
      .from("app_instances")
      .select("id, status, app_slug")
      .eq("id", instanceId)
      .maybeSingle();

    if (!instance || instance.app_slug !== "pacame-agenda") {
      return NextResponse.json(
        { error: "Instance no encontrada" },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    if (instance.status !== "active") {
      return NextResponse.json(
        { error: "La agenda no esta activa" },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    const { data: service } = await supabase
      .from("agenda_services")
      .select("id, slug, name, duration_min, price_cents, description")
      .eq("instance_id", instanceId)
      .eq("slug", serviceSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const slots = await getAvailableSlots(instanceId, service.id, from, to);

    return NextResponse.json(
      {
        service: {
          slug: service.slug,
          name: service.name,
          description: service.description,
          duration_min: service.duration_min,
          price_cents: service.price_cents,
        },
        slots,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    getLogger().error({ err }, "[agenda/availability] exception");
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
