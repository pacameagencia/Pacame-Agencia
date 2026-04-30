/**
 * GET /api/darkroom/crew/dashboard?code=<CODE>
 *
 * Panel afiliado público (el code mismo es el secreto compartido).
 *
 * Response 200:
 *   {
 *     code, name, status, tier_current, refs_active, refs_to_next,
 *     pending_balance_cents, lifetime_paid_cents,
 *     monthly_recurring_estimate_cents,
 *     last_referrals: [{ email_anon, plan, started_at, status, one_time_paid }],
 *     last_payouts: [{ period, total_cents, status, paid_at }]
 *   }
 *
 * 404 si code no existe.
 *
 * Sin auth porque el code mismo es el secreto. Rate limit por IP recomendado
 * (no implementado mes 1; añadir en mes 2 si hay abuse).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  computeTier,
  computeMonthlyRecurring,
  refsToNextTier,
  TIERS,
  type TierKey,
} from "@/lib/darkroom/crew-tiers";

export const runtime = "nodejs";
export const maxDuration = 10;

const CODE_RE = /^[a-z0-9-]{4,48}$/;

function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const localMasked = local.length <= 1 ? "***" : `${local[0]}***`;
  return `${localMasked}@***`;
}

interface AffRow {
  code: string;
  name: string;
  status: string;
  tier_current: TierKey;
  refs_active_count: number;
  pending_balance_cents: number;
  total_one_time_paid_cents: number;
  total_recurring_paid_cents: number;
  last_tier_change_at: string | null;
}

interface RefRow {
  referred_email: string;
  plan: string;
  started_at: string;
  status: string;
  one_time_paid: boolean;
}

interface PayoutRow {
  period: string;
  total_cents: number;
  status: string;
  paid_at: string | null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim().toLowerCase();
  if (!code || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "valid code required" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: aff, error } = await supabase
    .from("darkroom_affiliates")
    .select(
      "code, name, status, tier_current, refs_active_count, pending_balance_cents, total_one_time_paid_cents, total_recurring_paid_cents, last_tier_change_at"
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!aff) {
    return NextResponse.json({ error: "code not found" }, { status: 404 });
  }

  const a = aff as AffRow;

  const { data: refsRaw } = await supabase
    .from("darkroom_referrals")
    .select("referred_email, plan, started_at, status, one_time_paid")
    .eq("affiliate_code", code)
    .order("started_at", { ascending: false })
    .limit(10);

  const { data: payoutsRaw } = await supabase
    .from("darkroom_payouts")
    .select("period, total_cents, status, paid_at")
    .eq("affiliate_code", code)
    .order("period", { ascending: false })
    .limit(6);

  const refs = (refsRaw ?? []) as RefRow[];
  const payouts = (payoutsRaw ?? []) as PayoutRow[];

  const tier = computeTier(a.refs_active_count);
  const refsToNext = refsToNextTier(a.refs_active_count);
  const recurringEstimate = computeMonthlyRecurring(a.refs_active_count);
  const lifetimePaid =
    (a.total_one_time_paid_cents ?? 0) + (a.total_recurring_paid_cents ?? 0);

  return NextResponse.json({
    code: a.code,
    name: a.name,
    status: a.status,
    tier_current: a.tier_current,
    tier_label: tier.label,
    tier_emoji: tier.emoji,
    refs_active: a.refs_active_count,
    refs_to_next: refsToNext,
    pending_balance_cents: a.pending_balance_cents,
    lifetime_paid_cents: lifetimePaid,
    monthly_recurring_estimate_cents: recurringEstimate,
    last_tier_change_at: a.last_tier_change_at,
    tiers_table: TIERS.map((t) => ({
      key: t.key,
      label: t.label,
      emoji: t.emoji,
      refsMin: t.refsMin,
      refsMax: t.refsMax,
      oneTimeCents: t.oneTimeCents,
      recurringCents: t.recurringCents,
    })),
    last_referrals: refs.map((r) => ({
      email_anon: anonymizeEmail(r.referred_email),
      plan: r.plan,
      started_at: r.started_at,
      status: r.status,
      one_time_paid: r.one_time_paid,
    })),
    last_payouts: payouts,
  });
}
