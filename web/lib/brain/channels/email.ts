/**
 * Adapter de email via Resend. Envia con wrapper branded + footer GDPR inline.
 * Coste estimado: 0.001 USD (pool Resend).
 */

import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import type {
  ChannelAdapter,
  ChannelMessage,
  ChannelSendResult,
  LeadContext,
  SendContext,
} from "./types";

const UNSUBSCRIBE_BASE = "https://pacameagencia.com/unsubscribe";

function buildBodyWithFooter(body: string, context: SendContext): string {
  const token = context.unsubscribeToken
    ? `?token=${encodeURIComponent(context.unsubscribeToken)}`
    : "";
  const footer =
    "\n\n—\n" +
    "Si no quieres recibir mas mensajes de PACAME, responde STOP a este email " +
    `o haz clic aqui: ${UNSUBSCRIBE_BASE}${token}\n` +
    "PACAME · Entidad IA supervisada · hola@pacameagencia.com";
  return body + footer;
}

export const emailChannel: ChannelAdapter = {
  slug: "email",
  label: "Email",

  canReach(lead: LeadContext): boolean {
    return !!lead.email && lead.email.includes("@");
  },

  estimateCostUsd(): number {
    return 0.001;
  },

  async send(
    lead: LeadContext,
    msg: ChannelMessage,
    context: SendContext
  ): Promise<ChannelSendResult> {
    if (!lead.email) {
      return { success: false, error: "no_email" };
    }

    const bodyWithFooter = buildBodyWithFooter(msg.body, context);
    const html = wrapEmailTemplate(bodyWithFooter, {
      cta: msg.cta?.text,
      ctaUrl: msg.cta?.url,
    });

    const id = await sendEmail({
      to: lead.email,
      subject: msg.subject || `Hola ${lead.business_name}`,
      html,
      tags: [
        { name: "channel", value: "email" },
        { name: "touch", value: String(context.touchNumber) },
        ...(context.campaignId
          ? [{ name: "campaign", value: context.campaignId }]
          : []),
      ],
    });

    if (!id) {
      return { success: false, error: "resend_failed" };
    }

    return { success: true, externalId: id };
  },
};
