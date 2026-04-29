import { getLogger } from "@/lib/observability/logger";
import { hasMetaToken } from "@/lib/meta-token";
import {
  resolveWhatsAppConfig,
  isWhatsAppConfiguredFor,
  type Brand,
  DEFAULT_BRAND,
} from "@/lib/messaging/config";

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "pacame_wa_verify_2026";
const GRAPH_API = "https://graph.facebook.com/v21.0";

// Compat retro: helpers PACAME que mantienen la firma original
const phoneId = () => resolveWhatsAppConfig("pacame").phoneId;
const token = () => resolveWhatsAppConfig("pacame").token;

export { WHATSAPP_VERIFY_TOKEN };

/**
 * Opciones comunes a las funciones del módulo. Aceptan opcionalmente
 * un brand para enrutar a la cuenta WhatsApp correspondiente.
 *
 * Si no se pasa, default = "pacame" (comportamiento histórico inalterado).
 * Pasar `brand: "darkroom"` resuelve a `DARKROOM_WHATSAPP_PHONE_ID` +
 * `DARKROOM_META_SYSTEM_USER_TOKEN` (ver `web/lib/messaging/config.ts`).
 */
export interface WhatsAppCallOptions {
  brand?: Brand;
}

interface WhatsAppTextPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { body: string };
}

interface WhatsAppTemplatePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: "body";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
}

interface WhatsAppMessageResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

/**
 * Check if WhatsApp Business API is configured.
 * Sin parámetros = compat retro PACAME. Con `brand` consulta el otro tenant.
 */
export function isWhatsAppConfigured(brand: Brand = DEFAULT_BRAND): boolean {
  if (brand === "pacame") return !!(phoneId() && hasMetaToken("whatsapp"));
  return isWhatsAppConfiguredFor(brand);
}

/**
 * Send a text message via WhatsApp Business Cloud API.
 * Phone must be in international format without + (e.g., "34722669381").
 *
 * Multi-brand: por defecto envía desde la cuenta PACAME. Pasa
 * `{ brand: "darkroom" }` para enviar desde la cuenta DarkRoom.
 */
export async function sendWhatsApp(
  to: string,
  message: string,
  opts: WhatsAppCallOptions = {}
): Promise<WhatsAppMessageResult> {
  const cfg = resolveWhatsAppConfig(opts.brand);
  const pid = cfg.phoneId;
  const tok = cfg.token;
  if (!pid || !tok) {
    getLogger().warn(
      { brand: cfg.brand },
      "[WhatsApp] Not configured — phone ID or token missing"
    );
    return { success: false, error: `WhatsApp not configured for brand=${cfg.brand}` };
  }

  // Clean phone: remove +, spaces, dashes
  const cleanPhone = to.replace(/[+\s\-()]/g, "");

  const payload: WhatsAppTextPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: { body: message },
  };

  try {
    const res = await fetch(`${GRAPH_API}/${pid}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      getLogger().error({ err }, "[WhatsApp] API error");
      return {
        success: false,
        error: err.error?.message || `HTTP ${res.status}`,
      };
    }

    const data = await res.json() as { messages?: Array<{ id: string }> };
    const messageId = data.messages?.[0]?.id;

    return { success: true, message_id: messageId };
  } catch (err) {
    getLogger().error({ err }, "[WhatsApp] Exception");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send a template message (required for first contact — 24h rule).
 * Templates must be pre-approved in Meta Business Manager.
 * Multi-brand: pasa `{ brand: "darkroom" }` para usar plantillas DarkRoom.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "es",
  parameters?: string[],
  opts: WhatsAppCallOptions = {}
): Promise<WhatsAppMessageResult> {
  const cfg = resolveWhatsAppConfig(opts.brand);
  const pid = cfg.phoneId;
  const tok = cfg.token;
  if (!pid || !tok) {
    return { success: false, error: `WhatsApp not configured for brand=${cfg.brand}` };
  }

  const cleanPhone = to.replace(/[+\s\-()]/g, "");

  const payload: WhatsAppTemplatePayload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  if (parameters?.length) {
    payload.template.components = [
      {
        type: "body",
        parameters: parameters.map((text) => ({ type: "text" as const, text })),
      },
    ];
  }

  try {
    const res = await fetch(`${GRAPH_API}/${pid}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }

    const data = await res.json() as { messages?: Array<{ id: string }> };
    return { success: true, message_id: data.messages?.[0]?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Mark a message as read (blue ticks).
 * Multi-brand: pasa `{ brand: "darkroom" }` para marcar en la cuenta DarkRoom.
 */
export async function markAsRead(
  messageId: string,
  opts: WhatsAppCallOptions = {}
): Promise<boolean> {
  const cfg = resolveWhatsAppConfig(opts.brand);
  const pid = cfg.phoneId;
  const tok = cfg.token;
  if (!pid || !tok) return false;

  try {
    const res = await fetch(`${GRAPH_API}/${pid}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send a welcome message to a new lead via WhatsApp.
 */
export async function sendLeadWelcome(
  phone: string,
  leadName: string
): Promise<WhatsAppMessageResult> {
  const firstName = leadName.split(" ")[0] || leadName;
  const message =
    `Hola ${firstName} 👋\n\n` +
    `Soy el asistente de PACAME, tu agencia digital con IA.\n\n` +
    `He recibido tu consulta y quiero entender mejor tu negocio para darte una solucion concreta.\n\n` +
    `¿Me puedes contar brevemente cual es el principal reto digital que tienes ahora mismo?`;

  return sendWhatsApp(phone, message);
}

/**
 * Send a proposal notification via WhatsApp.
 */
export async function sendProposalNotification(
  phone: string,
  clientName: string,
  proposalUrl: string
): Promise<WhatsAppMessageResult> {
  const firstName = clientName.split(" ")[0] || clientName;
  const message =
    `Hola ${firstName} 👋\n\n` +
    `Tu propuesta personalizada de PACAME esta lista.\n\n` +
    `Puedes verla aqui: ${proposalUrl}\n\n` +
    `Incluye servicios, precios y timeline adaptados a tu negocio. Si tienes dudas, responde a este mensaje.`;

  return sendWhatsApp(phone, message);
}

/**
 * Send a followup message to an inactive lead.
 */
export async function sendLeadFollowup(
  phone: string,
  leadName: string,
  context: string
): Promise<WhatsAppMessageResult> {
  const firstName = leadName.split(" ")[0] || leadName;
  const message =
    `Hola ${firstName},\n\n` +
    `Soy el asistente de PACAME. ${context}\n\n` +
    `¿Te viene bien que hablemos esta semana? Podemos hacer un diagnostico rapido de tu situacion digital en 15 minutos.`;

  return sendWhatsApp(phone, message);
}
