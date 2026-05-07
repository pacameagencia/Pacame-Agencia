/**
 * Demo dinámico: GET /d/<slug>
 *
 * Sirve el HTML pre-renderizado guardado en prospect_leads.config.html.
 * Reemplaza la arquitectura anterior de un deploy Vercel por lead.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function trackingPixel(messageId: string | null): string {
  // Fallback no-op: Resend ya inyecta su propio pixel cuando se envía con tracking ON.
  return messageId
    ? `<img src="https://api.pacameagencia.com/r/${messageId}/p.gif" width="1" height="1" alt="" style="display:none" />`
    : "";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  if (!/^[a-z0-9-]{2,80}$/.test(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("prospect_leads")
    .select("config, name, email, resend_message_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || !data.config) {
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Demo no disponible</title><body style="font-family:system-ui;text-align:center;padding:4rem;color:#444"><h1>Demo no disponible</h1><p>Este enlace ha expirado o no existe.</p><p><a href="https://pacameagencia.com">PACAME →</a></p></body>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const config = data.config as { html?: string };
  if (!config.html) {
    return new NextResponse("Config sin HTML pre-renderizado", { status: 500 });
  }

  // Tracking lateral: registramos visita en email_events (no bloqueante)
  const ua = req.headers.get("user-agent") || "";
  const referrer = req.headers.get("referer") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (data.resend_message_id) {
    supabase
      .from("email_events")
      .insert({
        resend_message_id: data.resend_message_id,
        event_type: "page.view",
        occurred_at: new Date().toISOString(),
        user_agent: ua,
        ip,
        raw: { referrer, slug },
      })
      .then(() => {});
  }

  // Inyectar pixel tracking (best-effort) justo antes de </body>
  const html = config.html.replace(
    /<\/body>/i,
    `${trackingPixel(data.resend_message_id || null)}</body>`
  );

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
      "x-pacame-demo": slug,
    },
  });
}
