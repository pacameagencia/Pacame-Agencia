/**
 * POST /api/pacame-gpt/actions/email
 *
 * Envía un mensaje de Lucía por email al propio usuario (a su email de
 * cuenta — no permitimos enviar a terceros para no convertirnos en una
 * herramienta de spam).
 *
 * Body: { messageId, subject? }
 *
 * Reutiliza lib/resend.ts:sendEmail() ya configurado del repo.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import {
  checkActionRateLimit,
  loadOwnedMessage,
  logAction,
} from "@/lib/lucia/actions";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EmailBody {
  messageId?: string;
  subject?: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: EmailBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.messageId) {
    return NextResponse.json({ error: "messageId requerido" }, { status: 400 });
  }

  const rl = await checkActionRateLimit(user, "email");
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "daily_limit",
        message: `Has enviado ya ${rl.used} emails hoy. Límite ${rl.limit}/día.`,
      },
      { status: 429 }
    );
  }

  const msg = await loadOwnedMessage(user, body.messageId);
  if (!msg) return NextResponse.json({ error: "message_not_found" }, { status: 404 });
  if (msg.role !== "assistant") {
    return NextResponse.json({ error: "only_assistant_messages" }, { status: 400 });
  }

  const subject = (body.subject?.trim() || deriveSubject(msg.content)).slice(0, 120);
  const { html, text } = renderEmail(msg.content);

  let resendId: string | null = null;
  let sendError: string | null = null;
  try {
    resendId = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
      tags: [
        { name: "product", value: "pacame-gpt" },
        { name: "kind", value: "user_action_email" },
      ],
    });
  } catch (err) {
    sendError = err instanceof Error ? err.message : String(err);
  }

  if (!resendId) {
    await logAction({
      user_id: user.id,
      conversation_id: msg.conversationId,
      message_id: msg.id,
      action: "email",
      details: { to: user.email, subject },
      ok: false,
      error: sendError ?? "resend_returned_null",
    });
    return NextResponse.json(
      { error: "send_failed", message: "No he podido mandártelo. Inténtalo en un rato." },
      { status: 502 }
    );
  }

  await logAction({
    user_id: user.id,
    conversation_id: msg.conversationId,
    message_id: msg.id,
    action: "email",
    details: { to: user.email, subject, length: msg.content.length, resend_id: resendId },
  });

  return NextResponse.json({ ok: true, sent_to: user.email, subject });
}

function deriveSubject(content: string): string {
  const cleaned = content.trim().replace(/\s+/g, " ");
  return "Lucía · " + (cleaned.slice(0, 80) || "Mensaje guardado");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * HTML de email (sin gradientes ni fonts custom — gmail/outlook los rompen).
 */
function renderEmail(content: string): { html: string; text: string } {
  const safe = escapeHtml(content);
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  body { background:#f4efe3; color:#1a1813; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; margin:0; padding:24px; }
  .card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:14px; padding:28px 32px; }
  .head { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid #e8e3d0; margin-bottom:20px; }
  .av { width:40px; height:40px; border-radius:50%; background:#b54e30; color:#f4efe3; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-family:Georgia,serif; font-size:18px; }
  .name { font-weight:600; font-size:16px; }
  .sub { color:#6e6858; font-size:12px; }
  .body { white-space:pre-wrap; line-height:1.55; font-size:15px; }
  .foot { margin-top:24px; color:#6e6858; font-size:12px; text-align:center; }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="av">L</div>
      <div>
        <div class="name">Lucía · PACAME GPT</div>
        <div class="sub">Te lo mando como pediste 🙌</div>
      </div>
    </div>
    <div class="body">${safe}</div>
    <div class="foot">
      <a href="https://pacameagencia.com/pacame-gpt" style="color:#9c3e24; text-decoration:none;">Volver a Lucía</a>
    </div>
  </div>
</body>
</html>`;
  return { html, text: content };
}
