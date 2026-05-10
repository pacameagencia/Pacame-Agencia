/**
 * Dark Academy mailer — envío email con dominio Dark Room aislado.
 *
 * NO usar `sendEmail` de lib/resend para mails de Dark Academy:
 *   - Hardcodea FROM "PACAME <hola@pacameagencia.com>" (viola regla
 *     R7 del subagente dark-academy: cero menciones PACAME en
 *     contenido público Capa 3).
 *   - Hardcodea footer con marca PACAME.
 *
 * Esta función mantiene la separación de marca:
 *   - FROM: `Dark Academy <support@darkroomcreative.cloud>`
 *   - List-Unsubscribe usa dominio darkroomcreative.cloud
 *   - Reply-To configurable (default support@darkroomcreative.cloud)
 *
 * Requisito: dominio darkroomcreative.cloud verificado en Resend
 * (SPF + DKIM + DMARC). Si aún no, los emails llegarán a spam o
 * serán rechazados. Ver strategy/darkroom/academy/SPRINT-B-BLOCKERS.md.
 */

import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { getLogger } from "@/lib/observability/logger";
import { DARK_ROOM_EMAIL_CONFIG } from "./academy-email-templates";

// Build-time tolerant: si la env var falta, instanciamos con string vacío.
// La guardia funcional en `sendDarkRoomEmail` impide cualquier llamada real.
const resend = new Resend(process.env.RESEND_API_KEY ?? "");

interface SendDarkRoomEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  unsubscribeToken?: string | null;
}

/**
 * Envía un email con identidad Dark Room.
 * Retorna el messageId de Resend o null si falló.
 */
export async function sendDarkRoomEmail(params: SendDarkRoomEmailParams): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) {
    getLogger().error("[academy-mailer] RESEND_API_KEY not configured");
    return null;
  }

  const domain = DARK_ROOM_EMAIL_CONFIG.rootDomain;
  const fromHeader = DARK_ROOM_EMAIL_CONFIG.fromHeader;
  const replyTo = params.replyTo ?? DARK_ROOM_EMAIL_CONFIG.replyTo;

  const headers: Record<string, string> = {};

  // One-click unsubscribe RFC 8058 — requirement Gmail/Yahoo bulk sender.
  // Si tenemos token, link directo per-user; si no, fallback al endpoint genérico.
  const unsubUrl = params.unsubscribeToken
    ? `https://${domain}/api/academy/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`
    : `https://${domain}/unsubscribe`;

  headers["List-Unsubscribe"] = `<mailto:unsubscribe@${domain}>, <${unsubUrl}>`;
  headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";

  const tagType = params.tags?.find((t) => t.name === "type")?.value ?? "generic";
  headers["Feedback-ID"] = `darkacademy:${tagType}:${domain}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromHeader,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo,
      tags: params.tags,
      headers,
    });

    if (error) {
      getLogger().error({ err: error, to: params.to }, "[academy-mailer] Resend error");
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    getLogger().error({ err, to: params.to }, "[academy-mailer] Exception");
    return null;
  }
}

/**
 * Genera un unsubscribe token criptográficamente seguro.
 * Se guarda en academy_users.unsubscribe_token para el flujo 1-click.
 *
 * 32 bytes = 256 bits de entropía → 64 hex chars. Usa `crypto.randomBytes`
 * de Node (CSPRNG nativo). NUNCA usar Math.random() — adivinable.
 */
export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}
