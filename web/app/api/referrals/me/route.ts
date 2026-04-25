import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig, loadAffiliateStats } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

export async function GET(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const baseQuery = supabase
    .from("aff_affiliates")
    .select("id, referral_code, email, status, campaign_id, created_at")
    .eq("tenant_id", config.tenantId);
  const { data: affiliate } = authed.affiliateOnly
    ? await baseQuery.eq("id", authed.id).maybeSingle<{
        id: string; referral_code: string; email: string; status: string;
        campaign_id: string | null; created_at: string;
      }>()
    : await baseQuery.eq("user_id", authed.id).maybeSingle<{
        id: string; referral_code: string; email: string; status: string;
        campaign_id: string | null; created_at: string;
      }>();

  if (!affiliate) {
    return NextResponse.json({ error: "not_enrolled" }, { status: 404 });
  }

  const [stats, { data: referrals }] = await Promise.all([
    loadAffiliateStats(supabase, config, affiliate.id),
    supabase
      .from("aff_referrals")
      .select("id, status, created_at, converted_at, stripe_subscription_id")
      .eq("tenant_id", config.tenantId)
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    affiliate,
    stats,
    referrals: referrals ?? [],
  });
}
