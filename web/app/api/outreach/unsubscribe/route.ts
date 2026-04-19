import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/outreach/unsubscribe?t=TOKEN
 *
 * Llamado desde link en footer de email outreach. 1-click unsub:
 *  - Match del token contra outreach_leads.signals.unsubscribe_token
 *  - Add email_hash a outreach_unsubscribes
 *  - Update lead status='unsubscribed'
 *  - Devuelve HTML pagina de confirmacion (no JSON porque es click desde email)
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  if (!token) {
    return htmlError("Token de baja no proporcionado.");
  }

  const supabase = createServerSupabase();
  const log = getLogger();

  try {
    // Buscar lead con este token en signals
    const { data: leads } = await supabase
      .from("outreach_leads")
      .select("id, email, business_name, signals")
      .eq("signals->>unsubscribe_token", token)
      .limit(1);

    const lead = leads?.[0];
    if (!lead || !lead.email) {
      return htmlError("Token no valido o ya procesado.");
    }

    const emailHash = createHash("sha256").update(lead.email.toLowerCase()).digest("hex");

    // Insert en unsubscribes (idempotente)
    await supabase
      .from("outreach_unsubscribes")
      .insert({
        email_hash: emailHash,
        email_plain: null, // NO guardamos el email en claro por defecto
        reason: "user_link",
      })
      .throwOnError()
      .then(
        () => null,
        (err) => {
          // 23505 duplicate_key → ya estaba desuscrito
          if (!String(err?.code).includes("23505")) throw err;
        }
      );

    // Update lead
    await supabase
      .from("outreach_leads")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    await auditLog({
      actor: { type: "client", id: lead.id as string },
      action: "outreach.unsubscribed",
      resource: { type: "outreach_leads", id: lead.id as string },
      metadata: { business_name: lead.business_name, via: "email_link" },
      request,
    });

    return htmlSuccess(lead.business_name as string);
  } catch (err) {
    log.error({ err, token }, "unsubscribe failed");
    return htmlError("Error procesando la baja. Contacta a hola@pacameagencia.com.");
  }
}

function htmlSuccess(businessName: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Baja procesada | PACAME</title>
<meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; background:#0a0a0a; color:#fff; font-family: system-ui,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { max-width:480px; padding:32px 24px; text-align:center; }
  h1 { font-size:24px; margin:16px 0 8px; }
  p { color:rgba(255,255,255,0.6); margin:8px 0; }
  .ok { width:56px; height:56px; border-radius:50%; background:rgba(34,197,94,0.15); display:inline-flex; align-items:center; justify-content:center; font-size:28px; }
  a { color:#D4A574; text-decoration:none; }
</style></head><body>
<div class="card">
  <div class="ok">✓</div>
  <h1>Baja procesada</h1>
  <p>Hemos dado de baja a <strong>${escapeHtml(businessName)}</strong> de nuestras listas de contacto.</p>
  <p>No volveremos a escribirte. Perdona las molestias.</p>
  <p style="margin-top:24px;font-size:13px;"><a href="https://pacameagencia.com">pacameagencia.com</a></p>
</div></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function htmlError(message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Error | PACAME</title>
<meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; background:#0a0a0a; color:#fff; font-family: system-ui,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { max-width:480px; padding:32px 24px; text-align:center; }
  h1 { font-size:24px; margin:16px 0 8px; }
  p { color:rgba(255,255,255,0.6); }
  .err { width:56px; height:56px; border-radius:50%; background:rgba(239,68,68,0.15); display:inline-flex; align-items:center; justify-content:center; font-size:28px; color:#f87171; }
  a { color:#D4A574; text-decoration:none; }
</style></head><body>
<div class="card">
  <div class="err">!</div>
  <h1>No se pudo procesar</h1>
  <p>${escapeHtml(message)}</p>
  <p style="margin-top:24px;font-size:13px;">Contacta: <a href="mailto:hola@pacameagencia.com">hola@pacameagencia.com</a></p>
</div></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
