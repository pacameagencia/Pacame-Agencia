import { getLogger } from "@/lib/observability/logger";

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "pacame_wa_verify_2026";
const GRAPH_API = "https://graph.facebook.com/v21.0";

export { WHATSAPP_VERIFY_TOKEN };

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
 */
export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_PHONE_ID && WHATSAPP_TOKEN);
}

/**
 * Send a text message via WhatsApp Business Cloud API.
 * Phone must be in international format without + (e.g., "34722669381").
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<WhatsAppMessageResult> {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
    getLogger().warn("[WhatsApp] Not configured — WHATSAPP_PHONE_ID or WHATSAPP_TOKEN missing");
    return { success: false, error: "WhatsApp not configured" };
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
    const res = await fetch(`${GRAPH_API}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
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
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "es",
  parameters?: string[]
): Promise<WhatsAppMessageResult> {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
    return { success: false, error: "WhatsApp not configured" };
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
    const res = await fetch(`${GRAPH_API}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
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
 */
export async function markAsRead(messageId: string): Promise<boolean> {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) return false;

  try {
    const res = await fetch(`${GRAPH_API}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
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
