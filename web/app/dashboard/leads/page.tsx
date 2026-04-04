"use client";

import { useState } from "react";
import {
  UserPlus, Search, Filter, Phone, Mail, MessageSquare,
  Star, Clock, ArrowUpRight, Building2,
} from "lucide-react";

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

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageSquare,
  web_form: ArrowUpRight,
  phone: Phone,
  ads: Star,
  referral: UserPlus,
};

// Mock data
const mockLeads = [
  {
    id: "1", name: "Maria Garcia", email: "maria@clinicasol.com", phone: "+34612345678",
    business_name: "Clinica Dental Sol", business_type: "clinicas", problem: "No aparecemos en Google, nuestra web tiene 10 anos",
    budget: "1.500 – 3.000 €", source: "web_form", score: 5, status: "qualified",
    sage_analysis: { recommended_services: ["web", "seo"], estimated_value_monthly: 497, estimated_value_onetime: 1500 },
    created_at: "2026-04-04T10:30:00Z",
  },
  {
    id: "2", name: "Carlos Ruiz", email: "carlos@elpatio.com", phone: "+34698765432",
    business_name: "Restaurante El Patio", business_type: "restaurantes", problem: "Quiero llenar mesas entre semana",
    budget: "500 – 1.500 €", source: "whatsapp", score: 4, status: "proposal_sent",
    sage_analysis: { recommended_services: ["redes", "web"], estimated_value_monthly: 397, estimated_value_onetime: 800 },
    created_at: "2026-04-03T15:20:00Z",
  },
  {
    id: "3", name: "Ana Lopez", email: "ana@example.com", phone: "+34611222333",
    business_name: "Boutique Moda Ana", business_type: "tiendas", problem: "Quiero vender online",
    budget: "3.000 – 5.000 €", source: "ads", score: 3, status: "nurturing",
    sage_analysis: { recommended_services: ["ecommerce", "ads"], estimated_value_monthly: 297, estimated_value_onetime: 3000 },
    created_at: "2026-04-02T09:00:00Z",
  },
];

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
    <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium ${colors[score]}`}>
      {score}/5
    </span>
  );
}

export default function LeadsPage() {
  const [filter, setFilter] = useState("all");

  const filteredLeads = filter === "all" ? mockLeads : mockLeads.filter((l) => l.status === filter);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Leads</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">{mockLeads.length} leads en pipeline</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Todos" },
          { key: "new", label: "Nuevos" },
          { key: "qualified", label: "Cualificados" },
          { key: "proposal_sent", label: "Propuesta" },
          { key: "negotiating", label: "Negociando" },
          { key: "won", label: "Ganados" },
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
          </button>
        ))}
      </div>

      {/* Lead cards */}
      <div className="space-y-3">
        {filteredLeads.map((lead) => {
          const st = statusLabels[lead.status] || { label: lead.status, color: "#6B7280" };
          return (
            <div
              key={lead.id}
              className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 p-5 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-pacame-white">{lead.name}</h3>
                    <ScoreBadge score={lead.score} />
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-body font-medium"
                      style={{ backgroundColor: `${st.color}20`, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <span className="flex items-center gap-1.5 text-xs text-pacame-white/50 font-body">
                      <Building2 className="w-3 h-3" />
                      {lead.business_name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-pacame-white/50 font-body">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-pacame-white/30 font-body">
                      <Clock className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>

                  <p className="text-sm text-pacame-white/60 font-body mb-3">{lead.problem}</p>

                  <div className="flex items-center gap-2">
                    {lead.sage_analysis.recommended_services.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-electric-violet/10 text-electric-violet/70 font-body">
                        {s}
                      </span>
                    ))}
                    <span className="text-xs text-pacame-white/30 font-body ml-2">
                      Presupuesto: {lead.budget}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-heading font-bold text-lime-pulse">
                    {lead.sage_analysis.estimated_value_onetime}€
                  </div>
                  <div className="text-[11px] text-pacame-white/40 font-body">
                    + {lead.sage_analysis.estimated_value_monthly}€/mes
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
