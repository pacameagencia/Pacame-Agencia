/**
 * Helpers compartidos para los endpoints de acciones de PACAME GPT
 * (PDF, email, reminder, whatsapp). Centraliza:
 *   - Carga del mensaje origen + verificación de propietario
 *   - Rate limit suave por acción y user (ej. 50 PDFs/día)
 *   - Log estructurado en pacame_gpt_action_log
 *
 * Cada endpoint solo se ocupa de SU efecto secundario (Resend, render PDF,
 * insert reminder). Lo demás lo absorbe este módulo para no repetirlo.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import type { ProductUser } from "@/lib/products/auth";

export type ActionType = "pdf" | "email" | "reminder" | "whatsapp";

const DAILY_LIMITS: Record<ActionType, number> = {
  pdf: 50,
  email: 30,
  reminder: 30,
  whatsapp: 20,
};

export interface SourceMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/**
 * Verifica que el messageId pertenece a una conversación del user actual y
 * devuelve el contenido. 404 si no existe / no es suyo.
 */
export async function loadOwnedMessage(
  user: ProductUser,
  messageId: string
): Promise<SourceMessage | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("pacame_gpt_messages")
    .select(`
      id, role, content, created_at, conversation_id,
      pacame_gpt_conversations!inner(user_id)
    `)
    .eq("id", messageId)
    .maybeSingle();

  if (!data) return null;
  // El !inner garantiza join; toggleamos a any para el cast del nested.
  const conv = (data as any).pacame_gpt_conversations;
  if (!conv || conv.user_id !== user.id) return null;
  return {
    id: data.id,
    conversationId: data.conversation_id,
    role: data.role as "user" | "assistant",
    content: data.content,
    created_at: data.created_at,
  };
}

/**
 * Cuenta cuántas acciones de un tipo ha hecho el user hoy (zona Madrid).
 * Si supera DAILY_LIMITS[action] devuelve { ok: false }.
 */
export async function checkActionRateLimit(
  user: ProductUser,
  action: ActionType
): Promise<{ ok: true } | { ok: false; reason: "daily_limit"; limit: number; used: number }> {
  const supabase = createServerSupabase();
  const start = startOfTodayMadridIso();
  const { count } = await supabase
    .from("pacame_gpt_action_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("action", action)
    .gte("created_at", start);

  const used = count ?? 0;
  const limit = DAILY_LIMITS[action];
  if (used >= limit) {
    return { ok: false, reason: "daily_limit", limit, used };
  }
  return { ok: true };
}

/**
 * Inserta una entrada en pacame_gpt_action_log. No bloquea; si falla, swallow.
 */
export async function logAction(input: {
  user_id: string;
  conversation_id?: string | null;
  message_id?: string | null;
  action: ActionType;
  details?: Record<string, unknown>;
  ok?: boolean;
  error?: string | null;
}): Promise<void> {
  try {
    const supabase = createServerSupabase();
    await supabase.from("pacame_gpt_action_log").insert({
      user_id: input.user_id,
      conversation_id: input.conversation_id ?? null,
      message_id: input.message_id ?? null,
      action: input.action,
      details: input.details ?? {},
      ok: input.ok ?? true,
      error: input.error ?? null,
    });
  } catch {
    // logging nunca rompe el endpoint
  }
}

function startOfTodayMadridIso(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  );
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
