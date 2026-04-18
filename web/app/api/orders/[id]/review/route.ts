import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { sendEmail } from "@/lib/resend";
import { escalationLowRating } from "@/lib/email-templates/escalation";

const PABLO_EMAIL = "hola@pacameagencia.com";

export const dynamic = "force-dynamic";

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
  const supabase = createServerSupabase();
  const body = await request.json().catch(() => null);

  const rating = Number(body?.rating);
  const reviewText = (body?.review_text as string | undefined)?.trim() || null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating debe ser un entero entre 1 y 5" },
      { status: 400 }
    );
  }

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
  const fallbackEmail = body?.email as string | undefined;
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
