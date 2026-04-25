/**
 * Helpers para gestionar `pacame_product_subscriptions`.
 */

import { createServerSupabase } from "@/lib/supabase/server";

export interface ProductSubscription {
  id: string;
  user_id: string;
  product_id: string;
  tier: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
}

/**
 * Crea una suscripción en estado trial sin tarjeta.
 * trial_ends_at = now() + product.trial_days
 *
 * Idempotente: si ya existe sub para (user, product), la devuelve.
 */
export async function startTrial(input: {
  user_id: string;
  product_id: string;
  tier: string;
  trial_days: number;
}): Promise<{ subscription: ProductSubscription; created: boolean }> {
  const supabase = createServerSupabase();

  const { data: existing } = await supabase
    .from("pacame_product_subscriptions")
    .select("*")
    .eq("user_id", input.user_id)
    .eq("product_id", input.product_id)
    .maybeSingle();

  if (existing) {
    return { subscription: existing as ProductSubscription, created: false };
  }

  const trialEnds = new Date(Date.now() + input.trial_days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("pacame_product_subscriptions")
    .insert({
      user_id: input.user_id,
      product_id: input.product_id,
      tier: input.tier,
      status: "trialing",
      trial_ends_at: trialEnds.toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`startTrial failed: ${error?.message ?? "unknown"}`);
  }
  return { subscription: data as ProductSubscription, created: true };
}

export async function getActiveSubscription(
  userId: string,
  productId: string
): Promise<ProductSubscription | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("pacame_product_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();

  if (!data) return null;
  return data as ProductSubscription;
}

export function isSubscriptionActive(sub: ProductSubscription): boolean {
  if (sub.status === "active") return true;
  if (sub.status === "trialing" && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date();
  }
  return false;
}

export function daysLeftInTrial(sub: ProductSubscription): number | null {
  if (sub.status !== "trialing" || !sub.trial_ends_at) return null;
  const ms = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
