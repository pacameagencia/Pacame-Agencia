/**
 * GET /api/pacame-gpt/me
 *
 * Devuelve el estado de la cuenta para que el front muestre cabecera/sidebar:
 *   { user, subscription, dailyUsed, limit, daysLeftInTrial }
 *
 * Sin auth → 401 (front renderiza el botón "Iniciar sesión").
 */

import { NextRequest, NextResponse } from "next/server";
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

// Rate limit suave: /me se llama en cada montaje del front + tras cada turno
// de chat. Permitimos 60 req/min por IP (1/seg) — más que suficiente para
// uso legítimo, frena pollers abusivos.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 60;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  b.count++;
  return b.count <= RL_MAX;
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  return handleMe();
}

async function handleMe() {
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
