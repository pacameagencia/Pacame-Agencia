"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  Pencil, BarChart3, Brain, CheckCircle2, XCircle, DollarSign,
  Activity, Zap, Clock, RefreshCw, Play,
} from "lucide-react";

const agentMeta: Record<string, {
  role: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  specialty: string;
}> = {
  dios:  { role: "Orquestador del Sistema", icon: Brain,      color: "#FFFFFF", specialty: "Coordina los 9 agentes, auditoria semanal" },
  nova:  { role: "Directora Creativa",      icon: Sparkles,   color: "#7C3AED", specialty: "Modera resenas, auditoria de marca" },
  atlas: { role: "Estratega SEO",           icon: Globe,      color: "#2563EB", specialty: "Genera blog posts, audita 1600 paginas SEO" },
  nexus: { role: "Head of Growth",          icon: TrendingUp, color: "#EA580C", specialty: "Nurturing automatico, analiza campanas" },
  pixel: { role: "Lead Frontend",           icon: Layout,     color: "#06B6D4", specialty: "Health checks web, detecta caidas" },
  core:  { role: "Arquitecto Backend",      icon: Terminal,   color: "#16A34A", specialty: "Monitoriza Supabase, Claude API, alertas" },
  pulse: { role: "Head of Social Media",    icon: Heart,      color: "#EC4899", specialty: "Genera y publica contenido RRSS" },
  sage:  { role: "Chief Strategy Officer",  icon: Compass,    color: "#D97706", specialty: "Cualifica leads, genera propuestas, followups" },
  copy:  { role: "Head of Copywriting",     icon: Pencil,     color: "#F59E0B", specialty: "Mejora copy, genera scripts de ads" },
  lens:  { role: "Head of Analytics",       icon: BarChart3,  color: "#8B5CF6", specialty: "KPIs, deteccion anomalias, insights IA" },
};

const statusConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
  working:   { label: "Trabajando",  color: "#84CC16", pulse: true },
  idle:      { label: "Disponible",  color: "#06B6D4", pulse: false },
  reviewing: { label: "Revisando",   color: "#F59E0B", pulse: true },
  waiting:   { label: "En espera",   color: "#D97706", pulse: false },
  offline:   { label: "Offline",     color: "#6B7280", pulse: false },
};

interface AgentState {
  agent_id: string;
  status: string;
  current_task: string | null;
  tasks_today: number;
  tasks_completed: number;
  active_hours: number;
  last_activity: string;
}

interface RecentActivity {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

export default function AgentsPage() {
  const [states, setStates] = useState<AgentState[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringCron, setTriggeringCron] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [statesRes, activitiesRes] = await Promise.all([
        supabase.from("agent_states").select("*").order("agent_id"),
        supabase.from("agent_activities").select("id, agent_id, type, title, description, created_at").order("created_at", { ascending: false }).limit(100),
      ]);

      setStates(statesRes.data || []);
      setActivities(activitiesRes.data || []);
      setLoading(false);
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  function getState(agentId: string): AgentState | null {
    return states.find((s) => s.agent_id === agentId) || null;
  }

  function getAgentActivities(agentId: string): RecentActivity[] {
    return activities.filter((a) => a.agent_id === agentId).slice(0, 5);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }

  async function triggerCron() {
    setTriggeringCron(true);
    try {
      await fetch("/api/agents/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // Refresh data after cron
      const [statesRes, activitiesRes] = await Promise.all([
        supabase.from("agent_states").select("*").order("agent_id"),
        supabase.from("agent_activities").select("id, agent_id, type, title, description, created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      setStates(statesRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch {
      // silently fail
    } finally {
      setTriggeringCron(false);
    }
  }

  const agentIds = Object.keys(agentMeta);
  const workingCount = states.filter((s) => s.status === "working").length;
  const totalTasksToday = states.reduce((sum, s) => sum + (s.tasks_today || 0), 0);
  const totalCompleted = states.reduce((sum, s) => sum + (s.tasks_completed || 0), 0);

  // Count activities by type
  const activityCounts = activities.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink">Agentes</h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            10 agentes IA autonomos — trabajan 3x/dia + auditoria semanal
          </p>
        </div>
        <button
          onClick={triggerCron}
          disabled={triggeringCron}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary/15 text-brand-primary text-sm font-heading font-medium hover:bg-brand-primary/25 transition-all disabled:opacity-50"
        >
          {triggeringCron ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {triggeringCron ? "Ejecutando..." : "Ejecutar ciclo ahora"}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Activos ahora", value: `${workingCount}/10`, color: "#84CC16", icon: Zap },
          { label: "Tareas hoy", value: String(totalTasksToday), color: "#06B6D4", icon: Activity },
          { label: "Total completadas", value: String(totalCompleted), color: "#7C3AED", icon: CheckCircle2 },
          { label: "Alertas", value: String(activityCounts.alert || 0), color: "#EF4444", icon: XCircle },
          { label: "Entregas", value: String(activityCounts.delivery || 0), color: "#16A34A", icon: DollarSign },
        ].map((stat) => {
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

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agentIds.map((id) => {
          const meta = agentMeta[id];
          const state = getState(id);
          const status = state?.status || "idle";
          const statusConf = statusConfig[status] || statusConfig.idle;
          const Icon = meta.icon;
          const recentActs = getAgentActivities(id);

          return (
            <div
              key={id}
              className="rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 transition-all overflow-hidden"
            >
              <div className="h-1 w-full" style={{ backgroundColor: meta.color }} />
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-sm" style={{ color: meta.color }}>
                        {id.toUpperCase()}
                      </h3>
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConf.pulse ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: statusConf.color }}
                      />
                      <span className="text-[10px] font-body" style={{ color: statusConf.color }}>
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink/40 font-body truncate">{meta.role}</p>
                  </div>
                  {state?.last_activity && (
                    <span className="text-[10px] text-ink/30 font-body flex-shrink-0">
                      {timeAgo(state.last_activity)}
                    </span>
                  )}
                </div>

                {/* Current task */}
                {state?.current_task && (
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2 mb-3">
                    <div className="text-[10px] text-ink/30 font-body uppercase tracking-wide mb-0.5">
                      Tarea actual
                    </div>
                    <p className="text-xs text-ink/70 font-body line-clamp-2">{state.current_task}</p>
                  </div>
                )}

                {/* Specialty */}
                <p className="text-[11px] text-ink/30 font-body mb-3 italic">{meta.specialty}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-[10px] text-ink/30 font-body mb-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {state?.tasks_today || 0} hoy
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {state?.tasks_completed || 0} total
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {state?.active_hours || 0}h
                  </div>
                </div>

                {/* Recent activity */}
                {recentActs.length > 0 && (
                  <div className="space-y-1.5 border-t border-white/[0.04] pt-3">
                    <div className="text-[10px] text-ink/25 font-body uppercase tracking-wide">
                      Actividad reciente
                    </div>
                    {recentActs.map((act) => (
                      <div key={act.id} className="flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{
                            backgroundColor:
                              act.type === "alert" ? "#EF4444" :
                              act.type === "delivery" ? "#16A34A" :
                              act.type === "insight" ? "#7C3AED" :
                              act.type === "task_completed" ? "#06B6D4" :
                              "#F59E0B",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-ink/60 font-body truncate">{act.title}</p>
                          <span className="text-[9px] text-ink/20 font-body">
                            {timeAgo(act.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {recentActs.length === 0 && (
                  <div className="border-t border-white/[0.04] pt-3">
                    <p className="text-[11px] text-ink/20 font-body text-center">
                      Sin actividad registrada. Ejecuta un ciclo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cron schedule info */}
      <div className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-ink/30" />
          <div>
            <p className="text-xs text-ink/50 font-body">
              <span className="font-medium text-ink/70">Ciclo autonomo:</span>{" "}
              3x/dia (6:00, 12:00, 18:00 UTC) — Cada agente analiza, ejecuta y reporta.
            </p>
            <p className="text-[11px] text-ink/30 font-body mt-0.5">
              DIOS ejecuta auditoria semanal completa los lunes a las 7:00 UTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
