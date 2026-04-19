/**
 * Adapter Voice via Vapi. Solo se usa con warm leads (replied / interested) —
 * el router debe filtrar esto antes. Coste estimado: 0.25 USD por llamada
 * (telefonia + ElevenLabs + LLM).
 */

import { getLogger } from "@/lib/observability/logger";
import type {
  ChannelAdapter,
  ChannelMessage,
  ChannelSendResult,
  LeadContext,
  SendContext,
} from "./types";

const VAPI_BASE = "https://api.vapi.ai";
const WARM_STATUSES = new Set(["replied", "interested"]);

interface VapiCallResponse {
  id?: string;
  status?: string;
  message?: string;
}

export const voiceChannel: ChannelAdapter = {
  slug: "voice",
  label: "Voice (Vapi)",

  canReach(lead: LeadContext): boolean {
    if (!lead.phone || lead.phone.length < 8) return false;
    // Solo leads calientes — la voz es el canal mas caro e invasivo.
    return !!lead.status && WARM_STATUSES.has(lead.status);
  },

  estimateCostUsd(): number {
    return 0.25;
  },

  async send(
    lead: LeadContext,
    msg: ChannelMessage,
    context: SendContext
  ): Promise<ChannelSendResult> {
    if (!lead.phone) {
      return { success: false, error: "no_phone" };
    }

    const apiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

    if (!apiKey || !assistantId || !phoneNumberId) {
      return { success: false, error: "vapi_not_configured" };
    }

    // Limpia telefono a formato E.164 simple
    const rawPhone = lead.phone.trim();
    const e164 = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone.replace(/[^0-9]/g, "")}`;

    try {
      const res = await fetch(`${VAPI_BASE}/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          assistantId,
          phoneNumberId,
          customer: {
            number: e164,
            name: lead.business_name,
          },
          assistantOverrides: {
            variableValues: {
              lead_name: lead.business_name,
              niche: lead.niche_slug || "",
              touch_number: context.touchNumber,
              context: msg.body,
              cta_url: msg.cta?.url || "",
            },
          },
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as VapiCallResponse;
        getLogger().error({ status: res.status, errBody }, "[Voice] Vapi API error");
        return {
          success: false,
          error: errBody.message || `vapi_http_${res.status}`,
        };
      }

      const data = (await res.json()) as VapiCallResponse;
      return { success: true, externalId: data.id || null };
    } catch (err) {
      getLogger().error({ err }, "[Voice] Vapi exception");
      return {
        success: false,
        error: err instanceof Error ? err.message : "vapi_exception",
      };
    }
  },
};
