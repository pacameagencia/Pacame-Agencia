import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/apps/pacame-agenda/bookings/[id]
 * Owner (cliente PACAME) cambia status de una reserva.
 * Body: { status: 'confirmed'|'canceled'|'no_show'|'completed' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const newStatus = body.status as string;
  if (!["confirmed", "canceled", "no_show", "completed"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: booking } = await supabase
    .from("appointments")
    .select("id, client_id, customer_email, customer_name, scheduled_at, booking_number, status")
    .eq("id", id)
    .eq("client_id", client.id)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "canceled") {
    update.canceled_at = new Date().toISOString();
    update.canceled_by = "owner";
    update.cancellation_reason = (body.reason as string) || null;
  }

  const { error } = await supabase.from("appointments").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificar al customer si aplica
  if (["confirmed", "canceled"].includes(newStatus)) {
    const when = new Date(booking.scheduled_at as string).toLocaleString("es-ES", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    const subject =
      newStatus === "confirmed"
        ? `Confirmada tu reserva ${booking.booking_number}`
        : `Cancelada tu reserva ${booking.booking_number}`;
    const reason = (body.reason as string | undefined) || null;
    const emailBody =
      newStatus === "confirmed"
        ? `Hola ${booking.customer_name},\n\nTu reserva para el ${when} esta CONFIRMADA.\n\nReferencia: ${booking.booking_number}\n\nGracias!`
        : `Hola ${booking.customer_name},\n\nLamentablemente tu reserva del ${when} ha sido cancelada.\n\n${reason ? `Motivo: ${reason}` : "Contactanos para reagendar."}`;
    sendEmail({
      to: booking.customer_email as string,
      subject,
      html: wrapEmailTemplate(emailBody, { preheader: subject }),
      tags: [
        { name: "type", value: "agenda_booking_status" },
        { name: "status", value: newStatus },
      ],
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
