import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  getAffiliateById,
  getOrCreateAffiliate,
  loadReferralConfig,
} from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

export async function POST(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  try {
    // Standalone affiliates already have a row — just return it.
    if (authed.affiliateOnly) {
      const affiliate = await getAffiliateById(supabase, authed.id);
      if (!affiliate) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return NextResponse.json({
        affiliate: {
          id: affiliate.id,
          referral_code: affiliate.referral_code,
          email: affiliate.email,
          status: affiliate.status,
        },
      });
    }

    const affiliate = await getOrCreateAffiliate({
      supabase,
      config,
      userId: authed.id,
      email: authed.email,
    });
    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        referral_code: affiliate.referral_code,
        email: affiliate.email,
        status: affiliate.status,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "create_failed" },
      { status: 500 },
    );
  }
}
