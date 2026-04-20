/**
 * Channel router — decide que canal usar para un lead y touch number.
 *
 * Estrategia:
 *  1. Respetar preferencia explicita del lead (lead_channel_preferences.preferred_channel)
 *  2. Seguir plan del dia si especifica canal para este nicho
 *  3. Touch 1 → email (barato, escalable)
 *  4. Touch 2 → whatsapp si phone, else email
 *  5. Touch 3 → linkedin si url disponible, else email
 *  6. Leads warm (replied/interested) → voice (Vapi) si phone
 *
 * Considera channel_stats: si un canal tiene reply_rate < 1% en un nicho tras 100 sends,
 * lo penaliza. Se actualizan por trigger + cron.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

export type ChannelSlug = "email" | "whatsapp" | "linkedin" | "voice" | "instagram_dm";

export interface RouterDecision {
  channel: ChannelSlug;
  reason: string;
  confidence: number; // 0-1
  fallbacks: ChannelSlug[];
}

export interface LeadForRouting {
  id: string;
  niche_slug: string;
  status: string;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  instagram_handle?: string | null;
}

const DEFAULT_TOUCH_CHANNELS: Record<number, ChannelSlug[]> = {
  1: ["email", "whatsapp", "linkedin"],
  2: ["whatsapp", "email", "linkedin"],
  3: ["linkedin", "whatsapp", "email"],
};

export async function routeLead(
  lead: LeadForRouting,
  touchNumber: number
): Promise<RouterDecision | null> {
  const log = getLogger({ leadId: lead.id });
  const supabase = createServerSupabase();

  // 1. Pref explicita
  const { data: pref } = await supabase
    .from("lead_channel_preferences")
    .select("preferred_channel, preference_confidence, email, whatsapp_phone, linkedin_url, instagram_handle")
    .eq("lead_id", lead.id)
    .maybeSingle();

  const availability = {
    email: !!(pref?.email || lead.email),
    whatsapp: !!(pref?.whatsapp_phone || lead.phone),
    linkedin: !!(pref?.linkedin_url || lead.linkedin_url),
    voice: !!(pref?.whatsapp_phone || lead.phone),
    instagram_dm: !!(pref?.instagram_handle || lead.instagram_handle),
  };

  // Warm lead override: voice first
  if (
    (lead.status === "replied" || lead.status === "interested") &&
    availability.voice &&
    touchNumber >= 2
  ) {
    return {
      channel: "voice",
      reason: "warm_lead_voice_followup",
      confidence: 0.85,
      fallbacks: ["whatsapp", "email"],
    };
  }

  // Pref alta confidence
  if (pref?.preferred_channel && (pref.preference_confidence || 0) > 0.7) {
    const ch = pref.preferred_channel as ChannelSlug;
    if (availability[ch]) {
      return {
        channel: ch,
        reason: `lead_preference_${pref.preference_confidence}`,
        confidence: pref.preference_confidence as number,
        fallbacks: DEFAULT_TOUCH_CHANNELS[touchNumber].filter((c) => c !== ch),
      };
    }
  }

  // Channel stats: penaliza canales con reply_rate < 1% tras >50 sends
  const { data: stats } = await supabase
    .from("channel_stats")
    .select("channel, sent_count, replied_count")
    .eq("niche_slug", lead.niche_slug)
    .eq("touch_number", touchNumber);

  const channelScore = new Map<ChannelSlug, number>();
  for (const s of stats || []) {
    const rate = s.sent_count > 50 ? (s.replied_count || 0) / s.sent_count : 0.05;
    channelScore.set(s.channel as ChannelSlug, rate);
  }

  // Default order, filtrando por availability y sorting por score
  const ordered = DEFAULT_TOUCH_CHANNELS[touchNumber] || ["email"];
  const viable = ordered.filter((c) => availability[c]);

  if (viable.length === 0) {
    log.warn({ leadId: lead.id, touchNumber, availability }, "router: no viable channel");
    return null;
  }

  viable.sort((a, b) => {
    const scoreA = channelScore.get(a) ?? 0.05;
    const scoreB = channelScore.get(b) ?? 0.05;
    return scoreB - scoreA;
  });

  const winner = viable[0];
  return {
    channel: winner,
    reason: `default_touch${touchNumber}_score`,
    confidence: 0.6 + (channelScore.get(winner) ?? 0),
    fallbacks: viable.slice(1),
  };
}

/**
 * Records an observation: touch X by channel Y resulted in outcome Z.
 * Updates lead_channel_preferences.preferred_channel heuristic.
 */
export async function updatePreferenceFromOutcome(
  leadId: string,
  channel: ChannelSlug,
  outcome: "opened" | "clicked" | "replied" | "bounced" | "ignored"
): Promise<void> {
  if (outcome === "bounced" || outcome === "ignored") return;

  const supabase = createServerSupabase();
  const boost = outcome === "replied" ? 0.3 : outcome === "clicked" ? 0.15 : 0.05;

  const { data: current } = await supabase
    .from("lead_channel_preferences")
    .select("id, preferred_channel, preference_confidence")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (!current) {
    await supabase.from("lead_channel_preferences").insert({
      lead_id: leadId,
      preferred_channel: channel,
      preference_confidence: boost,
      enrichment_sources: ["outcome"],
    });
    return;
  }

  // Si mismo canal → refuerza; si otro → recalibra
  const isSame = current.preferred_channel === channel;
  const newConfidence = Math.min(
    1,
    (isSame ? (current.preference_confidence || 0) : 0.3) + boost
  );

  await supabase
    .from("lead_channel_preferences")
    .update({
      preferred_channel: isSame ? current.preferred_channel : channel,
      preference_confidence: newConfidence,
      last_enriched_at: new Date().toISOString(),
    })
    .eq("id", current.id);
}
