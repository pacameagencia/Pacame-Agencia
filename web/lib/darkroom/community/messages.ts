/**
 * Persistencia de mensajes y eventos comunidad DR.
 *
 * Privacy-first: NO almacenamos `content_raw`. Solo:
 *   · `content_hash` (SHA-256) para deduplicar y detectar spam.
 *   · `content_preview` (primeros 240 chars, anonimizado vía replace de tlfs/emails).
 */

import { createHash } from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import type {
  CommunityEvent,
  CommunityEventInput,
  CommunityMessageInput,
  EventStatus,
} from "./types";

const PREVIEW_MAX = 240;

const PII_REPLACERS: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]"],
  [/\b\+?\d{2}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g, "[phone]"],
  [/\b\d{16}\b/g, "[card]"],
];

/** Anonimiza emails/tlf/tarjeta antes de guardar preview. */
function sanitizePreview(content: string): string {
  let safe = content.slice(0, PREVIEW_MAX);
  for (const [re, rep] of PII_REPLACERS) safe = safe.replace(re, rep);
  return safe;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function recordMessage(input: CommunityMessageInput): Promise<void> {
  const sb = createServerSupabase();
  const { error } = await sb.from("darkroom_community_messages").insert({
    member_id: input.memberId,
    channel: input.channel,
    direction: input.direction,
    agent_handler: input.agentHandler ?? null,
    intent_detected: input.intentDetected ?? null,
    content_hash: hashContent(input.contentRaw),
    content_preview: sanitizePreview(input.contentRaw),
    lead_score_delta: input.leadScoreDelta ?? 0,
    escalated: input.escalated ?? false,
    llm_tier: input.llmTier ?? null,
    llm_confidence: input.llmConfidence ?? null,
    meta: input.meta ?? {},
  });
  if (error) {
    getLogger().error({ err: error }, "[dr-messages] record failed");
    throw error;
  }
}

export async function recordEvent(input: CommunityEventInput): Promise<CommunityEvent> {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("darkroom_community_events")
    .insert({
      member_id: input.memberId,
      event_type: input.eventType,
      payload: input.payload ?? {},
      delivered_via: input.deliveredVia ?? null,
      status: input.status ?? "recorded",
    })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    memberId: data.member_id,
    eventType: data.event_type,
    payload: data.payload,
    deliveredVia: data.delivered_via,
    status: data.status as EventStatus,
    createdAt: data.created_at,
    deliveredAt: data.delivered_at,
  };
}

export async function markEventDelivered(eventId: number): Promise<void> {
  const sb = createServerSupabase();
  const { error } = await sb
    .from("darkroom_community_events")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;
}

/** Detecta spam simple: ≥5 mensajes con mismo content_hash en <60s del mismo member. */
export async function isLikelySpam(memberId: string, contentRaw: string): Promise<boolean> {
  const hash = hashContent(contentRaw);
  const sb = createServerSupabase();
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await sb
    .from("darkroom_community_messages")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("content_hash", hash)
    .gte("created_at", since);
  if (error) {
    getLogger().warn({ err: error }, "[dr-messages] spam check error");
    return false;
  }
  return (count ?? 0) >= 5;
}
