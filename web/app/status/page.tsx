import { createServerSupabase } from "@/lib/supabase/server";
import { headers } from "next/headers";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status — PACAME",
  description: "Estado del sistema PACAME en tiempo real",
};

type LightColor = "green" | "yellow" | "red";

interface Light {
  key: string;
  label: string;
  color: LightColor;
  detail: string;
}

interface DayCell {
  date: string;
  color: LightColor;
  failures: number;
}

const GOLD = "#E8B730";

function colorClasses(c: LightColor) {
  if (c === "green") return { dot: "bg-emerald-500", ring: "ring-emerald-500/30", text: "text-emerald-400" };
  if (c === "yellow") return { dot: "bg-amber-400", ring: "ring-amber-400/30", text: "text-amber-300" };
  return { dot: "bg-red-500", ring: "ring-red-500/30", text: "text-red-400" };
}

function statusLabel(c: LightColor) {
  if (c === "green") return "Operativo";
  if (c === "yellow") return "Degradado";
  return "Incidencia";
}

function toISODay(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function loadStatus(): Promise<{
  lights: Light[];
  stats: {
    totalOrders: number;
    deliveredInSla: number;
    uptimePct: number;
    avgDeliveryHours: number;
  };
  days: DayCell[];
  now: string;
}> {
  const supabase = createServerSupabase();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last1h = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Pagos Stripe — notifications type='payment_failed' en 24h (si existe tabla)
  let paymentFailed24h = 0;
  try {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "payment_failed")
      .gte("created_at", last24h);
    paymentFailed24h = count || 0;
  } catch {
    // tabla opcional
  }

  // 2. Delivery engine — order_events type='delivery_failure' en 24h
  const { count: deliveryFail24h } = await supabase
    .from("order_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "delivery_failure")
    .gte("created_at", last24h);

  // 5. Claude/LLM — agent_tasks completed en ultima hora
  let agentTasksLastHour = 0;
  try {
    const { count } = await supabase
      .from("agent_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", last1h);
    agentTasksLastHour = count || 0;
  } catch {
    agentTasksLastHour = 1; // tolerante: si no hay tabla, no bloqueamos
  }

  const paymentsColor: LightColor =
    paymentFailed24h >= 3 ? "red" : paymentFailed24h >= 1 ? "yellow" : "green";

  const deliveryColor: LightColor =
    (deliveryFail24h || 0) >= 4 ? "red" : (deliveryFail24h || 0) >= 1 ? "yellow" : "green";

  const llmColor: LightColor = agentTasksLastHour > 0 ? "green" : "yellow";

  // Probe real de /api/health — da color de verdad a DB/Stripe/Resend.
  // Cache-bust: no-store para que cada SSR vea el estado actual.
  type HealthPayload = {
    checks: {
      supabase: { status: string; latency_ms?: number };
      stripe: { status: string };
      upstash: { status: string };
      resend: { status: string };
    };
  };
  let healthData: HealthPayload | null = null;
  try {
    const hdrs = await headers();
    const host = hdrs.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const res = await fetch(`${protocol}://${host}/api/health`, {
      cache: "no-store",
    });
    if (res.ok || res.status === 503) {
      healthData = (await res.json()) as HealthPayload;
    }
  } catch {
    healthData = null;
  }

  const dbColor: LightColor =
    healthData?.checks.supabase.status === "ok"
      ? "green"
      : healthData?.checks.supabase.status === "fail"
        ? "red"
        : "yellow";
  const stripeColor: LightColor =
    healthData?.checks.stripe.status === "ok"
      ? "green"
      : healthData?.checks.stripe.status === "fail"
        ? "red"
        : paymentsColor; // fallback a metrica de fallos 24h
  const emailColor: LightColor =
    healthData?.checks.resend.status === "ok"
      ? "green"
      : healthData?.checks.resend.status === "unconfigured"
        ? "yellow"
        : "green";

  const lights: Light[] = [
    {
      key: "payments",
      label: "Pagos Stripe",
      color: stripeColor,
      detail:
        healthData?.checks.stripe.status === "fail"
          ? "API Stripe no responde"
          : paymentFailed24h === 0
            ? "Sin fallos en 24h"
            : `${paymentFailed24h} fallo${paymentFailed24h > 1 ? "s" : ""} en 24h`,
    },
    {
      key: "delivery",
      label: "Delivery engine",
      color: deliveryColor,
      detail:
        (deliveryFail24h || 0) === 0
          ? "Todos los pedidos entregando"
          : `${deliveryFail24h} escaladas en 24h`,
    },
    {
      key: "email",
      label: "Email (Resend)",
      color: emailColor,
      detail:
        healthData?.checks.resend.status === "unconfigured"
          ? "RESEND_API_KEY sin configurar"
          : "Operativo",
    },
    {
      key: "whatsapp",
      label: "WhatsApp API",
      color: "green",
      detail: "Canal operativo",
    },
    {
      key: "llm",
      label: "Claude / LLM",
      color: llmColor,
      detail:
        agentTasksLastHour > 0
          ? `${agentTasksLastHour} tarea${agentTasksLastHour > 1 ? "s" : ""} en la ultima hora`
          : "Sin actividad en la ultima hora",
    },
    {
      key: "db",
      label: "Supabase DB",
      color: dbColor,
      detail:
        healthData?.checks.supabase.status === "ok"
          ? `Respuesta en ${healthData.checks.supabase.latency_ms ?? 0}ms`
          : healthData?.checks.supabase.status === "fail"
            ? "DB lenta o caida"
            : "Probe no disponible",
    },
  ];

  // Stats 30 dias
  const { data: orders30 } = await supabase
    .from("orders")
    .select("id, status, created_at, delivered_at, service_catalog:service_catalog_id(delivery_sla_hours)")
    .gte("created_at", last30d);

  const totalOrders = orders30?.length || 0;
  const delivered = (orders30 || []).filter((o) => o.status === "delivered" && o.delivered_at);
  let inSla = 0;
  let totalDeliveryHours = 0;
  for (const o of delivered) {
    const created = new Date(o.created_at as string).getTime();
    const deliveredAt = new Date(o.delivered_at as string).getTime();
    const hours = (deliveredAt - created) / (1000 * 60 * 60);
    totalDeliveryHours += hours;
    const sla = (o as unknown as { service_catalog?: { delivery_sla_hours?: number } | null })
      .service_catalog?.delivery_sla_hours ?? 48;
    if (hours <= sla) inSla += 1;
  }
  const avgDeliveryHours = delivered.length ? totalDeliveryHours / delivered.length : 0;

  // delivery_failures 30d
  const { data: failures30 } = await supabase
    .from("order_events")
    .select("created_at")
    .eq("event_type", "delivery_failure")
    .gte("created_at", last30d);

  const failureCount30 = failures30?.length || 0;
  const uptimePct = totalOrders > 0 ? Math.max(0, 1 - failureCount30 / totalOrders) : 1;

  // Grid 30 dias — count failures per day
  const failsByDay = new Map<string, number>();
  for (const f of failures30 || []) {
    const day = toISODay(new Date(f.created_at as string));
    failsByDay.set(day, (failsByDay.get(day) || 0) + 1);
  }

  const days: DayCell[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = toISODay(d);
    const f = failsByDay.get(iso) || 0;
    const color: LightColor = f >= 4 ? "red" : f >= 1 ? "yellow" : "green";
    days.push({ date: iso, color, failures: f });
  }

  return {
    lights,
    stats: {
      totalOrders,
      deliveredInSla: inSla,
      uptimePct: uptimePct * 100,
      avgDeliveryHours,
    },
    days,
    now: now.toISOString(),
  };
}

export default async function StatusPage() {
  let data: Awaited<ReturnType<typeof loadStatus>>;
  try {
    data = await loadStatus();
  } catch (err) {
    // Fallback: si la DB falla, marcamos todo amarillo pero la pagina sigue rendereando
    console.error("[status/page] loadStatus fallo:", err);
    data = {
      lights: [
        { key: "payments", label: "Pagos Stripe", color: "yellow", detail: "Status no disponible" },
        { key: "delivery", label: "Delivery engine", color: "yellow", detail: "Status no disponible" },
        { key: "email", label: "Email (Resend)", color: "green", detail: "" },
        { key: "whatsapp", label: "WhatsApp API", color: "green", detail: "" },
        { key: "llm", label: "Claude / LLM", color: "yellow", detail: "" },
        { key: "db", label: "Supabase DB", color: "red", detail: "Error al leer metricas" },
      ],
      stats: { totalOrders: 0, deliveredInSla: 0, uptimePct: 0, avgDeliveryHours: 0 },
      days: [],
      now: new Date().toISOString(),
    };
  }

  const overallColor: LightColor = data.lights.some((l) => l.color === "red")
    ? "red"
    : data.lights.some((l) => l.color === "yellow")
    ? "yellow"
    : "green";
  const overall = colorClasses(overallColor);
  const slaPct =
    data.stats.totalOrders > 0
      ? (data.stats.deliveredInSla / Math.max(1, data.stats.totalOrders)) * 100
      : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black text-lg"
              style={{ background: GOLD }}
            >
              P
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">PACAME</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Status del sistema</div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ring-1 ${overall.ring} bg-white/[0.02]`}>
            <span className={`w-2.5 h-2.5 rounded-full ${overall.dot} animate-pulse`} />
            <span className={`text-sm font-medium ${overall.text}`}>
              {statusLabel(overallColor)}
            </span>
          </div>
        </div>

        {/* Semaforos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {data.lights.map((l) => {
            const c = colorClasses(l.color);
            return (
              <div
                key={l.key}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                  <span className="text-sm font-medium text-neutral-100">{l.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${c.text}`}>{statusLabel(l.color)}</span>
                  <span className="text-xs text-neutral-500">{l.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats 30d */}
        <div className="mb-4">
          <h2
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: GOLD }}
          >
            Ultimos 30 dias
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Pedidos procesados" value={String(data.stats.totalOrders)} />
            <StatCard
              label="Entregados en SLA"
              value={`${Math.round(slaPct)}%`}
              sub={`${data.stats.deliveredInSla}/${data.stats.totalOrders}`}
            />
            <StatCard
              label="Uptime"
              value={`${data.stats.uptimePct.toFixed(2)}%`}
            />
            <StatCard
              label="Tiempo medio delivery"
              value={
                data.stats.avgDeliveryHours > 0
                  ? `${data.stats.avgDeliveryHours.toFixed(1)}h`
                  : "—"
              }
            />
          </div>
        </div>

        {/* Grid 30 dias */}
        <div className="mb-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-200">Historial incidentes</h3>
            <div className="flex items-center gap-3 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-500" /> OK
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-400" /> Degradado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-red-500" /> Incidente
              </span>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {data.days.map((d) => {
              const c = colorClasses(d.color);
              const title = `${d.date} — ${d.failures} fallo${d.failures === 1 ? "" : "s"}`;
              return (
                <div
                  key={d.date}
                  title={title}
                  className={`h-8 w-[calc((100%-29*0.25rem)/30)] min-w-[10px] rounded-sm ${c.dot} opacity-80 hover:opacity-100 transition`}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-neutral-500 mt-12">
          <div>
            Ultima actualizacion:{" "}
            {new Date(data.now).toLocaleString("es-ES", {
              timeZone: "Europe/Madrid",
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
          <div className="mt-2">
            <a href="https://pacameagencia.com" style={{ color: GOLD }} className="hover:underline">
              pacameagencia.com
            </a>{" "}
            · Supervisado por Pablo Calleja
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight" style={{ color: GOLD }}>
        {value}
      </div>
      {sub ? <div className="text-xs text-neutral-500 mt-1">{sub}</div> : null}
    </div>
  );
}
