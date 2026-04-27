import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { readAffiliateSessionFromRequest } from "@/lib/modules/referrals/affiliate-auth";

/**
 * Inicia el onboarding de Stripe Connect Express para que el afiliado pueda cobrar.
 *
 *   POST /api/referrals/public/stripe-connect/onboard
 *
 * Crea (o reusa) la connected account del afiliado y devuelve la URL de
 * onboarding. El afiliado completa el form en Stripe; vuelve a /afiliados/panel/perfil.
 */
export async function POST(request: NextRequest) {
  const session = readAffiliateSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: aff } = await supabase
    .from("aff_affiliates")
    .select("id, email, full_name, country, stripe_connect_account_id")
    .eq("tenant_id", config.tenantId)
    .eq("id", session.affiliate_id)
    .maybeSingle<{
      id: string; email: string; full_name: string | null;
      country: string | null; stripe_connect_account_id: string | null;
    }>();
  if (!aff) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let accountId = aff.stripe_connect_account_id;

  if (!accountId) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        country: aff.country || "ES",
        email: aff.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          tenant_id: config.tenantId,
          affiliate_id: aff.id,
          email: aff.email,
        },
      });
      accountId = account.id;
      await supabase
        .from("aff_affiliates")
        .update({
          stripe_connect_account_id: accountId,
          stripe_connect_status: "pending",
          stripe_payouts_enabled: false,
        })
        .eq("id", aff.id);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "stripe_account_create_failed" },
        { status: 500 },
      );
    }
  }

  const origin = request.nextUrl.origin;
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/afiliados/panel/perfil?onboarding=refresh`,
      return_url: `${origin}/afiliados/panel/perfil?onboarding=done`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "stripe_link_failed" },
      { status: 500 },
    );
  }
}
