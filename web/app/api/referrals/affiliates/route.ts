import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOrCreateAffiliate, loadReferralConfig } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

export async function POST(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  try {
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
