"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  TrendingUp, Users, FileCheck, CreditCard, Mail,
  Send, Loader2, Target, ArrowRight, Phone, CheckCircle,
  AlertCircle, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FunnelStats {
  funnel: {
    new: number;
    contacted: number;
    qualified: number;
    proposals: number;
    accepted: number;
    clients: number;
  };
  metrics: {
    monthly_revenue: number;
    total_outreach_sent: number;
    outbound_leads: number;
  };
}

interface OutboundLead {
  id: string;
  name: string;
  email: string;
  business_name: string;
  status: string;
  score: number;
  sage_analysis: {
    outreach_count?: number;
    last_outreach_at?: string;
    outreach_emails?: Record<string, { subject: string; body: string }>;
    audit_score?: number;
    campaign?: string;
  };
  created_at: string;
}

const funnelStages = [
  { key: "new", label: "Nuevos", color: "bg-blue-500", icon: Users },
  { key: "contacted", label: "Contactados", color: "bg-amber-500", icon: Mail },
  { key: "qualified", label: "Cualificados", color: "bg-electric-violet", icon: Target },
  { key: "proposals", label: "Propuestas", color: "bg-neon-cyan", icon: FileCheck },
  { key: "accepted", label: "Aceptadas", color: "bg-lime-pulse", icon: CheckCircle },
  { key: "clients", label: "Clientes", color: "bg-green-500", icon: CreditCard },
];

export default function CommercialPage() {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingOutreach, setSendingOutreach] = useState<string | null>(null);
  const [processingPipeline, setProcessingPipeline] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [statsRes, leadsRes] = await Promise.all([
      fetch("/api/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "funnel_stats" }),
      }),
      supabase
        .from("leads")
        .select("id, name, email, business_name, status, score, sage_analysis, created_at")
        .eq("source", "outbound")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (statsRes.ok) {
      setStats(await statsRes.json());
    }
    setLeads((leadsRes.data as OutboundLead[]) || []);
    setLoading(false);
  }

  async function handleSendOutreach(leadId: string, emailNumber: number) {
    setSendingOutreach(leadId);
    try {
      const res = await fetch("/api/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_outreach", lead_id: leadId, email_number: emailNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Email ${emailNumber} enviado correctamente`);
      }
    } catch {
      alert("Error de conexion");
    }
    setSendingOutreach(null);
    fetchAll();
  }

  async function handleBatchOutreach(emailNumber: number) {
    const eligibleLeads = leads.filter((l) => {
      const analysis = l.sage_analysis || {};
      return l.email && (analysis.outreach_count || 0) < emailNumber && analysis.outreach_emails;
    });

    if (eligibleLeads.length === 0) {
      alert("No hay leads elegibles para este email");
      return;
    }

    if (!confirm(`Enviar email ${emailNumber} a ${eligibleLeads.length} leads?`)) return;

    setSendingOutreach("batch");
    try {
      const res = await fetch("/api/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_outreach",
          lead_ids: eligibleLeads.map((l) => l.id),
          email_number: emailNumber,
        }),
      });
      const data = await res.json();
      alert(`Batch completado: ${data.sent} enviados, ${data.failed} fallidos`);
    } catch {
      alert("Error de conexion");
    }
    setSendingOutreach(null);
    fetchAll();
  }

  async function handleProcessPipeline() {
    setProcessingPipeline(true);
    try {
      const res = await fetch("/api/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_pipeline" }),
      });
      const data = await res.json();
      alert(`Pipeline procesado: ${data.followups_sent} follow-ups, ${data.proposals_generated} propuestas generadas`);
    } catch {
      alert("Error de conexion");
    }
    setProcessingPipeline(false);
    fetchAll();
  }

  const funnel = stats?.funnel;
  const metrics = stats?.metrics;
  const maxFunnel = funnel ? Math.max(...Object.values(funnel), 1) : 1;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Pipeline Comercial</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${leads.length} leads outbound · ${metrics?.total_outreach_sent || 0} emails enviados`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="gradient" size="sm"
            onClick={handleProcessPipeline}
            disabled={processingPipeline}
            className="gap-1.5"
          >
            {processingPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Procesar pipeline
          </Button>
        </div>
      </div>

      {/* Funnel Visualization */}
      {funnel && (
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-electric-violet" />
            <h2 className="font-heading font-semibold text-pacame-white">Embudo de ventas</h2>
          </div>

          <div className="space-y-3">
            {funnelStages.map((stage) => {
              const value = funnel[stage.key as keyof typeof funnel] || 0;
              const width = Math.max(5, (value / maxFunnel) * 100);
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex items-center gap-4">
                  <div className="w-28 flex items-center gap-2 flex-shrink-0">
                    <Icon className="w-4 h-4 text-pacame-white/40" />
                    <span className="text-xs text-pacame-white/60 font-body">{stage.label}</span>
                  </div>
                  <div className="flex-1 h-8 bg-white/[0.03] rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full ${stage.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs font-heading font-bold text-white">{value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion rates */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/[0.04]">
            {funnel.contacted > 0 && (
              <div className="text-center">
                <div className="text-lg font-heading font-bold text-electric-violet">
                  {Math.round((funnel.qualified / funnel.contacted) * 100)}%
                </div>
                <div className="text-[10px] text-pacame-white/30 font-body">Cualificacion</div>
              </div>
            )}
            {funnel.qualified > 0 && (
              <div className="text-center">
                <div className="text-lg font-heading font-bold text-neon-cyan">
                  {Math.round((funnel.accepted / Math.max(funnel.proposals, 1)) * 100)}%
                </div>
                <div className="text-[10px] text-pacame-white/30 font-body">Cierre propuestas</div>
              </div>
            )}
            {metrics && (
              <div className="text-center ml-auto">
                <div className="text-lg font-heading font-bold text-lime-pulse">
                  {metrics.monthly_revenue.toLocaleString("es-ES")}€
                </div>
                <div className="text-[10px] text-pacame-white/30 font-body">Revenue este mes</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Actions */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
        <h2 className="font-heading font-semibold text-pacame-white mb-3">Acciones masivas</h2>
        <div className="flex flex-wrap items-center gap-3">
          {[1, 2, 3].map((n) => (
            <Button
              key={n}
              variant="outline" size="sm"
              onClick={() => handleBatchOutreach(n)}
              disabled={sendingOutreach === "batch"}
              className="gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar email #{n} a todos
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-pacame-white/25 font-body mt-2">
          Solo envia a leads que tengan emails generados y no hayan recibido ese numero de email.
        </p>
      </div>

      {/* Outbound Leads Table */}
      <div className="space-y-2">
        <h2 className="font-heading font-semibold text-pacame-white">Leads outbound</h2>

        {!loading && leads.length === 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
            <Target className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
            <p className="text-sm text-pacame-white/40 font-body">Sin leads outbound</p>
            <p className="text-xs text-pacame-white/25 font-body mt-1">Usa Lead Generation para scrapear negocios de Google Maps</p>
          </div>
        )}

        {leads.map((lead) => {
          const analysis = lead.sage_analysis || {};
          const outreachCount = analysis.outreach_count || 0;
          const hasEmails = !!analysis.outreach_emails;
          const nextEmail = outreachCount + 1;
          const auditScore = analysis.audit_score;

          return (
            <div key={lead.id} className="rounded-xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-heading font-medium text-pacame-white">{lead.business_name || lead.name}</span>
                    {lead.score >= 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-pulse/15 text-lime-pulse font-mono">Hot</span>
                    )}
                    {auditScore !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        auditScore < 40 ? "bg-red-500/15 text-red-400" :
                        auditScore < 70 ? "bg-amber-500/15 text-amber-400" :
                        "bg-green-500/15 text-green-400"
                      }`}>
                        Web: {auditScore}/100
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-pacame-white/30 font-body">
                    {lead.email && <span>{lead.email}</span>}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      lead.status === "new" ? "bg-blue-500/15 text-blue-400" :
                      lead.status === "contacted" ? "bg-amber-500/15 text-amber-400" :
                      lead.status === "qualified" ? "bg-electric-violet/15 text-electric-violet" :
                      "bg-white/[0.05] text-pacame-white/40"
                    }`}>
                      {lead.status}
                    </span>
                    {outreachCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />{outreachCount}/3 enviados
                      </span>
                    )}
                    {analysis.campaign && (
                      <span className="text-pacame-white/20">{analysis.campaign}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasEmails && nextEmail <= 3 && lead.email && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleSendOutreach(lead.id, nextEmail)}
                      disabled={sendingOutreach === lead.id}
                      className="gap-1"
                    >
                      {sendingOutreach === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Email #{nextEmail}
                    </Button>
                  )}
                  {!hasEmails && (
                    <span className="text-[10px] text-pacame-white/20 font-body flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />Sin emails generados
                    </span>
                  )}
                  {outreachCount >= 3 && (
                    <span className="text-[10px] text-pacame-white/20 font-body">Secuencia completa</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
