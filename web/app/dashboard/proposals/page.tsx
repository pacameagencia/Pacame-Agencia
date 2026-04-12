"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  FileCheck, Plus, X, Send, Eye, Clock, CheckCircle2,
  XCircle, RefreshCw, ExternalLink, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Proposal {
  id: string;
  lead_id: string;
  brief_original: string;
  sage_analysis: Record<string, unknown>;
  services_proposed: Array<{ name: string; type: string; price: number }>;
  total_onetime: number;
  total_monthly: number;
  pdf_url: string;
  preview_web_url: string;
  status: string;
  sent_at: string;
  viewed_at: string;
  accepted_at: string;
  feedback: string;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  business_name: string;
  email: string;
  problem: string;
  budget: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  generating: { label: "Generando", color: "#D97706", icon: RefreshCw },
  ready: { label: "Lista", color: "#2563EB", icon: FileCheck },
  sent: { label: "Enviada", color: "#7C3AED", icon: Send },
  viewed: { label: "Vista", color: "#06B6D4", icon: Eye },
  accepted: { label: "Aceptada", color: "#16A34A", icon: CheckCircle2 },
  rejected: { label: "Rechazada", color: "#EF4444", icon: XCircle },
  expired: { label: "Expirada", color: "#6B7280", icon: Clock },
};

const serviceTemplates = [
  { name: "Landing Page", type: "onetime", price: 300 },
  { name: "Web Corporativa", type: "onetime", price: 800 },
  { name: "Web Premium (6-10 pags)", type: "onetime", price: 1500 },
  { name: "E-commerce Basico", type: "onetime", price: 2000 },
  { name: "Branding Completo", type: "onetime", price: 800 },
  { name: "RRSS Starter (1 red)", type: "monthly", price: 197 },
  { name: "RRSS Growth (2 redes)", type: "monthly", price: 397 },
  { name: "RRSS Premium (3+ redes)", type: "monthly", price: 697 },
  { name: "SEO Basico", type: "monthly", price: 397 },
  { name: "SEO Premium", type: "monthly", price: 797 },
  { name: "Meta Ads Gestion", type: "monthly", price: 397 },
  { name: "Google Ads Gestion", type: "monthly", price: 397 },
  { name: "Email Marketing", type: "monthly", price: 297 },
  { name: "Embudo Completo", type: "onetime", price: 1500 },
  { name: "Chatbot WhatsApp", type: "onetime", price: 500 },
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState("");

  const [form, setForm] = useState({
    lead_id: "",
    brief: "",
    services: [] as Array<{ name: string; type: string; price: number }>,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [proposalsRes, leadsRes] = await Promise.all([
      supabase.from("proposals").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, name, business_name, email, problem, budget").order("created_at", { ascending: false }),
    ]);
    setProposals(proposalsRes.data || []);
    setLeads(leadsRes.data || []);
    setLoading(false);
  }

  function handleLeadSelect(leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    setForm({
      ...form,
      lead_id: leadId,
      brief: lead ? `Negocio: ${lead.business_name || "N/A"}\nContacto: ${lead.name}\nProblema: ${lead.problem || "N/A"}\nPresupuesto: ${lead.budget || "N/A"}` : "",
    });
  }

  function addService(template: typeof serviceTemplates[0]) {
    setForm({ ...form, services: [...form.services, { ...template }] });
  }

  function removeService(index: number) {
    setForm({ ...form, services: form.services.filter((_, i) => i !== index) });
  }

  function updateServicePrice(index: number, price: number) {
    const updated = [...form.services];
    updated[index] = { ...updated[index], price };
    setForm({ ...form, services: updated });
  }

  async function generateWithSage() {
    if (!form.brief) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "SAGE",
          message: `Analiza este brief de un lead y genera una recomendacion de servicios PACAME con precios. Se conciso y directo. Brief:\n\n${form.brief}`,
          history: [],
        }),
      });
      const data = await res.json();
      setGeneratedBrief(data.message || "");
    } catch {
      setGeneratedBrief("Error al generar analisis");
    }
    setGenerating(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.services.length === 0) return;
    setSaving(true);

    const totalOnetime = form.services.filter((s) => s.type === "onetime").reduce((sum, s) => sum + s.price, 0);
    const totalMonthly = form.services.filter((s) => s.type === "monthly").reduce((sum, s) => sum + s.price, 0);

    await supabase.from("proposals").insert({
      lead_id: form.lead_id || null,
      brief_original: form.brief,
      services_proposed: form.services,
      total_onetime: totalOnetime,
      total_monthly: totalMonthly,
      status: "ready",
    });

    setForm({ lead_id: "", brief: "", services: [] });
    setShowForm(false);
    setGeneratedBrief("");
    setSaving(false);
    fetchData();
  }

  async function updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status };
    if (status === "sent") updates.sent_at = new Date().toISOString();
    await supabase.from("proposals").update(updates).eq("id", id);
    fetchData();
  }

  // Stats
  const accepted = proposals.filter((p) => p.status === "accepted");
  const pending = proposals.filter((p) => ["ready", "sent", "viewed"].includes(p.status));
  const totalValue = accepted.reduce((s, p) => s + (Number(p.total_onetime) || 0) + (Number(p.total_monthly) || 0) * 12, 0);
  const conversionRate = proposals.length > 0 ? Math.round((accepted.length / proposals.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Propuestas</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${proposals.length} propuestas · ${pending.length} en pipeline · ${conversionRate}% conversion`}
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />Nueva propuesta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <FileCheck className="w-6 h-6 text-electric-violet mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{proposals.length}</div>
          <div className="text-xs text-pacame-white/40 font-body">Total</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <Send className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-neon-cyan">{pending.length}</div>
          <div className="text-xs text-pacame-white/40 font-body">En pipeline</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <CheckCircle2 className="w-6 h-6 text-lime-pulse mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-lime-pulse">{accepted.length}</div>
          <div className="text-xs text-pacame-white/40 font-body">Aceptadas</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <Sparkles className="w-6 h-6 text-electric-violet mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{totalValue.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-pacame-white/40 font-body">Valor aceptado (anualizado)</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-dark-card border border-electric-violet/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-pacame-white">Nueva propuesta</h2>
            <button type="button" onClick={() => { setShowForm(false); setGeneratedBrief(""); }} className="text-pacame-white/30 hover:text-pacame-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lead selector */}
          <select
            value={form.lead_id} onChange={(e) => handleLeadSelect(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
          >
            <option value="">— Seleccionar lead (opcional) —</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.business_name || l.name} — {l.email}</option>)}
          </select>

          {/* Brief */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-pacame-white/50 font-body">Brief / contexto del cliente</label>
              <Button type="button" size="sm" variant="ghost" onClick={generateWithSage} disabled={generating || !form.brief} className="gap-1 text-xs">
                <Sparkles className="w-3 h-3" />{generating ? "Analizando..." : "Analizar con Sage"}
              </Button>
            </div>
            <textarea
              rows={4} placeholder="Describe el negocio, problema y necesidades del cliente..."
              value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none resize-none"
            />
          </div>

          {/* Sage analysis */}
          {generatedBrief && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-heading font-medium text-amber-300">Analisis de Sage</span>
              </div>
              <p className="text-sm text-pacame-white/70 font-body whitespace-pre-wrap">{generatedBrief}</p>
            </div>
          )}

          {/* Service picker */}
          <div>
            <label className="text-xs text-pacame-white/50 font-body mb-2 block">Servicios propuestos</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {serviceTemplates.map((t) => (
                <button
                  key={t.name} type="button" onClick={() => addService(t)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-pacame-white/50 hover:text-pacame-white hover:border-electric-violet/30 font-body transition-colors"
                >
                  + {t.name} ({t.price}€{t.type === "monthly" ? "/mes" : ""})
                </button>
              ))}
            </div>
            {form.services.length > 0 && (
              <div className="space-y-2">
                {form.services.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-sm text-pacame-white font-body flex-1">{s.name}</span>
                    <input
                      type="number" step="1" value={s.price}
                      onChange={(e) => updateServicePrice(i, Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-mono text-right outline-none focus:border-electric-violet/50"
                    />
                    <span className="text-xs text-pacame-white/40 font-body">{s.type === "monthly" ? "€/mes" : "€"}</span>
                    <button type="button" onClick={() => removeService(i)} className="text-red-400/50 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div className="text-xs text-pacame-white/40 font-body">
                    Puntual: {form.services.filter((s) => s.type === "onetime").reduce((sum, s) => sum + s.price, 0).toLocaleString("es-ES")}€
                    {" · "}Mensual: {form.services.filter((s) => s.type === "monthly").reduce((sum, s) => sum + s.price, 0).toLocaleString("es-ES")}€/mes
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" variant="gradient" size="sm" disabled={saving || form.services.length === 0}>
            {saving ? "Guardando..." : "Crear propuesta"}
          </Button>
        </form>
      )}

      {/* Proposal list */}
      <div className="space-y-3">
        {!loading && proposals.length === 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
            <FileCheck className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
            <p className="text-sm text-pacame-white/40 font-body">Sin propuestas</p>
            <p className="text-xs text-pacame-white/25 font-body mt-1">Genera tu primera propuesta para un lead</p>
          </div>
        )}
        {proposals.map((p) => {
          const st = statusConfig[p.status] || statusConfig.generating;
          const StatusIcon = st.icon;
          const lead = leads.find((l) => l.id === p.lead_id);
          const services = (p.services_proposed || []) as Array<{ name: string; type: string; price: number }>;
          return (
            <div key={p.id} className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 p-5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusIcon className="w-4 h-4" style={{ color: st.color }} />
                    <h3 className="font-heading font-semibold text-pacame-white">
                      {lead?.business_name || lead?.name || "Propuesta"}
                    </h3>
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-body font-medium"
                      style={{ backgroundColor: `${st.color}20`, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-pacame-white/40 font-body">
                    {services.length > 0 && (
                      <span>{services.map((s) => s.name).join(", ")}</span>
                    )}
                    <span>{new Date(p.created_at).toLocaleDateString("es-ES")}</span>
                    {p.sent_at && <span>Enviada: {new Date(p.sent_at).toLocaleDateString("es-ES")}</span>}
                    {p.viewed_at && <span className="text-neon-cyan">Vista: {new Date(p.viewed_at).toLocaleDateString("es-ES")}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {Number(p.total_onetime) > 0 && (
                    <div className="text-sm font-heading font-bold text-pacame-white">{Number(p.total_onetime).toLocaleString("es-ES")}€</div>
                  )}
                  {Number(p.total_monthly) > 0 && (
                    <div className="text-sm font-heading font-bold text-lime-pulse">{Number(p.total_monthly).toLocaleString("es-ES")}€/mes</div>
                  )}
                </div>
              </div>
              {/* Actions */}
              {(p.status === "ready" || p.status === "sent" || p.status === "viewed") && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                  {p.status === "ready" && (
                    <Button size="sm" variant="gradient" onClick={() => updateStatus(p.id, "sent")} className="gap-1 text-xs h-7">
                      <Send className="w-3 h-3" />Marcar enviada
                    </Button>
                  )}
                  {(p.status === "sent" || p.status === "viewed") && (
                    <>
                      <Button size="sm" variant="gradient" onClick={() => updateStatus(p.id, "accepted")} className="gap-1 text-xs h-7">
                        <CheckCircle2 className="w-3 h-3" />Aceptada
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "rejected")} className="gap-1 text-xs h-7 text-red-400">
                        <XCircle className="w-3 h-3" />Rechazada
                      </Button>
                    </>
                  )}
                  {p.pdf_url && (
                    <a href={p.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-electric-violet/70 hover:text-electric-violet flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />PDF
                    </a>
                  )}
                </div>
              )}
              {/* Feedback */}
              {p.feedback && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <p className="text-xs text-pacame-white/50 font-body">Feedback: {p.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
