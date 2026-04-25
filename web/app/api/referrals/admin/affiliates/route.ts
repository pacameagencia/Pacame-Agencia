import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Admin: list all affiliates of the tenant with their commission totals.
 * Returns rows ready for a payout dashboard.
 *
 *   GET /api/referrals/admin/affiliates
 *   → { affiliates: [{ id, email, code, status, conversions, pending_cents, approved_cents, paid_cents }] }
 *
 * Filters:
 *   ?status=active|suspicious|disabled
 *   ?has_pending=1   only affiliates with approved commissions to pay
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const status = request.nextUrl.searchParams.get("status");
  const hasPending = request.nextUrl.searchParams.get("has_pending") === "1";

  let q = supabase
    .from("aff_affiliates")
    .select("id, email, referral_code, status, created_at")
    .eq("tenant_id", config.tenantId)
    .order("created_at", { ascending: false });

  if (status) q = q.eq("status", status);

  const { data: affiliates, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!affiliates?.length) return NextResponse.json({ affiliates: [] });

  // Aggregate commissions per affiliate
  const ids = affiliates.map((a) => a.id);
  const { data: commissions } = await supabase
    .from("aff_commissions")
    .select("affiliate_id, status, amount_cents")
    .eq("tenant_id", config.tenantId)
    .in("affiliate_id", ids);

  const totalsByAffiliate = new Map<
    string,
    { pending: number; approved: number; paid: number; voided: number }
  >();
  for (const id of ids) {
    totalsByAffiliate.set(id, { pending: 0, approved: 0, paid: 0, voided: 0 });
  }
  for (const c of commissions ?? []) {
    const t = totalsByAffiliate.get(c.affiliate_id);
    if (!t) continue;
    if (c.status in t) (t as Record<string, number>)[c.status] += c.amount_cents;
  }

  // Conversion counts in one pass
  const { data: conversions } = await supabase
    .from("aff_referrals")
    .select("affiliate_id")
    .eq("tenant_id", config.tenantId)
    .eq("status", "converted")
    .in("affiliate_id", ids);

  const conversionsByAffiliate = new Map<string, number>();
  for (const r of conversions ?? []) {
    conversionsByAffiliate.set(
      r.affiliate_id,
      (conversionsByAffiliate.get(r.affiliate_id) ?? 0) + 1,
    );
  }

  const enriched = affiliates.map((a) => {
    const t = totalsByAffiliate.get(a.id) ?? { pending: 0, approved: 0, paid: 0, voided: 0 };
    return {
      id: a.id,
      email: a.email,
      code: a.referral_code,
      status: a.status,
      created_at: a.created_at,
      conversions: conversionsByAffiliate.get(a.id) ?? 0,
      pending_cents: t.pending,
      approved_cents: t.approved,
      paid_cents: t.paid,
      voided_cents: t.voided,
    };
  });

  const filtered = hasPending ? enriched.filter((a) => a.approved_cents > 0) : enriched;

  return NextResponse.json({
    tenant_id: config.tenantId,
    count: filtered.length,
    affiliates: filtered,
  });
}
