/**
 * GET / POST /api/darkroom/whatsapp/webhook
 *
 * Webhook WhatsApp Cloud API multi-brand · brand=darkroom (separación de tokens
 * documentada en `strategy/darkroom/canales-mensajeria-adaptacion.md`).
 *
 * GET  — Meta verification challenge
 * POST — Incoming messages 1:1 (Cloud API NO recibe eventos de grupos/communities;
 *        eso lo gestiona Pablo manual)
 *
 * Pipeline:
 *   1. Anti-spam + intent → dispatcher → IRIS/NIMBO/VECTOR
 *   2. Send reply via sendWhatsApp({ brand: "darkroom" }) usando phone ID DR
 *   3. recordMessage in/out con channel="whatsapp:dm"
 *
 * Plan §4 · Capa 2A WhatsApp Community.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  markAsRead,
  sendWhatsApp,
} from "@/lib/whatsapp";
import { resolveWhatsAppConfig } from "@/lib/messaging/config";
import { dispatch } from "@/lib/darkroom/community";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  const cfg = resolveWhatsAppConfig("darkroom");
  if (mode === "subscribe" && token === cfg.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification_failed" }, { status: 403 });
}

interface MetaIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const entry = (body as { entry?: Array<unknown> })?.entry?.[0] as
    | { changes?: Array<{ value?: unknown }> }
    | undefined;
  const value = entry?.changes?.[0]?.value as
    | { messages?: MetaIncomingMessage[]; statuses?: unknown[]; contacts?: Array<{ profile?: { name?: string } }> }
    | undefined;

  if (!value) return NextResponse.json({ ok: true });
  if (value.statuses) return NextResponse.json({ ok: true });

  const messages = value.messages ?? [];
  if (messages.length === 0) return NextResponse.json({ ok: true });

  for (const msg of messages) {
    const from = msg.from;
    const messageId = msg.id;
    let text = "";
    if (msg.type === "text") text = msg.text?.body ?? "";
    else if (msg.type === "interactive")
      text = msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? "";
    if (!text || text.trim().length === 0) continue;

    // marcar leído (no bloqueante)
    markAsRead(messageId, { brand: "darkroom" }).catch(() => {});

    const profileName = value.contacts?.[0]?.profile?.name;

    try {
      const result = await dispatch({
        lookup: { whatsappPhone: from },
        channel: "whatsapp:dm",
        contentRaw: text,
        memberHints: { displayName: profileName },
      });

      if (result.silent || !result.response?.reply) continue;

      // Enviar respuesta · si excede 4096 chars, partir
      const reply = result.response.reply.slice(0, 4000);
      const sent = await sendWhatsApp(from, reply, { brand: "darkroom" });
      if (!sent.success) {
        getLogger().warn(
          { err: sent.error, from },
          "[dr-wa-webhook] sendWhatsApp failed",
        );
      }
    } catch (err) {
      getLogger().error({ err, from }, "[dr-wa-webhook] dispatch error");
    }
  }

  return NextResponse.json({ ok: true });
}
