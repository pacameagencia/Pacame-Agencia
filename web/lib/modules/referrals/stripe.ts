import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralConfig } from "./config";
import type { RefCookieValue } from "./cookie";
import {
  getAffiliateById,
  getCampaignById,
  resolveProductForAffiliate,
  type BrandProduct,
} from "./db";
import { ipConversionCapExceeded } from "./fraud";

const CHARGEBACK_HOLD_DAYS = 60;

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
  extraMetadata?: Record<string, unknown>;
}): Promise<{ created: boolean; reason?: string }> {
  const { supabase, config, session, referredUserId, extraMetadata } = params;

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

  // Stamp brand context: prefer affiliate.brand_id; product info goes into metadata
  const productKey = (extraMetadata?.product as string | undefined) || null;

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
      brand_id: affiliate.brand_id,
      product_key: productKey,
      metadata: { session_id: session.id, ...extraMetadata },
    },
    { onConflict: "tenant_id,referred_user_id" },
  );

  if (error) return { created: false, reason: error.message };

  // ─── Comisión inmediata para checkouts one-time (sin invoice) ───
  // Si productKey existe Y match brand_product Y NO es recurring, generamos
  // la comisión aquí mismo (no llegará invoice.payment_succeeded para venta única).
  if (productKey && session.amount_total && session.amount_total > 0) {
    const resolved = await resolveProductForAffiliate(supabase, affiliate, productKey);
    if (resolved && !resolved.product.is_recurring) {
      const sourceEvent =
        (typeof session.invoice === "string" ? session.invoice : null) || `cs_${session.id}`;
      const amountCents = pickStandardAmount(resolved.product, affiliate.tier);
      if (amountCents > 0) {
        const now = Date.now();
        await supabase.from("aff_commissions").upsert(
          {
            tenant_id: config.tenantId,
            referral_id: undefined,
            affiliate_id: affiliateId,
            source_event: sourceEvent,
            amount_cents: amountCents,
            currency: (session.currency || "eur").toLowerCase(),
            month_index: 1,
            status: "pending",
            brand_id: resolved.brand.id,
            product_key: resolved.product.product_key,
            due_at: new Date(now + config.approvalDays * 86400 * 1000).toISOString(),
            hold_until: new Date(now + CHARGEBACK_HOLD_DAYS * 86400 * 1000).toISOString(),
            metadata: {
              checkout_session_id: session.id,
              flow: "checkout_one_time",
              tier: affiliate.tier,
            },
          },
          { onConflict: "tenant_id,source_event", ignoreDuplicates: true },
        );
        // Re-fetch the referral_id and link the commission row
        const { data: ref } = await supabase
          .from("aff_referrals")
          .select("id")
          .eq("tenant_id", config.tenantId)
          .eq("referred_user_id", referredUserId)
          .maybeSingle<{ id: string }>();
        if (ref) {
          await supabase
            .from("aff_commissions")
            .update({ referral_id: ref.id })
            .eq("tenant_id", config.tenantId)
            .eq("source_event", sourceEvent);
        }
      }
    }
  }

  // Fraud sweep — if too many distinct affiliates from same IP, mark suspicious
  if (visitIp) {
    const exceeded = await ipConversionCapExceeded(supabase, config, visitIp);
    if (exceeded) {
      await supabase.from("aff_affiliates").update({ status: "suspicious" }).eq("id", affiliateId);
    }
  }

  return { created: true };
}

function pickStandardAmount(product: BrandProduct, tier: string): number {
  if (tier === "vip" || tier === "partner") {
    return product.vip_first_flat_commission_cents || product.standard_flat_commission_cents;
  }
  return product.standard_flat_commission_cents;
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
  extraMetadata?: Record<string, unknown>;
}): Promise<{ created: boolean; reason?: string; amountCents?: number }> {
  const { supabase, config, invoice, extraMetadata } = params;

  const invoiceSubscription = (invoice as any).subscription;
  const subscriptionId = typeof invoiceSubscription === "string" ? invoiceSubscription : null;
  if (!subscriptionId) return { created: false, reason: "no_subscription" };
  if (!invoice.id) return { created: false, reason: "no_invoice_id" };
  if ((invoice.amount_paid ?? 0) <= 0) return { created: false, reason: "zero_amount" };

  const { data: referral } = await supabase
    .from("aff_referrals")
    .select("id, affiliate_id, status, brand_id, product_key")
    .eq("tenant_id", config.tenantId)
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle<{
      id: string; affiliate_id: string; status: string;
      brand_id: string | null; product_key: string | null;
    }>();

  if (!referral || referral.status !== "converted") {
    return { created: false, reason: "no_referral" };
  }

  const affiliate = await getAffiliateById(supabase, referral.affiliate_id);
  if (!affiliate || affiliate.status !== "active") {
    return { created: false, reason: "affiliate_inactive" };
  }

  // Count existing non-voided commissions for this referral
  const { count } = await supabase
    .from("aff_commissions")
    .select("id", { head: true, count: "exact" })
    .eq("tenant_id", config.tenantId)
    .eq("referral_id", referral.id)
    .neq("status", "voided");
  const monthIndex = (count ?? 0) + 1;

  // Try to resolve brand_product first (new flow). Fall back to legacy campaign.
  const productKey = referral.product_key || (extraMetadata?.product as string | undefined);
  let amountCents = 0;
  let brandId: string | null = referral.brand_id;
  let resolvedProductKey: string | null = referral.product_key;

  if (productKey) {
    const resolved = await resolveProductForAffiliate(supabase, affiliate, productKey);
    if (resolved) {
      brandId = resolved.brand.id;
      resolvedProductKey = resolved.product.product_key;
      amountCents = pickInvoiceCommission(resolved.product, affiliate.tier, monthIndex);
      if (amountCents === 0) {
        return { created: false, reason: "cap_reached_or_zero" };
      }
    }
  }

  // Legacy fallback: percentage of invoice using aff_campaigns
  if (amountCents === 0) {
    const campaign = await getCampaignById(supabase, config, affiliate.campaign_id);
    if (
      campaign.max_commission_period_months > 0 &&
      monthIndex > campaign.max_commission_period_months
    ) {
      return { created: false, reason: "cap_reached" };
    }
    amountCents = Math.floor(
      (invoice.amount_paid ?? 0) * (campaign.commission_percent / 100),
    );
    if (amountCents === 0) return { created: false, reason: "zero_commission" };
  }

  const now = Date.now();
  const dueAt = new Date(now + config.approvalDays * 86400 * 1000).toISOString();
  const holdUntil = new Date(now + CHARGEBACK_HOLD_DAYS * 86400 * 1000).toISOString();

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
      brand_id: brandId,
      product_key: resolvedProductKey,
      due_at: dueAt,
      hold_until: holdUntil,
      metadata: {
        billing_reason: invoice.billing_reason,
        invoice_number: invoice.number,
        tier: affiliate.tier,
        ...extraMetadata,
      },
    },
    { onConflict: "tenant_id,source_event", ignoreDuplicates: true },
  );

  if (error) return { created: false, reason: error.message };
  return { created: true, amountCents };
}

/**
 * For a recurring invoice (month N of subscription), pick the right commission
 * amount based on tier + product config. Returns 0 if past cap.
 */
function pickInvoiceCommission(
  product: BrandProduct,
  tier: string,
  monthIndex: number,
): number {
  // Standard tier: only 1 commission (first invoice).
  if (tier !== "vip" && tier !== "partner") {
    if (monthIndex === 1) return product.standard_flat_commission_cents;
    return 0;
  }
  // VIP / partner: first invoice uses vip_first_flat, recurring uses vip_recurring_flat.
  if (monthIndex === 1) return product.vip_first_flat_commission_cents;
  if (
    product.vip_recurring_months > 0 &&
    monthIndex <= product.vip_recurring_months
  ) {
    return product.vip_recurring_flat_cents;
  }
  return 0;
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
