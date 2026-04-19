import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { getLogger } from "@/lib/observability/logger";
import { auditLog } from "@/lib/security/audit";

/**
 * GET /api/apps/pacame-agenda/reminders-cron
 *
 * Cron diario (18:00 UTC). Envia recordatorio 24h a customers con
 * appointment pending/confirmed que se celebre entre ahora+23h y ahora+25h
 * y que todavia no hayan recibido el flag '24h' en reminders_sent.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface Row {
  id: string;
  instance_id: string;
  booking_number: string;
  customer_name: string | null;
  customer_email: string | null;
  scheduled_at: string;
  duration_min: number;
  confirmation_token: string | null;
  reminders_sent: string[] | null;
  service_id: string | null;
  status: string;
}

interface InstanceConfig {
  business_name?: string;
  timezone?: string;
}

function formatWhen(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function publicOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://pacameagencia.com"
  );
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const log = getLogger();
  const supabase = createServerSupabase();

  const now = Date.now();
  const windowStart = new Date(now + 23 * 3600 * 1000).toISOString();
  const windowEnd = new Date(now + 25 * 3600 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("appointments")
    .select(
      "id, instance_id, booking_number, customer_name, customer_email, scheduled_at, duration_min, confirmation_token, reminders_sent, service_id, status"
    )
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .limit(200);

  if (error) {
    log.error({ err: error }, "reminders-cron query failed");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates = (rows || []) as Row[];
  let sent = 0;
  let skipped = 0;
  const instanceCache = new Map<string, { config: InstanceConfig }>();
  const serviceCache = new Map<string, { name: string }>();

  for (const appt of candidates) {
    const already = Array.isArray(appt.reminders_sent)
      ? appt.reminders_sent
      : [];
    if (already.includes("24h")) {
      skipped++;
      continue;
    }
    if (!appt.customer_email) {
      skipped++;
      continue;
    }

    // Cargar instance config.
    let inst = instanceCache.get(appt.instance_id);
    if (!inst) {
      const { data: instRow } = await supabase
        .from("app_instances")
        .select("config")
        .eq("id", appt.instance_id)
        .maybeSingle();
      inst = {
        config: ((instRow?.config as InstanceConfig) || {}) as InstanceConfig,
      };
      instanceCache.set(appt.instance_id, inst);
    }

    // Cargar service name (no bloqueante).
    let svcName = "tu cita";
    if (appt.service_id) {
      let cached = serviceCache.get(appt.service_id);
      if (!cached) {
        const { data: svcRow } = await supabase
          .from("agenda_services")
          .select("name")
          .eq("id", appt.service_id)
          .maybeSingle();
        cached = { name: (svcRow?.name as string) || "tu cita" };
        serviceCache.set(appt.service_id, cached);
      }
      svcName = cached.name;
    }

    const tz = inst.config.timezone || "Europe/Madrid";
    const businessName = inst.config.business_name || "tu reserva";
    const when = formatWhen(appt.scheduled_at, tz);
    const firstName = (appt.customer_name || "").split(" ")[0] || "";
    const cancelUrl = appt.confirmation_token
      ? `${publicOrigin()}/a/cancel?id=${appt.id}&token=${appt.confirmation_token}`
      : `${publicOrigin()}/portal`;

    const body = [
      `Hola ${firstName},`,
      "",
      `Te recordamos tu cita en ${businessName}.`,
      "",
      `<strong>Servicio:</strong> ${svcName}`,
      `<strong>Fecha:</strong> ${when}`,
      `<strong>Ref:</strong> ${appt.booking_number}`,
      "",
      "Si necesitas cancelar, usa el enlace de abajo.",
    ].join("\n");

    const emailId = await sendEmail({
      to: appt.customer_email,
      subject: `Recordatorio de tu cita — ${when}`,
      html: wrapEmailTemplate(body, {
        cta: "Cancelar reserva",
        ctaUrl: cancelUrl,
        preheader: `Cita manana: ${svcName}`,
      }),
      tags: [
        { name: "type", value: "agenda_reminder_24h" },
        { name: "booking_id", value: appt.id },
      ],
    });

    if (emailId) {
      const nextSent = [...already, "24h"];
      await supabase
        .from("appointments")
        .update({
          reminders_sent: nextSent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appt.id);
      sent++;
    } else {
      log.warn({ bookingId: appt.id }, "reminder email failed");
      skipped++;
    }
  }

  auditLog({
    actor: { type: "system", id: "agenda-reminders-cron" },
    action: "agenda.reminders_sent",
    metadata: { sent, skipped, total: candidates.length },
    request,
  }).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    window_start: windowStart,
    window_end: windowEnd,
    total: candidates.length,
    sent,
    skipped,
  });
}
