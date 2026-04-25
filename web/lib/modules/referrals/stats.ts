import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralConfig } from "./config";

export type AffiliateStats = {
  clicks: number;
  signups: number;
  conversions: number;
  pending_cents: number;
  approved_cents: number;
  paid_cents: number;
  voided_cents: number;
  earnings_cents: number;     // approved + paid
  epc_cents: number;          // earnings / clicks
};

export async function loadAffiliateStats(
  supabase: SupabaseClient,
  config: ReferralConfig,
  affiliateId: string,
): Promise<AffiliateStats> {
  const [{ count: clicks }, { count: conversions }, { data: commissions }] = await Promise.all([
    supabase
      .from("aff_visits")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", config.tenantId)
      .eq("affiliate_id", affiliateId),
    supabase
      .from("aff_referrals")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", config.tenantId)
      .eq("affiliate_id", affiliateId)
      .eq("status", "converted"),
    supabase
      .from("aff_commissions")
      .select("amount_cents,status")
      .eq("tenant_id", config.tenantId)
      .eq("affiliate_id", affiliateId),
  ]);

  const buckets = { pending: 0, approved: 0, paid: 0, voided: 0 };
  (commissions ?? []).forEach((row: { amount_cents: number; status: keyof typeof buckets }) => {
    if (row.status in buckets) buckets[row.status] += row.amount_cents;
  });

  const earnings = buckets.approved + buckets.paid;
  const clicksSafe = clicks ?? 0;

  return {
    clicks: clicksSafe,
    signups: conversions ?? 0,    // we treat signups == conversions in the simplest model
    conversions: conversions ?? 0,
    pending_cents: buckets.pending,
    approved_cents: buckets.approved,
    paid_cents: buckets.paid,
    voided_cents: buckets.voided,
    earnings_cents: earnings,
    epc_cents: clicksSafe > 0 ? Math.floor(earnings / clicksSafe) : 0,
  };
}
