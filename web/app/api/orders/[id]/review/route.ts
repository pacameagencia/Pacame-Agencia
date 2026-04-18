import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { sendEmail } from "@/lib/resend";
import { escalationLowRating } from "@/lib/email-templates/escalation";
import { ordersLimiter, getClientIp } from "@/lib/security/rate-limit";
import { auditLog } from "@/lib/security/audit";

const PABLO_EMAIL = "hola@pacameagencia.com";

export const dynamic = "force-dynamic";

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional(),
  email: z.string().email().optional(),
});

/**
 * POST /api/orders/[id]/review
 * Cliente deja un rating (1-5) y texto opcional.
 * Si rating < 3 → escalada Telegram.
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
  const parsed = ReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { rating, review_text: reviewTextRaw, email: bodyEmail } = parsed.data;
  const reviewText = reviewTextRaw?.trim() || null;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, order_number, client_id, customer_email, service_slug, status")
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

  const update: Record<string, unknown> = {
    rating,
    review_text: reviewText,
    reviewed_at: new Date().toISOString(),
  };

  if (rating < 3) {
    update.escalated_to_pablo = true;
    update.escalation_reason = `Rating bajo: ${rating}/5${reviewText ? ` — ${reviewText.slice(0, 200)}` : ""}`;
    update.escalated_at = new Date().toISOString();
    update.status = "escalated";
  }

  await supabase.from("orders").update(update).eq("id", id);

  await supabase.from("order_events").insert({
    order_id: id,
    event_type: rating < 3 ? "escalated" : "completed",
    title: `Rating ${rating}/5`,
    message: reviewText || `Cliente valoro el entregable con ${rating}/5`,
    payload: { rating, escalated: rating < 3 },
  });

  // Auditar la review del cliente.
  void auditLog({
    actor: { type: "client", id: client?.id || null },
    action: "order.reviewed",
    resource: { type: "order", id },
    metadata: { rating, escalated: rating < 3 },
    request,
  });

  if (rating < 3) {
    const { data: clientRow } = order.client_id
      ? await supabase
          .from("clients")
          .select("name")
          .eq("id", order.client_id)
          .maybeSingle()
      : { data: null as { name?: string | null } | null };
    const esc = escalationLowRating({
      orderNumber: order.order_number || id,
      clientName: clientRow?.name || order.customer_email || null,
      rating,
      review: reviewText,
      orderUrl: `https://pacameagencia.com/dashboard/orders/${id}`,
    });
    await sendEmail({
      to: PABLO_EMAIL,
      subject: esc.subject,
      html: esc.html,
      tags: [
        { name: "type", value: "escalation_low_rating" },
        { name: "order_id", value: id },
      ],
    });
  }

  return NextResponse.json({ ok: true, escalated: rating < 3 });
}
