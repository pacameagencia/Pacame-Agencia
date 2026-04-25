"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, Boxes, Recycle, TrendingUp, Zap, Target, ArrowUpRight, RefreshCw } from "lucide-react";

interface SeriesPoint {
  date: string;
  value: number;
}

interface MetricsResponse {
  timestamp: string;
  health: { excellent: boolean; score: number };
  metrics: {
    density: { label: string; value: number; unit: string; target: number; detail: { embedded: number; total: number } };
    learning_speed: { label: string; value: number; weekly: number; avg_confidence: number; series: SeriesPoint[] };
    packaging_time: { label: string; value: number; unit: string; sample: number };
    reuse: { label: string; value: number; reused: number; total: number; by_agent: Record<string, number> };
    marginal: { label: string; value: number; synapse_fires_30d: number; new_memories_30d: number };
  };
  top_discoveries: { title: string; type: string; impact: string; confidence: number; status: string; created_at: string; agent_id: string }[];
  top_synapses: { from_agent: string; to_agent: string; synapse_type: string; weight: number; fire_count: number; success_count: number }[];
}

const AGENT_COLORS: Record<string, string> = {
  dios: "#7C3AED",
  nova: "#B54E30",
  atlas: "#283B70",
  nexus: "#CB6B47",
  pixel: "#374A8C",
  core: "#6B7535",
  pulse: "#E8B730",
  sage: "#9C3E24",
  copy: "#06B6D4",
  lens: "#10B981",
};

export default function FactoriaDashboardPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/neural/factoria-metrics");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-pacame-white/40 font-body">Cargando métricas de la factoría…</div>
      </div>
    );
  }

  const { metrics, health, top_discoveries, top_synapses } = data;
  const maxSeriesValue = Math.max(...metrics.learning_speed.series.map((s) => s.value), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-electric-violet" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/50">
              Factoría · Métricas LENS
            </span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-pacame-white mb-2">
            Estado de la factoría
          </h1>
          <p className="text-pacame-white/50 font-body text-sm">
            5 KPIs Hormozi en tiempo real desde Supabase pgvector. Refresh cada 60s.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-3 border ${health.excellent ? "border-lime-pulse/40 bg-lime-pulse/10" : "border-olympus-gold/30 bg-olympus-gold/5"}`}>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-1">
              Health score
            </span>
            <span className={`font-heading font-bold text-2xl ${health.excellent ? "text-lime-pulse" : "text-olympus-gold"}`}>
              {health.score}<span className="text-base text-pacame-white/30">/100</span>
            </span>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="p-3 border border-white/10 hover:border-electric-violet/40 transition-colors disabled:opacity-50"
            aria-label="Refrescar métricas"
          >
            <RefreshCw className={`w-4 h-4 text-pacame-white/60 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 5 KPIs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={Brain}
          n="01"
          label={metrics.density.label}
          value={metrics.density.value.toFixed(1)}
          unit="%"
          progress={metrics.density.value}
          progressTarget={metrics.density.target}
          subtitle={`${metrics.density.detail.embedded.toLocaleString("es-ES")} de ${metrics.density.detail.total.toLocaleString("es-ES")} embebidos`}
          accent="#06B6D4"
        />
        <KpiCard
          icon={Zap}
          n="02"
          label={metrics.learning_speed.label}
          value={metrics.learning_speed.value.toFixed(1)}
          unit=""
          subtitle={`${metrics.learning_speed.weekly} discoveries / semana × ${(metrics.learning_speed.avg_confidence * 100).toFixed(0)}% confidence`}
          accent="#E8B730"
          chart={
            <Sparkline series={metrics.learning_speed.series} max={maxSeriesValue} accent="#E8B730" />
          }
        />
        <KpiCard
          icon={Boxes}
          n="03"
          label={metrics.packaging_time.label}
          value={metrics.packaging_time.value > 0 ? metrics.packaging_time.value.toFixed(1) : "—"}
          unit={metrics.packaging_time.value > 0 ? "días" : ""}
          subtitle={metrics.packaging_time.sample > 0 ? `Muestra: ${metrics.packaging_time.sample} discoveries` : "Pipeline empaquetado pendiente (FASE C)"}
          accent="#283B70"
          warning={metrics.packaging_time.sample === 0}
        />
        <KpiCard
          icon={Recycle}
          n="04"
          label={metrics.reuse.label}
          value={metrics.reuse.value.toFixed(1)}
          unit="%"
          progress={metrics.reuse.value}
          subtitle={`${metrics.reuse.reused} de ${metrics.reuse.total} memorias re-accedidas`}
          accent="#6B7535"
          warning={metrics.reuse.value < 5}
        />
        <KpiCard
          icon={TrendingUp}
          n="05"
          label={metrics.marginal.label}
          value={metrics.marginal.value.toFixed(2)}
          unit="x"
          subtitle={`${metrics.marginal.synapse_fires_30d} fires vs ${metrics.marginal.new_memories_30d} memorias nuevas (30d)`}
          accent="#B54E30"
        />
      </div>

      {/* Two-column: Top discoveries + Top synapses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top discoveries */}
        <section className="bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-1">
                Top discoveries por impacto
              </span>
              <h2 className="font-heading font-bold text-lg text-pacame-white">Candidatos a empaquetar</h2>
            </div>
            <Target className="w-5 h-5 text-electric-violet" />
          </div>
          <ul className="space-y-3">
            {top_discoveries.map((d, i) => (
              <li
                key={i}
                className="group p-3 border border-white/[0.06] hover:border-electric-violet/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5"
                    style={{
                      backgroundColor: (AGENT_COLORS[d.agent_id] ?? "#888") + "20",
                      color: AGENT_COLORS[d.agent_id] ?? "#888",
                    }}
                  >
                    {d.agent_id?.toUpperCase() ?? "—"}
                  </span>
                  <span
                    className={`font-mono text-[10px] tracking-widest uppercase ${
                      d.impact === "high" ? "text-rose-alert" : d.impact === "medium" ? "text-olympus-gold" : "text-pacame-white/40"
                    }`}
                  >
                    {d.impact}
                  </span>
                </div>
                <p className="font-body text-sm text-pacame-white/85 leading-snug mb-2 line-clamp-2">{d.title}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-pacame-white/40">
                  <span>{d.type}</span>
                  <span>conf. {(d.confidence * 100).toFixed(0)}%</span>
                  <span>{new Date(d.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Top synapses */}
        <section className="bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-1">
                Sinapsis más reforzadas
              </span>
              <h2 className="font-heading font-bold text-lg text-pacame-white">Workflows recurrentes</h2>
            </div>
            <Activity className="w-5 h-5 text-electric-violet" />
          </div>
          <ul className="space-y-2">
            {top_synapses.map((s, i) => {
              const fromColor = AGENT_COLORS[s.from_agent] ?? "#888";
              const toColor = AGENT_COLORS[s.to_agent] ?? "#888";
              const successPct = s.fire_count > 0 ? (s.success_count / s.fire_count) * 100 : 0;
              return (
                <li key={i} className="flex items-center gap-3 p-2 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5"
                      style={{ backgroundColor: fromColor + "20", color: fromColor }}
                    >
                      {s.from_agent.toUpperCase()}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-pacame-white/30" />
                    <span
                      className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5"
                      style={{ backgroundColor: toColor + "20", color: toColor }}
                    >
                      {s.to_agent.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-pacame-white/40 flex-1 truncate">
                    {s.synapse_type}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-pacame-white/60">w {s.weight.toFixed(2)}</span>
                    <span className="text-pacame-white/60">{s.fire_count} fires</span>
                    <span className={successPct >= 90 ? "text-lime-pulse" : "text-olympus-gold"}>
                      {successPct.toFixed(0)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.06] text-[11px] font-mono text-pacame-white/40">
        <span>
          Actualizado · {new Date(data.timestamp).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" })}
        </span>
        <span>
          Fuente · Supabase pgvector + agent_synapses + agent_memories + agent_discoveries
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  n,
  label,
  value,
  unit,
  progress,
  progressTarget = 100,
  subtitle,
  accent,
  warning = false,
  chart,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  n: string;
  label: string;
  value: string;
  unit: string;
  progress?: number;
  progressTarget?: number;
  subtitle: string;
  accent: string;
  warning?: boolean;
  chart?: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-dark-card border ${warning ? "border-rose-alert/30" : "border-white/[0.06]"} p-5 hover:border-white/15 transition-colors flex flex-col`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/40">M·{n}</span>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>

      <h3 className="font-heading font-bold text-sm text-pacame-white/80 mb-2 leading-tight">{label}</h3>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-heading font-bold text-3xl text-pacame-white tabular-nums">{value}</span>
        {unit && <span className="font-mono text-sm text-pacame-white/40">{unit}</span>}
      </div>

      {progress !== undefined && (
        <div className="mb-3">
          <div className="h-1 bg-white/[0.05] overflow-hidden">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, (progress / progressTarget) * 100)}%`,
                backgroundColor: accent,
              }}
            />
          </div>
        </div>
      )}

      {chart && <div className="mb-3">{chart}</div>}

      <p className="text-[11px] font-mono text-pacame-white/40 leading-relaxed mt-auto">{subtitle}</p>
    </div>
  );
}

function Sparkline({ series, max, accent }: { series: SeriesPoint[]; max: number; accent: string }) {
  if (series.length === 0) return null;
  const w = 200;
  const h = 36;
  const stepX = w / (series.length - 1 || 1);
  const points = series.map((p, i) => `${i * stepX},${h - (p.value / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <polyline fill="none" stroke={accent} strokeWidth="1.5" points={points} />
      {series.map((p, i) => (
        <circle key={i} cx={i * stepX} cy={h - (p.value / max) * h} r="1.5" fill={accent} />
      ))}
    </svg>
  );
}
