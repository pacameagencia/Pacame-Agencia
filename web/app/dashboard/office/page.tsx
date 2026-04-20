"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  Pencil, BarChart3, Brain, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, Zap, ArrowRight, Plus, Loader2, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENT_META, STATUS_CONFIG } from "@/lib/data/agent-office";
import type { AgentStatus } from "@/lib/data/agent-office";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  Pencil, BarChart3, Brain,
};

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  task_started: Zap,
  task_completed: CheckCircle2,
  insight: Brain,
  alert: AlertTriangle,
  update: Activity,
  delivery: CheckCircle2,
};

const activityColors: Record<string, string> = {
  task_started: "#84CC16",
  task_completed: "#06B6D4",
  insight: "#7C3AED",
  alert: "#EF4444",
  update: "#F59E0B",
  delivery: "#16A34A",
};

const priorityColors: Record<string, string> = {
  urgent: "#EF4444",
  high: "#EA580C",
  medium: "#F59E0B",
  low: "#6B7280",
};

interface AgentStateData {
  agent_id: string;
  status: AgentStatus;
  current_task: string | null;
  tasks_today: number;
  tasks_completed: number;
  active_hours: number;
  last_activity: string;
}

interface ActivityData {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

interface TaskData {
  id: string;
  agent_id: string;
  title: string;
  status: string;
  priority: string;
  client: string | null;
  created_at: string;
}

export default function OfficePage() {
  const [states, setStates] = useState<AgentStateData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "feed" | "tasks">("grid");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/office?view=overview");
      const data = await res.json();
      setStates(data.states || []);
      setActivities(data.recentActivities || []);
      setTasks(data.activeTasks || []);
    } catch {
      // silently fail on fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  async function seedOffice() {
    setSeeding(true);
    try {
      await fetch("/api/office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      await fetchData();
    } catch {
      // silently fail
    } finally {
      setSeeding(false);
    }
  }

  function getAgentState(agentId: string): AgentStateData | null {
    return states.find((s) => s.agent_id === agentId) || null;
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

  const agentIds = Object.keys(AGENT_META).filter((id) => id !== "dios");
  const workingCount = states.filter((s) => s.status === "working").length;
  const totalTasksToday = states.reduce((sum, s) => sum + (s.tasks_today || 0), 0);
  const totalCompleted = states.reduce((sum, s) => sum + (s.tasks_completed || 0), 0);
  const filteredActivities = selectedAgent
    ? activities.filter((a) => a.agent_id === selectedAgent)
    : activities;
  const filteredTasks = selectedAgent
    ? tasks.filter((t) => t.agent_id === selectedAgent)
    : tasks;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink">
            Oficina PACAME
          </h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            Centro de control — estado en tiempo real de cada agente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body text-ink/50 hover:text-ink/80 hover:bg-white/5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
          {states.length === 0 && (
            <Button
              variant="gradient"
              size="sm"
              onClick={seedOffice}
              disabled={seeding}
              className="gap-2"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Inicializar oficina
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Agentes activos", value: `${workingCount}/10`, color: "#84CC16" },
          { label: "Tareas hoy", value: String(totalTasksToday), color: "#06B6D4" },
          { label: "Total completadas", value: String(totalCompleted), color: "#7C3AED" },
          { label: "Tareas pendientes", value: String(tasks.length), color: "#F59E0B" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
            <div className="text-xs text-ink/40 font-body mb-1">{stat.label}</div>
            <div className="font-heading font-bold text-xl" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* View tabs + Agent filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-1 rounded-lg bg-paper-deep border border-ink/[0.06] p-1">
          {(["grid", "feed", "tasks"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all ${
                view === v
                  ? "bg-brand-primary/15 text-brand-primary"
                  : "text-ink/50 hover:text-ink/80"
              }`}
            >
              {v === "grid" ? "Agentes" : v === "feed" ? "Actividad" : "Tareas"}
            </button>
          ))}
        </div>

        {(view === "feed" || view === "tasks") && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setSelectedAgent(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                !selectedAgent ? "bg-white/10 text-ink" : "text-ink/40 hover:text-ink/70"
              }`}
            >
              Todos
            </button>
            {agentIds.map((id) => {
              const meta = AGENT_META[id];
              return (
                <button
                  key={id}
                  onClick={() => setSelectedAgent(selectedAgent === id ? null : id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                    selectedAgent === id ? "text-white" : "hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: selectedAgent === id ? `${meta.color}30` : "transparent",
                    color: selectedAgent === id ? meta.color : `${meta.color}80`,
                    border: `1px solid ${selectedAgent === id ? meta.color : "transparent"}`,
                  }}
                >
                  {meta.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid View — Agent Cards */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* DIOS card first */}
          {(() => {
            const meta = AGENT_META.dios;
            const state = getAgentState("dios");
            const status = (state?.status || "idle") as AgentStatus;
            const statusConf = STATUS_CONFIG[status];
            const Icon = iconMap[meta.icon];
            return (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-2xl bg-paper-deep border border-ink/[0.08] p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary via-mint to-mint" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10">
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-lg text-ink">DIOS</span>
                      <span className="text-xs font-body text-ink/40">Orquestador del Sistema</span>
                    </div>
                    <p className="text-sm text-ink/50 font-body mt-0.5">
                      {state?.current_task || "Coordinando al equipo. Todos los sistemas operativos."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${statusConf.pulse ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: statusConf.color }}
                    />
                    <span className="text-xs font-body" style={{ color: statusConf.color }}>
                      {statusConf.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Individual agent cards */}
          {agentIds.map((id) => {
            const meta = AGENT_META[id];
            const state = getAgentState(id);
            const status = (state?.status || "idle") as AgentStatus;
            const statusConf = STATUS_CONFIG[status];
            const Icon = iconMap[meta.icon];

            return (
              <div
                key={id}
                className="rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => {
                  setSelectedAgent(id);
                  setView("feed");
                }}
              >
                <div className="h-1 w-full" style={{ backgroundColor: meta.color }} />
                <div className="p-5">
                  {/* Agent header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${meta.color}20` }}
                    >
                      {Icon && <Icon className="w-5 h-5" style={{ color: meta.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm" style={{ color: meta.color }}>
                          {meta.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-body" style={{
                          backgroundColor: `${meta.color}15`,
                          color: meta.color,
                        }}>
                          {meta.model}
                        </span>
                      </div>
                      <div className="text-xs text-ink/40 font-body truncate">{meta.role}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConf.pulse ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: statusConf.color }}
                    />
                    <span className="text-xs font-body font-medium" style={{ color: statusConf.color }}>
                      {statusConf.label}
                    </span>
                    {state?.last_activity && (
                      <span className="text-[10px] text-ink/30 font-body ml-auto">
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
                      <p className="text-xs text-ink/70 font-body line-clamp-2">
                        {state.current_task}
                      </p>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-[10px] text-ink/30 font-body">
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feed View — Activity timeline */}
      {view === "feed" && (
        <div className="space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
              <Activity className="w-8 h-8 text-ink/20 mx-auto mb-3" />
              <p className="text-sm text-ink/40 font-body">
                Sin actividad registrada{selectedAgent ? ` para ${AGENT_META[selectedAgent]?.name}` : ""}.
                Inicializa la oficina para ver datos.
              </p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const meta = AGENT_META[activity.agent_id];
              const Icon = meta ? iconMap[meta.icon] : null;
              const TypeIcon = activityIcons[activity.type] || Activity;
              const typeColor = activityColors[activity.type] || "#6B7280";

              return (
                <div
                  key={activity.id}
                  className="flex gap-4 rounded-xl bg-paper-deep border border-ink/[0.06] p-4 hover:border-white/10 transition-all"
                >
                  {/* Agent avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: meta ? `${meta.color}20` : "#333" }}
                  >
                    {Icon && <Icon className="w-5 h-5" style={{ color: meta?.color }} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading font-semibold text-sm" style={{ color: meta?.color }}>
                        {meta?.name || activity.agent_id}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-body"
                        style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                      >
                        <TypeIcon className="w-2.5 h-2.5" />
                        {activity.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-ink/30 font-body ml-auto flex-shrink-0">
                        {timeAgo(activity.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-ink/80 font-heading font-medium mb-0.5">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-ink/50 font-body leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tasks View */}
      {view === "tasks" && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-ink/20 mx-auto mb-3" />
              <p className="text-sm text-ink/40 font-body">
                Sin tareas activas{selectedAgent ? ` para ${AGENT_META[selectedAgent]?.name}` : ""}.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const meta = AGENT_META[task.agent_id];
              const Icon = meta ? iconMap[meta.icon] : null;
              const pColor = priorityColors[task.priority] || "#6B7280";

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-xl bg-paper-deep border border-ink/[0.06] p-4 hover:border-white/10 transition-all"
                >
                  {/* Priority dot */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                    <span className="text-[9px] text-ink/30 font-body uppercase">{task.priority}</span>
                  </div>

                  {/* Agent */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: meta ? `${meta.color}20` : "#333" }}
                  >
                    {Icon && <Icon className="w-4 h-4" style={{ color: meta?.color }} />}
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink/80 font-body truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-body" style={{ color: meta?.color }}>
                        {meta?.name}
                      </span>
                      {task.client && (
                        <span className="text-[10px] text-ink/30 font-body">
                          {task.client}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-body font-medium ${
                      task.status === "in_progress"
                        ? "bg-mint/15 text-mint"
                        : task.status === "blocked"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-white/5 text-ink/40"
                    }`}
                  >
                    {task.status === "in_progress" ? "En curso" : task.status === "blocked" ? "Bloqueada" : "Pendiente"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
