/**
 * Adapter LinkedIn — modo manual.
 * En lugar de enviar por API (LinkedIn no permite outbound automatizado sin SalesNav),
 * encolamos el mensaje en linkedin_queue para que Pablo lo envie a mano.
 * Coste estimado: 0 USD (tiempo humano no contabilizado).
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import type {
  ChannelAdapter,
  ChannelMessage,
  ChannelSendResult,
  LeadContext,
  SendContext,
} from "./types";

export const linkedinChannel: ChannelAdapter = {
  slug: "linkedin",
  label: "LinkedIn (manual)",

  canReach(lead: LeadContext): boolean {
    return !!lead.linkedin_url && lead.linkedin_url.includes("linkedin.com");
  },

  estimateCostUsd(): number {
    return 0;
  },

  async send(
    lead: LeadContext,
    msg: ChannelMessage,
    context: SendContext
  ): Promise<ChannelSendResult> {
    if (!lead.linkedin_url) {
      return { success: false, error: "no_linkedin_url" };
    }

    let body = msg.body;
    if (msg.cta?.url) {
      body += `\n\n${msg.cta.text || "Mas info"}: ${msg.cta.url}`;
    }

    try {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("linkedin_queue")
        .insert({
          lead_id: lead.id,
          target_name: lead.business_name,
          linkedin_url: lead.linkedin_url,
          message_body: body,
          campaign_id: context.campaignId || null,
          touch_number: context.touchNumber,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        getLogger().error({ err: error }, "[LinkedIn] queue insert failed");
        return { success: false, error: error.message };
      }

      return {
        success: true,
        queuedForManual: true,
        externalId: data?.id || null,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "linkedin_exception",
      };
    }
  },
};
