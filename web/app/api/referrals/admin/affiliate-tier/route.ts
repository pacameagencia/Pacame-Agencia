import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

const TIERS = ["standard", "vip", "partner"] as const;

/**
 * Toggle affiliate tier (standard/vip/partner) — controls whether the
 * affiliate is eligible for recurring commissions on subscriptions.
 *
 *   POST /api/referrals/admin/affiliate-tier
 *   Body: { affiliate_id, tier }
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: { affiliate_id?: string; tier?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.affiliate_id) return NextResponse.json({ error: "affiliate_id_required" }, { status: 400 });
  if (!body.tier || !TIERS.includes(body.tier as (typeof TIERS)[number])) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_affiliates")
    .update({ tier: body.tier })
    .eq("tenant_id", config.tenantId)
    .eq("id", body.affiliate_id)
    .select("id, tier, email")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ affiliate: data });
}
