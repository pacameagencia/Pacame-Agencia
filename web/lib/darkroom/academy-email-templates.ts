/**
 * Dark Academy email templates — marca Dark Room aislada.
 *
 * Importante: NUNCA usar wrapEmailTemplate de lib/resend (hardcoded a PACAME).
 * Estos templates mantienen la separación Capa 1 / Capa 3 (regla dura
 * feedback_no_mencionar_personal_con_pacame.md).
 *
 * Voz Dark Room (positioning.md):
 *   - Tutear siempre · cero "usted"
 *   - Frases ≤25 palabras
 *   - Cero superlativos vacíos
 *   - Cero palabras IA-trilladas (desbloquea, embárcate, transformador, etc.)
 *   - Datos concretos
 */

const DARK_ROOM_DOMAIN = "darkroomcreative.cloud";
const DARK_ROOM_SUPPORT = "support@darkroomcreative.cloud";

interface DarkRoomEmailOptions {
  preheader?: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeToken?: string;
}

/**
 * Envuelve el cuerpo en HTML branded Dark Room (dark mode + acento dorado/rojo).
 * Cero menciones PACAME ni Pablo Calleja.
 */
export function wrapDarkRoomEmail(bodyHtml: string, options: DarkRoomEmailOptions = {}): string {
  const ctaBlock = options.ctaText && options.ctaUrl
    ? `<div style="text-align:center;margin:28px 0">
        <a href="${options.ctaUrl}"
           style="background:linear-gradient(135deg,#D4AF37 0%,#B8860B 100%);color:#0a0a0a;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.5px;text-transform:uppercase">
          ${options.ctaText}
        </a>
       </div>`
    : "";

  const unsubLink = options.unsubscribeToken
    ? `https://${DARK_ROOM_DOMAIN}/api/academy/unsubscribe?token=${encodeURIComponent(options.unsubscribeToken)}`
    : `https://${DARK_ROOM_DOMAIN}/unsubscribe`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Dark Academy</title>
${options.preheader ? `<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(options.preheader)}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e0e0e0">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-block;border:2px solid #D4AF37;color:#D4AF37;font-weight:700;font-size:12px;letter-spacing:3px;text-transform:uppercase;padding:6px 14px;border-radius:2px">
        Dark Academy
      </div>
    </div>

    <!-- Body -->
    <div style="background:#141414;border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:32px;color:#e0e0e0;font-size:15px;line-height:1.65">
      ${bodyHtml}
      ${ctaBlock}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;color:#666;font-size:12px;line-height:1.6">
      <p style="margin:8px 0;color:#888">
        <strong style="color:#D4AF37;letter-spacing:2px">DARK ROOM</strong> · academia visual IA
      </p>
      <p style="margin:8px 0">
        <a href="https://${DARK_ROOM_DOMAIN}/academia" style="color:#D4AF37;text-decoration:none">darkroomcreative.cloud/academia</a>
      </p>
      <p style="margin:12px 0;color:#555;font-size:11px">
        Recibes este correo porque te registraste en Dark Academy.
        <a href="${unsubLink}" style="color:#888;text-decoration:underline">Date de baja</a>.
      </p>
    </div>

  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ────────────────────────────────────────────────────────
 * Lead magnet · email de entrega
 * ──────────────────────────────────────────────────────── */

interface LeadMagnetEmailInput {
  firstname?: string | null;
  magnetTitle: string;
  magnetDescription: string;
  magnetDownloadUrl: string;
  nextModuleTitle: string; // "Módulo 2 · Prompting básico"
  unsubscribeToken?: string | null;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email enviado tras capturar email para un lead magnet.
 * Entrega el asset + sugiere siguiente paso en la academia.
 */
export function renderLeadMagnetDeliveryEmail(input: LeadMagnetEmailInput): RenderedEmail {
  const greet = input.firstname ? `${escapeHtml(input.firstname)},` : "Hola,";

  const bodyHtml = `
<p style="margin:0 0 16px">${greet}</p>
<p style="margin:0 0 16px">Aquí tienes tu descarga: <strong style="color:#D4AF37">${escapeHtml(input.magnetTitle)}</strong>.</p>
<p style="margin:0 0 16px;color:#aaa;font-size:14px">${escapeHtml(input.magnetDescription)}</p>
<div style="text-align:center;margin:24px 0">
  <a href="${input.magnetDownloadUrl}"
     style="background:#D4AF37;color:#0a0a0a;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.5px;text-transform:uppercase">
    Descargar ahora
  </a>
</div>
<p style="margin:24px 0 12px;color:#888;font-size:13px;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px">
  Cuando termines de revisar el material, lo siguiente que toca es <strong style="color:#e0e0e0">${escapeHtml(input.nextModuleTitle)}</strong>.
</p>
<p style="margin:0;color:#888;font-size:13px">
  Son 8 minutos. Te dejo el enlace abajo.
</p>
`;

  const html = wrapDarkRoomEmail(bodyHtml, {
    preheader: `Tu descarga: ${input.magnetTitle}`,
    ctaText: "Continuar con la academia",
    ctaUrl: `https://${DARK_ROOM_DOMAIN}/academia`,
    unsubscribeToken: input.unsubscribeToken ?? undefined,
  });

  const text = [
    input.firstname ? `${input.firstname},` : "Hola,",
    "",
    `Aquí tienes tu descarga: ${input.magnetTitle}.`,
    input.magnetDescription,
    "",
    `Descarga: ${input.magnetDownloadUrl}`,
    "",
    `Cuando termines, lo siguiente es ${input.nextModuleTitle}.`,
    "Son 8 minutos.",
    "",
    `Continuar: https://${DARK_ROOM_DOMAIN}/academia`,
    "",
    "—",
    "Dark Academy · darkroomcreative.cloud",
  ].join("\n");

  return {
    subject: `Tu descarga · ${input.magnetTitle}`,
    html,
    text,
  };
}

export const DARK_ROOM_EMAIL_CONFIG = {
  fromName: "Dark Academy",
  fromAddress: DARK_ROOM_SUPPORT,
  fromHeader: `Dark Academy <${DARK_ROOM_SUPPORT}>`,
  replyTo: DARK_ROOM_SUPPORT,
  rootDomain: DARK_ROOM_DOMAIN,
} as const;
