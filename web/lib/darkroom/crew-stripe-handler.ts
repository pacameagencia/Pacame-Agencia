/**
 * Helpers que el webhook Stripe llama para procesar eventos Dark Room Crew.
 *
 * Detección: events que llegan con `metadata.darkroom_brand === 'darkroom'`
 * en checkout.session.completed (en payments el handler se invoca con el
 * stripe_subscription_id / stripe_customer_id ya conocidos).
 *
 * Reglas:
 *   - Anti-self-ref: rechaza si referred_email == owner.email del code.
 *   - Status inicial pending_30d. one_time_amount_cents=0 hasta que
 *     promote-pending lo snapshote al rate del tier vigente del afiliado.
 *   - Subscription deleted < 30d → churned (no clawback porque one_time
 *     aún no se pagó).
 *   - Subscription deleted >= 30d → churned + decrement refs_active_count
 *     + recompute tier en próximo cron.
 *   - Refund: marca refunded + clawback de one_time + recurring acumulado.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getLogger } from "@/lib/observability/logger";
import { notifyPablo } from "@/lib/resend";
import { computeTier } from "./crew-tiers";

interface AffiliateRow {
  code: string;
  email: string;
  status: string;
}

/**
 * checkout.session.completed handler para Dark Room Crew.
 * Llamado siempre · si el session no es Dark Room, sale silencioso.
 */
export async function handleDarkroomCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const log = getLogger();
  const metadata = session.metadata || {};
  if (metadata.darkroom_brand !== "darkroom") return;

  const code = (metadata.dr_ref ?? "").trim().toLowerCase();
  if (!code) {
    log.warn({ sessionId: session.id }, "[crew-webhook] darkroom session sin dr_ref");
    return;
  }

  const referredEmail = (session.customer_email ?? "").toLowerCase();
  const stripeSubId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const plan = (metadata.plan === "lifetime" ? "lifetime" : "pro") as "pro" | "lifetime";

  // Lookup afiliado del code
  const { data: affRaw } = await supabase
    .from("darkroom_affiliates")
    .select("code, email, status")
    .eq("code", code)
    .maybeSingle();

  if (!affRaw) {
    log.warn({ code, sessionId: session.id }, "[crew-webhook] dr_ref code not found");
    return;
  }
  const aff = affRaw as AffiliateRow;

  if (aff.status === "banned") {
    log.warn({ code }, "[crew-webhook] code banned · skipping attribution");
    return;
  }

  // Anti-self-ref: el referido no puede ser el propio afiliado
  if (referredEmail && referredEmail === aff.email.toLowerCase()) {
    log.warn(
      { code, referredEmail },
      "[crew-webhook] self-ref rejected"
    );
    return;
  }

  // Idempotencia · si ya existe un referral con este stripe_subscription_id, skip
  if (stripeSubId) {
    const { data: existing } = await supabase
      .from("darkroom_referrals")
      .select("id")
      .eq("stripe_subscription_id", stripeSubId)
      .maybeSingle();
    if (existing) {
      log.info({ stripeSubId }, "[crew-webhook] referral already exists · skip");
      return;
    }
  }

  const { error } = await supabase.from("darkroom_referrals").insert({
    affiliate_code: code,
    referred_email: referredEmail || "unknown@stripe",
    stripe_subscription_id: stripeSubId,
    stripe_customer_id: stripeCustomerId,
    plan,
    started_at: new Date().toISOString(),
    status: "pending_30d",
    one_time_paid: false,
    one_time_amount_cents: 0,    // se snapshotea al promover a active
  });

  if (error) {
    log.error(
      { err: error.message, code, stripeSubId },
      "[crew-webhook] insert referral failed"
    );
    return;
  }

  log.info(
    { code, referredEmail, plan, stripeSubId },
    "[crew-webhook] referral created pending_30d"
  );
}

/**
 * customer.subscription.deleted handler para Dark Room Crew.
 * Llamado siempre · si la sub no está en darkroom_referrals, sale silencioso.
 */
export async function handleDarkroomSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const log = getLogger();
  const stripeSubId = subscription.id;

  const { data: refRaw } = await supabase
    .from("darkroom_referrals")
    .select("id, affiliate_code, status, started_at, one_time_paid")
    .eq("stripe_subscription_id", stripeSubId)
    .maybeSingle();

  if (!refRaw) return;

  const ref = refRaw as {
    id: string;
    affiliate_code: string;
    status: string;
    started_at: string;
    one_time_paid: boolean;
  };

  if (ref.status === "churned" || ref.status === "refunded") return;

  const startedMs = new Date(ref.started_at).getTime();
  const ageDays = (Date.now() - startedMs) / (1000 * 60 * 60 * 24);
  const wasActive = ref.status === "active";

  await supabase
    .from("darkroom_referrals")
    .update({ status: "churned", updated_at: new Date().toISOString() })
    .eq("id", ref.id);

  // Si estaba active → decrementa refs_active_count del afiliado y deja
  // que el próximo cron promote-pending recompute el tier.
  if (wasActive) {
    // Recalcular siempre desde COUNT real (más seguro que decrement atómico)
    const { count } = await supabase
      .from("darkroom_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_code", ref.affiliate_code)
      .eq("status", "active");

    const refsActive = count ?? 0;
    const tier = computeTier(refsActive);

    await supabase
      .from("darkroom_affiliates")
      .update({
        refs_active_count: refsActive,
        tier_current: tier.key,
        updated_at: new Date().toISOString(),
      })
      .eq("code", ref.affiliate_code);
  }

  log.info(
    { stripeSubId, code: ref.affiliate_code, ageDays: ageDays.toFixed(1), wasActive },
    "[crew-webhook] referral churned"
  );
}

/**
 * charge.refunded handler para Dark Room Crew · clawback de one_time + recurring.
 */
export async function handleDarkroomChargeRefunded(
  supabase: SupabaseClient,
  charge: Stripe.Charge
): Promise<void> {
  const log = getLogger();
  const stripeCustomerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null;
  if (!stripeCustomerId) return;

  const { data: refRaw } = await supabase
    .from("darkroom_referrals")
    .select("id, affiliate_code, status, one_time_amount_cents, total_commission_cents, one_time_paid")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!refRaw) return;

  const ref = refRaw as {
    id: string;
    affiliate_code: string;
    status: string;
    one_time_amount_cents: number;
    total_commission_cents: number;
    one_time_paid: boolean;
  };

  if (ref.status === "refunded") return;

  // Clawback: si ya se pagó one_time, restarlo del pending_balance del afiliado.
  // El recurring acumulado también se descuenta · puede dejar pending negativo.
  const clawbackCents = (ref.one_time_paid ? ref.one_time_amount_cents : 0) + (ref.total_commission_cents ?? 0);

  await supabase
    .from("darkroom_referrals")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ref.id);

  if (clawbackCents > 0) {
    // SUPABASE no soporta `pending_balance_cents - X` directamente sin RPC,
    // así que leemos el valor actual y restamos.
    const { data: affRaw } = await supabase
      .from("darkroom_affiliates")
      .select("pending_balance_cents")
      .eq("code", ref.affiliate_code)
      .maybeSingle();
    if (affRaw) {
      const current = (affRaw as { pending_balance_cents: number }).pending_balance_cents;
      await supabase
        .from("darkroom_affiliates")
        .update({
          pending_balance_cents: current - clawbackCents,
          updated_at: new Date().toISOString(),
        })
        .eq("code", ref.affiliate_code);
    }
  }

  log.warn(
    { stripeCustomerId, code: ref.affiliate_code, clawbackCents },
    "[crew-webhook] referral refunded · clawback applied"
  );

  await notifyPablo(
    `Dark Room refund · clawback ${(clawbackCents / 100).toFixed(2)}€`,
    `<p>Cliente Dark Room ha pedido refund.</p>
     <ul>
       <li>Afiliado: <strong>${ref.affiliate_code}</strong></li>
       <li>Stripe customer: ${stripeCustomerId}</li>
       <li>Clawback: ${(clawbackCents / 100).toFixed(2)}€ descontados del pending_balance</li>
     </ul>`
  ).catch(() => undefined);
}
