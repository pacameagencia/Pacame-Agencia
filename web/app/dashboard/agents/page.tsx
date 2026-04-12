"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  Pencil, BarChart3, CheckCircle2, XCircle, DollarSign,
} from "lucide-react";

const agentMeta: Record<string, { role: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  NOVA: { role: "Marca y Creatividad", icon: Sparkles, color: "#7C3AED" },
  ATLAS: { role: "SEO", icon: Globe, color: "#2563EB" },
  NEXUS: { role: "Growth y Ads", icon: TrendingUp, color: "#EA580C" },
  PIXEL: { role: "Frontend", icon: Layout, color: "#06B6D4" },
  CORE: { role: "Backend", icon: Terminal, color: "#16A34A" },
  PULSE: { role: "Social Media", icon: Heart, color: "#EC4899" },
  SAGE: { role: "Estrategia", icon: Compass, color: "#D97706" },
  COPY: { role: "Copywriting", icon: Pencil, color: "#7C3AED" },
  LENS: { role: "Analytics", icon: BarChart3, color: "#2563EB" },
};

interface AgentStats {
  name: string;
  tasks: number;
  failed: number;
  avgTimeMs: number;
  costUsd: number;
  qualityAvg: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgentStats() {
      // Get all tasks from current month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: tasks } = await supabase
        .from("agent_tasks")
        .select("agent, status, duration_ms, cost_usd")
        .gte("created_at", monthStart.toISOString());

      // Also check agent_metrics for aggregated data
      const { data: metrics } = await supabase
        .from("agent_metrics")
        .select("*")
        .gte("date", monthStart.toISOString().split("T")[0]);

      // Aggregate from tasks
      const map = new Map<string, AgentStats>();

      // Seed with known agents
      for (const name of Object.keys(agentMeta)) {
        map.set(name, { name, tasks: 0, failed: 0, avgTimeMs: 0, costUsd: 0, qualityAvg: 0 });
      }

      if (tasks && tasks.length > 0) {
        const durationSums = new Map<string, { total: number; count: number }>();
        for (const t of tasks) {
          const key = (t.agent || "").toUpperCase();
          if (!map.has(key)) map.set(key, { name: key, tasks: 0, failed: 0, avgTimeMs: 0, costUsd: 0, qualityAvg: 0 });
          const a = map.get(key)!;
          a.tasks++;
          if (t.status === "failed") a.failed++;
          a.costUsd += Number(t.cost_usd) || 0;
          if (t.duration_ms) {
            if (!durationSums.has(key)) durationSums.set(key, { total: 0, count: 0 });
            const d = durationSums.get(key)!;
            d.total += t.duration_ms;
            d.count++;
          }
        }
        for (const [key, d] of durationSums) {
          map.get(key)!.avgTimeMs = d.total / d.count;
        }
      }

      // Merge metrics quality
      if (metrics && metrics.length > 0) {
        for (const m of metrics) {
          const key = (m.agent || "").toUpperCase();
          if (map.has(key) && m.quality_avg > 0) {
            map.get(key)!.qualityAvg = Number(m.quality_avg);
          }
        }
      }

      setAgents(Array.from(map.values()).sort((a, b) => b.tasks - a.tasks));
      setLoading(false);
    }
    fetchAgentStats();
  }, []);

  const totalTasks = agents.reduce((s, a) => s + a.tasks, 0);
  const totalFailed = agents.reduce((s, a) => s + a.failed, 0);
  const totalCost = agents.reduce((s, a) => s + a.costUsd, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Agentes</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          {loading ? "Cargando..." : `Rendimiento del sistema — ${totalTasks} tareas este mes, $${totalCost.toFixed(2)} gastado`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <CheckCircle2 className="w-6 h-6 text-lime-pulse mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{totalTasks - totalFailed}</div>
          <div className="text-xs text-pacame-white/40 font-body">Completadas</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{totalFailed}</div>
          <div className="text-xs text-pacame-white/40 font-body">Fallidas</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <DollarSign className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-pacame-white/40 font-body">Coste API mes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const meta = agentMeta[agent.name] || { role: agent.name, icon: BarChart3, color: "#6B7280" };
          const AgentIcon = meta.icon;
          const avgSec = agent.avgTimeMs > 0 ? (agent.avgTimeMs / 1000).toFixed(1) + "s" : "—";
          return (
            <div key={agent.name} className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all overflow-hidden">
              <div className="h-1 w-full" style={{ backgroundColor: meta.color }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}20` }}>
                    <AgentIcon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-pacame-white" style={{ color: meta.color }}>{agent.name}</h3>
                    <p className="text-xs text-pacame-white/40 font-body">{meta.role}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-lime-pulse animate-pulse" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-white/[0.03]">
                    <div className="text-xs text-pacame-white/30 font-body mb-0.5">Tareas</div>
                    <div className="font-heading font-bold text-pacame-white text-lg">{agent.tasks}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03]">
                    <div className="text-xs text-pacame-white/30 font-body mb-0.5">Calidad</div>
                    <div className="font-heading font-bold text-lg" style={{ color: agent.qualityAvg >= 4.5 ? "#16A34A" : agent.qualityAvg >= 4 ? "#D97706" : agent.qualityAvg > 0 ? "#EF4444" : "#6B7280" }}>
                      {agent.qualityAvg > 0 ? `${agent.qualityAvg}/5` : "—"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03]">
                    <div className="text-xs text-pacame-white/30 font-body mb-0.5">Tiempo</div>
                    <div className="font-heading font-bold text-pacame-white/80 text-lg">{avgSec}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03]">
                    <div className="text-xs text-pacame-white/30 font-body mb-0.5">Coste</div>
                    <div className="font-heading font-bold text-pacame-white/80 text-lg">${agent.costUsd.toFixed(2)}</div>
                  </div>
                </div>

                {agent.failed > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-xs text-red-400 font-body">{agent.failed} tarea{agent.failed > 1 ? "s" : ""} fallida{agent.failed > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
