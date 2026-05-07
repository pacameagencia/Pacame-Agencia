/**
 * Webhook Resend → actualiza prospect_leads en tiempo real.
 *
 * Configurar en panel Resend:
 *   URL: https://pacameagencia.com/api/webhooks/resend (o Vercel preview)
 *   Events: email.sent, email.delivered, email.delivery_delayed,
 *           email.bounced, email.complained, email.opened, email.clicked
 *   Signing secret: RESEND_WEBHOOK_SECRET en .env.local
 *
 * Spec: https://resend.com/docs/dashboard/webhooks/introduction
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    click?: { link?: string; ipAddress?: string; userAgent?: string };
    bounce?: { type?: string; subType?: string; message?: string };
    tags?: Array<{ name: string; value: string }>;
  };
}

/**
 * Verify Svix-style signature. Resend usa el formato Svix:
 *   svix-id: msg_xxx
 *   svix-timestamp: <unix seconds>
 *   svix-signature: v1,<base64-hmac> v1,<base64-hmac>
 *
 * Probamos contra TODOS los secrets configurados (una cuenta puede tener varios webhooks).
 */
function verifySvix(rawBody: string, headers: Headers, secrets: string[]): boolean {
  const svixId = headers.get("svix-id");
  const svixTs = headers.get("svix-timestamp");
  const svixSig = headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) return false;
  const signedContent = `${svixId}.${svixTs}.${rawBody}`;

  // svixSig puede contener varias firmas separadas por espacios: "v1,sig1 v1,sig2"
  const provided = svixSig
    .split(" ")
    .map((p) => p.split(",")[1])
    .filter(Boolean);
  if (provided.length === 0) return false;

  for (const secret of secrets) {
    // Strip "whsec_" prefix antes de decodificar base64
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const hmac = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
    for (const sig of provided) {
      try {
        const a = Buffer.from(hmac, "base64");
        const b = Buffer.from(sig, "base64");
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
      } catch {
        // ignore mismatched lengths
      }
    }
  }
  return false;
}

function getConfiguredSecrets(): string[] {
  const list = process.env.RESEND_WEBHOOK_SECRETS || process.env.RESEND_WEBHOOK_SECRET || "";
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secrets = getConfiguredSecrets();

  // Si hay secrets configurados, verificamos. Si no hay (dev/test), aceptamos cualquier POST.
  if (secrets.length > 0 && !verifySvix(rawBody, req.headers, secrets)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sb = createServerSupabase();
  const messageId = event.data?.email_id;
  const slug = event.data?.tags?.find((t) => t.name === "lead_slug")?.value;
  const occurred = event.created_at || new Date().toISOString();
  const eventType = event.type || "unknown";

  // Buscar lead por message_id o slug
  let leadId: string | null = null;
  if (messageId) {
    const { data } = await sb.from("prospect_leads").select("id").eq("resend_message_id", messageId).maybeSingle();
    leadId = data?.id ?? null;
  }
  if (!leadId && slug) {
    const { data } = await sb.from("prospect_leads").select("id").eq("slug", slug).maybeSingle();
    leadId = data?.id ?? null;
  }

  // Append event
  await sb.from("email_events").insert({
    lead_id: leadId,
    resend_message_id: messageId,
    event_type: eventType,
    occurred_at: occurred,
    raw: event,
    user_agent: event.data?.click?.userAgent ?? null,
    ip: event.data?.click?.ipAddress ?? null,
    link_url: event.data?.click?.link ?? null,
    bounce_type: event.data?.bounce?.type ?? null,
    bounce_reason: event.data?.bounce?.message ?? null,
  });

  // Update lead state según tipo de evento
  if (leadId) {
    const updates: Record<string, unknown> = {};
    switch (eventType) {
      case "email.sent":
        updates.status = "sent";
        updates.sent_at = occurred;
        break;
      case "email.delivered":
        updates.status = "delivered";
        updates.delivered_at = occurred;
        break;
      case "email.opened":
        updates.last_opened_at = occurred;
        // first_opened_at solo si era null
        const { data: cur } = await sb
          .from("prospect_leads")
          .select("first_opened_at, open_count, status")
          .eq("id", leadId)
          .single();
        updates.first_opened_at = cur?.first_opened_at ?? occurred;
        updates.open_count = (cur?.open_count ?? 0) + 1;
        if (cur?.status !== "clicked" && cur?.status !== "replied" && cur?.status !== "won") {
          updates.status = "opened";
        }
        break;
      case "email.clicked": {
        updates.last_clicked_at = occurred;
        const { data: cur } = await sb
          .from("prospect_leads")
          .select("first_clicked_at, click_count, status")
          .eq("id", leadId)
          .single();
        updates.first_clicked_at = cur?.first_clicked_at ?? occurred;
        updates.click_count = (cur?.click_count ?? 0) + 1;
        if (cur?.status !== "replied" && cur?.status !== "won") {
          updates.status = "clicked";
        }
        break;
      }
      case "email.bounced":
        updates.status = "bounced";
        updates.bounced_at = occurred;
        updates.bounce_reason = event.data?.bounce?.message ?? null;
        break;
      case "email.complained":
        updates.status = "complained";
        updates.complained_at = occurred;
        break;
    }
    if (Object.keys(updates).length > 0) {
      await sb.from("prospect_leads").update(updates).eq("id", leadId);
    }
  }

  return NextResponse.json({ ok: true, lead_id: leadId, event_type: eventType });
}

// GET: info para debugging
export async function GET() {
  return NextResponse.json({
    status: "ready",
    accepts: "Resend webhook events",
    docs: "https://resend.com/docs/dashboard/webhooks/introduction",
  });
}
