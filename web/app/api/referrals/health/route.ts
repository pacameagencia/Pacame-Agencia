import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Setup validator. Run once after deploying to confirm the module is wired up.
 *
 *   GET /api/referrals/health
 *   → { status: "ok" | "needs_setup", checks: { ... } }
 *
 * Verifies:
 *  - All aff_* tables exist and are queryable.
 *  - A default campaign exists for the tenant.
 *  - Required env vars are set.
 *  - The webhook secret is configured (cannot test signing without a real event).
 */
export async function GET(_: NextRequest) {
  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  for (const table of [
    "aff_campaigns",
    "aff_affiliates",
    "aff_visits",
    "aff_referrals",
    "aff_commissions",
  ]) {
    const { error } = await supabase.from(table).select("id", { head: true, count: "exact" }).limit(1);
    checks[`table_${table}`] = error
      ? { ok: false, detail: error.message }
      : { ok: true };
  }

  const { data: campaign } = await supabase
    .from("aff_campaigns")
    .select("id, commission_percent, max_commission_period_months")
    .eq("tenant_id", config.tenantId)
    .eq("is_default", true)
    .maybeSingle();

  checks.default_campaign = campaign
    ? { ok: true, detail: `${campaign.commission_percent}% / ${campaign.max_commission_period_months}m` }
    : { ok: false, detail: `no default campaign for tenant '${config.tenantId}'` };

  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];
  for (const key of requiredEnv) {
    checks[`env_${key}`] = process.env[key]
      ? { ok: true }
      : { ok: false, detail: "missing" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? "ok" : "needs_setup",
      tenant_id: config.tenantId,
      config: {
        url_param: config.urlParam,
        cookie_days: config.cookieDays,
        commission_percent: config.commissionPercent,
        max_commission_months: config.maxCommissionMonths,
        attribution: config.attribution,
      },
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
