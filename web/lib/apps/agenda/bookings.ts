/**
 * PACAME Agenda — creacion de reservas.
 *
 * Flujo createBooking:
 *   1. Carga instance + service (service.slug + instance_id).
 *   2. Verifica que el slot sigue disponible (usa getAvailableSlots para ese dia).
 *   3. Genera confirmation_token aleatorio (24 bytes hex).
 *   4. Determina status inicial segun config.booking_confirmation_mode.
 *   5. Inserta appointment.
 *   6. Envia emails (customer + duen~o via notifyPablo/cliente si hay email).
 *   7. audit_log action 'agenda.booking_created'.
 */

import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { auditLog } from "@/lib/security/audit";
import { getAvailableSlots } from "./availability";

export interface CreateBookingInput {
  instanceId: string;
  serviceSlug: string;
  scheduledAt: string; // ISO UTC
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  source?: string;
  utmParams?: Record<string, string>;
}

export interface CreateBookingResult {
  ok: boolean;
  booking?: {
    id: string;
    booking_number: string;
    confirmation_token: string;
    status: string;
    scheduled_at: string;
  };
  error?: string;
}

interface InstanceRow {
  id: string;
  client_id: string;
  config: Record<string, unknown> | null;
}

interface ClientRow {
  id: string;
  email: string | null;
  name: string | null;
}

interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  duration_min: number;
  price_cents: number;
  is_active: boolean;
}

function formatDateTimeES(iso: string, timezone: string): string {
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

function extractDateKey(iso: string, timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(iso));
}

function publicOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://pacameagencia.com"
  );
}

export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const log = getLogger({ instanceId: input.instanceId, serviceSlug: input.serviceSlug });
  const supabase = createServerSupabase();

  try {
    // 1. Instance + service.
    const { data: instanceRaw } = await supabase
      .from("app_instances")
      .select("id, client_id, config, status, app_slug")
      .eq("id", input.instanceId)
      .maybeSingle();

    const instance = instanceRaw as (InstanceRow & { status: string; app_slug: string }) | null;
    if (!instance) {
      return { ok: false, error: "Instance no encontrada" };
    }
    if (instance.app_slug !== "pacame-agenda") {
      return { ok: false, error: "Instance no es de pacame-agenda" };
    }
    if (instance.status !== "active") {
      return { ok: false, error: "La agenda no esta activa todavia" };
    }

    const { data: serviceRaw } = await supabase
      .from("agenda_services")
      .select("id, slug, name, duration_min, price_cents, is_active")
      .eq("instance_id", input.instanceId)
      .eq("slug", input.serviceSlug)
      .maybeSingle();

    const service = serviceRaw as ServiceRow | null;
    if (!service) {
      return { ok: false, error: "Servicio no encontrado" };
    }
    if (!service.is_active) {
      return { ok: false, error: "Servicio no disponible" };
    }

    const config = (instance.config || {}) as Record<string, unknown>;
    const timezone = (config.timezone as string) || "Europe/Madrid";
    const confirmationMode =
      (config.booking_confirmation_mode as string) === "auto" ? "auto" : "manual";
    const businessName = (config.business_name as string) || "tu reserva";

    // 2. Re-verificar disponibilidad. Tomamos una ventana del dia.
    const dateKey = extractDateKey(input.scheduledAt, timezone);
    const slots = await getAvailableSlots(
      input.instanceId,
      service.id,
      dateKey,
      dateKey
    );

    const requestedStartMs = new Date(input.scheduledAt).getTime();
    if (Number.isNaN(requestedStartMs)) {
      return { ok: false, error: "scheduled_at invalido" };
    }
    const match = slots.find(
      (s) => new Date(s.start).getTime() === requestedStartMs
    );
    if (!match) {
      return { ok: false, error: "El horario solicitado ya no esta disponible" };
    }

    // 3. Token de confirmacion.
    const confirmationToken = crypto.randomBytes(24).toString("hex");

    // 4. Status inicial.
    const status = confirmationMode === "auto" ? "confirmed" : "pending";

    // 5. Insertar appointment.
    const { data: inserted, error: insertErr } = await supabase
      .from("appointments")
      .insert({
        instance_id: input.instanceId,
        client_id: instance.client_id,
        service_id: service.id,
        customer_name: input.customer.name.slice(0, 160),
        customer_email: input.customer.email.toLowerCase().slice(0, 200),
        customer_phone: input.customer.phone?.slice(0, 40) || null,
        customer_notes: input.customer.notes?.slice(0, 2000) || null,
        scheduled_at: new Date(input.scheduledAt).toISOString(),
        duration_min: service.duration_min,
        status,
        confirmation_token: confirmationToken,
        reminders_sent: [],
        source: input.source || "widget",
        metadata: {
          utm: input.utmParams || {},
          service_slug: service.slug,
          service_name: service.name,
          price_cents: service.price_cents,
        },
      })
      .select("id, booking_number, confirmation_token, status, scheduled_at")
      .single();

    if (insertErr || !inserted) {
      log.error({ err: insertErr }, "booking insert failed");
      return {
        ok: false,
        error: insertErr?.message || "No se pudo crear la reserva",
      };
    }

    const bookingId = inserted.id as string;
    const bookingNumber = inserted.booking_number as string;

    // 6. Emails.
    const fmtWhen = formatDateTimeES(input.scheduledAt, timezone);
    const origin = publicOrigin();
    const cancelUrl = `${origin}/a/cancel?id=${bookingId}&token=${confirmationToken}`;

    const customerSubject =
      status === "confirmed"
        ? `Reserva confirmada — ${service.name}`
        : `Reserva recibida — ${service.name}`;

    const customerBody = [
      `Hola ${input.customer.name.split(" ")[0] || ""},`,
      "",
      status === "confirmed"
        ? `Tu reserva para ${businessName} ha sido confirmada.`
        : `Hemos recibido tu solicitud de reserva para ${businessName}. Te confirmaremos en breve.`,
      "",
      `<strong>Servicio:</strong> ${service.name}`,
      `<strong>Fecha:</strong> ${fmtWhen}`,
      `<strong>Duracion:</strong> ${service.duration_min} min`,
      `<strong>Ref:</strong> ${bookingNumber}`,
      "",
      "Si necesitas cancelar, usa el enlace de abajo.",
    ].join("\n");

    sendEmail({
      to: input.customer.email,
      subject: customerSubject,
      html: wrapEmailTemplate(customerBody, {
        cta: "Cancelar reserva",
        ctaUrl: cancelUrl,
        preheader: `${service.name} — ${fmtWhen}`,
      }),
      tags: [
        { name: "type", value: "agenda_booking" },
        { name: "booking_id", value: bookingId },
      ],
    }).catch(() => undefined);

    // Notificacion al duen~o (cliente PACAME). Buscamos email.
    const { data: ownerRaw } = await supabase
      .from("clients")
      .select("id, email, name")
      .eq("id", instance.client_id)
      .maybeSingle();
    const owner = ownerRaw as ClientRow | null;

    const ownerBody = [
      `Nueva reserva (${status}) para ${businessName}.`,
      "",
      `Cliente: ${input.customer.name} (${input.customer.email})`,
      input.customer.phone ? `Telefono: ${input.customer.phone}` : "",
      "",
      `Servicio: ${service.name}`,
      `Fecha: ${fmtWhen}`,
      `Ref: ${bookingNumber}`,
      input.customer.notes ? `\nNotas: ${input.customer.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (owner?.email) {
      sendEmail({
        to: owner.email,
        subject: `Nueva reserva: ${service.name} — ${fmtWhen}`,
        html: wrapEmailTemplate(ownerBody, {
          cta: "Ver agenda",
          ctaUrl: `${origin}/portal/apps/${input.instanceId}`,
          preheader: `Reserva ${bookingNumber}`,
        }),
        tags: [
          { name: "type", value: "agenda_owner_alert" },
          { name: "booking_id", value: bookingId },
        ],
      }).catch(() => undefined);
    } else {
      // Sin email de cliente PACAME — fallback a Pablo.
      notifyPablo(
        `Agenda: nueva reserva ${bookingNumber}`,
        wrapEmailTemplate(ownerBody)
      ).catch(() => undefined);
    }

    // 7. Audit log (best-effort).
    auditLog({
      actor: { type: "system", id: "agenda-widget" },
      action: "agenda.booking_created",
      resource: { type: "appointments", id: bookingId },
      metadata: {
        instance_id: input.instanceId,
        service_slug: service.slug,
        status,
        source: input.source || "widget",
      },
    }).catch(() => undefined);

    return {
      ok: true,
      booking: {
        id: bookingId,
        booking_number: bookingNumber,
        confirmation_token: confirmationToken,
        status,
        scheduled_at: inserted.scheduled_at as string,
      },
    };
  } catch (err) {
    log.error({ err }, "createBooking exception");
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error interno",
    };
  }
}
