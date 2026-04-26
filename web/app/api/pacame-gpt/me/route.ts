/**
 * GET /api/pacame-gpt/me
 *
 * Devuelve el estado de la cuenta para que el front muestre cabecera/sidebar:
 *   { user, subscription, dailyUsed, limit, daysLeftInTrial }
 *
 * Sin auth → 401 (front renderiza el botón "Iniciar sesión").
 */

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProductUser } from "@/lib/products/session";
import {
  daysLeftInTrial,
  getActiveSubscription,
  isSubscriptionActive,
} from "@/lib/products/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCT_ID = "pacame-gpt";
const FREE_DAILY_LIMIT = 20;

export async function GET() {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const sub = await getActiveSubscription(user.id, PRODUCT_ID);
  const supabase = createServerSupabase();
  const today = todayMadrid();
  const { data: usage } = await supabase
    .from("pacame_gpt_daily_usage")
    .select("messages_count")
    .eq("user_id", user.id)
    .eq("day", today)
    .maybeSingle();

  const dailyUsed = usage?.messages_count ?? 0;
  const active = sub ? isSubscriptionActive(sub) : false;

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    subscription: sub
      ? {
          id: sub.id,
          tier: sub.tier,
          status: sub.status,
          trial_ends_at: sub.trial_ends_at,
          days_left_in_trial: daysLeftInTrial(sub),
          active,
        }
      : null,
    dailyUsed,
    limit: active ? -1 : FREE_DAILY_LIMIT,
    remaining: active ? -1 : Math.max(0, FREE_DAILY_LIMIT - dailyUsed),
  });
}

function todayMadrid(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
