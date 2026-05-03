/**
 * DarkRoom — Telegram bot webhook (@DarkRoomBot).
 *
 * Recibe mensajes del público que escriben al bot DarkRoom (NO el bot
 * personal de Pablo). Procesa con `runDarkRoomAgent` y responde.
 *
 * Aislamiento: usa `brand: "darkroom"` en sendTelegramMessage para que
 * use `DARKROOM_TELEGRAM_BOT_TOKEN`, NO el de PACAME.
 *
 * Setup:
 *   1. Pablo crea el bot con @BotFather → recibe DARKROOM_TELEGRAM_BOT_TOKEN.
 *   2. setWebhook → https://darkroomcreative.cloud/api/darkroom/telegram/webhook
 *      con secret_token = DARKROOM_TELEGRAM_WEBHOOK_SECRET.
 *   3. Cualquier mensaje entrante llega aquí.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { resolveTelegramConfig } from "@/lib/messaging/config";
import { runDarkRoomAgent } from "@/lib/sales-agent/agent";
import { getLogger } from "@/lib/observability/logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const maxDuration = 60;

const supabase = createServerSupabase();

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  const log = getLogger();
  const cfg = resolveTelegramConfig("darkroom");

  // Validar secret header (Telegram setWebhook con secret_token)
  if (cfg.webhookSecret) {
    const headerToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerToken !== cfg.webhookSecret) {
      log.warn({}, "[darkroom-telegram] invalid webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const msg = update.message;
  if (!msg || !msg.text) {
    // Ignora updates sin texto (stickers, fotos pendientes a soportar más adelante)
    return NextResponse.json({ ok: true });
  }

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();
  const contactName = msg.from.username
    ? `@${msg.from.username}`
    : msg.from.first_name || `chat_${chatId}`;

  // Comandos slash → respuestas rápidas sin LLM
  if (text.startsWith("/")) {
    const reply = handleSlashCommand(text);
    if (reply) {
      await sendTelegramMessage(chatId, reply, { brand: "darkroom" });
      return NextResponse.json({ ok: true, handled: "slash" });
    }
  }

  // Recuperar histórico previo (últimas 8 mensajes)
  const { data: prior } = await supabase
    .from("darkroom_chat_history")
    .select("role, content")
    .eq("contact_id", `tg:${chatId}`)
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
      contactId: `tg:${chatId}`,
      context: {
        channel: "telegram",
        contactName,
        history: undefined, // ya pasado en `history` array
      },
    });

    // Persistir turno para el próximo mensaje
    try {
      await supabase.from("darkroom_chat_history").insert([
        { contact_id: `tg:${chatId}`, role: "user", content: text, channel: "telegram" },
        { contact_id: `tg:${chatId}`, role: "assistant", content: result.reply, channel: "telegram" },
      ]);
    } catch (err) {
      log.warn({ err }, "[darkroom-telegram] history persist failed");
    }

    await sendTelegramMessage(chatId, result.reply, { brand: "darkroom" });
    return NextResponse.json({ ok: true, escalated: result.escalatedImmediately });
  } catch (err) {
    log.error({ err }, "[darkroom-telegram] agent error");
    await sendTelegramMessage(
      chatId,
      "El sistema tuvo un problema procesando tu mensaje. Inténtalo en 1 minuto o escribe /support.",
      { brand: "darkroom" }
    );
    return NextResponse.json({ ok: true, error: "agent_failed" });
  }
}

function handleSlashCommand(text: string): string | null {
  const cmd = text.split(/\s+/)[0].toLowerCase();
  switch (cmd) {
    case "/start":
      return "Bienvenido a DarkRoom · membresía colectiva del stack creativo premium.\n\nDímenos en qué te ayudamos:\n· **info** del producto\n· **prueba** 14 días sin tarjeta\n· **soporte** (si ya eres miembro)\n· **crew** (programa de embajadores)\n\nO escribe /support para escalar a humano.";
    case "/support":
      return "Te derivamos a un humano. Recibirás respuesta por aquí o en `support@darkroomcreative.cloud` en menos de 24h.";
    case "/legal":
      return "Toda la info legal en darkroomcreative.cloud/legal — términos, privacidad, cookies, modelo membresía colectiva.";
    case "/crew":
      return "DarkRoom Crew · programa de embajadores. Hasta 10€ one-time + 5€/mes recurring por ref activo en plan Pro. Más info: darkroomcreative.cloud/crew";
    case "/status":
      return "Para consultar tu membresía/trial responde con tu email asociado y el equipo lo verifica.";
    case "/help":
      return "Comandos: /start /support /legal /crew /status /help";
    default:
      return null;
  }
}
