"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Lightbulb, TrendingUp, Zap, Eye, Target, BarChart3,
  Pencil, Brain, Sparkles, Globe, Heart, Compass, Terminal,
  Layout, CheckCircle2, XCircle, Clock, RefreshCw, Filter,
  ArrowRight, Star,
} from "lucide-react";

const typeConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  trend:              { label: "Tendencia",       color: "#7C3AED", icon: TrendingUp },
  service_idea:       { label: "Nuevo servicio",  color: "#16A34A", icon: Lightbulb },
  technique:          { label: "Tecnica",         color: "#06B6D4", icon: Zap },
  competitor_insight: { label: "Competencia",     color: "#EF4444", icon: Eye },
  optimization:       { label: "Optimizacion",    color: "#F59E0B", icon: Target },
  market_signal:      { label: "Mercado",         color: "#EA580C", icon: BarChart3 },
  content_idea:       { label: "Idea contenido",  color: "#EC4899", icon: Pencil },
};

const impactConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critico",  color: "#EF4444" },
  high:     { label: "Alto",     color: "#F59E0B" },
  medium:   { label: "Medio",    color: "#06B6D4" },
  low:      { label: "Bajo",     color: "#6B7280" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new:          { label: "Nuevo",         color: "#7C3AED" },
  reviewed:     { label: "Revisado",      color: "#06B6D4" },
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
  lens: "#8B5CF6", copy: "#F59E0B", nova: "#7C3AED", pixel: "#06B6D4",
  core: "#16A34A", dios: "#FFFFFF",
};

interface Discovery {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  description: string;
  evidence: string | null;
  impact: string;
  actionable: boolean;
  suggested_action: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  reviewed_at: string | null;
}

export default function DiscoveriesPage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [stats, setStats] = useState({ new: 0, implemented: 0, total: 0 });

  const [tableExists, setTableExists] = useState(true);

  async function fetchDiscoveries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("agent_discoveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error && (error.code === "PGRST205" || error.message?.includes("agent_discoveries"))) {
      setTableExists(false);
      setLoading(false);
      return;
    }

    const all = data || [];
    setDiscoveries(all);
    setStats({
      new: all.filter(d => d.status === "new").length,
      implemented: all.filter(d => d.status === "implemented").length,
      total: all.length,
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchDiscoveries();
    const interval = setInterval(fetchDiscoveries, 60000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from("agent_discoveries").update({
      status: newStatus,
      reviewed_at: newStatus !== "new" ? new Date().toISOString() : null,
    }).eq("id", id);

    setDiscoveries(prev =>
      prev.map(d => d.id === id ? { ...d, status: newStatus, reviewed_at: new Date().toISOString() } : d)
    );
    setStats(prev => ({
      ...prev,
      new: prev.new + (newStatus === "new" ? 1 : -1),
      implemented: prev.implemented + (newStatus === "implemented" ? 1 : 0),
    }));
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
    if (filterType !== "all" && d.type !== filterType) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-electric-violet" />
      </div>
    );
  }

  if (!tableExists) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Descubrimientos</h1>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
          <Lightbulb className="w-12 h-12 text-electric-violet/30 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-lg text-pacame-white mb-2">Tabla pendiente de crear</h2>
          <p className="text-sm text-pacame-white/40 font-body max-w-md mx-auto">
            Ejecuta el SQL de <code className="text-electric-violet/70">infra/migrations/003_agent_discoveries.sql</code> en el Supabase SQL Editor para activar los descubrimientos autonomos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Descubrimientos</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          Tus agentes investigan oportunidades en cada ciclo — revisa y decide que implementar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Nuevos", value: stats.new, color: "#7C3AED", icon: Star },
          { label: "Implementados", value: stats.implemented, color: "#16A34A", icon: CheckCircle2 },
          { label: "Total", value: stats.total, color: "#06B6D4", icon: Lightbulb },
          { label: "Agentes activos", value: new Set(discoveries.map(d => d.agent_id)).size, color: "#F59E0B", icon: Brain },
        ].map(stat => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-dark-card border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-1">
                <StatIcon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="text-xs text-pacame-white/40 font-body">{stat.label}</span>
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
        <Filter className="w-4 h-4 text-pacame-white/30" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-dark-card border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-pacame-white/70 font-body"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(typeConfig).map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-dark-card border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-pacame-white/70 font-body"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(statusConfig).map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
        <span className="text-xs text-pacame-white/30 font-body ml-auto">
          {filtered.length} descubrimiento{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Discovery cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
          <Lightbulb className="w-12 h-12 text-pacame-white/10 mx-auto mb-4" />
          <p className="text-sm text-pacame-white/30 font-body">
            {discoveries.length === 0
              ? "Tus agentes aun no han generado descubrimientos. Se activan en cada ciclo del cron (6:00, 12:00, 18:00 UTC)."
              : "No hay descubrimientos con estos filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const tConf = typeConfig[d.type] || typeConfig.market_signal;
            const iConf = impactConfig[d.impact] || impactConfig.medium;
            const sConf = statusConfig[d.status] || statusConfig.new;
            const TypeIcon = tConf.icon;
            const AgentIcon = agentIcons[d.agent_id] || Brain;
            const agentColor = agentColors[d.agent_id] || "#7C3AED";

            return (
              <div
                key={d.id}
                className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all overflow-hidden"
              >
                <div className="flex items-stretch">
                  {/* Left accent */}
                  <div className="w-1 flex-shrink-0" style={{ backgroundColor: tConf.color }} />

                  <div className="flex-1 p-5">
                    {/* Top row: agent + type + impact + time */}
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

                      <span className="text-[10px] text-pacame-white/20 font-body ml-auto flex-shrink-0">
                        {timeAgo(d.created_at)}
                      </span>
                    </div>

                    {/* Title + description */}
                    <h3 className="font-heading font-bold text-sm text-pacame-white mb-1.5">{d.title}</h3>
                    <p className="text-xs text-pacame-white/60 font-body mb-2">{d.description}</p>

                    {/* Evidence */}
                    {d.evidence && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2 mb-2">
                        <span className="text-[10px] text-pacame-white/30 font-body uppercase tracking-wide">Evidencia</span>
                        <p className="text-[11px] text-pacame-white/50 font-body mt-0.5">{d.evidence}</p>
                      </div>
                    )}

                    {/* Suggested action */}
                    {d.suggested_action && (
                      <div className="flex items-start gap-2 mb-3">
                        <ArrowRight className="w-3 h-3 text-electric-violet mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-electric-violet/80 font-body">{d.suggested_action}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {d.status === "new" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                        <button
                          onClick={() => updateStatus(d.id, "implementing")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-violet/15 text-electric-violet text-[11px] font-heading font-medium hover:bg-electric-violet/25 transition-all"
                        >
                          <Zap className="w-3 h-3" />
                          Implementar
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "reviewed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-pacame-white/50 text-[11px] font-body hover:bg-white/[0.08] transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          Revisar luego
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "dismissed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-pacame-white/20 text-[11px] font-body hover:text-red-400/50 transition-all"
                        >
                          <XCircle className="w-3 h-3" />
                          Descartar
                        </button>
                      </div>
                    )}

                    {d.status === "implementing" && (
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

                    {d.status === "reviewed" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                        <button
                          onClick={() => updateStatus(d.id, "implementing")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-violet/15 text-electric-violet text-[11px] font-heading font-medium hover:bg-electric-violet/25 transition-all"
                        >
                          <Zap className="w-3 h-3" />
                          Implementar
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, "dismissed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-pacame-white/20 text-[11px] font-body hover:text-red-400/50 transition-all"
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
      <div className="rounded-xl bg-dark-card border border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-pacame-white/30" />
          <div>
            <p className="text-xs text-pacame-white/50 font-body">
              <span className="font-medium text-pacame-white/70">Investigacion autonoma:</span>{" "}
              2-3 agentes investigan en cada ciclo (6:00, 12:00, 18:00 UTC). Rotan para cubrir todos los angulos.
            </p>
            <p className="text-[11px] text-pacame-white/30 font-body mt-0.5">
              Los descubrimientos con impacto alto te llegan por Telegram y email en el digest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
