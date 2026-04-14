import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendSms, isSmsConfigured } from "@/lib/sms";

const supabase = createServerSupabase();

/**
 * SMS API — Send SMS messages to leads/clients.
 *
 * POST body:
 * - action: "send" | "bulk"
 * - phone_number: string (E.164)
 * - message: string
 * - lead_id?: string
 * - client_id?: string
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  if (!isSmsConfigured()) {
    return NextResponse.json(
      { error: "SMS not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { action } = body;

  // --- Send single SMS ---
  if (action === "send") {
    const { phone_number, message, lead_id, client_id } = body;

    if (!phone_number || !message) {
      return NextResponse.json(
        { error: "phone_number and message required" },
        { status: 400 }
      );
    }

    const result = await sendSms(phone_number, message);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Save outbound message to conversations
    await supabase.from("conversations").insert({
      lead_id: lead_id || null,
      client_id: client_id || null,
      channel: "sms",
      direction: "outbound",
      sender: "pacame",
      message,
      message_type: "text",
      mode: "manual",
      metadata: { twilio_sid: result.message_sid },
    });

    logAgentActivity({
      agentId: "sage",
      type: "task_completed",
      title: "SMS enviado",
      description: `A: ${phone_number}. Mensaje: "${message.slice(0, 60)}..."`,
      metadata: { phone_number, lead_id, client_id, twilio_sid: result.message_sid },
    });

    return NextResponse.json({ ok: true, message_sid: result.message_sid });
  }

  // --- Bulk send SMS ---
  if (action === "bulk") {
    const { recipients } = body as {
      recipients: Array<{ phone: string; message: string; lead_id?: string }>;
    };

    if (!recipients?.length) {
      return NextResponse.json({ error: "recipients array required" }, { status: 400 });
    }

    if (recipients.length > 50) {
      return NextResponse.json({ error: "Max 50 recipients per batch" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      recipients.map(async (r) => {
        const result = await sendSms(r.phone, r.message);
        if (result.success) {
          await supabase.from("conversations").insert({
            lead_id: r.lead_id || null,
            channel: "sms",
            direction: "outbound",
            sender: "pacame",
            message: r.message,
            message_type: "text",
            mode: "auto",
            metadata: { twilio_sid: result.message_sid },
          });
        }
        return { phone: r.phone, ...result };
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - sent;

    logAgentActivity({
      agentId: "sage",
      type: "task_completed",
      title: `SMS masivo: ${sent}/${recipients.length} enviados`,
      description: failed > 0 ? `${failed} fallidos` : "Todos enviados correctamente",
    });

    return NextResponse.json({ ok: true, sent, failed, total: recipients.length });
  }

  return NextResponse.json({ error: "Invalid action. Use 'send' or 'bulk'" }, { status: 400 });
}
