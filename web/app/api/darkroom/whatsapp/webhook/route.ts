/**
 * DarkRoom — WhatsApp Business webhook.
 *
 * Aislado del webhook PACAME (`/api/whatsapp/webhook`). Aquí solo entran
 * mensajes que vienen al **número WhatsApp de DarkRoom** (env
 * DARKROOM_WHATSAPP_PHONE_ID), no al número PACAME.
 *
 * Setup:
 *   1. Pablo crea Meta Business Manager "Dark Room IO".
 *   2. Crea App Meta DarkRoom + System User token (DARKROOM_META_SYSTEM_USER_TOKEN).
 *   3. Da de alta nuevo número WhatsApp Business en BM DarkRoom.
 *   4. Configura webhook URL: https://darkroomcreative.cloud/api/darkroom/whatsapp/webhook
 *      con verify token = DARKROOM_WHATSAPP_VERIFY_TOKEN.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp, markAsRead } from "@/lib/whatsapp";
import { resolveWhatsAppConfig } from "@/lib/messaging/config";
import { runDarkRoomAgent } from "@/lib/sales-agent/agent";
import { getLogger } from "@/lib/observability/logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const maxDuration = 60;
const supabase = createServerSupabase();

// Meta verification challenge
export async function GET(request: NextRequest) {
  const cfg = resolveWhatsAppConfig("darkroom");
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === cfg.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface WhatsAppIncoming {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: "text" | "image" | "audio" | "document" | "interactive" | "button" | "location";
          text?: { body: string };
        }>;
        contacts?: Array<{
          wa_id: string;
          profile?: { name?: string };
        }>;
      };
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  const log = getLogger();

  let body: WhatsAppIncoming;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const change = body.entry?.[0]?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  if (!message || message.type !== "text" || !message.text?.body) {
    return NextResponse.json({ ok: true, skipped: "non-text or no message" });
  }

  const phone = message.from; // E.164 sin +
  const text = message.text.body.trim();
  const contactName = value?.contacts?.[0]?.profile?.name;

  // Marca leído (blue ticks) en cuenta DarkRoom
  await markAsRead(message.id, { brand: "darkroom" });

  // Histórico para context
  const { data: prior } = await supabase
    .from("darkroom_chat_history")
    .select("role, content")
    .eq("contact_id", `wa:${phone}`)
    .order("created_at", { ascending: false })
    .limit(8);

  const history = (prior || []).reverse().map((p) => ({
    role: (p.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
    content: String(p.content || ""),
  }));

  try {
    const result = await runDarkRoomAgent({
      userMessage: text,
      history,
      contactId: `wa:${phone}`,
      context: {
        channel: "whatsapp",
        contactName: contactName || `+${phone}`,
      },
    });

    try {
      await supabase.from("darkroom_chat_history").insert([
        { contact_id: `wa:${phone}`, role: "user", content: text, channel: "whatsapp" },
        { contact_id: `wa:${phone}`, role: "assistant", content: result.reply, channel: "whatsapp" },
      ]);
    } catch (err) {
      log.warn({ err }, "[darkroom-whatsapp] history persist failed");
    }

    await sendWhatsApp(phone, result.reply, { brand: "darkroom" });
    return NextResponse.json({ ok: true, escalated: result.escalatedImmediately });
  } catch (err) {
    log.error({ err }, "[darkroom-whatsapp] agent error");
    await sendWhatsApp(
      phone,
      "El sistema tuvo un fallo al procesar tu mensaje. Pruebas en 1 minuto o escribes a support@darkroomcreative.cloud.",
      { brand: "darkroom" }
    );
    return NextResponse.json({ ok: true, error: "agent_failed" });
  }
}
