/**
 * Lógica de recompensas del programa referidos PACAME GPT.
 *
 * Flujo:
 *   1. Referido se da de alta con cookie pgpt_ref → fila en pacame_gpt_referrals
 *      con paid_at=NULL.
 *   2. Cuando paga su primer Stripe checkout → markReferralPaid() llamado
 *      desde el webhook handler. Marca paid_at=now().
 *   3. Cron apply-referral-rewards barre filas con paid_at NOT NULL y
 *      reward_applied_at NULL, y EXTIENDE +30 días el current_period_end
 *      del referrer en pacame_product_subscriptions.
 *
 * Si el referrer está en trial cuando se aplica el reward, no extendemos
 * (su trial ya es ilimitado). Marcamos reward_applied_at igual para no
 * acumular y le añadimos un crédito mental: el siguiente periodo paid se
 * extiende +30d (vía Stripe coupon o credit_balance, Sprint 7).
 *
 * Por simplicidad Sprint 6: aplicamos solo si la sub está en `active`.
 */

import { createServerSupabase } from "@/lib/supabase/server";

const PRODUCT_ID = "pacame-gpt";
const REWARD_DAYS = 30;

/**
 * Marca un referido como "ha pagado". Llamado desde el webhook al recibir
 * el checkout.session.completed del referido. Idempotente.
 */
export async function markReferralPaid(referredUserId: string): Promise<{
  ok: boolean;
  marked?: boolean;
  referrer?: string;
}> {
  const supabase = createServerSupabase();
  // Solo si existe fila y aún no se ha marcado como pagado.
  const { data, error } = await supabase
    .from("pacame_gpt_referrals")
    .update({ paid_at: new Date().toISOString() })
    .eq("referred_user_id", referredUserId)
    .is("paid_at", null)
    .select("referrer_user_id")
    .maybeSingle();
  if (error) return { ok: false };
  if (!data) return { ok: true, marked: false };
  return { ok: true, marked: true, referrer: data.referrer_user_id };
}

export interface RewardResult {
  scanned: number;
  applied: number;
  skipped_no_active_sub: number;
  errors: number;
}

/**
 * Barre referrals con paid_at NOT NULL y reward_applied_at NULL.
 * Para cada uno: si el referrer tiene sub activa de pacame-gpt, le suma
 * REWARD_DAYS al current_period_end y marca reward_applied_at.
 *
 * Llamado por cron diario. Idempotente: si se llama 2 veces en la misma
 * ventana, las filas ya marcadas no se vuelven a procesar.
 */
export async function applyPendingRewards(): Promise<RewardResult> {
  const supabase = createServerSupabase();

  const { data: pending, error } = await supabase
    .from("pacame_gpt_referrals")
    .select("id, referrer_user_id, paid_at")
    .not("paid_at", "is", null)
    .is("reward_applied_at", null)
    .limit(200);

  if (error || !pending) {
    return { scanned: 0, applied: 0, skipped_no_active_sub: 0, errors: 1 };
  }

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of pending) {
    try {
      const { data: sub } = await supabase
        .from("pacame_product_subscriptions")
        .select("id, status, current_period_end")
        .eq("user_id", row.referrer_user_id)
        .eq("product_id", PRODUCT_ID)
        .maybeSingle();

      if (!sub || sub.status !== "active" || !sub.current_period_end) {
        skipped++;
        continue;
      }

      const newEnd = new Date(
        new Date(sub.current_period_end).getTime() + REWARD_DAYS * 24 * 3600 * 1000
      ).toISOString();

      // Atómicamente: UPDATE sub + UPDATE referral. Si falla cualquiera,
      // no marcamos la referral como aplicada (próximo cron lo reintenta).
      const { error: errSub } = await supabase
        .from("pacame_product_subscriptions")
        .update({ current_period_end: newEnd })
        .eq("id", sub.id);
      if (errSub) {
        errors++;
        continue;
      }

      const { error: errRow } = await supabase
        .from("pacame_gpt_referrals")
        .update({ reward_applied_at: new Date().toISOString() })
        .eq("id", row.id);
      if (errRow) {
        errors++;
        // Nota: ya hemos extendido la sub, pero el reward no se ha marcado.
        // El próximo run lo intentará otra vez y duplicará +30d. Para evitarlo,
        // hacemos rollback manual del current_period_end.
        await supabase
          .from("pacame_product_subscriptions")
          .update({ current_period_end: sub.current_period_end })
          .eq("id", sub.id);
        continue;
      }
      applied++;
    } catch {
      errors++;
    }
  }

  return {
    scanned: pending.length,
    applied,
    skipped_no_active_sub: skipped,
    errors,
  };
}
