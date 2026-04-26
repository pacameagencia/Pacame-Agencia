/**
 * GET /api/pacame-gpt/cron/send-reminders
 *
 * Cron diario que envía los recordatorios cuyo due_at <= now() y status='pending'.
 * Llamado por Vercel Cron o n8n. Auth: header `x-cron-secret` con CRON_SECRET.
 *
 * Lo dejo idempotente: cada reminder pasa por status pending → sent (o failed).
 * Si el cron se llama 2 veces seguidas en la misma ventana, no se duplica nada
 * gracias al filter status='pending' + UPDATE atómico al final.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 50;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const nowIso = new Date().toISOString();

  // Cargar tanda. Hacemos JOIN con users para sacar el email destino.
  const { data: due, error } = await supabase
    .from("pacame_gpt_reminders")
    .select(`
      id, body, subject, due_at, user_id,
      pacame_product_users!inner(email, full_name)
    `)
    .eq("status", "pending")
    .lte("due_at", nowIso)
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "nothing_due" });
  }

  let sent = 0;
  let failed = 0;
  for (const r of due) {
    const u = (r as any).pacame_product_users;
    const to = u?.email;
    const name = u?.full_name || u?.email?.split("@")[0] || "tú";
    const subject = r.subject || "Recordatorio de Lucía";
    const html = renderReminderHtml(name, r.body, r.due_at);
    try {
      if (!to) throw new Error("user_email_missing");
      const id = await sendEmail({
        to,
        subject,
        html,
        text: r.body,
        tags: [
          { name: "product", value: "pacame-gpt" },
          { name: "kind", value: "reminder" },
        ],
      });
      if (!id) throw new Error("resend_returned_null");
      await supabase
        .from("pacame_gpt_reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id)
        .eq("status", "pending"); // double-check anti-doble-envío
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("pacame_gpt_reminders")
        .update({ status: "failed", send_error: msg.slice(0, 500) })
        .eq("id", r.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, scanned: due.length });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderReminderHtml(name: string, body: string, dueAt: string): string {
  const fecha = new Date(dueAt).toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const safe = escapeHtml(body);
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="background:#f4efe3;color:#1a1813;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid #e8e3d0;margin-bottom:20px;">
      <div style="width:40px;height:40px;border-radius:50%;background:#b54e30;color:#f4efe3;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-family:Georgia,serif;font-size:18px;">L</div>
      <div>
        <div style="font-weight:600;font-size:16px;">Hola ${escapeHtml(name)} 👋</div>
        <div style="color:#6e6858;font-size:12px;">Te lo recuerdo, como pediste — ${fecha}</div>
      </div>
    </div>
    <div style="white-space:pre-wrap;line-height:1.55;font-size:15px;">${safe}</div>
    <div style="margin-top:24px;color:#6e6858;font-size:12px;text-align:center;">
      <a href="https://pacameagencia.com/pacame-gpt" style="color:#9c3e24;text-decoration:none;">Abrir Lucía</a>
    </div>
  </div>
</body></html>`;
}
