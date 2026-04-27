import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { readAffiliateSessionFromRequest } from "@/lib/modules/referrals/affiliate-auth";

/**
 * GET /api/referrals/public/stripe-connect/status
 * Refresca el estado del Connected Account desde Stripe y lo cachea en BD.
 */
export async function GET(request: NextRequest) {
  const session = readAffiliateSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: aff } = await supabase
    .from("aff_affiliates")
    .select("stripe_connect_account_id, stripe_connect_status, stripe_payouts_enabled")
    .eq("tenant_id", config.tenantId)
    .eq("id", session.affiliate_id)
    .maybeSingle<{
      stripe_connect_account_id: string | null;
      stripe_connect_status: string | null;
      stripe_payouts_enabled: boolean;
    }>();

  if (!aff?.stripe_connect_account_id) {
    return NextResponse.json({
      has_account: false,
      payouts_enabled: false,
      status: null,
      requirements: [],
    });
  }

  try {
    const account = await stripe.accounts.retrieve(aff.stripe_connect_account_id);
    const payoutsEnabled = !!account.payouts_enabled && !!account.charges_enabled;
    const detailsSubmitted = !!account.details_submitted;
    const newStatus = payoutsEnabled
      ? "active"
      : detailsSubmitted
        ? "pending"
        : "pending";

    if (newStatus !== aff.stripe_connect_status || payoutsEnabled !== aff.stripe_payouts_enabled) {
      await supabase
        .from("aff_affiliates")
        .update({
          stripe_connect_status: newStatus,
          stripe_payouts_enabled: payoutsEnabled,
          stripe_connect_onboarded_at: payoutsEnabled ? new Date().toISOString() : null,
        })
        .eq("id", session.affiliate_id);
    }

    return NextResponse.json({
      has_account: true,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      status: newStatus,
      requirements: account.requirements?.currently_due ?? [],
      pending: account.requirements?.pending_verification ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "stripe_status_failed" },
      { status: 500 },
    );
  }
}
