/**
 * GET/POST /api/academy/unsubscribe?token=...
 *
 * 1-click unsubscribe (RFC 8058) para newsletter Dark Academy.
 *
 * GET muestra página HTML simple con confirmación.
 * POST (List-Unsubscribe-Post) marca al usuario como `newsletter_subscribed=false`
 * y registra `unsubscribed_at` en el capture relacionado si aplica.
 *
 * NO requiere auth: el token actúa como prueba de propiedad del email.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";

async function processUnsubscribe(token: string): Promise<{ ok: boolean; error?: string }> {
  if (!token || token.length < 32) {
    return { ok: false, error: "invalid token" };
  }

  const supabase = createServerSupabase();

  const { data: userData, error } = await supabase
    .from("academy_users")
    .select("id, email, newsletter_subscribed")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !userData) {
    return { ok: false, error: "token not found" };
  }

  const user = userData as { id: string; email: string; newsletter_subscribed: boolean };

  if (!user.newsletter_subscribed) {
    return { ok: true }; // ya estaba dado de baja · idempotente.
  }

  const { error: updErr } = await supabase
    .from("academy_users")
    .update({ newsletter_subscribed: false })
    .eq("id", user.id);

  if (updErr) {
    getLogger().error({ err: updErr, userId: user.id }, "[academy-unsubscribe] update failed");
    return { ok: false, error: "update failed" };
  }

  // Marca captures del usuario como unsubscribed (best-effort).
  await supabase
    .from("academy_lead_captures")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .neq("status", "unsubscribed");

  return { ok: true };
}

function renderHtmlPage(success: boolean, message: string): string {
  const status = success ? "Te has dado de baja" : "No pudimos completar la baja";
  const body = success
    ? "No vas a recibir más emails de Dark Academy. Si fue un error, escríbenos a support@darkroomcreative.cloud y lo revertimos."
    : message;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Dark Academy · ${status}</title>
<style>
  body { margin:0; padding:0; background:#0a0a0a; color:#e0e0e0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { max-width:480px; padding:40px 32px; background:#141414; border:1px solid rgba(212,175,55,0.15); border-radius:12px; text-align:center; }
  .badge { display:inline-block; border:2px solid #D4AF37; color:#D4AF37; font-weight:700; font-size:11px; letter-spacing:3px; padding:4px 12px; border-radius:2px; margin-bottom:24px; }
  h1 { font-size:22px; font-weight:600; margin:0 0 16px; color:#fff; }
  p { font-size:15px; line-height:1.6; color:#aaa; margin:0 0 16px; }
  a { color:#D4AF37; text-decoration:none; }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">DARK ACADEMY</div>
    <h1>${status}</h1>
    <p>${body}</p>
    <p style="margin-top:24px;font-size:13px;color:#666"><a href="https://darkroomcreative.cloud/academia">darkroomcreative.cloud/academia</a></p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await processUnsubscribe(token);
  return new NextResponse(
    renderHtmlPage(result.ok, result.error ?? "Token no encontrado o ya usado."),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function POST(request: NextRequest) {
  // Gmail/Yahoo envían POST a este URL con List-Unsubscribe=One-Click.
  // El token puede venir como query string o como form-urlencoded.
  let token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    try {
      const form = await request.formData();
      token = (form.get("token") as string | null) ?? "";
    } catch {
      // ignore
    }
  }
  const result = await processUnsubscribe(token);
  return NextResponse.json({ ok: result.ok, error: result.error });
}
