/**
 * POST /api/darkroom/discord/role-sync
 *
 * Sincroniza rol Discord del miembro con su tier Stripe actual.
 *
 * Caller:
 *   - Stripe webhook handler (cuando customer.subscription.created/updated/deleted).
 *   - Endpoint manual desde admin dashboard.
 *
 * Body:
 *   {
 *     "stripe_customer_id": "cus_...",
 *     "discord_user_id"?: "snowflake",
 *     "email"?: "user@x.com",
 *     "tier": "trial" | "starter" | "pro" | "studio" | "crew" | "crew_vip" | "founder" | "lurker",
 *     "subscription_status"?: "active" | "trialing" | "canceled"
 *   }
 *
 * Flujo:
 *   1. Resolve member (upsert) por stripe_customer_id + lookup secundarios.
 *   2. setMemberTier(member.id, tier).
 *   3. Si discord_user_id presente, llama Discord REST API para asignar rol
 *      mapeado (DARKROOM_DISCORD_ROLE_<tier>_ID env var).
 *   4. recordEvent stripe:subscription_created|updated|canceled.
 *
 * Auth: HMAC del body con DARKROOM_STRIPE_SYNC_SECRET o cookie admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  recordEvent,
  setMemberTier,
  upsertMember,
} from "@/lib/darkroom/community";
import { getLogger } from "@/lib/observability/logger";
import type { EventType, MemberTier } from "@/lib/darkroom/community/types";

export const runtime = "nodejs";
export const maxDuration = 15;

const TIER_TO_ROLE_ENV: Record<MemberTier, string> = {
  lurker: "DARKROOM_DISCORD_ROLE_LURKER_ID",
  trial: "DARKROOM_DISCORD_ROLE_TRIAL_ID",
  starter: "DARKROOM_DISCORD_ROLE_STARTER_ID",
  pro: "DARKROOM_DISCORD_ROLE_PRO_ID",
  studio: "DARKROOM_DISCORD_ROLE_STUDIO_ID",
  crew: "DARKROOM_DISCORD_ROLE_CREW_ID",
  crew_vip: "DARKROOM_DISCORD_ROLE_CREW_VIP_ID",
  founder: "DARKROOM_DISCORD_ROLE_FOUNDER_ID",
};

function verify(rawBody: string, sig: string | null): boolean {
  if (!sig) return false;
  const secret = process.env.DARKROOM_STRIPE_SYNC_SECRET;
  if (!secret) return false;
  const [algo, hex] = sig.split("=", 2);
  if (algo !== "sha256" || !hex) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hex, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

interface SyncBody {
  stripe_customer_id: string;
  discord_user_id?: string;
  email?: string;
  tier: MemberTier;
  subscription_status?: "active" | "trialing" | "canceled";
}

async function assignDiscordRole(args: {
  guildId: string;
  userId: string;
  roleId: string;
}): Promise<boolean> {
  const token = process.env.DARKROOM_DISCORD_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${args.guildId}/members/${args.userId}/roles/${args.roleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${token}`,
        "X-Audit-Log-Reason": "darkroom-tier-sync",
      },
    },
  );
  return res.ok;
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verify(raw, request.headers.get("x-darkroom-signature"))) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }
  let body: SyncBody;
  try {
    body = JSON.parse(raw) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.stripe_customer_id || !body.tier) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const member = await upsertMember({
    lookup: {
      stripeCustomerId: body.stripe_customer_id,
      discordUserId: body.discord_user_id,
      email: body.email,
    },
    patch: { tier: body.tier, email: body.email },
  });

  await setMemberTier(member.id, body.tier);

  // Asignar rol Discord si tenemos discord_user_id + guild + role configurados
  let roleAssigned = false;
  const guildId = process.env.DARKROOM_DISCORD_GUILD_ID;
  const roleEnv = TIER_TO_ROLE_ENV[body.tier];
  const roleId = process.env[roleEnv];
  if (member.discordUserId && guildId && roleId) {
    try {
      roleAssigned = await assignDiscordRole({
        guildId,
        userId: member.discordUserId,
        roleId,
      });
    } catch (err) {
      getLogger().warn({ err }, "[dr-role-sync] discord API error");
    }
  }

  // Registrar event
  const eventType: EventType =
    body.subscription_status === "canceled"
      ? "stripe:subscription_canceled"
      : body.subscription_status === "trialing" || body.tier === "trial"
        ? "stripe:subscription_created"
        : "stripe:subscription_updated";

  await recordEvent({
    memberId: member.id,
    eventType,
    payload: {
      tier: body.tier,
      subscription_status: body.subscription_status ?? null,
      role_assigned: roleAssigned,
    },
    deliveredVia: "internal",
    status: "recorded",
  });

  return NextResponse.json({
    ok: true,
    member_id: member.id,
    tier: body.tier,
    role_assigned: roleAssigned,
  });
}
