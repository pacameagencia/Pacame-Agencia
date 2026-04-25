/**
 * Stripe webhook handlers para productos PACAME (mini-SaaS).
 *
 * Se invoca desde el webhook genérico /api/stripe/webhook cuando el evento
 * tiene metadata.pacame_product_id (configurado en /api/products/[product]/checkout).
 *
 * Eventos manejados:
 *   - checkout.session.completed       → activa subscription (trial→active)
 *   - customer.subscription.created    → idem si llega antes que checkout
 *   - customer.subscription.updated    → refresh tier + period_end
 *   - customer.subscription.deleted    → status=canceled
 *   - invoice.payment_failed           → status=past_due
 *   - invoice.payment_succeeded        → log + extender period_end (ya viene en sub.updated)
 */

import type Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase/server";

interface PacameMetadata {
  pacame_user_id?: string;
  pacame_product_id?: string;
  pacame_tier?: string;
}

function extractPacameMeta(meta: Stripe.Metadata | null | undefined): PacameMetadata {
  if (!meta) return {};
  return {
    pacame_user_id: meta.pacame_user_id,
    pacame_product_id: meta.pacame_product_id,
    pacame_tier: meta.pacame_tier,
  };
}

/**
 * Detecta si un evento de Stripe pertenece a un producto PACAME.
 * Se usa en el webhook genérico para enrutar.
 */
export function isPacameProductEvent(event: Stripe.Event): boolean {
  // checkout.session
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return !!session.metadata?.pacame_product_id;
  }
  // customer.subscription.* — metadata viene en subscription.metadata
  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    return !!sub.metadata?.pacame_product_id;
  }
  // invoice.* — buscar metadata en subscription_details (en versión SDK con apiVersion 2025-03-31)
  if (event.type.startsWith("invoice.")) {
    const inv = event.data.object as Stripe.Invoice;
    const subDetails = (inv as { subscription_details?: { metadata?: Stripe.Metadata } }).subscription_details;
    const meta = (subDetails?.metadata ?? inv.metadata ?? {}) as Stripe.Metadata;
    return !!meta.pacame_product_id;
  }
  return false;
}

/**
 * Handler principal — el webhook genérico llama aquí si isPacameProductEvent=true.
 */
export async function handlePacameProductEvent(event: Stripe.Event): Promise<{ ok: boolean; action: string; detail?: string }> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    case "invoice.payment_failed":
      return handlePaymentFailed(event.data.object as Stripe.Invoice);
    case "invoice.payment_succeeded":
      return { ok: true, action: "payment_logged" };
    default:
      return { ok: true, action: "ignored", detail: `event type ${event.type} no mapped` };
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = extractPacameMeta(session.metadata ?? undefined);
  if (!meta.pacame_user_id || !meta.pacame_product_id) {
    return { ok: false, action: "checkout_completed", detail: "missing metadata" };
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  const supabase = createServerSupabase();
  await supabase
    .from("pacame_product_subscriptions")
    .update({
      status: "active",
      stripe_subscription_id: subscriptionId ?? null,
      stripe_customer_id: customerId ?? null,
      tier: meta.pacame_tier ?? undefined,
    })
    .eq("user_id", meta.pacame_user_id)
    .eq("product_id", meta.pacame_product_id);

  return { ok: true, action: "subscription_activated", detail: `user=${meta.pacame_user_id} sub=${subscriptionId}` };
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const meta = extractPacameMeta(sub.metadata ?? undefined);
  if (!meta.pacame_user_id || !meta.pacame_product_id) {
    return { ok: false, action: "sub_updated", detail: "missing metadata" };
  }

  // Mapear status de Stripe → nuestro lifecycle
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "trialing",
    incomplete_expired: "canceled",
    paused: "paused",
  };
  const ourStatus = statusMap[sub.status] ?? "active";

  const periodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;

  const supabase = createServerSupabase();
  await supabase
    .from("pacame_product_subscriptions")
    .update({
      status: ourStatus,
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_price_id: sub.items?.data?.[0]?.price?.id ?? null,
      current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
      tier: meta.pacame_tier ?? undefined,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    })
    .eq("user_id", meta.pacame_user_id)
    .eq("product_id", meta.pacame_product_id);

  return { ok: true, action: `sub_${sub.status}`, detail: `user=${meta.pacame_user_id} period_end=${periodEndUnix}` };
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const meta = extractPacameMeta(sub.metadata ?? undefined);
  if (!meta.pacame_user_id || !meta.pacame_product_id) {
    return { ok: false, action: "sub_deleted", detail: "missing metadata" };
  }
  const supabase = createServerSupabase();
  await supabase
    .from("pacame_product_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("user_id", meta.pacame_user_id)
    .eq("product_id", meta.pacame_product_id);
  return { ok: true, action: "subscription_canceled" };
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subDetails = (invoice as { subscription_details?: { metadata?: Stripe.Metadata } }).subscription_details;
  const meta = extractPacameMeta(subDetails?.metadata ?? invoice.metadata ?? undefined);
  if (!meta.pacame_user_id || !meta.pacame_product_id) {
    return { ok: false, action: "payment_failed", detail: "missing metadata" };
  }
  const supabase = createServerSupabase();
  await supabase
    .from("pacame_product_subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", meta.pacame_user_id)
    .eq("product_id", meta.pacame_product_id);
  return { ok: true, action: "subscription_past_due" };
}
