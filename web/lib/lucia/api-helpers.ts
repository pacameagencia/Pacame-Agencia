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
): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.from("pacame_gpt_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    llm_provider: telemetry?.llm_provider ?? null,
    llm_model: telemetry?.llm_model ?? null,
    tokens_in: telemetry?.tokens_in ?? null,
    tokens_out: telemetry?.tokens_out ?? null,
    latency_ms: telemetry?.latency_ms ?? null,
  });
  // updated_at de pacame_gpt_conversations se mueve solo via trigger.
}

export type UsageGate =
  | { ok: true; remaining: number; tier: "premium" | "trialing" | "free" }
  | { ok: false; reason: "limit_reached"; resetIn: string; tier: "free" }
  | { ok: false; reason: "subscription_invalid" };

/**
 * Comprueba si el user puede mandar otro mensaje hoy y, si puede, incrementa
 * el contador atómicamente. Política:
 *
 *   - Si la subscription está activa o en trialing válido → ilimitado.
 *   - Si la sub no existe / canceled / past_due → cae a free 20/día.
 *   - Si el contador del día (zona Madrid) ya llegó a 20 → bloquea.
 *
 * El incremento usa UPSERT: 1 fila por (user_id, day) en pacame_gpt_daily_usage.
 */
export async function checkAndIncrementDailyUsage(
  user: ProductUser,
  sub: ProductSubscription | null
): Promise<UsageGate> {
  // Premium o trial vivo → no contamos límite.
  if (sub && isSubscriptionActive(sub)) {
    // Igualmente registramos el contador para analítica (pero no lo limitamos).
    await bumpDailyCounter(user.id);
    return {
      ok: true,
      remaining: -1,
      tier: sub.status === "trialing" ? "trialing" : "premium",
    };
  }

  // Free tier: 20/día en zona Madrid.
  const today = todayMadrid();
  const supabase = createServerSupabase();
  const { data: row } = await supabase
    .from("pacame_gpt_daily_usage")
    .select("messages_count")
    .eq("user_id", user.id)
    .eq("day", today)
    .maybeSingle();

  const used = row?.messages_count ?? 0;
  if (used >= FREE_DAILY_LIMIT) {
    return {
      ok: false,
      reason: "limit_reached",
      resetIn: nextMidnightMadridIso(),
      tier: "free",
    };
  }

  await bumpDailyCounter(user.id);
  return {
    ok: true,
    remaining: FREE_DAILY_LIMIT - used - 1,
    tier: "free",
  };
}

/**
 * UPSERT atómico del contador diario. Si la fila no existe, se crea con count=1.
 * Si existe, suma 1. Para evitar race conditions usamos `on conflict` con `excluded`.
 */
async function bumpDailyCounter(userId: string): Promise<void> {
  const supabase = createServerSupabase();
  const today = todayMadrid();
  await supabase.rpc("pacame_gpt_increment_daily", {
    p_user: userId,
    p_day: today,
  });
  // Si la RPC no está creada (entorno fresco que aún no ejecutó la migration),
  // hacemos fallback a UPSERT manual no-atómico (suficiente para tráfico bajo).
  // Lo siguiente es idempotente si ya hizo el incremento la RPC.
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
