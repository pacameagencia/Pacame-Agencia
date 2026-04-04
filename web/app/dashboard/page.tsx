"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, UserPlus, DollarSign, FileText, Bot, TrendingUp,
  Clock, AlertCircle, CheckCircle2, ArrowRight, Zap,
} from "lucide-react";

// Mock data — replace with Supabase queries when connected
const mockKPIs = {
  activeClients: 0,
  mrr: 0,
  hotLeads: 0,
  pendingContent: 0,
  leadsThisMonth: 0,
  apiCostUsd: 0,
  revenueThisMonth: 0,
  expensesThisMonth: 0,
};

const mockActivityFeed = [
  { id: 1, agent: "SAGE", subagent: "sage.qualify", task: "Lead cualificado: Juan Lopez (Score 4/5)", time: "Hace 2 min", color: "#D97706" },
  { id: 2, agent: "COPY", subagent: "copy.social", task: "4 posts generados para cliente #1", time: "Hace 15 min", color: "#7C3AED" },
  { id: 3, agent: "ATLAS", subagent: "atlas.content", task: "Brief SEO: 'marketing restaurantes madrid'", time: "Hace 32 min", color: "#2563EB" },
  { id: 4, agent: "NOVA", subagent: "nova.review", task: "QA visual aprobado (batch_001)", time: "Hace 1h", color: "#7C3AED" },
  { id: 5, agent: "PACAME", subagent: null, task: "Conversacion WhatsApp con lead nuevo", time: "Hace 2h", color: "#06B6D4" },
];

const mockHotLeads = [
  { id: "1", name: "Maria Garcia", business: "Clinica Dental Sol", score: 5, source: "web_form", services: ["web", "seo"], value: "1.500€ + 497€/mes" },
  { id: "2", name: "Carlos Ruiz", business: "Restaurante El Patio", score: 4, source: "whatsapp", services: ["redes", "web"], value: "800€ + 397€/mes" },
];

function KPICard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="font-heading font-bold text-2xl text-pacame-white">{value}</div>
      <div className="text-xs text-pacame-white/40 font-body mt-1">{label}</div>
      {sub && <div className="text-[11px] text-pacame-white/30 font-body mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardOverview() {
  const kpis = mockKPIs;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Dashboard</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          Vista general del sistema PACAME
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Clientes activos" value={kpis.activeClients} icon={Users} color="#06B6D4" />
        <KPICard label="MRR" value={`${kpis.mrr} €`} icon={DollarSign} color="#16A34A" />
        <KPICard label="Leads calientes" value={kpis.hotLeads} icon={Zap} color="#EA580C" />
        <KPICard label="Contenido pendiente" value={kpis.pendingContent} icon={FileText} color="#7C3AED" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Leads este mes" value={kpis.leadsThisMonth} icon={UserPlus} color="#EC4899" />
        <KPICard label="Revenue mes" value={`${kpis.revenueThisMonth} €`} icon={TrendingUp} color="#16A34A" />
        <KPICard label="Gastos mes" value={`${kpis.expensesThisMonth} €`} icon={DollarSign} color="#EF4444" sub="API + herramientas" />
        <KPICard label="Coste API" value={`$${kpis.apiCostUsd.toFixed(2)}`} icon={Bot} color="#D97706" sub="Claude + otros" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-3 rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-lg text-pacame-white">Actividad de agentes</h2>
            <Link href="/dashboard/agents" className="text-xs text-electric-violet hover:underline font-body">
              Ver todo
            </Link>
          </div>
          <div className="space-y-4">
            {mockActivityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold font-heading"
                  style={{ backgroundColor: `${item.color}20`, color: item.color }}
                >
                  {item.agent[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-semibold" style={{ color: item.color }}>
                      {item.agent}
                    </span>
                    {item.subagent && (
                      <span className="text-[10px] text-pacame-white/30 font-mono">{item.subagent}</span>
                    )}
                  </div>
                  <p className="text-sm text-pacame-white/70 font-body truncate">{item.task}</p>
                </div>
                <span className="text-[11px] text-pacame-white/30 font-body flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hot leads */}
        <div className="lg:col-span-2 rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-lg text-pacame-white">Leads calientes</h2>
            <Link href="/dashboard/leads" className="text-xs text-electric-violet hover:underline font-body">
              Ver todos
            </Link>
          </div>
          {mockHotLeads.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
              <p className="text-sm text-pacame-white/40 font-body">Sin leads calientes</p>
              <p className="text-xs text-pacame-white/25 font-body mt-1">Llegarán por WhatsApp, web o ads</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockHotLeads.map((lead) => (
                <div key={lead.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-semibold text-sm text-pacame-white">{lead.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-body font-medium">
                      {lead.score}/5
                    </span>
                  </div>
                  <p className="text-xs text-pacame-white/50 font-body">{lead.business}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {lead.services.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-electric-violet/10 text-electric-violet/70 font-body">
                        {s}
                      </span>
                    ))}
                    <span className="text-[11px] text-lime-pulse font-body ml-auto">{lead.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-pacame-white mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Revisar contenido", href: "/dashboard/content", icon: FileText, color: "#7C3AED" },
            { label: "Ver leads", href: "/dashboard/leads", icon: UserPlus, color: "#EA580C" },
            { label: "Nuevo cliente", href: "/dashboard/clients", icon: Users, color: "#06B6D4" },
            { label: "Ver finanzas", href: "/dashboard/finances", icon: DollarSign, color: "#16A34A" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] transition-all group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <action.icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <span className="text-sm text-pacame-white/70 font-body group-hover:text-pacame-white transition-colors">
                {action.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-pacame-white/20 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
