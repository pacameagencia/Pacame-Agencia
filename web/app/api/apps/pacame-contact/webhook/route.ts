import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendWhatsApp, markAsRead, isWhatsAppConfigured, WHATSAPP_VERIFY_TOKEN } from "@/lib/whatsapp";
import { llmChat } from "@/lib/llm";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import {
  webhookLimiter,
  isTrustedWebhookSource,
} from "@/lib/security/rate-limit";
import { getLogger } from "@/lib/observability/logger";

/**
 * PACAME Contact — WhatsApp Business API webhook
 *
 * Multi-tenant: matches app_instance by config.whatsapp_phone_id
 * Behavior:
 *   - Logs inbound message in app_messages
 *   - Upserts lead in app_leads
 *   - Generates AI reply with instance config as system prompt
 *   - Escalates to human if intent matches escalate_to_human_on
 *   - Replies via WhatsApp or logs fallback if not configured
 */

export const runtime = "nodejs";

// Meta verification (GET)
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

type AppInstanceConfig = {
  business_name?: string;
  sector?: string;
  business_description?: string;
  opening_hours?: string;
  location?: string;
  faq?: string;
  escalate_to_human_on?: string[];
  tone?: string;
  whatsapp_phone_id?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  if (!value) return NextResponse.json({ ok: true });

  // Status updates — no-op
  if (value.statuses) return NextResponse.json({ ok: true });

  const messages = value.messages;
  if (!messages?.length) return NextResponse.json({ ok: true });

  const supabase = createServerSupabase();
  const phoneNumberId =
    value.metadata?.phone_number_id as string | undefined;

  if (!phoneNumberId) {
    return NextResponse.json({ ok: true });
  }

  // Rate limit 300/min por instance (phoneNumberId). Bypass si la firma
  // x-hub-signature-256 de Meta esta presente (fuente confiable).
  if (!isTrustedWebhookSource(request)) {
    const rl = await webhookLimiter.limit(`wa:${phoneNumberId}`);
    if (!rl.success) {
      const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many requests", retry_after: retrySec },
        { status: 429, headers: { "Retry-After": String(retrySec) } }
      );
    }
  }

  // Match app_instance by config.whatsapp_phone_id
  const { data: instance } = await supabase
    .from("app_instances")
    .select("id, client_id, app_slug, status, config")
    .eq("app_slug", "pacame-contact")
    .eq("config->>whatsapp_phone_id", phoneNumberId)
    .in("status", ["active", "provisioning"])
    .maybeSingle();

  if (!instance) {
    // Unknown phone_number_id — ignore silently (not our tenant)
    return NextResponse.json({ ok: true });
  }

  const config = (instance.config || {}) as AppInstanceConfig;
  const escalateOn = Array.isArray(config.escalate_to_human_on)
    ? (config.escalate_to_human_on as string[])
    : [];
  const contactProfile = value.contacts?.[0]?.profile;
  const contactName = (contactProfile?.name as string | undefined) || null;

  for (const msg of messages) {
    const from = msg.from as string; // "34722669381"
    const msgType = msg.type as string;
    const messageId = msg.id as string;
    let messageText = "";

    if (msgType === "text") {
      messageText = msg.text?.body || "";
    } else if (msgType === "interactive") {
      messageText =
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title ||
        "[interactive]";
    } else {
      messageText = `[${msgType}]`;
    }

    // Mark as read (best-effort)
    try {
      await markAsRead(messageId);
    } catch {
      /* noop */
    }

    // Record inbound
    await supabase.from("app_messages").insert({
      instance_id: instance.id,
      client_id: instance.client_id,
      channel: "whatsapp",
      direction: "inbound",
      contact_phone: from,
      contact_name: contactName,
      message_text: messageText,
      external_id: messageId,
      metadata: { wa_phone_number_id: phoneNumberId },
    });

    // Upsert lead
    const { data: existingLead } = await supabase
      .from("app_leads")
      .select("id")
      .eq("instance_id", instance.id)
      .eq("phone", from)
      .maybeSingle();

    if (existingLead) {
      await supabase
        .from("app_leads")
        .update({
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(contactName ? { name: contactName } : {}),
        })
        .eq("id", existingLead.id);
    } else {
      await supabase.from("app_leads").insert({
        instance_id: instance.id,
        client_id: instance.client_id,
        name: contactName,
        phone: from,
        source: "whatsapp",
        status: "new",
        last_interaction_at: new Date().toISOString(),
      });
    }

    // If instance is still provisioning → no AI response yet
    if (instance.status !== "active") {
      await notifyPablo(
        `PACAME Contact pendiente de setup (instance ${instance.id})`,
        `Llego un mensaje WhatsApp pero la instance no esta activada.`
      );
      continue;
    }

    // Intent detection (quick heuristic via LLM)
    const intent = await detectIntent(messageText);

    // Escalation rule
    if (escalateOn.includes(intent)) {
      await supabase.from("notifications").insert({
        type: "app_escalation",
        priority: "high",
        title: `PACAME Contact escalado (${intent})`,
        message: `${contactName || from}: "${messageText.slice(0, 140)}"`,
        data: {
          instance_id: instance.id,
          client_id: instance.client_id,
          intent,
          phone: from,
        },
      });
      await notifyPablo(
        `Escalacion PACAME Contact: ${intent}`,
        wrapEmailTemplate(
          `El bot WhatsApp ha detectado un mensaje de tipo <strong>${intent}</strong> y lo ha escalado.\n\n` +
            `Cliente: ${instance.client_id}\nInstance: ${instance.id}\nDe: ${contactName || from}\n\n` +
            `Mensaje:\n"${messageText}"`,
          {
            cta: "Ver conversacion",
            ctaUrl: `https://pacameagencia.com/portal/apps/${instance.id}`,
          }
        )
      );
      continue;
    }

    // Build system prompt from config
    const systemPrompt = buildSystemPrompt(config);

    let aiReply = "";
    try {
      const res = await llmChat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageText },
        ],
        { tier: "standard", maxTokens: 400, temperature: 0.7 }
      );
      aiReply = res.content;
    } catch (err) {
      getLogger().error({ err }, "[pacame-contact] LLM error");
    }

    if (!aiReply) {
      continue;
    }

    // Record AI reply in DB always
    await supabase.from("app_messages").insert({
      instance_id: instance.id,
      client_id: instance.client_id,
      channel: "whatsapp",
      direction: "outbound",
      contact_phone: from,
      contact_name: contactName,
      message_text: aiReply,
      ai_generated: true,
      intent,
      handled_by: "ai",
    });

    // Send via WhatsApp
    if (isWhatsAppConfigured()) {
      await sendWhatsApp(from, aiReply);
    } else {
      await notifyPablo(
        `PACAME Contact sin WhatsApp configurado (instance ${instance.id})`,
        `WHATSAPP_PHONE_ID / WHATSAPP_TOKEN no estan definidos. La respuesta IA se registro en DB pero no se envio.`
      );
    }
  }

  return NextResponse.json({ ok: true });
}

function buildSystemPrompt(config: AppInstanceConfig): string {
  const tone = config.tone || "cercano";
  const parts: string[] = [
    `Eres el asistente WhatsApp IA de ${config.business_name || "este negocio"}.`,
    `Sector: ${config.sector || "general"}.`,
    `Tono: ${tone}. Responde en espanol. Maximo 3-4 frases.`,
    "",
    `DESCRIPCION DEL NEGOCIO:`,
    config.business_description || "No especificada.",
  ];

  if (config.opening_hours) {
    parts.push("", `HORARIO: ${config.opening_hours}`);
  }
  if (config.location) {
    parts.push(`UBICACION: ${config.location}`);
  }
  if (config.faq) {
    parts.push("", "FAQ:", config.faq);
  }

  parts.push(
    "",
    "REGLAS:",
    "- Tutea al cliente. Tono cercano y directo.",
    "- Nunca inventes precios, horarios o datos. Si no sabes, di que un humano respondera pronto.",
    "- Si el cliente quiere reservar/citar, pide fecha y hora propuestas.",
    "- No uses emojis excesivos (maximo 1-2 por mensaje)."
  );

  return parts.join("\n");
}

async function detectIntent(text: string): Promise<string> {
  // Fast heuristic first
  const lower = text.toLowerCase();
  if (/reclam|queja|problema|fatal|pesim/.test(lower)) return "complaint";
  if (/cancel/.test(lower)) return "cancellation";
  if (/reserv|cita|agendar/.test(lower)) return "booking";
  if (/presupuest|cotizar|cuanto cuesta|precio especial/.test(lower))
    return "custom_quote";
  if (/compra|pedir|ordenar|quiero comprar/.test(lower)) return "sale_high_value";
  return "info";
}
