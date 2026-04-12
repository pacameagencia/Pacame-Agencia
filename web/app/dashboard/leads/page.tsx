"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  UserPlus, Phone, Mail, MessageSquare,
  Clock, Building2, Sparkles, Loader2,
  ChevronDown, Check, UserCheck, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Nuevo", color: "#06B6D4" },
  contacted: { label: "Contactado", color: "#2563EB" },
  nurturing: { label: "Nurturing", color: "#7C3AED" },
  qualified: { label: "Cualificado", color: "#D97706" },
  proposal_sent: { label: "Propuesta enviada", color: "#EA580C" },
  proposal_viewed: { label: "Propuesta vista", color: "#EC4899" },
  negotiating: { label: "Negociando", color: "#F59E0B" },
  won: { label: "Ganado", color: "#16A34A" },
  lost: { label: "Perdido", color: "#EF4444" },
  dormant: { label: "Dormido", color: "#6B7280" },
};

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  business_type: string;
  problem: string;
  budget: string;
  source: string;
  score: number;
  status: string;
  sage_analysis: { recommended_services?: string[]; estimated_value_monthly?: number; estimated_value_onetime?: number };
  created_at: string;
}

function ScoreBadge({ score }: { score: number }) {
  const colors = [
    "bg-gray-500/20 text-gray-400",
    "bg-red-500/20 text-red-400",
    "bg-yellow-500/20 text-yellow-400",
    "bg-blue-500/20 text-blue-400",
    "bg-orange-500/20 text-orange-400",
    "bg-lime-500/20 text-lime-400",
  ];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium ${colors[score] || colors[0]}`}>
      {score}/5
    </span>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generatingProposal, setGeneratingProposal] = useState<string | null>(null);
  const [convertingLead, setConvertingLead] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

  async function fetchLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  async function generateProposal(leadId: string) {
    setGeneratingProposal(leadId);
    try {
      await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", lead_id: leadId }),
      });
      window.open("/dashboard/proposals", "_blank");
    } catch {
      // silently handle
    }
    setGeneratingProposal(null);
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    setStatusDropdownId(null);
    fetchLeads();
  }

  async function convertToClient(lead: Lead) {
    setConvertingLead(lead.id);
    try {
      // Create client from lead data
      await supabase.from("clients").insert({
        name: lead.name,
        business_name: lead.business_name || lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        business_type: lead.business_type || null,
        status: "onboarding",
        plan: null,
        monthly_fee: lead.sage_analysis?.estimated_value_monthly || null,
        notes: `Convertido desde lead. Problema original: ${lead.problem || "N/A"}`,
      });

      // Mark lead as won
      await supabase.from("leads").update({ status: "won" }).eq("id", lead.id);

      // Initialize onboarding
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "initialize", client_name: lead.business_name || lead.name }),
        });
      } catch {
        // Non-blocking
      }

      fetchLeads();
    } catch {
      // handle error
    }
    setConvertingLead(null);
  }

  const filteredLeads = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  // Pipeline summary
  const pipelineCounts = Object.entries(statusLabels).reduce((acc, [key]) => {
    acc[key] = leads.filter((l) => l.status === key).length;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = leads.reduce((sum, l) => {
    const monthly = l.sage_analysis?.estimated_value_monthly || 0;
    const onetime = l.sage_analysis?.estimated_value_onetime || 0;
    return sum + onetime + monthly;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Leads</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${leads.length} leads en pipeline · Valor estimado: ${totalValue.toLocaleString("es-ES")}€`}
          </p>
        </div>
      </div>

      {/* Pipeline mini-stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: "new", label: "Nuevos", icon: "🆕" },
          { key: "qualified", label: "Cualificados", icon: "⭐" },
          { key: "proposal_sent", label: "Propuestas", icon: "📄" },
          { key: "negotiating", label: "Negociando", icon: "🤝" },
          { key: "won", label: "Ganados", icon: "✅" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key === filter ? "all" : s.key)}
            className={`rounded-xl p-3 text-center transition-all border ${
              filter === s.key
                ? "bg-electric-violet/10 border-electric-violet/30"
                : "bg-dark-card border-white/[0.06] hover:border-white/10"
            }`}
          >
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-heading font-bold text-pacame-white mt-1">{pipelineCounts[s.key] || 0}</div>
            <div className="text-[10px] text-pacame-white/40 font-body">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Todos" },
          ...Object.entries(statusLabels).map(([key, v]) => ({ key, label: v.label })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
              filter === f.key
                ? "bg-electric-violet/20 text-electric-violet border border-electric-violet/30"
                : "text-pacame-white/40 border border-white/[0.06] hover:border-white/10"
            }`}
          >
            {f.label}
            {f.key !== "all" && pipelineCounts[f.key] > 0 && (
              <span className="ml-1 text-pacame-white/30">{pipelineCounts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Lead cards */}
      <div className="space-y-3">
        {!loading && filteredLeads.length === 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
            <UserPlus className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
            <p className="text-sm text-pacame-white/40 font-body">Sin leads{filter !== "all" ? ` con estado "${statusLabels[filter]?.label || filter}"` : ""}</p>
          </div>
        )}
        {filteredLeads.map((lead) => {
          const st = statusLabels[lead.status] || { label: lead.status, color: "#6B7280" };
          const services = lead.sage_analysis?.recommended_services || [];
          const onetime = lead.sage_analysis?.estimated_value_onetime || 0;
          const monthly = lead.sage_analysis?.estimated_value_monthly || 0;
          const canConvert = ["qualified", "proposal_sent", "proposal_viewed", "negotiating"].includes(lead.status);
          return (
            <div key={lead.id} className="group rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 p-5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-pacame-white">{lead.name}</h3>
                    <ScoreBadge score={lead.score} />

                    {/* Status dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdownId(statusDropdownId === lead.id ? null : lead.id)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-body font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${st.color}20`, color: st.color }}
                      >
                        {st.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {statusDropdownId === lead.id && (
                        <div className="absolute top-full left-0 mt-1 rounded-lg bg-dark-card border border-white/[0.1] shadow-xl z-10 overflow-hidden min-w-[160px]">
                          {Object.entries(statusLabels).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => updateLeadStatus(lead.id, key)}
                              className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs font-body hover:bg-white/[0.06] transition-colors ${
                                lead.status === key ? "bg-white/[0.04]" : ""
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                              <span style={{ color: val.color }}>{val.label}</span>
                              {lead.status === key && <Check className="w-3 h-3 ml-auto" style={{ color: val.color }} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {lead.source && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/30 font-body">{lead.source}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    {lead.business_name && (
                      <span className="flex items-center gap-1.5 text-xs text-pacame-white/50 font-body">
                        <Building2 className="w-3 h-3" />{lead.business_name}
                      </span>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-xs text-pacame-white/50 hover:text-electric-violet/70 font-body transition-colors">
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-pacame-white/50 hover:text-electric-violet/70 font-body transition-colors">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </a>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-pacame-white/30 font-body">
                      <Clock className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>

                  {lead.problem && <p className="text-sm text-pacame-white/60 font-body mb-3">{lead.problem}</p>}

                  <div className="flex items-center gap-2 flex-wrap">
                    {services.map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-electric-violet/10 text-electric-violet/70 font-body">{s}</span>
                    ))}
                    {lead.budget && (
                      <span className="text-xs text-pacame-white/30 font-body ml-2">Presupuesto: {lead.budget}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {(onetime > 0 || monthly > 0) && (
                    <div className="text-right">
                      {onetime > 0 && <div className="text-sm font-heading font-bold text-lime-pulse">{onetime.toLocaleString("es-ES")}€</div>}
                      {monthly > 0 && <div className="text-[11px] text-pacame-white/40 font-body">+ {monthly.toLocaleString("es-ES")}€/mes</div>}
                    </div>
                  )}

                  {/* Quick contact */}
                  <div className="flex gap-1.5">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                        title="Email"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5">
                    {lead.score >= 3 && lead.status !== "won" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        disabled={generatingProposal === lead.id}
                        onClick={() => generateProposal(lead.id)}
                      >
                        {generatingProposal === lead.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />Generando...</>
                        ) : (
                          <><Sparkles className="w-3 h-3" />Propuesta IA</>
                        )}
                      </Button>
                    )}
                    {canConvert && (
                      <Button
                        variant="gradient"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        disabled={convertingLead === lead.id}
                        onClick={() => convertToClient(lead)}
                      >
                        {convertingLead === lead.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />Convirtiendo...</>
                        ) : (
                          <><UserCheck className="w-3 h-3" />Convertir a cliente</>
                        )}
                      </Button>
                    )}
                    {lead.status === "won" && (
                      <a href="/dashboard/clients" className="flex items-center gap-1 text-xs text-green-400/70 hover:text-green-400 font-body transition-colors">
                        <ExternalLink className="w-3 h-3" />Ver cliente
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
