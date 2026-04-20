import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";
import { processMessage } from "@/lib/telegram-assistant";
import { downloadTelegramFile, transcribeAudio } from "@/lib/telegram-media";
import { getLogger } from "@/lib/observability/logger";

/**
 * Telegram Bot Webhook — receives messages from Pablo via Telegram.
 *
 * Slash commands get handled directly (fast, no AI).
 * Everything else goes to the AI assistant (Claude + tool_use)
 * which can query the DB, create leads, generate proposals, etc.
 *
 * IMPORTANT: This is the ONLY Telegram webhook handler.
 * Do NOT activate the n8n Telegram workflow (01-telegram-bot) —
 * it would overwrite this webhook and break the bot.
 */
export async function POST(request: NextRequest) {
  // Verify this comes from Telegram. Acepta:
  //  1. Header "x-telegram-bot-api-secret-token" (estandar Telegram setWebhook)
  //  2. Query param "?secret=..." (compat legacy)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const headerToken = request.headers.get("x-telegram-bot-api-secret-token");
    const queryToken = new URL(request.url).searchParams.get("secret");
    const ok = headerToken === secret || queryToken === secret;
    if (!ok) {
      getLogger().warn({}, "telegram webhook invalid secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = body?.message;
  if (!message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  // Only accept messages from Pablo's chat
  const pabloChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (pabloChatId && String(message.chat.id) !== pabloChatId) {
    return NextResponse.json({ ok: true });
  }

  // --- VOICE / AUDIO messages: transcribe and process ---
  if (message.voice || message.audio) {
    const fileId = message.voice?.file_id || message.audio?.file_id;
    if (!fileId) return NextResponse.json({ ok: true });

    try {
      await sendTelegram("🎧 Recibido. Transcribiendo audio...");
      const file = await downloadTelegramFile(fileId);
      if (!file) {
        await sendTelegram("No pude descargar el audio. Intentalo de nuevo.");
        return NextResponse.json({ ok: true });
      }

      const transcription = await transcribeAudio(file.buffer, file.filePath.split("/").pop() || "audio.ogg");
      if (!transcription) {
        await sendTelegram("No pude transcribir el audio. Necesito OPENAI_API_KEY configurada para Whisper. Mandamelo escrito por ahora.");
        return NextResponse.json({ ok: true });
      }

      await sendTelegram(`📝 <b>Transcripcion:</b>\n"${transcription}"`);
      await processMessage(transcription);
    } catch (err) {
      getLogger().error({ err }, "[Telegram Voice] Error");
      await sendTelegram(`Error procesando audio: ${err instanceof Error ? err.message : "desconocido"}`);
    }
    return NextResponse.json({ ok: true });
  }

  // --- PHOTO messages: extract caption and process ---
  if (message.photo && message.photo.length > 0) {
    const caption = message.caption?.trim() || "";
    const photoFileId = message.photo[message.photo.length - 1]?.file_id; // largest photo

    try {
      const context = caption
        ? `[Pablo envio una foto con este mensaje: "${caption}"]`
        : "[Pablo envio una foto sin texto. Preguntale que quiere hacer con ella.]";

      if (photoFileId) {
        // Download photo for potential future use
        const file = await downloadTelegramFile(photoFileId);
        if (file) {
          // Store photo context so the assistant knows there's an image
          await processMessage(`${context}\n[Foto descargada: ${file.filePath}]`);
        } else {
          await processMessage(context);
        }
      } else {
        await processMessage(context);
      }
    } catch (err) {
      getLogger().error({ err }, "[Telegram Photo] Error");
      await sendTelegram(`Error procesando foto: ${err instanceof Error ? err.message : "desconocido"}`);
    }
    return NextResponse.json({ ok: true });
  }

  // --- DOCUMENT messages ---
  if (message.document) {
    const caption = message.caption?.trim() || "";
    const docName = message.document.file_name || "documento";
    try {
      await processMessage(`[Pablo envio un documento: "${docName}"${caption ? `, con mensaje: "${caption}"` : ""}. Confirmale que lo recibiste y preguntale que necesita.]`);
    } catch (err) {
      getLogger().error({ err }, "[Telegram Doc] Error");
      await sendTelegram(`Error procesando documento: ${err instanceof Error ? err.message : "desconocido"}`);
    }
    return NextResponse.json({ ok: true });
  }

  // --- TEXT messages ---
  if (!message.text) {
    return NextResponse.json({ ok: true });
  }

  const text = message.text.trim();

  // If it's NOT a slash command, send to AI assistant
  if (!text.startsWith("/")) {
    try {
      await processMessage(text);
    } catch (err) {
      getLogger().error({ err }, "[Telegram AI] Error");
      try {
        await sendTelegram(`Error procesando mensaje: ${err instanceof Error ? err.message : "desconocido"}`);
      } catch { /* silent */ }
    }
    return NextResponse.json({ ok: true });
  }

  // Slash commands — fast, direct, no AI needed
  const command = text.split(" ")[0].toLowerCase();

  let supabase;
  try {
    supabase = createServerSupabase();
  } catch (err) {
    getLogger().error({ err }, "[Telegram Webhook] Failed to create Supabase client");
    await sendTelegram("Error: no se pudo conectar a la base de datos.");
    return NextResponse.json({ ok: true });
  }

  try {
    switch (command) {
      case "/status": {
        const [clientsRes, leadsRes, contentRes, activityRes] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("leads").select("*", { count: "exact", head: true }).gte("score", 4).not("status", "in", '("won","lost")'),
          supabase.from("content").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("agent_activities").select("title, agent_id").order("created_at", { ascending: false }).limit(5),
        ]);

        const activities = (activityRes.data ?? [])
          .map((a: { agent_id: string; title: string }) => `• ${a.agent_id}: ${a.title}`)
          .join("\n");

        const errors = [
          clientsRes.error ? `clients: ${clientsRes.error.message}` : null,
          leadsRes.error ? `leads: ${leadsRes.error.message}` : null,
          contentRes.error ? `content: ${contentRes.error.message}` : null,
          activityRes.error ? `activities: ${activityRes.error.message}` : null,
        ].filter(Boolean);

        let statusMsg =
          `📊 <b>Estado PACAME</b>\n\n` +
          `Clientes activos: <b>${clientsRes.count ?? 0}</b>\n` +
          `Leads calientes: <b>${leadsRes.count ?? 0}</b>\n` +
          `Contenido pendiente: <b>${contentRes.count ?? 0}</b>\n\n` +
          `<b>Actividad reciente:</b>\n${activities || "Sin actividad"}`;

        if (errors.length > 0) {
          statusMsg += `\n\n⚠️ <b>Errores DB:</b>\n${errors.join("\n")}`;
        }

        await sendTelegram(statusMsg);
        break;
      }

      case "/leads": {
        const { data: leads, error } = await supabase
          .from("leads")
          .select("name, business_name, score, status, source")
          .gte("score", 3)
          .not("status", "in", '("won","lost")')
          .order("score", { ascending: false })
          .limit(10);

        if (error) {
          await sendTelegram(`Error consultando leads: ${error.message}`);
          break;
        }

        if (!leads?.length) {
          await sendTelegram("No hay leads calientes ahora mismo.");
          break;
        }

        const list = leads
          .map((l) => `${"🔥".repeat(Math.min(l.score, 5))} <b>${l.name}</b>${l.business_name ? ` (${l.business_name})` : ""} — ${l.status} [${l.source}]`)
          .join("\n");

        await sendTelegram(`🎯 <b>Leads activos (score >= 3)</b>\n\n${list}`);
        break;
      }

      case "/cron": {
        const cronSecret = process.env.CRON_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
        await sendTelegram("⚙️ Lanzando cron de agentes...");

        try {
          const res = await fetch(`${baseUrl}/api/agents/cron`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
            },
            body: JSON.stringify({}),
          });
          if (res.ok) {
            await sendTelegram("✅ Cron ejecutado.");
          } else {
            await sendTelegram(`⚠️ Cron devolvio ${res.status}`);
          }
        } catch (err) {
          await sendTelegram(`Error ejecutando cron: ${err instanceof Error ? err.message : "desconocido"}`);
        }
        break;
      }

      case "/takeover": {
        const phone = text.split(" ")[1];
        if (!phone) { await sendTelegram("Uso: /takeover +34XXXXXXXXX"); break; }
        const { error } = await supabase
          .from("conversations").update({ mode: "human" })
          .eq("metadata->>phone", phone).order("created_at", { ascending: false }).limit(1);
        await sendTelegram(error ? `Error: ${error.message}` : `✅ Takeover activo para ${phone}.`);
        break;
      }

      case "/release": {
        const phone = text.split(" ")[1];
        if (!phone) { await sendTelegram("Uso: /release +34XXXXXXXXX"); break; }
        const { error } = await supabase
          .from("conversations").update({ mode: "auto" })
          .eq("metadata->>phone", phone).order("created_at", { ascending: false }).limit(1);
        await sendTelegram(error ? `Error: ${error.message}` : `✅ ${phone} devuelto a PACAME.`);
        break;
      }

      case "/ping": {
        await sendTelegram("🏓 Pong!");
        break;
      }

      case "/help": {
        await sendTelegram(
          `<b>Comandos rapidos:</b>\n` +
          `/status — Estado del sistema\n` +
          `/leads — Leads calientes\n` +
          `/cron — Ejecutar agentes\n` +
          `/takeover +34XXX — Tomar WhatsApp\n` +
          `/release +34XXX — Devolver WhatsApp\n` +
          `/ping — Test\n\n` +
          `<b>O simplemente escribeme (texto o audio):</b>\n` +
          `"genera una imagen de un logo para restaurante"\n` +
          `"scrapea restaurantes en Madrid"\n` +
          `"audita la web de example.com"\n` +
          `"crea un carrusel de 5 fotos para captar leads"\n` +
          `"llama al +34612345678"\n` +
          `"envia email a juan@email.com con la propuesta"\n` +
          `"genera contenido para Instagram esta semana"\n` +
          `"lanza al agente Nova"\n` +
          `"dame las metricas del negocio"\n` +
          `"crea un lead: Juan, panaderia en Madrid"`
        );
        break;
      }

      default: {
        // Unknown slash command — try the AI assistant
        await processMessage(text);
      }
    }
  } catch (err) {
    getLogger().error({ err }, "[Telegram Webhook] Error");
    try {
      await sendTelegram(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
    } catch { /* silent */ }
  }

  return NextResponse.json({ ok: true });
}
