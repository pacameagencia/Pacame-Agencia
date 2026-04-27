/**
 * Programa de referidos simple de PACAME GPT.
 *
 * Modelo:
 *   - Cada user tiene un código derivado de su id (sin tabla aparte).
 *   - Cookie `pgpt_ref` captura `?ref=CODE` en /lucia y subpáginas.
 *   - Al hacer signup-trial, si la cookie está, se inserta una fila en
 *     pacame_gpt_referrals.
 *   - Cuando el referido paga (Stripe webhook), se marca paid_at.
 *   - Un cron/webhook posterior aplica la recompensa al referrer
 *     (+30 días current_period_end o +1 mes free trial). Sprint 6.
 *
 * Esto es deliberadamente más simple que el módulo `lib/modules/referrals`
 * que tiene admin/fraud/comisiones %. Para un producto B2C 9,90€/mes con
 * pricing fijo es suficiente y se ejecuta YA.
 */

import { createServerSupabase } from "@/lib/supabase/server";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LEN = 7;

/**
 * Deriva un código de invitación determinístico de 7 chars desde el user_id.
 * No reversible: nadie puede sacar tu user_id desde tu código.
 */
export function userCode(userId: string): string {
  // Hash simple sin libs: suma de char codes con multiplicador primo.
  // Determinístico, suficientemente uniforme para 7 chars.
  let h1 = 0x9e3779b9;
  let h2 = 0x85ebca77;
  for (let i = 0; i < userId.length; i++) {
    const c = userId.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0xcc9e2d51);
    h2 = Math.imul(h2 ^ c, 0x1b873593);
  }
  let out = "";
  let n = (h1 >>> 0) ^ (h2 >>> 0);
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[Math.abs(n) % ALPHABET.length];
    n = Math.imul(n, 33) ^ (n >>> 5);
  }
  return out;
}

/**
 * Resuelve el user_id propietario de un código. Linealmente busca entre los
 * users de pacame-gpt — para volúmenes bajo 100k usuarios es perfectamente
 * aceptable (el query lo cachea Postgres). Cuando escalemos, materializamos
 * la tabla code → user_id.
 */
export async function resolveCodeOwner(code: string): Promise<string | null> {
  if (!/^[2-9A-HJ-NP-Z]{7}$/i.test(code)) return null;
  const upper = code.toUpperCase();
  const supabase = createServerSupabase();
  const { data: users } = await supabase
    .from("pacame_product_users")
    .select("id");
  if (!users) return null;
  for (const u of users) {
    if (userCode(u.id) === upper) return u.id;
  }
  return null;
}

/**
 * Registra que `referred_user_id` se dio de alta a través de `code`.
 * Idempotente — si ya existe la fila, no la duplica.
 */
export async function recordReferral(input: {
  referred_user_id: string;
  code: string;
}): Promise<{ ok: boolean; reason?: string; referrer?: string }> {
  const referrer = await resolveCodeOwner(input.code);
  if (!referrer) return { ok: false, reason: "code_not_found" };
  if (referrer === input.referred_user_id) return { ok: false, reason: "self_referral" };

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("pacame_gpt_referrals")
    .insert({
      referrer_user_id: referrer,
      referred_user_id: input.referred_user_id,
      code: input.code.toUpperCase(),
    });
  // Si falla por unique violation (referido ya estaba en otro intento), OK.
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false, reason: error.message };
  }
  return { ok: true, referrer };
}

export interface ReferralStats {
  total_invited: number;
  total_paid: number;
  pending_reward: number;
}

export async function getStats(userId: string): Promise<ReferralStats> {
  const supabase = createServerSupabase();
  const { data: rows } = await supabase
    .from("pacame_gpt_referrals")
    .select("paid_at, reward_applied_at")
    .eq("referrer_user_id", userId);
  const list = rows || [];
  const total_paid = list.filter((r: any) => !!r.paid_at).length;
  const pending_reward = list.filter(
    (r: any) => !!r.paid_at && !r.reward_applied_at
  ).length;
  return {
    total_invited: list.length,
    total_paid,
    pending_reward,
  };
}

export const REFERRAL_COOKIE = "pgpt_ref";
export const REFERRAL_COOKIE_DAYS = 60;
