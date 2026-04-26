/**
 * POST /api/vapi/webhook
 *
 * Webhook de Vapi: recibe eventos de llamada (status-update, end-of-call-report, transcript).
 * Usamos `metadata.pacame_user_id` (que se incluyó al crear el assistant) para localizar al asesor.
 *
 * Almacenamos el call en asesorpro_vapi_calls + creamos alerta `call_received`.
 * Si el asesor tiene Telegram conectado, le mandamos un ping.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

interface VapiMessage {
  type?: string;
  call?: {
    id?: string;
    metadata?: Record<string, string>;
    customer?: { number?: string; name?: string };
  };
  endedReason?: string;
  durationSeconds?: number;
  cost?: number;
  transcript?: string;
  recordingUrl?: string;
  artifact?: { transcript?: string; recordingUrl?: string };
  analysis?: { summary?: string };
  status?: string;
}

export async function POST(request: NextRequest) {
  let payload: { message?: VapiMessage };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const msg = payload.message;
  if (!msg) return NextResponse.json({ ok: true, ignored: "no_message" });

  const callId = msg.call?.id;
  if (!callId) return NextResponse.json({ ok: true, ignored: "no_call_id" });

  const asesorUserId = msg.call?.metadata?.pacame_user_id;
  if (!asesorUserId) return NextResponse.json({ ok: true, ignored: "no_pacame_user_id" });

  const supabase = createServerSupabase();
  const transcript = msg.transcript ?? msg.artifact?.transcript ?? null;
  const recordingUrl = msg.recordingUrl ?? msg.artifact?.recordingUrl ?? null;
  const summary = msg.analysis?.summary ?? null;
  const status = msg.status ?? (msg.type === "end-of-call-report" ? "ended" : "in-progress");
  const endedReason = msg.endedReason ?? null;

  await supabase
    .from("asesorpro_vapi_calls")
    .upsert(
      {
        asesor_user_id: asesorUserId,
        vapi_call_id: callId,
        status,
        ended_reason: endedReason,
        duration_seconds: msg.durationSeconds ?? null,
        cost_usd: msg.cost ?? null,
        transcript,
        summary,
        recording_url: recordingUrl,
        caller_phone: msg.call?.customer?.number ?? null,
        caller_name: msg.call?.customer?.name ?? null,
        metadata: msg.call?.metadata ?? {},
      },
      { onConflict: "vapi_call_id" }
    );

  // Solo creamos alerta + ping al final de la llamada
  if (msg.type === "end-of-call-report" || status === "ended") {
    const phone = msg.call?.customer?.number ?? "número desconocido";
    const summaryShort = summary ? summary.slice(0, 200) : `Llamada de ${phone}.`;

    await supabase.from("asesorpro_alerts").insert({
      asesor_user_id: asesorUserId,
      type: "call_received",
      severity: "info",
      title: `Llamada nueva · ${phone}`,
      message: summaryShort,
      action_url: "/app/asesor-pro/ajustes/recepcionista",
    });

    // Telegram ping si está activo
    const { data: settings } = await supabase
      .from("asesorpro_settings")
      .select("telegram_chat_id, telegram_enabled, notify_call_received")
      .eq("asesor_user_id", asesorUserId)
      .maybeSingle();

    if (
      settings?.telegram_enabled &&
      settings?.telegram_chat_id &&
      settings?.notify_call_received !== false
    ) {
      try {
        await sendTelegramMessage(
          settings.telegram_chat_id,
          `📞 *Llamada nueva* desde \`${phone}\`\n\n${summaryShort}`,
          { parse_mode: "Markdown" }
        );
      } catch {
        // no rompemos webhook si Telegram falla
      }
    }
  }

  return NextResponse.json({ ok: true });
}
