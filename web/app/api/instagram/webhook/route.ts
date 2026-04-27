import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendInstagramDM, INSTAGRAM_VERIFY_TOKEN, isConfigured } from "@/lib/instagram";
import { notifyHotLead } from "@/lib/telegram";
import { llmChat } from "@/lib/llm";
import { pabloPersonaSystem, qualifyIntent } from "@/lib/pablo-persona";

const supabase = createServerSupabase();

/**
 * Instagram Webhook
 *
 * GET  â€” Meta verification challenge
 * POST â€” Incoming DMs + comment mentions
 */

// --- Meta webhook verification ---
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === INSTAGRAM_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// --- Incoming messages & comments ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Instagram webhooks follow the same Meta structure as WhatsApp
  const entry = body.entry?.[0];
  if (!entry) {
    return NextResponse.json({ ok: true });
  }

  // Handle messaging (DMs)
  const messaging = entry.messaging;
  if (messaging?.length) {
    for (const event of messaging) {
      await handleDirectMessage(event);
    }
  }

  // Handle comment changes
  const changes = entry.changes;
  if (changes?.length) {
    for (const change of changes) {
      if (change.field === "comments") {
        await handleComment(change.value);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// â”€â”€â”€ DM Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{ type: string; payload: { url: string } }>;
  };
}

async function handleDirectMessage(event: MessagingEvent) {
  const senderId = event.sender.id;
  const message = event.message;

  if (!message) return;

  const messageText = message.text || `[${message.attachments?.[0]?.type || "media"}]`;
  const messageId = message.mid;

  // Check if we know this contact
  let leadId: string | null = null;
  let contactName = "Instagram User";

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, business_name, problem, sector, score")
    .or(`metadata->>instagram_id.eq.${senderId},source.eq.instagram`)
    .limit(1);

  if (leads?.length) {
    leadId = leads[0].id;
    contactName = leads[0].name;
  }

  // Save incoming message
  await supabase.from("conversations").insert({
    lead_id: leadId,
    channel: "instagram",
    direction: "inbound",
    sender: senderId,
    message: messageText,
    message_type: message.attachments?.length ? "media" : "text",
    mode: "auto",
    metadata: {
      ig_message_id: messageId,
      timestamp: event.timestamp,
      contact_name: contactName,
    },
  });

  // Create lead if new
  if (!leadId) {
    const { data: newLead } = await supabase
      .from("leads")
      .insert({
        name: `Instagram ${senderId.slice(-6)}`,
        source: "instagram",
        status: "new",
        score: 3,
        problem: messageText.length > 10 ? messageText.slice(0, 200) : null,
        metadata: { instagram_id: senderId },
      })
      .select("id")
      .single();

    if (newLead) {
      leadId = newLead.id;

      await notifyHotLead({
        name: `DM Instagram`,
        score: 3,
        source: "instagram",
        problem: messageText.slice(0, 100),
      });

      logAgentActivity({
        agentId: "sage",
        type: "update",
        title: `Nuevo lead Instagram DM`,
        description: `Mensaje: "${messageText.slice(0, 80)}..."`,
        metadata: { lead_id: leadId, ig_sender: senderId },
      });
    }
  }

  // Auto-respond with AI (Nebius economy â†’ Claude fallback)
  if (isConfigured() && messageText.length > 2) {
    await autoRespondDM(senderId, messageText, contactName, leadId);
  }
}

// â”€â”€â”€ Comment Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CommentValue {
  id: string;
  text: string;
  from: { id: string; username: string };
  media: { id: string };
}

async function handleComment(value: CommentValue) {
  const { id: commentId, text, from } = value;

  // Log the comment
  await supabase.from("conversations").insert({
    channel: "instagram",
    direction: "inbound",
    sender: from.username,
    message: text,
    message_type: "comment",
    mode: "auto",
    metadata: {
      ig_comment_id: commentId,
      ig_media_id: value.media?.id,
      ig_username: from.username,
    },
  });

  logAgentActivity({
    agentId: "pulse",
    type: "update",
    title: `Comentario IG de @${from.username}`,
    description: `"${text.slice(0, 100)}"`,
    metadata: { comment_id: commentId },
  });
}

// â”€â”€â”€ AI Auto-Response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function autoRespondDM(
  recipientId: string,
  incomingMessage: string,
  contactName: string,
  leadId: string | null
) {
  // Get conversation history
  const { data: history } = await supabase
    .from("conversations")
    .select("direction, sender, message, created_at")
    .eq("channel", "instagram")
    .eq("sender", recipientId)
    .order("created_at", { ascending: false })
    .limit(10);

  const historyText = (history || [])
    .reverse()
    .map((h) => `${h.direction === "inbound" ? contactName : "Pablo"}: ${h.message}`)
    .join("\n");

  const qualified = qualifyIntent(incomingMessage);

  // Persistir intent en lead.metadata si lo detectamos con confianza alta
  if (leadId && qualified.confidence >= 0.8 && qualified.intent !== "unknown") {
    await supabase
      .from("leads")
      .update({
        metadata: {
          instagram_id: recipientId,
          intent: qualified.intent,
          intent_signal: qualified.signal,
          qualified_at: new Date().toISOString(),
        },
      })
      .eq("id", leadId);

    logAgentActivity({
      agentId: "sage",
      type: "update",
      title: `Lead IG cualificado · intent=${qualified.intent}`,
      description: `Señal: "${qualified.signal}" · mensaje: "${incomingMessage.slice(0, 80)}"`,
      metadata: { lead_id: leadId, intent: qualified.intent, channel: "instagram" },
    });
  }

  const systemPrompt = pabloPersonaSystem({
    channel: "instagram",
    qualified,
    contactName,
    history: historyText,
  });

  try {
    const res = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: incomingMessage },
      ],
      { tier: "standard", maxTokens: 220, agentId: "pulse", source: "instagram-dm-pablo" }
    );

    if (!res.content) return;

    // Small delay for natural feel
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2500));

    const result = await sendInstagramDM(recipientId, res.content);

    if (result.success) {
      await supabase.from("conversations").insert({
        lead_id: leadId,
        channel: "instagram",
        direction: "outbound",
        sender: "pacame",
        message: res.content,
        message_type: "text",
        mode: "auto",
        metadata: { ig_message_id: result.messageId, ai_generated: true, provider: res.provider },
      });
    }
  } catch (err) {
    console.error("[Instagram] Auto-respond error:", err);
  }
}
