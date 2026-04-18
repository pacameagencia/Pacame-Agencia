import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendSms, validateTwilioSignature } from "@/lib/sms";
import { notifyHotLead } from "@/lib/telegram";
import { getLogger } from "@/lib/observability/logger";

const supabase = createServerSupabase();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * Twilio SMS Webhook — receives incoming SMS messages.
 *
 * Twilio sends POST with application/x-www-form-urlencoded:
 * - From: sender phone (E.164)
 * - To: our Twilio number
 * - Body: message text
 * - MessageSid: unique message ID
 * - AccountSid: Twilio account ID
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  const from = params.From || "";
  const body = params.Body || "";
  const messageSid = params.MessageSid || "";
  const accountSid = params.AccountSid || "";

  // Basic validation
  if (!from || !body) {
    return twimlResponse(""); // Empty TwiML = no auto-reply from Twilio
  }

  // Validate webhook origin
  const signature = request.headers.get("x-twilio-signature") || "";
  if (!validateTwilioSignature(request.url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // Find contact in database
  const phoneFormats = [from, from.replace("+", ""), from.replace(/^\+34/, "34")];
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
    channel: "sms",
    direction: "inbound",
    sender: from,
    message: body,
    message_type: "text",
    mode: "auto",
    metadata: {
      twilio_sid: messageSid,
      account_sid: accountSid,
      contact_name: contactName,
      is_new: isNewContact,
    },
  });

  // If new contact, create as lead
  if (isNewContact) {
    const { data: newLead } = await supabase.from("leads").insert({
      name: `SMS ${from}`,
      phone: from,
      source: "sms",
      status: "new",
      score: 2,
      problem: body.length > 10 ? body.slice(0, 200) : null,
    }).select("id").single();

    if (newLead) {
      leadId = newLead.id;

      await notifyHotLead({
        name: `SMS ${from}`,
        score: 2,
        source: "sms",
        problem: body.slice(0, 100),
      });

      logAgentActivity({
        agentId: "sage",
        type: "update",
        title: `Nuevo lead SMS: ${from}`,
        description: `Mensaje: "${body.slice(0, 80)}..."`,
        metadata: { lead_id: leadId, phone: from },
      });
    }
  }

  // Auto-respond with AI
  if (CLAUDE_API_KEY && body.length > 2) {
    const reply = await generateSmsReply(from, body, contactName, contactContext, leadId, clientId);
    if (reply) {
      // Return TwiML with response (immediate reply via Twilio)
      return twimlResponse(reply);
    }
  }

  // No auto-reply
  return twimlResponse("");
}

/**
 * Generate AI reply for incoming SMS using Claude.
 */
async function generateSmsReply(
  phone: string,
  incomingMessage: string,
  contactName: string,
  contactContext: string,
  leadId: string | null,
  clientId: string | null
): Promise<string | null> {
  if (!CLAUDE_API_KEY) return null;

  // Get recent conversation history
  const { data: history } = await supabase
    .from("conversations")
    .select("direction, sender, message, created_at")
    .eq("channel", "sms")
    .or([
      leadId && `lead_id.eq.${leadId}`,
      clientId && `client_id.eq.${clientId}`,
      `sender.eq.${phone}`,
    ].filter(Boolean).join(","))
    .order("created_at", { ascending: false })
    .limit(8);

  const historyText = (history || [])
    .reverse()
    .map((h) => `${h.direction === "inbound" ? contactName : "PACAME"}: ${h.message}`)
    .join("\n");

  const systemPrompt =
    `Eres el asistente SMS de PACAME, una agencia digital con IA en Espana.\n` +
    `Respondes a mensajes SMS de leads y clientes.\n\n` +
    `REGLAS:\n` +
    `- Tutea siempre. Tono directo, cercano.\n` +
    `- Maximo 2 frases. SMS = muy breve.\n` +
    `- Maximo 160 caracteres si es posible (1 segmento SMS).\n` +
    `- Si el contacto tiene un problema, ofrece diagnostico gratuito.\n` +
    `- Si pide precios, da rangos (desde 297€/mes) y ofrece llamar.\n` +
    `- Servicios: webs, SEO, redes sociales, ads, branding, chatbots, automatizaciones.\n` +
    `- No inventes datos. Si no sabes, di que Pablo contactara.\n` +
    `- No uses emojis. SMS no los muestra bien en todos los dispositivos.\n` +
    `- Cierra con CTA: responder SMS, llamar, o visitar pacameagencia.com\n\n` +
    (contactContext ? `CONTEXTO:\n${contactContext}\n\n` : "") +
    (historyText ? `HISTORIAL:\n${historyText}\n\n` : "");

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
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: incomingMessage }],
      }),
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text;

    if (!reply) return null;

    // Save outbound message
    await supabase.from("conversations").insert({
      lead_id: leadId,
      client_id: clientId,
      channel: "sms",
      direction: "outbound",
      sender: "pacame",
      message: reply,
      message_type: "text",
      mode: "auto",
      metadata: { ai_generated: true },
    });

    return reply;
  } catch (err) {
    getLogger().error({ err }, "[SMS] Auto-respond error");
    return null;
  }
}

/**
 * Return a TwiML XML response for Twilio.
 * If message is empty, Twilio won't send a reply.
 */
function twimlResponse(message: string): NextResponse {
  const twiml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
