/**
 * Helpers de servidor para PACAME GPT.
 *
 * Concentra lo que necesita el endpoint principal /api/pacame-gpt:
 *   - getOrCreateConversation(userId, convId, firstMsg)
 *   - persistMessage(convId, role, content, telemetry?)
 *   - checkAndIncrementDailyUsage(user, sub) → ok | rate_limited
 *
 * El endpoint /api/pacame-gpt/route.ts orquesta todo, este módulo solo
 * habla con Supabase y aplica reglas de negocio.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import {
  getActiveSubscription,
  isSubscriptionActive,
  type ProductSubscription,
} from "@/lib/products/subscriptions";
import type { ProductUser } from "@/lib/products/auth";

export interface ConvHandle {
  id: string;
  isNew: boolean;
}

const PRODUCT_ID = "pacame-gpt";
const FREE_DAILY_LIMIT = 20;

/**
 * Devuelve la conversación apuntada por convId si pertenece al user, o crea una
 * nueva titulada con la primera frase del usuario.
 */
export async function getOrCreateConversation(
  userId: string,
  convId: string | null | undefined,
  firstUserText: string
): Promise<ConvHandle> {
  const supabase = createServerSupabase();

  if (convId) {
    const { data } = await supabase
      .from("pacame_gpt_conversations")
      .select("id, user_id")
      .eq("id", convId)
      .maybeSingle();
    if (data && data.user_id === userId) {
      return { id: data.id, isNew: false };
    }
    // convId inválido o ajeno → ignoramos y creamos uno nuevo.
  }

  const title = deriveTitle(firstUserText);
  const { data, error } = await supabase
    .from("pacame_gpt_conversations")
    .insert({ user_id: userId, title })
    .select("id")
    .single();
  if (error || !data) throw new Error(`create_conv_failed: ${error?.message}`);
  return { id: data.id, isNew: true };
}

export async function persistMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  telemetry?: {
    llm_provider?: string;
    llm_model?: string;
    tokens_in?: number;
    tokens_out?: number;
    latency_ms?: number;
  }
): Promise<{ id: string } | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("pacame_gpt_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      llm_provider: telemetry?.llm_provider ?? null,
      llm_model: telemetry?.llm_model ?? null,
      tokens_in: telemetry?.tokens_in ?? null,
      tokens_out: telemetry?.tokens_out ?? null,
      latency_ms: telemetry?.latency_ms ?? null,
    })
    .select("id")
    .single();
  // updated_at de pacame_gpt_conversations se mueve solo via trigger.
  return data ? { id: data.id } : null;
}

export type UsageGate =
  | { ok: true; remaining: number; tier: "premium" | "trialing" | "free" }
  | { ok: false; reason: "limit_reached"; resetIn: string; tier: "free" }
  | { ok: false; reason: "subscription_invalid" };

/**
 * Comprueba si el user puede mandar otro mensaje hoy y, si puede, incrementa
 * el contador atómicamente — todo dentro de una sola RPC con SELECT FOR UPDATE.
 *
 * Política:
 *   - Sub activa o trialing válido → ilimitado (p_limit=NULL).
 *   - Sin sub o canceled/past_due  → free, 20/día (p_limit=20).
 *
 * La RPC pacame_gpt_check_and_increment_daily lockea la fila, decide si pasa
 * y solo entonces incrementa. Cierra la ventana TOCTOU del flujo
 * "SELECT-then-UPSERT" que tenía la versión anterior.
 */
export async function checkAndIncrementDailyUsage(
  user: ProductUser,
  sub: ProductSubscription | null
): Promise<UsageGate> {
  const today = todayMadrid();
  const supabase = createServerSupabase();
  const isPremium = !!sub && isSubscriptionActive(sub);

  const { data, error } = await supabase.rpc("pacame_gpt_check_and_increment_daily", {
    p_user: user.id,
    p_day: today,
    p_limit: isPremium ? null : FREE_DAILY_LIMIT,
  });

  if (error || !data) {
    // Si la RPC no existe (env sin migrations) o la DB se cae, no bloqueamos
    // al usuario — degradamos. El contador puede quedar inconsistente, pero
    // mejor servir que tirar.
    return {
      ok: true,
      remaining: isPremium ? -1 : FREE_DAILY_LIMIT,
      tier: isPremium ? (sub!.status === "trialing" ? "trialing" : "premium") : "free",
    };
  }

  const result = data as { ok: boolean; count: number; limit: number | null; reason?: string };

  if (!result.ok) {
    return {
      ok: false,
      reason: "limit_reached",
      resetIn: nextMidnightMadridIso(),
      tier: "free",
    };
  }

  if (isPremium) {
    return {
      ok: true,
      remaining: -1,
      tier: sub!.status === "trialing" ? "trialing" : "premium",
    };
  }
  return {
    ok: true,
    remaining: Math.max(0, FREE_DAILY_LIMIT - result.count),
    tier: "free",
  };
}

/**
 * Conveniencia: carga sub activa del producto pacame-gpt.
 */
export async function loadSubscription(userId: string): Promise<ProductSubscription | null> {
  return getActiveSubscription(userId, PRODUCT_ID);
}

/**
 * Devuelve fecha YYYY-MM-DD en zona Europe/Madrid.
 * Postgres tiene `(now() AT TIME ZONE 'Europe/Madrid')::date` por defecto en
 * la columna; aquí lo replicamos para los chequeos del lado Node.
 */
function todayMadrid(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextMidnightMadridIso(): string {
  const now = new Date();
  const madridNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  );
  madridNow.setHours(24, 0, 0, 0);
  // Convertimos de vuelta a UTC con el offset actual para devolver ISO útil.
  return madridNow.toISOString();
}

function deriveTitle(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Conversación nueva";
  const m = cleaned.match(/^([^.!?¿¡\n]{4,48})/);
  return (m ? m[1] : cleaned.slice(0, 48)) || "Conversación nueva";
}
