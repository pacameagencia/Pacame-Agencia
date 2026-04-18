import { Resend } from "resend";
import { getLogger } from "@/lib/observability/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "PACAME <hola@pacameagencia.com>";
const PABLO_EMAIL = "hola@pacameagencia.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

/**
 * Send a single email via Resend.
 * Returns the email ID on success, null on failure.
 */
export async function sendEmail({ to, subject, html, replyTo, tags }: SendEmailParams): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) {
    getLogger().error("[Resend] RESEND_API_KEY not configured");
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      replyTo: replyTo || PABLO_EMAIL,
      tags,
    });

    if (error) {
      getLogger().error({ err: error }, "[Resend] Error");
      return null;
    }

    return data?.id || null;
  } catch (err) {
    getLogger().error({ err }, "[Resend] Exception");
    return null;
  }
}

/**
 * Send a notification email to Pablo.
 */
export async function notifyPablo(subject: string, html: string): Promise<string | null> {
  return sendEmail({
    to: PABLO_EMAIL,
    subject: `[PACAME] ${subject}`,
    html,
    tags: [{ name: "type", value: "internal_alert" }],
  });
}

/**
 * Wrap plain text email body in PACAME branded HTML template.
 */
export function wrapEmailTemplate(body: string, options?: { cta?: string; ctaUrl?: string; preheader?: string }): string {
  const ctaHtml = options?.cta
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${options.ctaUrl || "https://pacameagencia.com"}"
           style="background:#7C3AED;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          ${options.cta}
        </a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
${options?.preheader ? `<span style="display:none;max-height:0;overflow:hidden">${options.preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#06B6D4);width:40px;height:40px;border-radius:12px;line-height:40px;color:#fff;font-weight:700;font-size:18px">P</div>
      <div style="color:#fff;font-weight:700;font-size:20px;margin-top:8px">PACAME</div>
    </div>

    <!-- Body -->
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px;color:#e0e0e0;font-size:15px;line-height:1.6">
      ${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>")}
      ${ctaHtml}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:#666;font-size:12px;line-height:1.5">
      <p>PACAME — Tu equipo digital con IA</p>
      <p><a href="https://pacameagencia.com" style="color:#7C3AED;text-decoration:none">pacameagencia.com</a> ·
         <a href="https://wa.me/34722669381" style="color:#7C3AED;text-decoration:none">WhatsApp</a></p>
      <p style="margin-top:12px;color:#444">PACAME | Entidad IA — Supervisado por Pablo Calleja</p>
    </div>
  </div>
</body>
</html>`;
}
