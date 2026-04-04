"use client";

import {
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
  Pencil, BarChart3, CheckCircle2, XCircle, Clock, DollarSign,
} from "lucide-react";

const agentData = [
  { name: "NOVA", role: "Marca y Creatividad", icon: Sparkles, color: "#7C3AED", tasks: 12, failed: 0, avgTime: "3.2s", cost: "$0.48", quality: 4.5 },
  { name: "ATLAS", role: "SEO", icon: Globe, color: "#2563EB", tasks: 8, failed: 1, avgTime: "5.1s", cost: "$0.72", quality: 4.3 },
  { name: "NEXUS", role: "Growth y Ads", icon: TrendingUp, color: "#EA580C", tasks: 5, failed: 0, avgTime: "4.8s", cost: "$0.60", quality: 4.1 },
  { name: "PIXEL", role: "Frontend", icon: Layout, color: "#06B6D4", tasks: 3, failed: 0, avgTime: "8.2s", cost: "$1.20", quality: 4.7 },
  { name: "CORE", role: "Backend", icon: Terminal, color: "#16A34A", tasks: 2, failed: 0, avgTime: "6.5s", cost: "$0.90", quality: 4.6 },
  { name: "PULSE", role: "Social Media", icon: Heart, color: "#EC4899", tasks: 18, failed: 2, avgTime: "2.1s", cost: "$0.35", quality: 4.0 },
  { name: "SAGE", role: "Estrategia", icon: Compass, color: "#D97706", tasks: 7, failed: 0, avgTime: "6.8s", cost: "$0.95", quality: 4.8 },
  { name: "COPY", role: "Copywriting", icon: Pencil, color: "#7C3AED", tasks: 22, failed: 1, avgTime: "1.8s", cost: "$0.28", quality: 4.2 },
  { name: "LENS", role: "Analytics", icon: BarChart3, color: "#2563EB", tasks: 4, failed: 0, avgTime: "3.5s", cost: "$0.45", quality: 4.4 },
];

export default function AgentsPage() {
  const totalTasks = agentData.reduce((sum, a) => sum + a.tasks, 0);
  const totalFailed = agentData.reduce((sum, a) => sum + a.failed, 0);
  const totalCost = agentData.reduce((sum, a) => sum + parseFloat(a.cost.replace("$", "")), 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Agentes</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          Rendimiento del sistema — {totalTasks} tareas hoy, ${totalCost.toFixed(2)} gastado
        </p>
      </div>

      {/* Summary */}
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
          <div className="text-xs text-pacame-white/40 font-body">Coste API hoy</div>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentData.map((agent) => (
          <div
            key={agent.name}
            className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all overflow-hidden"
          >
            <div className="h-1 w-full" style={{ backgroundColor: agent.color }} />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${agent.color}20` }}
                >
                  <agent.icon className="w-5 h-5" style={{ color: agent.color }} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-pacame-white" style={{ color: agent.color }}>
                    {agent.name}
                  </h3>
                  <p className="text-xs text-pacame-white/40 font-body">{agent.role}</p>
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
                  <div className="font-heading font-bold text-lg" style={{ color: agent.quality >= 4.5 ? "#16A34A" : agent.quality >= 4 ? "#D97706" : "#EF4444" }}>
                    {agent.quality}/5
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03]">
                  <div className="text-xs text-pacame-white/30 font-body mb-0.5">Tiempo</div>
                  <div className="font-heading font-bold text-pacame-white/80 text-lg">{agent.avgTime}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03]">
                  <div className="text-xs text-pacame-white/30 font-body mb-0.5">Coste</div>
                  <div className="font-heading font-bold text-pacame-white/80 text-lg">{agent.cost}</div>
                </div>
              </div>

              {agent.failed > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-xs text-red-400 font-body">{agent.failed} tarea{agent.failed > 1 ? "s" : ""} fallida{agent.failed > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
