import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import {
  sendWhatsApp,
  sendWhatsAppTemplate,
  sendLeadWelcome,
  sendProposalNotification,
  sendLeadFollowup,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

const supabase = createServerSupabase();

/**
 * WhatsApp Business API Route
 *
 * Actions:
 * - send: Send a text message to a phone number
 * - send_template: Send a pre-approved template message
 * - welcome_lead: Send welcome message to new lead
 * - send_proposal: Notify lead about their proposal
 * - followup: Send followup to inactive lead
 * - status: Check if WhatsApp is configured
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Check configuration ---
  if (action === "status") {
    return NextResponse.json({
      configured: isWhatsAppConfigured(),
      phone_id: process.env.WHATSAPP_PHONE_ID ? "set" : "missing",
      token: process.env.WHATSAPP_TOKEN ? "set" : "missing",
    });
  }

  // --- Send a text message ---
  if (action === "send") {
    const { phone, message, lead_id, client_id } = body;
    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message required" }, { status: 400 });
    }

    const result = await sendWhatsApp(phone, message);

    // Save to conversations table
    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: lead_id || null,
        client_id: client_id || null,
        channel: "whatsapp",
        direction: "outbound",
        sender: "pacame",
        message,
        message_type: "text",
        mode: "auto",
        metadata: { wa_message_id: result.message_id },
      });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message_id: result.message_id });
  }

  // --- Send a template message ---
  if (action === "send_template") {
    const { phone, template_name, language, parameters, lead_id, client_id } = body;
    if (!phone || !template_name) {
      return NextResponse.json({ error: "phone and template_name required" }, { status: 400 });
    }

    const result = await sendWhatsAppTemplate(phone, template_name, language, parameters);

    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: lead_id || null,
        client_id: client_id || null,
        channel: "whatsapp",
        direction: "outbound",
        sender: "pacame",
        message: `[Template: ${template_name}]`,
        message_type: "template",
        mode: "auto",
        metadata: { wa_message_id: result.message_id, template: template_name, parameters },
      });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message_id: result.message_id });
  }

  // --- Welcome a new lead ---
  if (action === "welcome_lead") {
    const { lead_id } = body;
    if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone, email")
      .eq("id", lead_id)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (!lead.phone) return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 });

    const result = await sendLeadWelcome(lead.phone, lead.name || "amigo");

    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: lead.id,
        channel: "whatsapp",
        direction: "outbound",
        sender: "pacame",
        message: "[Welcome message]",
        message_type: "text",
        mode: "auto",
        metadata: { wa_message_id: result.message_id, type: "welcome" },
      });

      logAgentActivity({
        agentId: "sage",
        type: "update",
        title: `WhatsApp bienvenida: ${lead.name}`,
        description: `Mensaje de bienvenida enviado a ${lead.phone}.`,
        metadata: { lead_id, wa_message_id: result.message_id },
      });
    }

    return NextResponse.json({ ok: result.success, message_id: result.message_id, error: result.error });
  }

  // --- Send proposal notification ---
  if (action === "send_proposal") {
    const { lead_id, proposal_id } = body;
    if (!lead_id || !proposal_id) {
      return NextResponse.json({ error: "lead_id and proposal_id required" }, { status: 400 });
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone")
      .eq("id", lead_id)
      .single();

    if (!lead?.phone) {
      return NextResponse.json({ error: "Lead has no phone" }, { status: 400 });
    }

    const proposalUrl = `https://pacameagencia.com/propuesta/${proposal_id}`;
    const result = await sendProposalNotification(lead.phone, lead.name || "cliente", proposalUrl);

    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: lead.id,
        channel: "whatsapp",
        direction: "outbound",
        sender: "pacame",
        message: `[Proposal notification: ${proposalUrl}]`,
        message_type: "text",
        mode: "auto",
        metadata: { wa_message_id: result.message_id, type: "proposal", proposal_id },
      });

      logAgentActivity({
        agentId: "sage",
        type: "delivery",
        title: `Propuesta enviada por WhatsApp: ${lead.name}`,
        description: `Notificacion de propuesta ${proposal_id} enviada a ${lead.phone}.`,
        metadata: { lead_id, proposal_id, wa_message_id: result.message_id },
      });
    }

    return NextResponse.json({ ok: result.success, message_id: result.message_id, error: result.error });
  }

  // --- Follow up inactive lead ---
  if (action === "followup") {
    const { lead_id, context } = body;
    if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone, business_name, problem")
      .eq("id", lead_id)
      .single();

    if (!lead?.phone) {
      return NextResponse.json({ error: "Lead has no phone" }, { status: 400 });
    }

    const followupContext = context ||
      (lead.problem
        ? `Vi que mencionaste un reto con ${lead.problem.toLowerCase()}.`
        : `Hace unos dias hablamos sobre como mejorar la presencia digital de ${lead.business_name || "tu negocio"}.`);

    const result = await sendLeadFollowup(lead.phone, lead.name || "amigo", followupContext);

    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: lead.id,
        channel: "whatsapp",
        direction: "outbound",
        sender: "pacame",
        message: `[Followup: ${followupContext}]`,
        message_type: "text",
        mode: "auto",
        metadata: { wa_message_id: result.message_id, type: "followup" },
      });
    }

    return NextResponse.json({ ok: result.success, message_id: result.message_id, error: result.error });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
