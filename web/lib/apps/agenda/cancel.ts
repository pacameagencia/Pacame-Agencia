/**
 * PACAME Agenda — cancelacion de reservas.
 *
 * - Verifica que el token coincide con el stored en appointments.
 * - Verifica que todavia estamos dentro del margen de cancelacion
 *   (scheduled_at - cancellation_hours del instance.config).
 * - Marca canceled + notifica al duen~o.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { auditLog } from "@/lib/security/audit";

interface AppointmentForCancel {
  id: string;
  booking_number: string;
  instance_id: string;
  client_id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  confirmation_token: string | null;
  customer_name: string | null;
  customer_email: string | null;
  service_id: string | null;
}

interface InstanceRow {
  id: string;
  client_id: string;
  config: Record<string, unknown> | null;
}

function formatES(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: timezone,
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function cancelBooking(
  bookingId: string,
  token: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const log = getLogger({ bookingId });
  const supabase = createServerSupabase();

  const { data: apptRaw } = await supabase
    .from("appointments")
    .select(
      "id, booking_number, instance_id, client_id, scheduled_at, duration_min, status, confirmation_token, customer_name, customer_email, service_id"
    )
    .eq("id", bookingId)
    .maybeSingle();

  const appt = apptRaw as AppointmentForCancel | null;
  if (!appt) {
    return { ok: false, error: "Reserva no encontrada" };
  }

  if (!appt.confirmation_token || appt.confirmation_token !== token) {
    return { ok: false, error: "Token invalido" };
  }

  if (appt.status === "canceled") {
    // Idempotente: ya cancelada.
    return { ok: true };
  }

  if (!["pending", "confirmed"].includes(appt.status)) {
    return {
      ok: false,
      error: `La reserva no se puede cancelar en estado ${appt.status}`,
    };
  }

  // Config del instance para margen de cancelacion.
  const { data: instanceRaw } = await supabase
    .from("app_instances")
    .select("id, client_id, config")
    .eq("id", appt.instance_id)
    .maybeSingle();
  const instance = instanceRaw as InstanceRow | null;
  const config = (instance?.config || {}) as Record<string, unknown>;
  const cancellationHours =
    typeof config.cancellation_hours === "number"
      ? (config.cancellation_hours as number)
      : 24;
  const timezone = (config.timezone as string) || "Europe/Madrid";

  const scheduledMs = new Date(appt.scheduled_at).getTime();
  const limitMs = scheduledMs - cancellationHours * 3600 * 1000;
  if (Date.now() > limitMs) {
    return {
      ok: false,
      error: `Las cancelaciones deben hacerse con al menos ${cancellationHours}h de antelacion`,
    };
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("appointments")
    .update({
      status: "canceled",
      canceled_at: now,
      canceled_by: "customer",
      cancellation_reason: reason?.slice(0, 500) || null,
      updated_at: now,
    })
    .eq("id", bookingId);

  if (updateErr) {
    log.error({ err: updateErr }, "cancel update failed");
    return { ok: false, error: updateErr.message };
  }

  // Notificar al duen~o.
  try {
    const { data: ownerRaw } = await supabase
      .from("clients")
      .select("email, name")
      .eq("id", appt.client_id)
      .maybeSingle();
    const owner = ownerRaw as { email: string | null; name: string | null } | null;

    const fmtWhen = formatES(appt.scheduled_at, timezone);
    const body = [
      `Cancelacion de reserva ${appt.booking_number}.`,
      "",
      `Cliente: ${appt.customer_name || ""} (${appt.customer_email || ""})`,
      `Fecha prevista: ${fmtWhen}`,
      reason ? `\nMotivo: ${reason}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (owner?.email) {
      sendEmail({
        to: owner.email,
        subject: `Reserva cancelada: ${appt.booking_number}`,
        html: wrapEmailTemplate(body),
        tags: [
          { name: "type", value: "agenda_cancellation" },
          { name: "booking_id", value: bookingId },
        ],
      }).catch(() => undefined);
    } else {
      notifyPablo(
        `Agenda: cancelacion ${appt.booking_number}`,
        wrapEmailTemplate(body)
      ).catch(() => undefined);
    }
  } catch (err) {
    log.warn({ err }, "owner notify failed");
  }

  auditLog({
    actor: { type: "client", id: appt.customer_email || null },
    action: "agenda.booking_canceled",
    resource: { type: "appointments", id: bookingId },
    metadata: {
      instance_id: appt.instance_id,
      reason: reason || null,
    },
  }).catch(() => undefined);

  return { ok: true };
}
