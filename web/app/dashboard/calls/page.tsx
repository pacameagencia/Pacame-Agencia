"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Phone, PhoneIncoming, PhoneOutgoing, Plus, X,
  Clock, ThumbsUp, ThumbsDown, Minus, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceCall {
  id: string;
  lead_id: string;
  client_id: string;
  direction: string;
  purpose: string;
  duration_seconds: number;
  transcript: string;
  summary: string;
  sentiment: string;
  outcome: string;
  next_action: string;
  vapi_call_id: string;
  cost_eur: number;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  type: "lead" | "client";
}

const sentimentConfig: Record<string, { label: string; color: string; icon: typeof ThumbsUp }> = {
  positive: { label: "Positivo", color: "#16A34A", icon: ThumbsUp },
  neutral: { label: "Neutral", color: "#6B7280", icon: Minus },
  negative: { label: "Negativo", color: "#EF4444", icon: ThumbsDown },
};

export default function CallsPage() {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contact_type: "lead" as "lead" | "client",
    contact_id: "",
    direction: "outbound",
    purpose: "",
    summary: "",
    sentiment: "neutral",
    outcome: "",
    next_action: "",
    duration_seconds: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [callsRes, leadsRes, clientsRes] = await Promise.all([
      supabase.from("voice_calls").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("leads").select("id, name"),
      supabase.from("clients").select("id, name"),
    ]);
    setCalls(callsRes.data || []);
    const allContacts: Contact[] = [
      ...(leadsRes.data || []).map((l) => ({ id: l.id, name: l.name, type: "lead" as const })),
      ...(clientsRes.data || []).map((c) => ({ id: c.id, name: c.name, type: "client" as const })),
    ];
    setContacts(allContacts);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("voice_calls").insert({
      lead_id: form.contact_type === "lead" ? form.contact_id || null : null,
      client_id: form.contact_type === "client" ? form.contact_id || null : null,
      direction: form.direction,
      purpose: form.purpose || null,
      summary: form.summary || null,
      sentiment: form.sentiment,
      outcome: form.outcome || null,
      next_action: form.next_action || null,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
    });
    setForm({ contact_type: "lead", contact_id: "", direction: "outbound", purpose: "", summary: "", sentiment: "neutral", outcome: "", next_action: "", duration_seconds: "" });
    setShowForm(false);
    setSaving(false);
    fetchData();
  }

  function formatDuration(seconds: number): string {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function getContactName(call: VoiceCall): string {
    if (call.lead_id) {
      return contacts.find((c) => c.id === call.lead_id)?.name || "Lead";
    }
    if (call.client_id) {
      return contacts.find((c) => c.id === call.client_id)?.name || "Cliente";
    }
    return "Desconocido";
  }

  // Stats
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration_seconds || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const totalCost = calls.reduce((s, c) => s + (Number(c.cost_eur) || 0), 0);
  const positiveRate = totalCalls > 0 ? Math.round((calls.filter((c) => c.sentiment === "positive").length / totalCalls) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Llamadas</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${totalCalls} llamadas · ${positiveRate}% positivas`}
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />Registrar llamada
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <Phone className="w-6 h-6 text-electric-violet mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{totalCalls}</div>
          <div className="text-xs text-pacame-white/40 font-body">Total llamadas</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <Clock className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-neon-cyan">{formatDuration(avgDuration)}</div>
          <div className="text-xs text-pacame-white/40 font-body">Duracion media</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <ThumbsUp className="w-6 h-6 text-lime-pulse mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-lime-pulse">{positiveRate}%</div>
          <div className="text-xs text-pacame-white/40 font-body">Sentimiento positivo</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <FileText className="w-6 h-6 text-electric-violet mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{totalCost.toFixed(2)}€</div>
          <div className="text-xs text-pacame-white/40 font-body">Coste total (Vapi)</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-dark-card border border-electric-violet/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-pacame-white">Registrar llamada</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-pacame-white/30 hover:text-pacame-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="outbound">Saliente</option>
              <option value="inbound">Entrante</option>
            </select>
            <select
              value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value as "lead" | "client", contact_id: "" })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="lead">Lead</option>
              <option value="client">Cliente</option>
            </select>
            <select
              value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="">— Contacto —</option>
              {contacts.filter((c) => c.type === form.contact_type).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Proposito (ej: Diagnostico inicial)"
              value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              type="number" placeholder="Duracion (segundos)"
              value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <select
              value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
            <input
              placeholder="Resultado de la llamada"
              value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              placeholder="Siguiente accion"
              value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <textarea
              rows={3} placeholder="Resumen de la llamada"
              value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="col-span-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none resize-none"
            />
          </div>
          <Button type="submit" variant="gradient" size="sm" disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      )}

      {/* Call list */}
      <div className="space-y-2">
        {!loading && calls.length === 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
            <Phone className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
            <p className="text-sm text-pacame-white/40 font-body">Sin llamadas registradas</p>
            <p className="text-xs text-pacame-white/25 font-body mt-1">Las llamadas via Vapi apareceran aqui automaticamente</p>
          </div>
        )}
        {calls.map((call) => {
          const sent = sentimentConfig[call.sentiment] || sentimentConfig.neutral;
          const SentIcon = sent.icon;
          const isExpanded = expandedId === call.id;
          return (
            <div key={call.id} className="rounded-xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all">
              <button
                onClick={() => setExpandedId(isExpanded ? null : call.id)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-electric-violet/10 flex-shrink-0">
                  {call.direction === "inbound" ? (
                    <PhoneIncoming className="w-4 h-4 text-neon-cyan" />
                  ) : (
                    <PhoneOutgoing className="w-4 h-4 text-electric-violet" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-heading font-medium text-pacame-white">{getContactName(call)}</span>
                    <SentIcon className="w-3.5 h-3.5" style={{ color: sent.color }} />
                    {call.purpose && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/40 font-body">{call.purpose}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-pacame-white/30 font-body">
                    <span>{new Date(call.created_at).toLocaleDateString("es-ES")} {new Date(call.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                    {call.duration_seconds > 0 && <span><Clock className="w-3 h-3 inline mr-0.5" />{formatDuration(call.duration_seconds)}</span>}
                    {call.cost_eur > 0 && <span>{Number(call.cost_eur).toFixed(3)}€</span>}
                  </div>
                </div>
                {call.outcome && (
                  <span className="text-xs text-pacame-white/50 font-body flex-shrink-0 max-w-[200px] truncate">{call.outcome}</span>
                )}
              </button>
              {isExpanded && (call.summary || call.transcript || call.next_action) && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3 ml-12">
                  {call.summary && (
                    <div>
                      <div className="text-[11px] text-pacame-white/30 font-body mb-1">Resumen</div>
                      <p className="text-sm text-pacame-white/70 font-body">{call.summary}</p>
                    </div>
                  )}
                  {call.next_action && (
                    <div>
                      <div className="text-[11px] text-pacame-white/30 font-body mb-1">Siguiente accion</div>
                      <p className="text-sm text-electric-violet/80 font-body">{call.next_action}</p>
                    </div>
                  )}
                  {call.transcript && (
                    <div>
                      <div className="text-[11px] text-pacame-white/30 font-body mb-1">Transcripcion</div>
                      <p className="text-xs text-pacame-white/50 font-body whitespace-pre-wrap max-h-48 overflow-auto">{call.transcript}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
