"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  Users, UserPlus, DollarSign, FileText, Bot, TrendingUp,
  ArrowRight, Zap, Building2, Rocket, MessageSquare, Sparkles,
  Play, Loader2, Phone, Target,
  PhoneCall, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";

const agentColors: Record<string, string> = {
  SAGE: "#D97706", NOVA: "#7C3AED", ATLAS: "#2563EB", NEXUS: "#EA580C",
  PIXEL: "#06B6D4", CORE: "#16A34A", PULSE: "#EC4899", COPY: "#7C3AED",
  LENS: "#2563EB", PACAME: "#06B6D4",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

interface KPIs {
  activeClients: number;
  mrr: number;
  hotLeads: number;
  pendingContent: number;
  leadsThisMonth: number;
  apiCostUsd: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  proposalsSent: number;
  proposalsAccepted: number;
  callsThisMonth: number;
  outreachSent: number;
}

interface MonthlyFinance {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ActivityItem {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

interface HotLead {
  id: string;
  name: string;
  business_name: string;
  score: number;
  source: string;
  sage_analysis: { recommended_services?: string[]; estimated_value_monthly?: number; estimated_value_onetime?: number };
}

function KPICard({ label, value, icon: Icon, color, sub, trend }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; sub?: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            trend.startsWith("+") ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
          }`}>{trend}</span>
        )}
      </div>
      <div className="font-heading font-bold text-2xl text-pacame-white">{value}</div>
      <div className="text-xs text-pacame-white/40 font-body mt-1">{label}</div>
      {sub && <div className="text-[11px] text-pacame-white/30 font-body mt-0.5">{sub}</div>}
    </div>
  );
}

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg bg-dark-elevated border border-white/10 px-3 py-2 shadow-xl">
      <p className="text-xs text-pacame-white/60 font-body mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs font-body font-medium" style={{ color: entry.color }}>
          {entry.name === "revenue" ? "Ingresos" : entry.name === "expenses" ? "Gastos" : "Profit"}: {entry.value.toLocaleString("es-ES")}€
        </p>
      ))}
    </div>
  );
}

function CronTrigger() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function triggerCron() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/agents/cron", { method: "POST" });
      const data = await res.json();
      const agents = Object.keys(data.results || {}).length;
      setResult(`${agents} agentes ejecutados`);
      setTimeout(() => setResult(null), 4000);
    } catch {
      setResult("Error");
      setTimeout(() => setResult(null), 3000);
    }
    setRunning(false);
  }

  return (
    <button
      onClick={triggerCron}
      disabled={running}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lime-pulse/10 hover:bg-lime-pulse/20 border border-lime-pulse/20 text-lime-pulse text-xs font-body font-medium transition-all disabled:opacity-50"
    >
      {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
      {result || (running ? "Ejecutando agentes..." : "Ejecutar cron")}
    </button>
  );
}

export default function DashboardOverview() {
  const [kpis, setKpis] = useState<KPIs>({
    activeClients: 0, mrr: 0, hotLeads: 0, pendingContent: 0,
    leadsThisMonth: 0, apiCostUsd: 0, revenueThisMonth: 0, expensesThisMonth: 0,
    proposalsSent: 0, proposalsAccepted: 0, callsThisMonth: 0, outreachSent: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthISO = monthStart.toISOString();

      // Calculate 6 months ago for chart data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      const sixMonthsISO = sixMonthsAgo.toISOString().split("T")[0];

      const [
        clientsRes,
        mrrRes,
        hotLeadsCountRes,
        pendingRes,
        leadsMonthRes,
        apiCostRes,
        revenueRes,
        expensesRes,
        activityRes,
        hotLeadsRes,
        proposalsSentRes,
        proposalsAcceptedRes,
        callsRes,
        financesHistoryRes,
      ] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("clients").select("monthly_fee").eq("status", "active"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("score", 4).not("status", "in", "(won,lost)"),
        supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", monthISO),
        supabase.from("agent_tasks").select("cost_usd").gte("created_at", monthISO),
        supabase.from("finances").select("amount").eq("type", "income").gte("date", monthISO.split("T")[0]),
        supabase.from("finances").select("amount").eq("type", "expense").gte("date", monthISO.split("T")[0]),
        supabase.from("agent_activities").select("id, agent_id, type, title, description, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("leads").select("id, name, business_name, score, source, sage_analysis").gte("score", 4).not("status", "in", "(won,lost)").order("score", { ascending: false }).limit(5),
        supabase.from("proposals").select("id", { count: "exact", head: true }).in("status", ["sent", "viewed"]).gte("created_at", monthISO),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "accepted").gte("created_at", monthISO),
        supabase.from("voice_calls").select("id", { count: "exact", head: true }).gte("created_at", monthISO),
        supabase.from("finances").select("type, amount, date").gte("date", sixMonthsISO).order("date", { ascending: true }),
      ]);

      const mrr = (mrrRes.data || []).reduce((sum, c) => sum + (Number(c.monthly_fee) || 0), 0);
      const apiCost = (apiCostRes.data || []).reduce((sum, t) => sum + (Number(t.cost_usd) || 0), 0);
      const revenue = (revenueRes.data || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const expenses = (expensesRes.data || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

      // Build monthly chart data
      const monthMap = new Map<string, { revenue: number; expenses: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, { revenue: 0, expenses: 0 });
      }
      for (const f of financesHistoryRes.data || []) {
        const dateStr = (f.date as string) || "";
        const key = dateStr.substring(0, 7);
        const entry = monthMap.get(key);
        if (entry) {
          if (f.type === "income") entry.revenue += Number(f.amount) || 0;
          else entry.expenses += Number(f.amount) || 0;
        }
      }
      const chartData: MonthlyFinance[] = [];
      for (const [key, val] of monthMap) {
        const [, m] = key.split("-");
        chartData.push({
          month: monthNames[parseInt(m, 10) - 1],
          revenue: Math.round(val.revenue),
          expenses: Math.round(val.expenses),
          profit: Math.round(val.revenue - val.expenses),
        });
      }
      setMonthlyData(chartData);

      setKpis({
        activeClients: clientsRes.count || 0,
        mrr,
        hotLeads: hotLeadsCountRes.count || 0,
        pendingContent: pendingRes.count || 0,
        leadsThisMonth: leadsMonthRes.count || 0,
        apiCostUsd: apiCost,
        revenueThisMonth: revenue,
        expensesThisMonth: expenses,
        proposalsSent: proposalsSentRes.count || 0,
        proposalsAccepted: proposalsAcceptedRes.count || 0,
        callsThisMonth: callsRes.count || 0,
        outreachSent: 0,
      });

      setActivity(activityRes.data || []);
      setHotLeads(hotLeadsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const profit = kpis.revenueThisMonth - kpis.expensesThisMonth;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Dashboard</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">Vista general del sistema PACAME</p>
      </div>

      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Clientes activos" value={kpis.activeClients} icon={Users} color="#06B6D4" />
        <KPICard label="MRR" value={`${kpis.mrr.toLocaleString("es-ES")} €`} icon={DollarSign} color="#16A34A" />
        <KPICard label="Leads calientes" value={kpis.hotLeads} icon={Zap} color="#EA580C" />
        <KPICard
          label="Profit mes"
          value={`${profit >= 0 ? "+" : ""}${profit.toLocaleString("es-ES")} €`}
          icon={TrendingUp}
          color={profit >= 0 ? "#16A34A" : "#EF4444"}
          sub={`${kpis.revenueThisMonth.toLocaleString("es-ES")}€ rev — ${kpis.expensesThisMonth.toLocaleString("es-ES")}€ gastos`}
        />
      </div>

      {/* Row 2: Pipeline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Leads este mes" value={kpis.leadsThisMonth} icon={UserPlus} color="#EC4899" />
        <KPICard
          label="Propuestas"
          value={kpis.proposalsSent}
          icon={FileText}
          color="#7C3AED"
          sub={kpis.proposalsAccepted > 0 ? `${kpis.proposalsAccepted} aceptada${kpis.proposalsAccepted > 1 ? "s" : ""}` : "Ninguna aceptada aun"}
        />
        <KPICard label="Llamadas" value={kpis.callsThisMonth} icon={Phone} color="#06B6D4" sub="Vapi + manuales" />
        <KPICard label="Coste API" value={`$${kpis.apiCostUsd.toFixed(2)}`} icon={Bot} color="#D97706" sub="Claude + Vapi + otros" />
      </div>

      {/* Mini funnel bar */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-electric-violet" />
            <h2 className="font-heading font-semibold text-pacame-white text-sm">Embudo rapido</h2>
          </div>
          <Link href="/dashboard/commercial" className="text-xs text-electric-violet hover:underline font-body">Ver completo</Link>
        </div>
        <div className="flex items-center gap-1">
          {[
            { label: "Leads", value: kpis.leadsThisMonth, color: "bg-blue-500" },
            { label: "Hot", value: kpis.hotLeads, color: "bg-amber-500" },
            { label: "Propuestas", value: kpis.proposalsSent, color: "bg-electric-violet" },
            { label: "Aceptadas", value: kpis.proposalsAccepted, color: "bg-lime-pulse" },
            { label: "Clientes", value: kpis.activeClients, color: "bg-green-500" },
          ].map((stage, i) => (
            <div key={stage.label} className="flex-1 text-center">
              <div className={`h-2 ${stage.color} rounded-full mx-0.5`} style={{ opacity: Math.max(0.2, stage.value > 0 ? 1 : 0.15) }} />
              <div className="text-[10px] text-pacame-white/40 font-body mt-1.5">{stage.label}</div>
              <div className="text-xs font-heading font-bold text-pacame-white">{stage.value}</div>
              {i < 4 && <ArrowRight className="w-3 h-3 text-pacame-white/10 mx-auto mt-0.5 hidden md:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue & Expenses Chart */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart: Revenue vs Expenses */}
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-sm text-pacame-white">Ingresos vs Gastos</h2>
                <p className="text-[11px] text-pacame-white/30 font-body mt-0.5">Ultimos 6 meses</p>
              </div>
              <DollarSign className="w-4 h-4 text-pacame-white/20" />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => `${v}€`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="revenue" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-600" />
                <span className="text-[10px] text-pacame-white/40 font-body">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 opacity-70" />
                <span className="text-[10px] text-pacame-white/40 font-body">Gastos</span>
              </div>
            </div>
          </div>

          {/* Area chart: Profit trend */}
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-sm text-pacame-white">Beneficio neto</h2>
                <p className="text-[11px] text-pacame-white/30 font-body mt-0.5">Evolucion mensual</p>
              </div>
              <TrendingUp className="w-4 h-4 text-pacame-white/20" />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => `${v}€`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="profit" name="profit" stroke="#7C3AED" fill="url(#profitGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]" />
                <span className="text-[10px] text-pacame-white/40 font-body">Beneficio neto</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-3 rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-lg text-pacame-white">Actividad de agentes</h2>
            <Link href="/dashboard/agents" className="text-xs text-electric-violet hover:underline font-body">Ver todo</Link>
          </div>
          <div className="space-y-4">
            {activity.length === 0 && !loading && (
              <p className="text-sm text-pacame-white/30 font-body text-center py-6">Sin actividad reciente</p>
            )}
            {activity.map((item) => {
              const agentUpper = (item.agent_id || "").toUpperCase();
              const color = agentColors[agentUpper] || "#6B7280";
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold font-heading"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {agentUpper[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-heading font-semibold" style={{ color }}>{agentUpper}</span>
                      <span className="text-[10px] text-pacame-white/30 font-mono">{item.type.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm text-pacame-white/70 font-body truncate">{item.title}</p>
                  </div>
                  <span className="text-[11px] text-pacame-white/30 font-body flex-shrink-0">{timeAgo(item.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hot leads */}
        <div className="lg:col-span-2 rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-lg text-pacame-white">Leads calientes</h2>
            <Link href="/dashboard/leads" className="text-xs text-electric-violet hover:underline font-body">Ver todos</Link>
          </div>
          {hotLeads.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
              <p className="text-sm text-pacame-white/40 font-body">Sin leads calientes</p>
              <p className="text-xs text-pacame-white/25 font-body mt-1">Llegaran por WhatsApp, web o ads</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hotLeads.map((lead) => {
                const services = lead.sage_analysis?.recommended_services || [];
                const onetime = lead.sage_analysis?.estimated_value_onetime || 0;
                const monthly = lead.sage_analysis?.estimated_value_monthly || 0;
                return (
                  <div key={lead.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-semibold text-sm text-pacame-white">{lead.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-body font-medium">{lead.score}/5</span>
                    </div>
                    <p className="text-xs text-pacame-white/50 font-body">{lead.business_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {services.map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-electric-violet/10 text-electric-violet/70 font-body">{s}</span>
                      ))}
                      {(onetime > 0 || monthly > 0) && (
                        <span className="text-[11px] text-lime-pulse font-body ml-auto">
                          {onetime > 0 ? `${onetime}€` : ""}{monthly > 0 ? ` + ${monthly}€/mes` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg text-pacame-white">Acciones rapidas</h2>
          <CronTrigger />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Pipeline comercial", href: "/dashboard/commercial", icon: Target, color: "#EA580C" },
            { label: "Llamar con Sage", href: "/dashboard/calls", icon: PhoneCall, color: "#06B6D4" },
            { label: "Lead Gen", href: "/dashboard/leadgen", icon: Rocket, color: "#7C3AED" },
            { label: "Propuestas IA", href: "/dashboard/proposals", icon: Sparkles, color: "#D97706" },
            { label: "Chat con agentes", href: "/dashboard/chat", icon: MessageSquare, color: "#06B6D4" },
            { label: "Oficina PACAME", href: "/dashboard/office", icon: Building2, color: "#D97706" },
            { label: "Revisar contenido", href: "/dashboard/content", icon: FileText, color: "#16A34A" },
            { label: "Finanzas", href: "/dashboard/finances", icon: DollarSign, color: "#16A34A" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] transition-all group"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                <action.icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <span className="text-sm text-pacame-white/70 font-body group-hover:text-pacame-white transition-colors">{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-pacame-white/20 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
