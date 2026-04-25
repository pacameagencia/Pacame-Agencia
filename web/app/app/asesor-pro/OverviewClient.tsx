"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Users, FileText, Receipt, Bell, Kanban, AlertTriangle, Sparkles } from "lucide-react";
import type { DashboardStats, AsesorAlert, AsesorClient } from "@/lib/products/asesor-pro/queries";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

interface Props {
  user: { full_name: string | null; email: string };
  stats: DashboardStats;
  alerts: AsesorAlert[];
  recentClients: AsesorClient[];
}

export default function OverviewClient({ user, stats, alerts, recentClients }: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 13) return "Buenos días";
    if (h < 21) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          AsesorPro · Resumen
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          {greeting}, <span style={{ color: "#283B70" }}>{(user.full_name ?? user.email).split(" ")[0]}</span>.
        </h1>
        <p className="font-sans text-ink-soft text-[15px] mt-2">
          {stats.alerts_unread > 0
            ? `Tienes ${stats.alerts_unread} alerta${stats.alerts_unread === 1 ? "" : "s"} por revisar.`
            : "Todo en orden. Sin alertas pendientes."}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Clientes activos"
          value={String(stats.clients_active)}
          sub={`${stats.clients_invited} invitaciones pendientes`}
          icon={Users}
          accent="#283B70"
          href="/app/asesor-pro/clientes"
        />
        <KpiCard
          label="Facturado este mes"
          value={eur(stats.total_billed_cents_month)}
          sub={`${stats.invoices_this_month} facturas emitidas`}
          icon={FileText}
          accent="#B54E30"
          href="/app/asesor-pro/facturas"
        />
        <KpiCard
          label="Pendiente revisar"
          value={String(stats.invoices_pending_review + stats.expenses_pending_review)}
          sub={`${stats.invoices_pending_review} facturas · ${stats.expenses_pending_review} gastos`}
          icon={Receipt}
          accent="#E8B730"
          href="/app/asesor-pro/facturas"
          warning={stats.invoices_pending_review + stats.expenses_pending_review > 5}
        />
        <KpiCard
          label="Pipeline abierto"
          value={String(stats.pipeline_open)}
          sub="tarjetas sin cerrar"
          icon={Kanban}
          accent="#6B7535"
          href="/app/asesor-pro/pipeline"
        />
      </div>

      {/* Two-column: alerts + recent clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas */}
        <section className="lg:col-span-2 bg-paper border-2 border-ink p-6" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/15">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-ink" />
              <h2 className="font-display text-ink text-xl" style={{ fontWeight: 500 }}>Alertas</h2>
            </div>
            {alerts.length > 0 && (
              <Link
                href="/app/asesor-pro/alertas"
                className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hover:text-terracotta-500"
              >
                Ver todas →
              </Link>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-ink-mute/40 mb-3" />
              <p className="font-sans text-ink-mute text-sm">Todo tranquilo. Sin alertas por revisar.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 border-l-2 ${
                    a.severity === "urgent"
                      ? "border-rose-alert bg-rose-alert/5"
                      : a.severity === "warning"
                      ? "border-mustard-500 bg-mustard-500/5"
                      : "border-indigo-600 bg-indigo-600/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {a.severity !== "info" && <AlertTriangle className="w-3 h-3 text-ink-mute" />}
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                          {a.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="font-sans text-ink text-[14px] font-medium">{a.title}</p>
                      {a.message && <p className="font-sans text-ink-soft text-[13px] mt-1">{a.message}</p>}
                    </div>
                    <span className="font-mono text-[10px] text-ink-mute whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent clients */}
        <section className="bg-paper border-2 border-ink p-6" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/15">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-ink" />
              <h2 className="font-display text-ink text-xl" style={{ fontWeight: 500 }}>Recientes</h2>
            </div>
            <Link
              href="/app/asesor-pro/clientes"
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hover:text-terracotta-500"
            >
              Ver →
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-sans text-ink-mute text-sm mb-4">Aún no tienes clientes.</p>
              <Link
                href="/app/asesor-pro/clientes/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper text-[13px] font-sans hover:bg-terracotta-500 transition-colors"
              >
                Añadir cliente
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/asesor-pro/clientes/${c.id}`}
                  className="block p-3 hover:bg-sand-100 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-sans text-ink text-[14px] font-medium truncate group-hover:text-terracotta-500">
                        {c.fiscal_name}
                      </p>
                      <p className="font-mono text-[10px] tracking-[0.1em] text-ink-mute mt-0.5">{c.nif}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
  warning,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  href: string;
  warning?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-paper border-2 ${warning ? "border-rose-alert" : "border-ink"} p-5 group hover:-translate-y-0.5 transition-transform`}
      style={{ boxShadow: warning ? "5px 5px 0 #B54E30" : "5px 5px 0 #1A1813" }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <ArrowUpRight className="w-3.5 h-3.5 text-ink-mute group-hover:text-terracotta-500 transition-colors" />
      </div>
      <div
        className="font-display text-ink mb-1 tabular-nums"
        style={{ fontSize: "1.875rem", lineHeight: "1", letterSpacing: "-0.02em", fontWeight: 500 }}
      >
        {value}
      </div>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink block">
        {label}
      </span>
      <span className="font-mono text-[11px] text-ink-mute block mt-2">{sub}</span>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: "bg-olive-500/20 text-olive-600", label: "activo" },
    invited: { color: "bg-mustard-500/20 text-mustard-700", label: "invitado" },
    paused: { color: "bg-ink-mute/20 text-ink-mute", label: "pausa" },
    archived: { color: "bg-rose-alert/20 text-rose-alert", label: "archivado" },
  };
  const cfg = map[status] ?? map.paused;
  return (
    <span className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
