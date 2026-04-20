/**
 * PACAME Agenda — motor de disponibilidad.
 *
 * Calcula slots libres para un service en un rango de fechas:
 *  - Respeta agenda_hours (horario semanal por weekday 0-6).
 *  - Excluye agenda_closures (cierres puntuales por rango de dias).
 *  - Excluye appointments existentes en estado pending/confirmed,
 *    aplicando los buffers before/after del servicio.
 *  - Genera slots alineados al duration_min del servicio.
 *  - Soporta allow_same_day (default true) desde instance.config.
 *  - Timezone: instance.config.timezone (default Europe/Madrid).
 *    Para no arrastrar una dependencia de zonas horarias, operamos con
 *    strings "YYYY-MM-DD" + offsets aplicados via Intl.DateTimeFormat.
 *
 * La funcion devuelve slots con start/end en ISO UTC (Z), que es lo
 * que espera la UI del widget. El calculo asume que agenda_hours y
 * closures se interpretan en la timezone del negocio.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

export interface Slot {
  start: string; // ISO UTC
  end: string; // ISO UTC
}

interface AgendaHourRow {
  weekday: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_active: boolean;
}

interface ClosureRow {
  from_date: string; // "YYYY-MM-DD"
  to_date: string;
}

interface AppointmentRow {
  scheduled_at: string; // ISO UTC
  duration_min: number;
}

interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  price_cents: number;
  is_active: boolean;
  capacity: number;
}

interface InstanceRow {
  id: string;
  config: Record<string, unknown> | null;
}

/**
 * Devuelve el offset (en minutos) entre UTC y una timezone dada
 * para un instante concreto. Positivo cuando la TZ esta por delante de UTC.
 * Usa Intl.DateTimeFormat para evitar depender de tzdata externas.
 */
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = dtf.formatToParts(date);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || "0");
    // Nota: en en-US, hour 24 puede aparecer como 24 en medianoche; normalizamos.
    let hour = get("hour");
    if (hour === 24) hour = 0;
    const asUTC = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      hour,
      get("minute"),
      get("second")
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/**
 * Construye un Date UTC a partir de una "hora local" (YYYY-MM-DD + HH:MM)
 * en una timezone concreta. Primero asume UTC y luego ajusta el offset.
 */
function localToUTC(dateStr: string, hhmm: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = hhmm.split(":").map((n) => parseInt(n, 10));
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
  // offset del instante naive — aproximacion suficiente para el mismo dia.
  const offset = getTimezoneOffsetMinutes(new Date(naiveUtc), timeZone);
  return new Date(naiveUtc - offset * 60000);
}

/**
 * Devuelve el weekday 0-6 (lunes=1 … domingo=0 en JS; aqui mapeamos 0=domingo,
 * siguiendo postgres DOW estandar).
 */
function weekdayForDate(dateStr: string, timeZone: string): number {
  const base = localToUTC(dateStr, "12:00", timeZone); // mediodia evita ambiguedad DST
  // getUTCDay sobre un instante desplazado a TZ: usamos Intl para ser seguros.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const name = fmt.format(base);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[name] ?? 0;
}

/**
 * Itera fechas ISO (YYYY-MM-DD) de from a to (ambos incluidos).
 */
function* dateRange(from: string, to: string): Generator<string> {
  const [fy, fm, fd] = from.split("-").map((n) => parseInt(n, 10));
  const [ty, tm, td] = to.split("-").map((n) => parseInt(n, 10));
  let cur = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  while (cur <= end) {
    const d = new Date(cur);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    yield `${y}-${m}-${day}`;
    cur += 24 * 3600 * 1000;
  }
}

function isClosed(dateStr: string, closures: ClosureRow[]): boolean {
  return closures.some(
    (c) => dateStr >= c.from_date && dateStr <= c.to_date
  );
}

/**
 * Calcula los slots disponibles en el rango pedido.
 */
export async function getAvailableSlots(
  instanceId: string,
  serviceId: string,
  fromDate: string,
  toDate: string
): Promise<Slot[]> {
  const supabase = createServerSupabase();
  const log = getLogger({ instanceId, serviceId });

  // 1. Cargar instance + service en paralelo.
  const [instanceRes, serviceRes] = await Promise.all([
    supabase
      .from("app_instances")
      .select("id, config")
      .eq("id", instanceId)
      .maybeSingle(),
    supabase
      .from("agenda_services")
      .select(
        "id, slug, name, duration_min, buffer_before_min, buffer_after_min, price_cents, is_active, capacity"
      )
      .eq("id", serviceId)
      .eq("instance_id", instanceId)
      .maybeSingle(),
  ]);

  const instance = instanceRes.data as InstanceRow | null;
  const service = serviceRes.data as ServiceRow | null;
  if (!instance || !service || !service.is_active) {
    log.warn({ hasInstance: !!instance, hasService: !!service }, "availability: missing instance/service");
    return [];
  }

  const config = (instance.config || {}) as Record<string, unknown>;
  const timezone = (config.timezone as string) || "Europe/Madrid";
  const allowSameDay = config.allow_same_day !== false;

  // 2. Cargar horario semanal + cierres + appointments del rango.
  const fromUtc = localToUTC(fromDate, "00:00", timezone).toISOString();
  const toUtc = localToUTC(toDate, "23:59", timezone).toISOString();

  const [hoursRes, closuresRes, apptsRes] = await Promise.all([
    supabase
      .from("agenda_hours")
      .select("weekday, start_time, end_time, is_active")
      .eq("instance_id", instanceId)
      .eq("is_active", true),
    supabase
      .from("agenda_closures")
      .select("from_date, to_date")
      .eq("instance_id", instanceId)
      .lte("from_date", toDate)
      .gte("to_date", fromDate),
    supabase
      .from("appointments")
      .select("scheduled_at, duration_min")
      .eq("instance_id", instanceId)
      .gte("scheduled_at", fromUtc)
      .lte("scheduled_at", toUtc)
      .in("status", ["pending", "confirmed"]),
  ]);

  const hours = (hoursRes.data || []) as AgendaHourRow[];
  const closures = (closuresRes.data || []) as ClosureRow[];
  const appointments = (apptsRes.data || []) as AppointmentRow[];

  if (!hours.length) {
    log.info("availability: no hours configured");
    return [];
  }

  // 3. Generar slots por dia.
  const slots: Slot[] = [];
  const now = Date.now();
  const todayStr = (() => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date());
  })();

  const stepMin = service.duration_min;

  for (const dateStr of dateRange(fromDate, toDate)) {
    if (!allowSameDay && dateStr === todayStr) continue;
    if (isClosed(dateStr, closures)) continue;

    const weekday = weekdayForDate(dateStr, timezone);
    const dayHours = hours.filter((h) => h.weekday === weekday);
    if (!dayHours.length) continue;

    for (const window of dayHours) {
      const [sH, sM] = window.start_time.split(":").map((n) => parseInt(n, 10));
      const [eH, eM] = window.end_time.split(":").map((n) => parseInt(n, 10));
      const startMinTotal = sH * 60 + sM;
      const endMinTotal = eH * 60 + eM;

      for (
        let m = startMinTotal;
        m + stepMin <= endMinTotal;
        m += stepMin
      ) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const slotStart = localToUTC(dateStr, `${hh}:${mm}`, timezone);
        const slotEnd = new Date(slotStart.getTime() + stepMin * 60000);

        // Saltar slots ya pasados.
        if (slotStart.getTime() < now) continue;

        // Bloqueo por appointment existente + buffers.
        const conflict = appointments.some((appt) => {
          const aStart = new Date(appt.scheduled_at).getTime();
          const aEnd = aStart + appt.duration_min * 60000;
          const blockedStart = aStart - service.buffer_before_min * 60000;
          const blockedEnd = aEnd + service.buffer_after_min * 60000;
          return slotStart.getTime() < blockedEnd && slotEnd.getTime() > blockedStart;
        });

        if (conflict) continue;

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
  }

  // Orden cronologico.
  slots.sort((a, b) => a.start.localeCompare(b.start));
  return slots;
}
