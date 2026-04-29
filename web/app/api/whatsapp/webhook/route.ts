import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendWhatsApp, markAsRead, WHATSAPP_VERIFY_TOKEN } from "@/lib/whatsapp";
import { notifyHotLead } from "@/lib/telegram";
import { getLogger } from "@/lib/observability/logger";
import { pabloPersonaSystem, qualifyIntent } from "@/lib/pablo-persona";

const supabase = createServerSupabase();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * WhatsApp Webhook
 *
 * GET  — Meta verification challenge (required for webhook setup)
 * POST — Incoming messages + status updates
 */

// --- Meta webhook verification ---
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// --- Incoming messages ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Meta sends a specific structure
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value) {
    return NextResponse.json({ ok: true }); // Acknowledge unknown payloads
  }

  // Handle message status updates (sent, delivered, read) — informational only
  if (value.statuses) {
    return NextResponse.json({ ok: true });
  }

  // Handle incoming messages
  const messages = value.messages;
  if (!messages?.length) {
    return NextResponse.json({ ok: true });
  }

  for (const msg of messages) {
    const from = msg.from; // Phone number (e.g., "34722669381")
    const msgType = msg.type; // text, image, audio, document, etc.
    const timestamp = msg.timestamp;
    const messageId = msg.id;

    // Extract message content based on type
    let messageText = "";
    if (msgType === "text") {
      messageText = msg.text?.body || "";
    } else if (msgType === "interactive") {
      messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "[interactive]";
    } else {
      messageText = `[${msgType}]`;
    }

    // Mark as read
    await markAsRead(messageId);

    // Find contact in database
    const phoneFormats = [from, `+${from}`, from.replace(/^34/, "+34")];
    let leadId: string | null = null;
    let clientId: string | null = null;
    let contactName = "Desconocido";
    let contactContext = "";
    let isNewContact = false;

    // Check clients first
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, business_name, plan, phone")
      .or(phoneFormats.map((p) => `phone.eq.${p}`).join(","))
      .limit(1);

    if (clients?.length) {
      clientId = clients[0].id;
      contactName = clients[0].name;
      contactContext = `Cliente activo: ${clients[0].name} (${clients[0].business_name || ""}). Plan: ${clients[0].plan || "basico"}.`;
    } else {
      // Check leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name, business_name, problem, sector, score, phone")
        .or(phoneFormats.map((p) => `phone.eq.${p}`).join(","))
        .limit(1);

      if (leads?.length) {
        leadId = leads[0].id;
        contactName = leads[0].name;
        contactContext = [
          `Lead existente: ${leads[0].name}`,
          leads[0].business_name && `Empresa: ${leads[0].business_name}`,
          leads[0].sector && `Sector: ${leads[0].sector}`,
          leads[0].problem && `Problema: ${leads[0].problem}`,
          leads[0].score && `Score: ${leads[0].score}/5`,
        ].filter(Boolean).join(". ");
      } else {
        isNewContact = true;
      }
    }

    // Save incoming message
    await supabase.from("conversations").insert({
      lead_id: leadId,
      client_id: clientId,
      channel: "whatsapp",
      direction: "inbound",
      sender: from,
      message: messageText,
      message_type: msgType,
      mode: "auto",
      metadata: {
        wa_message_id: messageId,
        timestamp,
        contact_name: contactName,
        is_new: isNewContact,
      },
    });

    // If new contact, create as lead
    if (isNewContact) {
      const contactProfile = value.contacts?.[0]?.profile;
      const name = contactProfile?.name || `WhatsApp ${from}`;

      const { data: newLead } = await supabase.from("leads").insert({
        name,
        phone: `+${from}`,
        source: "whatsapp",
        status: "new",
        score: 3,
        problem: messageText.length > 10 ? messageText.slice(0, 200) : null,
      }).select("id").single();

      if (newLead) {
        leadId = newLead.id;

        // Notify Pablo about new WhatsApp lead
        await notifyHotLead({
          name,
          score: 3,
          source: "whatsapp",
          problem: messageText.slice(0, 100),
        });

        logAgentActivity({
          agentId: "sage",
          type: "update",
          title: `Nuevo lead WhatsApp: ${name}`,
          description: `Mensaje: "${messageText.slice(0, 80)}..."`,
          metadata: { lead_id: leadId, phone: from },
        });
      }
    }

    // Auto-respond with AI
    if (CLAUDE_API_KEY && messageText.length > 2) {
      await autoRespond(from, messageText, contactName, contactContext, leadId, clientId);
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * Auto-respond to WhatsApp messages using Claude.
 */
async function autoRespond(
  phone: string,
  incomingMessage: string,
  contactName: string,
  contactContext: string,
  leadId: string | null,
  clientId: string | null
) {
  if (!CLAUDE_API_KEY) return;

  // Get recent conversation history
  const { data: history } = await supabase
    .from("conversations")
    .select("direction, sender, message, created_at")
    .eq("channel", "whatsapp")
    .or([
      leadId && `lead_id.eq.${leadId}`,
      clientId && `client_id.eq.${clientId}`,
      `sender.eq.${phone}`,
    ].filter(Boolean).join(","))
    .order("created_at", { ascending: false })
    .limit(10);

  const historyText = (history || [])
    .reverse()
    .map((h) => `${h.direction === "inbound" ? contactName : "PACAME"}: ${h.message}`)
    .join("\n");

  // Pablo persona en 1a persona (igual que IG webhook) — unifica voz a traves de canales.
  // El agente `pablo` tiene 30 memorias semantic en agent_memories importance >= 0.9
  // (q1-q15 + 13 directivas + obsesion + vision-pacame-core) que cargan IDENTIDAD-PABLO.md.
  const qualified = qualifyIntent(incomingMessage);
  const contextHistory = [
    contactContext ? `CONTEXTO DEL CONTACTO:\n${contactContext}` : "",
    historyText ? `HISTORIAL RECIENTE:\n${historyText}` : "",
  ].filter(Boolean).join("\n\n");

  const systemPrompt = pabloPersonaSystem({
    channel: "whatsapp",
    qualified,
    contactName,
    history: contextHistory,
  });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: incomingMessage }],
      }),
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text;

    if (!reply) return;

    // Small delay for natural feel (2-5 seconds)
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));

    const result = await sendWhatsApp(phone, reply);

    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: leadId,
        client_id: clientId,
        channel: "whatsapp",
        direction: "outbound",
        sender: "pacame",
        message: reply,
        message_type: "text",
        mode: "auto",
        metadata: { wa_message_id: result.message_id, ai_generated: true },
      });
    }
  } catch (err) {
    getLogger().error({ err }, "[WhatsApp] Auto-respond error");
  }
}
