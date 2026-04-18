import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { sendEmail } from "@/lib/resend";
import { escalationThirdRevision } from "@/lib/email-templates/escalation";
import { ordersLimiter, getClientIp } from "@/lib/security/rate-limit";
import { getLogger } from "@/lib/observability/logger";

const PABLO_EMAIL = "hola@pacameagencia.com";

export const dynamic = "force-dynamic";

const NEGATIVE_KEYWORDS =
  /\b(no me gusta|horrible|cancelar|devolver|refund|reembolso|malisimo|malo|no sirve|pesimo|terrible|lo odio|hate)\b/i;

const RevisionSchema = z.object({
  feedback: z.string().min(10).max(2000),
  email: z.string().email().optional(),
});

/**
 * POST /api/orders/[id]/revision
 * Cliente solicita revision con feedback.
 * Si revision_number >= 3 → trigger SQL escala automaticamente.
 * Si feedback tiene keywords muy negativas → escalada inmediata.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit
  const ip = getClientIp(request);
  const rl = await ordersLimiter.limit(`${ip}:${id}`);
  if (!rl.success) {
    const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests", retry_after: retrySec },
      { status: 429, headers: { "Retry-After": String(retrySec) } }
    );
  }

  const supabase = createServerSupabase();
  const raw = await request.json().catch(() => null);
  const parsed = RevisionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { feedback: feedbackRaw, email: bodyEmail } = parsed.data;
  const feedback = feedbackRaw.trim();

  if (feedback.length < 10) {
    return NextResponse.json(
      { error: "Necesitamos al menos 10 caracteres de feedback para revisar." },
      { status: 400 }
    );
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, order_number, client_id, customer_email, status, service_slug")
    .eq("id", id)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const client = await getAuthedClient(request);
  const authedByClient = client && order.client_id === client.id;
  const fallbackEmail = bodyEmail;
  const authedByEmail =
    fallbackEmail &&
    order.customer_email &&
    fallbackEmail.toLowerCase() === order.customer_email.toLowerCase();

  if (!authedByClient && !authedByEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count existing revisions
  const { count } = await supabase
    .from("delivery_revisions")
    .select("id", { count: "exact", head: true })
    .eq("order_id", id);

  const nextRevision = (count || 0) + 1;
  const hasNegativeKeywords = NEGATIVE_KEYWORDS.test(feedback);

  const sentiment: "negative" | "neutral" = hasNegativeKeywords ? "negative" : "neutral";

  // Insert — DB trigger will escalate if revision_number >= 3
  const { data: revision, error: revErr } = await supabase
    .from("delivery_revisions")
    .insert({
      order_id: id,
      revision_number: nextRevision,
      requested_by: client?.id || null,
      feedback,
      feedback_sentiment: sentiment,
      status: "pending",
    })
    .select("id")
    .single();

  if (revErr) {
    return NextResponse.json({ error: revErr.message }, { status: 500 });
  }

  // Update order status
  await supabase
    .from("orders")
    .update({ status: "revision_requested" })
    .eq("id", id);

  await supabase.from("order_events").insert({
    order_id: id,
    event_type: "revision_requested",
    title: `Revision #${nextRevision}`,
    message: feedback.slice(0, 300),
    payload: { revision_id: revision?.id, sentiment },
  });

  // If negative keywords or >= 3 revisions → extra alert to Pablo
  if (hasNegativeKeywords || nextRevision >= 3) {
    const { data: clientRow } = order.client_id
      ? await supabase
          .from("clients")
          .select("name")
          .eq("id", order.client_id)
          .maybeSingle()
      : { data: null as { name?: string | null } | null };
    const esc = escalationThirdRevision({
      orderNumber: order.order_number || id,
      clientName: clientRow?.name || order.customer_email || null,
      feedback,
      orderUrl: `https://pacameagencia.com/dashboard/orders/${id}`,
    });
    await sendEmail({
      to: PABLO_EMAIL,
      subject: esc.subject,
      html: esc.html,
      tags: [
        { name: "type", value: "escalation_third_revision" },
        { name: "order_id", value: id },
      ],
    });
  }

  // If revision <3, re-dispatch delivery to regenerate
  if (nextRevision < 3) {
    const origin = request.nextUrl.origin;
    const cronSecret = process.env.CRON_SECRET;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cronSecret) headers.Authorization = `Bearer ${cronSecret}`;
    // Fire-and-forget
    fetch(`${origin}/api/deliveries/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({ order_id: id, revision: nextRevision, feedback }),
    }).catch((err) => {
      getLogger().error({ err }, "[orders/revision] re-dispatch failed");
    });
  }

  return NextResponse.json({
    ok: true,
    revision_number: nextRevision,
    escalated: hasNegativeKeywords || nextRevision >= 3,
  });
}
