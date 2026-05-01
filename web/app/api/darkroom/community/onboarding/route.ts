/**
 * GET /api/darkroom/community/onboarding
 *
 * Cron diario · ejecuta el siguiente step del onboarding 7-day para cada
 * miembro elegible (tier !== lurker, status active, joined_at >= step.day).
 *
 * Idempotente: si el step ya está registrado en `darkroom_community_events`,
 * se salta al siguiente.
 *
 * Plan §6.2 + master-success-playbook §7 Notebook 1.
 *
 * Output JSON:
 *   { ok: true, processed: N, delivered: M, skipped: K }
 *
 * Caller: Vercel cron (configurado en `web/vercel.json` o cron-master existente).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  markStepDelivered,
  nextStepFor,
  renderStep,
  type CommunityMember,
  type OnboardingStep,
} from "@/lib/darkroom/community";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

const ELIGIBLE_TIERS = ["trial", "starter", "pro", "studio", "crew", "crew_vip"];

/** Auth simple: header Authorization Bearer = CRON_SECRET (Vercel cron-friendly). */
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production"; // permitir solo en dev sin secret
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${expected}`;
}

async function deliverDM(
  member: CommunityMember,
  step: OnboardingStep,
): Promise<boolean> {
  const message = renderStep(step, member);

  // Discord DM: el bot Discord ya está suscrito al guild; le mandamos via REST.
  if (step.channel === "discord_dm" && member.discordUserId) {
    return await sendDiscordDM(member.discordUserId, message);
  }
  // WhatsApp template: requiere plantilla aprobada por Meta. Por ahora marcamos
  // como recorded y delegamos al humano (Pablo) para D0 si solo hay tlf.
  if (step.channel === "whatsapp_template" && member.whatsappPhone) {
    return false;
  }
  return false;
}

async function sendDiscordDM(userId: string, message: string): Promise<boolean> {
  const token = process.env.DARKROOM_DISCORD_BOT_TOKEN;
  if (!token) return false;
  try {
    // 1. Crear (o reusar) DM channel
    const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: userId }),
    });
    if (!dmRes.ok) return false;
    const dm = (await dmRes.json()) as { id: string };

    // 2. Enviar mensaje
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: message.slice(0, 1900) }),
    });
    return msgRes.ok;
  } catch (err) {
    getLogger().warn({ err }, "[dr-onboarding] discord DM failed");
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("darkroom_community_members")
    .select(
      "id, lead_id, stripe_customer_id, discord_user_id, discord_username, whatsapp_phone, display_name, email, tier, joined_at, last_active_at, status, lead_score, affiliate_code, meta",
    )
    .eq("status", "active")
    .in("tier", ELIGIBLE_TIERS)
    .gte("joined_at", new Date(Date.now() - 14 * 86_400_000).toISOString())
    .limit(500);

  if (error) {
    getLogger().error({ err: error }, "[dr-onboarding] supabase select error");
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  let processed = 0;
  let delivered = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const member: CommunityMember = {
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
      leadScore: row.lead_score ?? 0,
      affiliateCode: row.affiliate_code,
      meta: row.meta ?? {},
    };
    processed++;
    const step = await nextStepFor(member);
    if (!step) {
      skipped++;
      continue;
    }
    const ok = await deliverDM(member, step);
    if (ok) {
      await markStepDelivered(member.id, step);
      delivered++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, processed, delivered, skipped });
}
