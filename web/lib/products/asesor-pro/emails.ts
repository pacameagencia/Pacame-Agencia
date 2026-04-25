/**
 * Templates de email transaccional para AsesorPro.
 * Usan el helper sendEmail de @/lib/resend (incluye text fallback + List-Unsubscribe).
 */

import { sendEmail } from "@/lib/resend";

const BRAND_PRIMARY = "#283B70";
const BRAND_ACCENT = "#B54E30";

interface SendInviteParams {
  to: string;
  client_fiscal_name: string;
  asesor_name: string;
  invite_url: string;
}

export async function sendClientInviteEmail(p: SendInviteParams): Promise<string | null> {
  const subject = `${p.asesor_name} te invita a tu panel de facturación`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { margin: 0; padding: 24px; background: #F4EFE3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1A1813; line-height: 1.55; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .card { background: #FFFFFF; padding: 32px 28px; border: 2px solid #1A1813; box-shadow: 5px 5px 0 ${BRAND_ACCENT}; }
  h1 { font-size: 22px; margin: 0 0 16px; font-weight: 500; letter-spacing: -0.01em; }
  p { margin: 0 0 16px; font-size: 15px; color: #3A362C; }
  .business { padding: 12px 16px; background: #F4EFE3; border-left: 3px solid ${BRAND_PRIMARY}; margin: 20px 0; font-size: 14px; }
  .business strong { display: block; font-size: 16px; margin-bottom: 2px; }
  .cta { display: inline-block; background: ${BRAND_ACCENT}; color: #FFFFFF !important; padding: 14px 24px; text-decoration: none; font-weight: 500; font-size: 15px; box-shadow: 4px 4px 0 #1A1813; margin: 8px 0 24px; }
  .cta:hover { background: #9C3E24; }
  .meta { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #6E6858; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(26,24,19,0.15); font-size: 12px; color: #6E6858; }
  .url-fallback { word-break: break-all; font-family: monospace; font-size: 12px; color: #283B70; background: #F4EFE3; padding: 8px; margin-top: 8px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <span class="meta">${p.asesor_name} · AsesorPro</span>
    <h1>Tu asesor te invita a su panel</h1>

    <p>Hola,</p>
    <p><strong>${p.asesor_name}</strong> ha activado un panel de facturación digital donde tu negocio va a poder:</p>
    <ul style="font-size: 15px; color: #3A362C; padding-left: 20px;">
      <li>Crear facturas en 3 clicks (cumplimiento legal español)</li>
      <li>Subir tickets desde el móvil con foto (OCR automático)</li>
      <li>Ver tu IVA del trimestre en tiempo real</li>
      <li>Chatear directamente con tu asesor sin emails</li>
    </ul>

    <div class="business">
      <span class="meta">Tu negocio en su sistema</span>
      <strong>${p.client_fiscal_name}</strong>
    </div>

    <p>Tu asesor ya tiene tus datos cargados. Solo necesitas crear tu contraseña y empezar.</p>

    <a href="${p.invite_url}" class="cta">Aceptar y entrar a mi panel →</a>

    <p style="font-size: 13px; color: #6E6858;">
      <strong>Es gratis para ti</strong> mientras ${p.asesor_name} mantenga su plan activo.
    </p>

    <p style="font-size: 13px; color: #6E6858; margin-top: 8px;">
      Si el botón no funciona, copia y pega esta dirección en tu navegador:
    </p>
    <div class="url-fallback">${p.invite_url}</div>

    <div class="footer">
      <p style="margin: 0;">Email enviado por PACAME · AsesorPro a petición de ${p.asesor_name}.<br>
      Si no esperabas esta invitación puedes ignorar este mensaje. El enlace solo se puede usar una vez.</p>
    </div>
  </div>
</div>
</body>
</html>`;

  return sendEmail({
    to: p.to,
    subject,
    html,
    replyTo: "hola@pacameagencia.com",
    tags: [
      { name: "type", value: "asesor_pro_invite" },
      { name: "product", value: "asesor-pro" },
    ],
    unsubscribe: false,
  });
}
