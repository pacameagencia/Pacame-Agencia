/**
 * POST /api/pacame-gpt/actions/reminder
 *
 * Crea un recordatorio que un cron diario manda por email cuando llega.
 *
 * Body: { messageId, due_at, subject? }
 *   due_at: ISO string. Debe ser futura. Mínimo +5 minutos.
 *
 * Devuelve: { ok, reminder_id, due_at }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProductUser } from "@/lib/products/session";
import {
  checkActionRateLimit,
  loadOwnedMessage,
  logAction,
} from "@/lib/lucia/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReminderBody {
  messageId?: string;
  due_at?: string;
  subject?: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: ReminderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.messageId) {
    return NextResponse.json({ error: "messageId requerido" }, { status: 400 });
  }
  if (!body.due_at) {
    return NextResponse.json({ error: "due_at requerido" }, { status: 400 });
  }

  const due = new Date(body.due_at);
  if (isNaN(due.getTime())) {
    return NextResponse.json({ error: "due_at_invalid" }, { status: 400 });
  }
  // Mínimo +5 min para evitar reminders en el pasado / instantáneos accidentales.
  if (due.getTime() < Date.now() + 5 * 60_000) {
    return NextResponse.json(
      { error: "due_at_too_soon", message: "El recordatorio debe ser de al menos 5 minutos en el futuro." },
      { status: 400 }
    );
  }
  // Máximo +1 año para evitar abuso.
  if (due.getTime() > Date.now() + 365 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "due_at_too_far" }, { status: 400 });
  }

  const rl = await checkActionRateLimit(user, "reminder");
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "daily_limit",
        message: `Has creado ya ${rl.used} recordatorios hoy. Límite ${rl.limit}/día.`,
      },
      { status: 429 }
    );
  }

  const msg = await loadOwnedMessage(user, body.messageId);
  if (!msg) return NextResponse.json({ error: "message_not_found" }, { status: 404 });

  const subject = (body.subject?.trim() || deriveSubject(msg.content)).slice(0, 120);

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pacame_gpt_reminders")
    .insert({
      user_id: user.id,
      conversation_id: msg.conversationId,
      message_id: msg.id,
      body: msg.content,
      subject,
      due_at: due.toISOString(),
    })
    .select("id, due_at")
    .single();

  if (error || !data) {
    await logAction({
      user_id: user.id,
      conversation_id: msg.conversationId,
      message_id: msg.id,
      action: "reminder",
      details: { due_at: due.toISOString() },
      ok: false,
      error: error?.message,
    });
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  await logAction({
    user_id: user.id,
    conversation_id: msg.conversationId,
    message_id: msg.id,
    action: "reminder",
    details: { reminder_id: data.id, due_at: data.due_at },
  });

  return NextResponse.json({
    ok: true,
    reminder_id: data.id,
    due_at: data.due_at,
  });
}

function deriveSubject(content: string): string {
  const cleaned = content.trim().replace(/\s+/g, " ");
  return "Recordatorio de Lucía: " + (cleaned.slice(0, 80) || "Mensaje guardado");
}
