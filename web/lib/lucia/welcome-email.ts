/**
 * Email de bienvenida tras signup en PACAME GPT.
 *
 * Se dispara desde el endpoint de trial. Fire-and-forget: si falla Resend,
 * no debería romper el signup. Tono Hormozi-Spanish: caliente, da valor,
 * cierra con 3 ideas concretas + un solo CTA.
 */

import { sendEmail } from "@/lib/resend";

export async function sendWelcomeEmailToLucia(input: {
  email: string;
  full_name?: string | null;
}): Promise<void> {
  try {
    const name = (input.full_name?.split(" ")[0] || input.email.split("@")[0]).trim();
    await sendEmail({
      to: input.email,
      subject: "Hola 👋 Soy Lucía. Te cuento cómo sacarme partido en 30 seg",
      html: renderHtml(name),
      text: renderText(name),
      tags: [
        { name: "product", value: "pacame-gpt" },
        { name: "kind", value: "welcome" },
      ],
    });
  } catch {
    // No bloquea el signup si Resend tiene un mal día.
  }
}

function renderHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="background:#f4efe3;color:#1a1813;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:30px 32px;">
    <div style="display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid #e8e3d0;margin-bottom:20px;">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#b54e30,#e8b730);color:#f4efe3;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-family:Georgia,serif;font-size:20px;">L</div>
      <div>
        <div style="font-weight:600;font-size:17px;font-family:Georgia,serif;">Hola ${escapeHtml(name)} 👋</div>
        <div style="color:#6e6858;font-size:13px;">Soy Lucía, tu IA española de PACAME GPT</div>
      </div>
    </div>
    <p style="font-size:15px;line-height:1.55;margin:0 0 14px;">
      Me alegra tenerte. Tienes <strong>14 días gratis ilimitado</strong> sin tarjeta.
      Después puedes seguir gratis con 20 mensajes/día o pasarte a Premium por 9,90€/mes.
    </p>
    <p style="font-size:15px;line-height:1.55;margin:0 0 18px;">
      Tres movidas para sacarme partido desde el minuto 1:
    </p>
    <ol style="font-size:15px;line-height:1.6;margin:0 0 22px 18px;padding:0;color:#3a362c;">
      <li><strong>Cuéntame con quién hablas.</strong> Cuanto más contexto al inicio (tu sector, tu tono, tu jefe), mejor te imito.</li>
      <li><strong>Pídeme variantes.</strong> Si la primera respuesta no encaja, dime "más corto", "más formal", "más para WhatsApp" y te lo afino.</li>
      <li><strong>Usa los atajos.</strong> Email, WhatsApp, resumen, traducción. 4 botones en la home, una vez los pruebas, no vuelves a empezar de cero.</li>
    </ol>
    <div style="text-align:center;margin:28px 0 18px;">
      <a href="https://pacameagencia.com/pacame-gpt"
         style="background:#1a1813;color:#f4efe3;padding:14px 26px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
        Volver a Lucía →
      </a>
    </div>
    <p style="font-size:13px;color:#6e6858;line-height:1.55;margin:18px 0 0;">
      Si te lías o algo no funciona, contestar a este email vale — Pablo me supervisa
      y lee tus mensajes.
    </p>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e8e3d0;color:#6e6858;font-size:12px;text-align:center;">
      PACAME GPT, hecho en España. <a href="https://pacameagencia.com/lucia" style="color:#9c3e24;">pacameagencia.com/lucia</a>
    </div>
  </div>
</body></html>`;
}

function renderText(name: string): string {
  return `Hola ${name} 👋

Soy Lucía, tu IA española de PACAME GPT. Me alegra tenerte.

Tienes 14 días gratis ilimitado sin tarjeta. Después puedes seguir gratis
con 20 mensajes/día o pasarte a Premium por 9,90€/mes.

Tres movidas para sacarme partido desde el minuto 1:

1. Cuéntame con quién hablas. Cuanto más contexto al inicio, mejor te imito.
2. Pídeme variantes. "más corto", "más formal", "más para WhatsApp".
3. Usa los atajos: email, WhatsApp, resumen, traducción.

Volver a Lucía → https://pacameagencia.com/pacame-gpt

Si te lías o algo no funciona, contestar a este email vale.

PACAME GPT, hecho en España.`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
