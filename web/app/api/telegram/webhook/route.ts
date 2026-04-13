import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";

const supabase = createServerSupabase();

/**
 * Telegram Bot Webhook — receives messages from Pablo via Telegram.
 * Commands:
 *   /status          — System status summary
 *   /leads           — Hot leads summary
 *   /cron            — Trigger agent cron manually
 *   /takeover {phone} — Take control of a WhatsApp conversation
 *   /release {phone}  — Release WhatsApp conversation back to PACAME
 */
export async function POST(request: NextRequest) {
  // Verify this comes from Telegram (basic token check)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const token = url.searchParams.get("secret");
    if (token !== secret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  const body = await request.json();
  const message = body?.message;
  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  // Only accept messages from Pablo's chat
  const pabloChatId = process.env.TELEGRAM_CHAT_ID;
  if (pabloChatId && String(message.chat.id) !== pabloChatId) {
    return NextResponse.json({ ok: true });
  }

  const text = message.text.trim();
  const command = text.split(" ")[0].toLowerCase();

  try {
    switch (command) {
      case "/status": {
        const [
          { count: activeClients },
          { count: hotLeads },
          { count: pendingContent },
          { data: recentActivity },
        ] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("leads").select("*", { count: "exact", head: true }).gte("score", 4).not("status", "in", '("won","lost")'),
          supabase.from("content").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
          supabase.from("agent_activities").select("title, agent_id").order("created_at", { ascending: false }).limit(5),
        ]);

        const activities = (recentActivity || [])
          .map((a) => `• ${a.agent_id}: ${a.title}`)
          .join("\n");

        await sendTelegram(
          `📊 <b>Estado PACAME</b>\n\n` +
            `Clientes activos: <b>${activeClients || 0}</b>\n` +
            `Leads calientes: <b>${hotLeads || 0}</b>\n` +
            `Contenido pendiente: <b>${pendingContent || 0}</b>\n\n` +
            `<b>Actividad reciente:</b>\n${activities || "Sin actividad"}`
        );
        break;
      }

      case "/leads": {
        const { data: leads } = await supabase
          .from("leads")
          .select("name, business_name, score, status, source")
          .gte("score", 3)
          .not("status", "in", '("won","lost")')
          .order("score", { ascending: false })
          .limit(10);

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
          await fetch(`${baseUrl}/api/agents/cron`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
            },
            body: JSON.stringify({}),
          });
          await sendTelegram("✅ Cron ejecutado. Revisa el dashboard para resultados.");
        } catch {
          await sendTelegram("❌ Error ejecutando el cron.");
        }
        break;
      }

      case "/takeover": {
        const phone = text.split(" ")[1];
        if (!phone) {
          await sendTelegram("Uso: /takeover +34XXXXXXXXX");
          break;
        }
        // Mark conversation as human-controlled
        const { error } = await supabase
          .from("conversations")
          .update({ mode: "human" })
          .eq("metadata->>phone", phone)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          await sendTelegram(`❌ Error: ${error.message}`);
        } else {
          await sendTelegram(`✅ Takeover activo para ${phone}. PACAME no respondera a ese numero.`);
        }
        break;
      }

      case "/release": {
        const phone = text.split(" ")[1];
        if (!phone) {
          await sendTelegram("Uso: /release +34XXXXXXXXX");
          break;
        }
        const { error } = await supabase
          .from("conversations")
          .update({ mode: "auto" })
          .eq("metadata->>phone", phone)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          await sendTelegram(`❌ Error: ${error.message}`);
        } else {
          await sendTelegram(`✅ ${phone} devuelto a PACAME. Retoma con contexto completo.`);
        }
        break;
      }

      default: {
        await sendTelegram(
          `Comandos disponibles:\n` +
            `/status — Estado del sistema\n` +
            `/leads — Leads calientes\n` +
            `/cron — Ejecutar agentes\n` +
            `/takeover +34XXX — Tomar control WhatsApp\n` +
            `/release +34XXX — Devolver a PACAME`
        );
      }
    }
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
    await sendTelegram("❌ Error procesando comando. Revisa los logs.");
  }

  return NextResponse.json({ ok: true });
}
