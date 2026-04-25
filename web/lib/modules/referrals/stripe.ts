import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralConfig } from "./config";
import type { RefCookieValue } from "./cookie";
import { getAffiliateById, getCampaignById } from "./db";
import { ipConversionCapExceeded } from "./fraud";

export type CheckoutSessionInput = NonNullable<Parameters<Stripe["checkout"]["sessions"]["create"]>[0]>;

/**
 * Inject the visitor cookie into a Stripe Checkout Session payload so we can
 * link the eventual `checkout.session.completed` webhook back to the affiliate.
 */
export function attachReferralToCheckoutSession(
  params: CheckoutSessionInput,
  refCookie: RefCookieValue | null,
): CheckoutSessionInput {
  if (!refCookie) return params;
  return {
    ...params,
    client_reference_id: refCookie.v,
    metadata: {
      ...(params.metadata || {}),
      ref_code: refCookie.c,
      ref_affiliate_id: refCookie.a,
    },
    subscription_data: params.subscription_data
      ? {
          ...params.subscription_data,
          metadata: {
            ...(params.subscription_data.metadata || {}),
            ref_code: refCookie.c,
            ref_affiliate_id: refCookie.a,
          },
        }
      : undefined,
  };
}

/**
 * Called from the Stripe webhook on `checkout.session.completed`.
 * Creates the `aff_referrals` row linking referred user to affiliate.
 */
export async function processCheckoutSession(params: {
  supabase: SupabaseClient;
  config: ReferralConfig;
  session: Stripe.Checkout.Session;
  referredUserId: string;
}): Promise<{ created: boolean; reason?: string }> {
  const { supabase, config, session, referredUserId } = params;

  const visitorUuid = session.client_reference_id;
  const metadataAffiliateId = (session.metadata?.ref_affiliate_id as string | undefined) || null;

  let affiliateId: string | null = metadataAffiliateId;
  let visitId: string | null = null;
  let visitIp: string | null = null;

  if (visitorUuid) {
    const { data: visit } = await supabase
      .from("aff_visits")
      .select("id, affiliate_id, ip")
      .eq("tenant_id", config.tenantId)
      .eq("visitor_uuid", visitorUuid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; affiliate_id: string; ip: string | null }>();

    if (visit) {
      affiliateId = visit.affiliate_id;
      visitId = visit.id;
      visitIp = visit.ip;
    }
  }

  if (!affiliateId) return { created: false, reason: "no_affiliate" };

  const affiliate = await getAffiliateById(supabase, affiliateId);
  if (!affiliate || affiliate.status !== "active") {
    return { created: false, reason: "affiliate_inactive" };
  }
  if (affiliate.user_id && affiliate.user_id === referredUserId) {
    return { created: false, reason: "self_referral" };
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
  const customerId = typeof session.customer === "string" ? session.customer : null;

  const { error } = await supabase.from("aff_referrals").upsert(
    {
      tenant_id: config.tenantId,
      affiliate_id: affiliateId,
      referred_user_id: referredUserId,
      visit_id: visitId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: "converted",
      converted_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,referred_user_id" },
  );

  if (error) return { created: false, reason: error.message };

  // Fraud sweep — if too many distinct affiliates from same IP, mark suspicious
  if (visitIp) {
    const exceeded = await ipConversionCapExceeded(supabase, config, visitIp);
    if (exceeded) {
      await supabase.from("aff_affiliates").update({ status: "suspicious" }).eq("id", affiliateId);
    }
  }

  return { created: true };
}

/**
 * Called on `invoice.payment_succeeded` (or `invoice.paid`).
 * Generates one commission row per paid invoice, capped by campaign months.
 * Idempotent via UNIQUE(tenant_id, source_event).
 */
export async function processInvoicePaid(params: {
  supabase: SupabaseClient;
  config: ReferralConfig;
  invoice: Stripe.Invoice;
}): Promise<{ created: boolean; reason?: string; amountCents?: number }> {
  const { supabase, config, invoice } = params;

  const invoiceSubscription = (invoice as any).subscription;
  const subscriptionId = typeof invoiceSubscription === "string" ? invoiceSubscription : null;
  if (!subscriptionId) return { created: false, reason: "no_subscription" };
  if (!invoice.id) return { created: false, reason: "no_invoice_id" };
  if ((invoice.amount_paid ?? 0) <= 0) return { created: false, reason: "zero_amount" };

  const { data: referral } = await supabase
    .from("aff_referrals")
    .select("id, affiliate_id, status")
    .eq("tenant_id", config.tenantId)
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle<{ id: string; affiliate_id: string; status: string }>();

  if (!referral || referral.status !== "converted") {
    return { created: false, reason: "no_referral" };
  }

  const affiliate = await getAffiliateById(supabase, referral.affiliate_id);
  if (!affiliate || affiliate.status !== "active") {
    return { created: false, reason: "affiliate_inactive" };
  }

  const campaign = await getCampaignById(supabase, config, affiliate.campaign_id);

  const { count } = await supabase
    .from("aff_commissions")
    .select("id", { head: true, count: "exact" })
    .eq("tenant_id", config.tenantId)
    .eq("referral_id", referral.id)
    .neq("status", "voided");
  const monthIndex = (count ?? 0) + 1;

  if (
    campaign.max_commission_period_months > 0 &&
    monthIndex > campaign.max_commission_period_months
  ) {
    return { created: false, reason: "cap_reached" };
  }

  const amountCents = Math.floor(
    (invoice.amount_paid ?? 0) * (campaign.commission_percent / 100),
  );

  const dueAt = new Date(Date.now() + config.approvalDays * 86400 * 1000).toISOString();

  const { error } = await supabase.from("aff_commissions").upsert(
    {
      tenant_id: config.tenantId,
      referral_id: referral.id,
      affiliate_id: referral.affiliate_id,
      source_event: invoice.id,
      amount_cents: amountCents,
      currency: invoice.currency || "eur",
      month_index: monthIndex,
      status: "pending",
      due_at: dueAt,
    },
    { onConflict: "tenant_id,source_event", ignoreDuplicates: true },
  );

  if (error) return { created: false, reason: error.message };
  return { created: true, amountCents };
}

/**
 * Called on `charge.refunded` or `customer.subscription.deleted`.
 * Voids commissions linked to the affected source events / subscriptions.
 */
export async function processRefundClawback(params: {
  supabase: SupabaseClient;
  config: ReferralConfig;
  invoiceId?: string | null;
  subscriptionId?: string | null;
}): Promise<{ voided: number }> {
  const { supabase, config, invoiceId, subscriptionId } = params;

  if (invoiceId) {
    const { data } = await supabase
      .from("aff_commissions")
      .update({ status: "voided", voided_at: new Date().toISOString() })
      .eq("tenant_id", config.tenantId)
      .eq("source_event", invoiceId)
      .neq("status", "paid")
      .select("id");
    return { voided: data?.length ?? 0 };
  }

  if (subscriptionId) {
    const { data: referral } = await supabase
      .from("aff_referrals")
      .select("id")
      .eq("tenant_id", config.tenantId)
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle<{ id: string }>();
    if (!referral) return { voided: 0 };
    await supabase
      .from("aff_referrals")
      .update({ status: "cancelled" })
      .eq("id", referral.id);
    const { data } = await supabase
      .from("aff_commissions")
      .update({ status: "voided", voided_at: new Date().toISOString() })
      .eq("tenant_id", config.tenantId)
      .eq("referral_id", referral.id)
      .eq("status", "pending")
      .select("id");
    return { voided: data?.length ?? 0 };
  }

  return { voided: 0 };
}
