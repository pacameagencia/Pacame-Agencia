"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import {
  Lightbulb, TrendingUp, Zap, Eye, Target, BarChart3,
  Pencil, Brain, Sparkles, Globe, Heart, Compass, Terminal,
  Layout, CheckCircle2, XCircle, Clock, RefreshCw, Filter,
  ArrowRight, Star,
} from "lucide-react";

const typeConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  trend:              { label: "Tendencia",       color: "#B54E30", icon: TrendingUp },
  service_idea:       { label: "Nuevo servicio",  color: "#16A34A", icon: Lightbulb },
  technique:          { label: "Tecnica",         color: "#283B70", icon: Zap },
  competitor_insight: { label: "Competencia",     color: "#EF4444", icon: Eye },
  optimization:       { label: "Optimizacion",    color: "#F59E0B", icon: Target },
  market_signal:      { label: "Mercado",         color: "#EA580C", icon: BarChart3 },
  content_idea:       { label: "Idea contenido",  color: "#EC4899", icon: Pencil },
};

const impactConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critico",  color: "#EF4444" },
  high:     { label: "Alto",     color: "#F59E0B" },
  medium:   { label: "Medio",    color: "#283B70" },
  low:      { label: "Bajo",     color: "#6B7280" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new:          { label: "Nuevo",         color: "#B54E30" },
  reviewed:     { label: "Revisado",      color: "#283B70" },
  implementing: { label: "Implementando", color: "#F59E0B" },
  implemented:  { label: "Implementado",  color: "#16A34A" },
  dismissed:    { label: "Descartado",    color: "#6B7280" },
};

const agentIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  sage: Compass, atlas: Globe, pulse: Heart, nexus: TrendingUp,
  lens: BarChart3, copy: Pencil, nova: Sparkles, pixel: Layout,
  core: Terminal, dios: Brain,
};

const agentColors: Record<string, string> = {
  sage: "#D97706", atlas: "#2563EB", pulse: "#EC4899", nexus: "#EA580C",
  lens: "#8B5CF6", copy: "#F59E0B", nova: "#B54E30", pixel: "#283B70",
  core: "#16A34A", dios: "#FFFFFF",
};

interface DiscoveryActivity {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function getMeta(d: DiscoveryActivity, key: string): string {
  return String((d.metadata as Record<string, unknown>)?.[key] || "");
}

export default function DiscoveriesPage() {
  const [discoveries, setDiscoveries] = useState<DiscoveryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  async function fetchDiscoveries() {
    setLoading(true);
    const { data } = await supabase
      .from("agent_activities")
      .select("*")
      .eq("type", "insight").eq("metadata->>is_discovery", "true")
      .order("created_at", { ascending: false })
      .limit(100);

    setDiscoveries(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDiscoveries();
    const interval = setInterval(fetchDiscoveries, 60000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, newStatus: string) {
    const discovery = discoveries.find(d => d.id === id);
    if (!discovery) return;

    const currentMeta = (discovery.metadata as Record<string, unknown>) || {};

    await dbCall({
      table: "agent_activities",
      op: "update",
      data: {
        metadata: {
          ...currentMeta,
          discovery_status: newStatus,
          reviewed_at: newStatus !== "new" ? new Date().toISOString() : null,
        },
      },
      filter: { column: "id", value: id },
    });

    setDiscoveries(prev =>
      prev.map(d => d.id === id ? {
        ...d,
        metadata: { ...currentMeta, discovery_status: newStatus, reviewed_at: new Date().toISOString() },
      } : d)
    );
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return "hace " + mins + "m";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return "hace " + hours + "h";
    return "hace " + Math.floor(hours / 24) + "d";
  }

  const filtered = discoveries.filter(d => {
    const dType = getMeta(d, "discovery_type");
    const dStatus = getMeta(d, "discovery_status") || "new";
    if (filterType !== "all" && dType !== filterType) return false;
    if (filterStatus !== "all" && dStatus !== filterStatus) return false;
    return true;
  });

  const stats = {
    new: discoveries.filter(d => !getMeta(d, "discovery_status") || getMeta(d, "discovery_status") === "new").length,
    implemented: discoveries.filter(d => getMeta(d, "discovery_status") === "implemented").length,
    total: discoveries.length,
    agents: new Set(discoveries.map(d => d.agent_id)).size,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-ink">Descubrimientos</h1>
        <p className="text-sm text-ink/40 font-body mt-1">
          Tus agentes investigan oportunidades en cada ciclo — revisa y decide que implementar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Nuevos", value: stats.new, color: "#B54E30", icon: Star },
          { label: "Implementados", value: stats.implemented, color: "#16A34A", icon: CheckCircle2 },
          { label: "Total", value: stats.total, color: "#283B70", icon: Lightbulb },
          { label: "Agentes activos", value: stats.agents, color: "#F59E0B", icon: Brain },
        ].map(stat => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
              <div className="flex items-center gap-2 mb-1">
                <StatIcon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="text-xs text-ink/40 font-body">{stat.label}</span>
              </div>
              <div className="font-heading font-bold text-xl" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-ink/30" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-paper-deep border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-ink/70 font-body"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(typeConfig).map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-paper-deep border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-ink/70 font-body"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(statusConfig).map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
        <span className="text-xs text-ink/30 font-body ml-auto">
          {filtered.length} descubrimiento{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Discovery cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
          <Lightbulb className="w-12 h-12 text-ink/10 mx-auto mb-4" />
          <p className="text-sm text-ink/30 font-body">
            {discoveries.length === 0
              ? "Tus agentes aun no han generado descubrimientos. Se activan en cada ciclo del cron (6:00, 12:00, 18:00 UTC)."
              : "No hay descubrimientos con estos filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const dType = getMeta(d, "discovery_type") || "market_signal";
            const dImpact = getMeta(d, "impact") || "medium";
            const dStatus = getMeta(d, "discovery_status") || "new";
            const dEvidence = getMeta(d, "evidence");
            const dAction = getMeta(d, "suggested_action");

            const tConf = typeConfig[dType] || typeConfig.market_signal;
            const iConf = impactConfig[dImpact] || impactConfig.medium;
            const sConf = statusConfig[dStatus] || statusConfig.new;
            const TypeIcon = tConf.icon;
            const AgentIcon = agentIcons[d.agent_id] || Brain;
            const agentColor = agentColors[d.agent_id] || "#B54E30";

            return (
              <div
                key={d.id}
                className="rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 transition-all overflow-hidden"
              >
                <div className="flex items-stretch">
                  {/* Left accent */}
                  <div className="w-1 flex-shrink-0" style={{ backgroundColor: tConf.color }} />

                  <div className="flex-1 p-5">
                    {/* Top row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: agentColor + "20" }}
                      >
                        <AgentIcon className="w-3.5 h-3.5" style={{ color: agentColor }} />
                      </div>
                      <span className="text-[10px] font-heading font-bold" style={{ color: agentColor }}>
                        {d.agent_id.toUpperCase()}
                      </span>

                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: tConf.color + "15" }}>
                        <TypeIcon className="w-3 h-3" style={{ color: tConf.color }} />
                        <span className="text-[10px] font-body" style={{ color: tConf.color }}>{tConf.label}</span>
                      </div>

                      <span
                        className="text-[10px] font-body font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: iConf.color + "15", color: iConf.color }}
                      >
                        {iConf.label}
                      </span>

                      <span
                        className="text-[10px] font-body px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: sConf.color + "15", color: sConf.color }}
                      >
                        {sConf.label}
                      </span>

                      <span className="text-[10px] text-ink/20 font-body ml-auto flex-shrink-0">
                        {timeAgo(d.created_at)}
                      </span>
                    </div>

                    {/* Title + description */}
                    <h3 className="font-heading font-bold text-sm text-ink mb-1.5">{d.title}</h3>
                    <p className="text-xs text-ink/60 font-body mb-2">{d.description}</p>

                    {/* Evidence */}
                    {dEvidence && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2 mb-2">
                        <span className="text-[10px] text-ink/30 font-body uppercase tracking-wide">Evidencia</span>
                        <p className="text-[11px] text-ink/50 font-body mt-0.5">{dEvidence}</p>
                      </div>
                    )}

                    {/* Suggested action */}
                    {dAction && (
                      <div className="flex items-start gap-2 mb-3">
                        <ArrowRight className="w-3 h-3 text-brand-primary mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-brand-primary/80 font-body">{dAction}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {dStatus === "new" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                        <button
                          onClick={() => updateStatus(d.id, "implementing")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/15 text-brand-primary text-[11px] font-heading font-medium hover:bg-brand-primary/25 transition-all"
                        >
                          <Zap className="w-3 h-3" />
                          Implementar
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "reviewed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-ink/50 text-[11px] font-body hover:bg-white/[0.08] transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          Revisar luego
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "dismissed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink/20 text-[11px] font-body hover:text-red-400/50 transition-all"
                        >
                          <XCircle className="w-3 h-3" />
                          Descartar
                        </button>
                      </div>
                    )}

                    {dStatus === "implementing" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                        <button
                          onClick={() => updateStatus(d.id, "implemented")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-[11px] font-heading font-medium hover:bg-green-500/25 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Marcar completado
                        </button>
                      </div>
                    )}

                    {dStatus === "reviewed" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                        <button
                          onClick={() => updateStatus(d.id, "implementing")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/15 text-brand-primary text-[11px] font-heading font-medium hover:bg-brand-primary/25 transition-all"
                        >
                          <Zap className="w-3 h-3" />
                          Implementar
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "dismissed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink/20 text-[11px] font-body hover:text-red-400/50 transition-all"
                        >
                          <XCircle className="w-3 h-3" />
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-ink/30" />
          <div>
            <p className="text-xs text-ink/50 font-body">
              <span className="font-medium text-ink/70">Investigacion autonoma:</span>{" "}
              2-3 agentes investigan en cada ciclo (6:00, 12:00, 18:00 UTC). Rotan para cubrir todos los angulos.
            </p>
            <p className="text-[11px] text-ink/30 font-body mt-0.5">
              Los descubrimientos con impacto alto te llegan por Telegram y email en el digest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
