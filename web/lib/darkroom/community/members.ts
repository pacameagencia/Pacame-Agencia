/**
 * Repositorio de miembros DarkRoom comunidad.
 *
 * Consolida un perfil cross-canal: el mismo usuario en WhatsApp + Discord
 * = una sola fila en `darkroom_community_members` (key heurístico: email
 * stripe / discord_user_id / whatsapp_phone).
 *
 * Plan §6.4: synapses neurales esperan `member_id` consistente para cruzar
 * memoria entre IRIS, NIMBO y VECTOR.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import type {
  CommunityMember,
  MemberLookup,
  MemberStatus,
  MemberTier,
} from "./types";

type SupabaseRow = {
  id: string;
  lead_id: string | null;
  stripe_customer_id: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  whatsapp_phone: string | null;
  display_name: string | null;
  email: string | null;
  tier: MemberTier;
  joined_at: string;
  last_active_at: string;
  status: MemberStatus;
  lead_score: number;
  affiliate_code: string | null;
  meta: Record<string, unknown>;
};

function toMember(row: SupabaseRow): CommunityMember {
  return {
    id: row.id,
    leadId: row.lead_id,
    stripeCustomerId: row.stripe_customer_id,
    discordUserId: row.discord_user_id,
    discordUsername: row.discord_username,
    whatsappPhone: row.whatsapp_phone,
    displayName: row.display_name,
    email: row.email,
    tier: row.tier,
    joinedAt: row.joined_at,
    lastActiveAt: row.last_active_at,
    status: row.status,
    leadScore: row.lead_score,
    affiliateCode: row.affiliate_code,
    meta: row.meta ?? {},
  };
}

/** Busca un miembro por cualquier identificador disponible. Devuelve null si no existe. */
export async function findMember(lookup: MemberLookup): Promise<CommunityMember | null> {
  const sb = createServerSupabase();
  const filters: Array<[string, string]> = [];
  if (lookup.discordUserId) filters.push(["discord_user_id", lookup.discordUserId]);
  if (lookup.whatsappPhone) filters.push(["whatsapp_phone", normalizePhone(lookup.whatsappPhone)]);
  if (lookup.email) filters.push(["email", lookup.email.toLowerCase()]);
  if (lookup.stripeCustomerId) filters.push(["stripe_customer_id", lookup.stripeCustomerId]);

  if (filters.length === 0) return null;

  // Primero intenta match exacto del primer filter (más fuerte). Si no, OR-search.
  for (const [col, val] of filters) {
    const { data, error } = await sb
      .from("darkroom_community_members")
      .select("*")
      .eq(col, val)
      .limit(1)
      .maybeSingle();
    if (error) {
      getLogger().warn({ err: error, col }, "[dr-members] lookup error");
      continue;
    }
    if (data) return toMember(data as SupabaseRow);
  }
  return null;
}

/**
 * Upsert idempotente — si encuentra match en cualquier identificador, fusiona campos
 * faltantes. Si no, crea fila nueva. Devuelve siempre el miembro consolidado.
 */
export async function upsertMember(input: {
  lookup: MemberLookup;
  patch: Partial<Omit<CommunityMember, "id" | "joinedAt">>;
}): Promise<CommunityMember> {
  const existing = await findMember(input.lookup);
  const sb = createServerSupabase();

  if (existing) {
    const merged = mergeMember(existing, input.lookup, input.patch);
    const { data, error } = await sb
      .from("darkroom_community_members")
      .update({
        lead_id: merged.leadId,
        stripe_customer_id: merged.stripeCustomerId,
        discord_user_id: merged.discordUserId,
        discord_username: merged.discordUsername,
        whatsapp_phone: merged.whatsappPhone,
        display_name: merged.displayName,
        email: merged.email,
        tier: merged.tier,
        last_active_at: new Date().toISOString(),
        status: merged.status,
        lead_score: merged.leadScore,
        affiliate_code: merged.affiliateCode,
        meta: merged.meta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return toMember(data as SupabaseRow);
  }

  // Insert nuevo
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("darkroom_community_members")
    .insert({
      lead_id: input.patch.leadId ?? null,
      stripe_customer_id: input.lookup.stripeCustomerId ?? input.patch.stripeCustomerId ?? null,
      discord_user_id: input.lookup.discordUserId ?? input.patch.discordUserId ?? null,
      discord_username: input.patch.discordUsername ?? null,
      whatsapp_phone:
        normalizePhone(input.lookup.whatsappPhone ?? input.patch.whatsappPhone ?? "") || null,
      display_name: input.patch.displayName ?? null,
      email: (input.lookup.email ?? input.patch.email ?? "").toLowerCase() || null,
      tier: input.patch.tier ?? "lurker",
      joined_at: now,
      last_active_at: now,
      status: input.patch.status ?? "active",
      lead_score: input.patch.leadScore ?? 0,
      affiliate_code: input.patch.affiliateCode ?? null,
      meta: input.patch.meta ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return toMember(data as SupabaseRow);
}

/** Suma delta al lead_score, clamp a [0,100]. Idempotente safe. */
export async function bumpLeadScore(memberId: string, delta: number): Promise<number> {
  if (delta === 0) return 0;
  const sb = createServerSupabase();
  const { data: cur, error: e1 } = await sb
    .from("darkroom_community_members")
    .select("lead_score")
    .eq("id", memberId)
    .single();
  if (e1) throw e1;
  const next = Math.max(0, Math.min(100, (cur?.lead_score ?? 0) + delta));
  const { error: e2 } = await sb
    .from("darkroom_community_members")
    .update({ lead_score: next, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (e2) throw e2;
  return next;
}

/** Promueve a tier superior (típico tras Stripe webhook). */
export async function setMemberTier(memberId: string, tier: MemberTier): Promise<void> {
  const sb = createServerSupabase();
  const { error } = await sb
    .from("darkroom_community_members")
    .update({ tier, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw error;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function mergeMember(
  existing: CommunityMember,
  lookup: MemberLookup,
  patch: Partial<CommunityMember>,
): CommunityMember {
  return {
    ...existing,
    discordUserId: lookup.discordUserId ?? patch.discordUserId ?? existing.discordUserId,
    discordUsername: patch.discordUsername ?? existing.discordUsername,
    whatsappPhone:
      normalizePhone(lookup.whatsappPhone ?? patch.whatsappPhone ?? "") ||
      existing.whatsappPhone,
    stripeCustomerId:
      lookup.stripeCustomerId ?? patch.stripeCustomerId ?? existing.stripeCustomerId,
    email: (lookup.email ?? patch.email ?? existing.email ?? "")?.toLowerCase() || null,
    leadId: patch.leadId ?? existing.leadId,
    displayName: patch.displayName ?? existing.displayName,
    tier: patch.tier ?? existing.tier,
    status: patch.status ?? existing.status,
    leadScore: patch.leadScore ?? existing.leadScore,
    affiliateCode: patch.affiliateCode ?? existing.affiliateCode,
    meta: { ...(existing.meta ?? {}), ...(patch.meta ?? {}) },
  };
}

/** Normaliza teléfono al formato Cloud API (sin +, sin espacios, sin guiones). */
export function normalizePhone(phone: string): string {
  return phone.replace(/[+\s\-()]/g, "");
}
