/**
 * Adapter de WhatsApp via WhatsApp Business Cloud API.
 * Requiere WHATSAPP_PHONE_ID + WHATSAPP_TOKEN. Si no estan, devuelve error estructurado.
 * Coste estimado: 0.01 USD (conversaciones salientes Meta).
 */

import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";
import type {
  ChannelAdapter,
  ChannelMessage,
  ChannelSendResult,
  LeadContext,
  SendContext,
} from "./types";

function composeMessage(msg: ChannelMessage): string {
  let text = msg.body;
  if (msg.cta?.url) {
    text += `\n\n${msg.cta.text || "Mas info"}: ${msg.cta.url}`;
  }
  return text;
}

export const whatsappChannel: ChannelAdapter = {
  slug: "whatsapp",
  label: "WhatsApp",

  canReach(lead: LeadContext): boolean {
    return !!lead.phone && lead.phone.length >= 8;
  },

  estimateCostUsd(): number {
    return 0.01;
  },

  async send(
    lead: LeadContext,
    msg: ChannelMessage,
    _context: SendContext
  ): Promise<ChannelSendResult> {
    if (!lead.phone) {
      return { success: false, error: "no_phone" };
    }
    if (!isWhatsAppConfigured()) {
      return { success: false, error: "whatsapp_not_configured" };
    }

    try {
      const result = await sendWhatsApp(lead.phone, composeMessage(msg));
      if (!result.success) {
        return {
          success: false,
          error: result.error || "whatsapp_send_failed",
        };
      }
      return {
        success: true,
        externalId: result.message_id || null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "whatsapp_exception",
      };
    }
  },
};
