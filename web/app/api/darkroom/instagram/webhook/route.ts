/**
 * DarkRoom — Instagram Direct Message webhook.
 *
 * Aislado del webhook PACAME (`/api/instagram/webhook`). Aquí solo entran
 * mensajes que vienen a la **cuenta Instagram de DarkRoom** (env
 * DARKROOM_INSTAGRAM_ACCOUNT_ID), no a @pacameagencia.
 *
 * Setup:
 *   1. Pablo crea cuenta IG @darkroomstudio (o similar) Business profile.
 *   2. Conecta a la página Facebook DarkRoom dentro del BM Dark Room IO.
 *   3. App Meta DarkRoom permite scopes instagram_manage_messages.
 *   4. Configura webhook URL: https://darkroomcreative.cloud/api/darkroom/instagram/webhook
 *      con verify token = DARKROOM_INSTAGRAM_VERIFY_TOKEN.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveInstagramConfig } from "@/lib/messaging/config";
import { runDarkRoomAgent } from "@/lib/sales-agent/agent";
import { getLogger } from "@/lib/observability/logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const maxDuration = 60;
const supabase = createServerSupabase();

const GRAPH_API = "https://graph.facebook.com/v21.0";

// Meta verification challenge
export async function GET(request: NextRequest) {
  const cfg = resolveInstagramConfig("darkroom");
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === cfg.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface IGIncoming {
  entry?: Array<{
    id?: string;
    messaging?: Array<{
      sender?: { id: string };
      recipient?: { id: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
      };
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  const log = getLogger();
  const cfg = resolveInstagramConfig("darkroom");

  let body: IGIncoming;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messaging = body.entry?.[0]?.messaging?.[0];
  const senderId = messaging?.sender?.id;
  const text = messaging?.message?.text?.trim();
  const isEcho = messaging?.message?.is_echo;

  // Ignorar nuestros propios echoes (mensajes salientes que IG re-notifica)
  if (isEcho || !senderId || !text) {
    return NextResponse.json({ ok: true, skipped: "echo or no text" });
  }

  // Histórico
  const { data: prior } = await supabase
    .from("darkroom_chat_history")
    .select("role, content")
    .eq("contact_id", `ig:${senderId}`)
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
      contactId: `ig:${senderId}`,
      context: {
        channel: "instagram",
      },
    });

    try {
      await supabase.from("darkroom_chat_history").insert([
        { contact_id: `ig:${senderId}`, role: "user", content: text, channel: "instagram" },
        { contact_id: `ig:${senderId}`, role: "assistant", content: result.reply, channel: "instagram" },
      ]);
    } catch (err) {
      log.warn({ err }, "[darkroom-ig] history persist failed");
    }

    await sendIGDirectMessage(senderId, result.reply, cfg.accessToken);
    return NextResponse.json({ ok: true, escalated: result.escalatedImmediately });
  } catch (err) {
    log.error({ err }, "[darkroom-ig] agent error");
    await sendIGDirectMessage(
      senderId,
      "Fallo procesando el mensaje. Vuelve a escribir en 1 min o por mail a support@darkroomcreative.cloud.",
      cfg.accessToken
    );
    return NextResponse.json({ ok: true, error: "agent_failed" });
  }
}

async function sendIGDirectMessage(
  recipientId: string,
  text: string,
  accessToken?: string
): Promise<boolean> {
  if (!accessToken) {
    getLogger().warn({}, "[darkroom-ig] no access token configured");
    return false;
  }
  try {
    const res = await fetch(`${GRAPH_API}/me/messages?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
