"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneCall, Plus, X,
  Clock, ThumbsUp, ThumbsDown, Minus, FileText, Bot, Loader2,
  Sparkles, AlertCircle,
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
  phone: string;
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
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calling, setCalling] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "outbound" | "inbound">("all");
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
  const [callForm, setCallForm] = useState({
    contact_type: "lead" as "lead" | "client",
    contact_id: "",
    phone_number: "",
    purpose: "discovery",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [callsRes, leadsRes, clientsRes] = await Promise.all([
      supabase.from("voice_calls").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("leads").select("id, name, phone"),
      supabase.from("clients").select("id, name, phone"),
    ]);
    setCalls(callsRes.data || []);
    const allContacts: Contact[] = [
      ...(leadsRes.data || []).map((l: Record<string, string>) => ({ id: l.id, name: l.name, phone: l.phone || "", type: "lead" as const })),
      ...(clientsRes.data || []).map((c: Record<string, string>) => ({ id: c.id, name: c.name, phone: c.phone || "", type: "client" as const })),
    ];
    setContacts(allContacts);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log",
        lead_id: form.contact_type === "lead" ? form.contact_id || null : null,
        client_id: form.contact_type === "client" ? form.contact_id || null : null,
        direction: form.direction,
        purpose: form.purpose || null,
        summary: form.summary || null,
        sentiment: form.sentiment,
        outcome: form.outcome || null,
        next_action: form.next_action || null,
        duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      }),
    });
    setForm({ contact_type: "lead", contact_id: "", direction: "outbound", purpose: "", summary: "", sentiment: "neutral", outcome: "", next_action: "", duration_seconds: "" });
    setShowForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleInitiateCall(e: React.FormEvent) {
    e.preventDefault();
    if (!callForm.phone_number.trim()) return;
    setCalling(true);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          lead_id: callForm.contact_type === "lead" ? callForm.contact_id || null : null,
          client_id: callForm.contact_type === "client" ? callForm.contact_id || null : null,
          phone_number: callForm.phone_number.trim(),
          purpose: callForm.purpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Llamada iniciada. Vapi call ID: ${data.vapi_call_id}`);
        setShowCallDialog(false);
        setCallForm({ contact_type: "lead", contact_id: "", phone_number: "", purpose: "discovery" });
        fetchData();
      }
    } catch {
      alert("Error de conexion");
    }

    setCalling(false);
  }

  async function handleSummarize(callId: string) {
    setSummarizing(callId);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize", call_id: callId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Error de conexion");
    }
    setSummarizing(null);
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

  // Auto-fill phone when selecting a contact
  function handleCallContactChange(contactId: string) {
    const contact = contacts.find((c) => c.id === contactId);
    setCallForm({
      ...callForm,
      contact_id: contactId,
      phone_number: contact?.phone || callForm.phone_number,
    });
  }

  // Filtered calls
  const filteredCalls = filter === "all" ? calls : calls.filter((c) => c.direction === filter);

  // Stats
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration_seconds || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const totalCost = calls.reduce((s, c) => s + (Number(c.cost_eur) || 0), 0);
  const positiveRate = totalCalls > 0 ? Math.round((calls.filter((c) => c.sentiment === "positive").length / totalCalls) * 100) : 0;
  const vapiCalls = calls.filter((c) => c.vapi_call_id).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink">Llamadas</h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            {loading ? "Cargando..." : `${totalCalls} llamadas · ${vapiCalls} via Vapi · ${positiveRate}% positivas`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="gradient" size="sm"
            onClick={() => setShowCallDialog(!showCallDialog)}
            className="gap-1.5"
          >
            <PhoneCall className="w-4 h-4" />Llamar con Sage
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />Registrar manual
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <Phone className="w-6 h-6 text-brand-primary mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-ink">{totalCalls}</div>
          <div className="text-xs text-ink/40 font-body">Total llamadas</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <Clock className="w-6 h-6 text-mint mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-mint">{formatDuration(avgDuration)}</div>
          <div className="text-xs text-ink/40 font-body">Duracion media</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <ThumbsUp className="w-6 h-6 text-mint mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-mint">{positiveRate}%</div>
          <div className="text-xs text-ink/40 font-body">Sentimiento positivo</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <Bot className="w-6 h-6 text-brand-primary mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-ink">{totalCost.toFixed(2)}€</div>
          <div className="text-xs text-ink/40 font-body">Coste Vapi</div>
        </div>
      </div>

      {/* Vapi Call Dialog */}
      {showCallDialog && (
        <form onSubmit={handleInitiateCall} className="rounded-2xl bg-paper-deep border border-brand-primary/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-ink">Llamar con Sage (Vapi)</h2>
                <p className="text-xs text-ink/40 font-body">Sage hara un diagnostico del negocio por telefono</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowCallDialog(false)} className="text-ink/30 hover:text-ink/60">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={callForm.contact_type}
              onChange={(e) => setCallForm({ ...callForm, contact_type: e.target.value as "lead" | "client", contact_id: "", phone_number: "" })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="lead">Lead</option>
              <option value="client">Cliente</option>
            </select>
            <select
              value={callForm.contact_id}
              onChange={(e) => handleCallContactChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="">— Seleccionar contacto —</option>
              {contacts.filter((c) => c.type === callForm.contact_type).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Telefono (+34...)"
              value={callForm.phone_number}
              onChange={(e) => setCallForm({ ...callForm, phone_number: e.target.value })}
              required
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <select
              value={callForm.purpose}
              onChange={(e) => setCallForm({ ...callForm, purpose: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="discovery">Diagnostico inicial</option>
              <option value="followup">Seguimiento</option>
              <option value="proposal">Presentar propuesta</option>
              <option value="onboarding">Onboarding</option>
              <option value="support">Soporte</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="gradient" size="sm" disabled={calling} className="gap-1.5">
              {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
              {calling ? "Iniciando llamada..." : "Iniciar llamada"}
            </Button>
            <p className="text-xs text-ink/30 font-body">
              Sage llamara al contacto y te enviara un resumen por email.
            </p>
          </div>
        </form>
      )}

      {/* Manual Log Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-paper-deep border border-ink/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-ink">Registrar llamada manual</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink/30 hover:text-ink/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="outbound">Saliente</option>
              <option value="inbound">Entrante</option>
            </select>
            <select
              value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value as "lead" | "client", contact_id: "" })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="lead">Lead</option>
              <option value="client">Cliente</option>
            </select>
            <select
              value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="">— Contacto —</option>
              {contacts.filter((c) => c.type === form.contact_type).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Proposito (ej: Diagnostico inicial)"
              value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              type="number" placeholder="Duracion (segundos)"
              value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <select
              value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
            <input
              placeholder="Resultado de la llamada"
              value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              placeholder="Siguiente accion"
              value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <textarea
              rows={3} placeholder="Resumen de la llamada"
              value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="col-span-full px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none resize-none"
            />
          </div>
          <Button type="submit" variant="gradient" size="sm" disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["all", "outbound", "inbound"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body transition-colors ${
              filter === f
                ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                : "bg-white/[0.03] text-ink/40 border border-ink/[0.06] hover:text-ink/60"
            }`}
          >
            {f === "all" ? "Todas" : f === "outbound" ? "Salientes" : "Entrantes"}
          </button>
        ))}
      </div>

      {/* Call list */}
      <div className="space-y-2">
        {!loading && filteredCalls.length === 0 && (
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
            <Phone className="w-8 h-8 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40 font-body">Sin llamadas registradas</p>
            <p className="text-xs text-ink/50 font-body mt-1">Usa &quot;Llamar con Sage&quot; para iniciar una llamada automatica</p>
          </div>
        )}
        {filteredCalls.map((call) => {
          const sent = sentimentConfig[call.sentiment] || sentimentConfig.neutral;
          const SentIcon = sent.icon;
          const isExpanded = expandedId === call.id;
          const isVapi = !!call.vapi_call_id;
          return (
            <div key={call.id} className={`rounded-xl bg-paper-deep border transition-all ${isVapi ? "border-brand-primary/15 hover:border-brand-primary/30" : "border-ink/[0.06] hover:border-white/10"}`}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : call.id)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isVapi ? "bg-brand-primary/20" : "bg-white/[0.05]"}`}>
                  {call.direction === "inbound" ? (
                    <PhoneIncoming className="w-4 h-4 text-mint" />
                  ) : (
                    <PhoneOutgoing className={`w-4 h-4 ${isVapi ? "text-brand-primary" : "text-ink/40"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-heading font-medium text-ink">{getContactName(call)}</span>
                    <SentIcon className="w-3.5 h-3.5" style={{ color: sent.color }} />
                    {isVapi && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/15 text-brand-primary font-mono">Vapi</span>
                    )}
                    {call.purpose && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-ink/40 font-body">{call.purpose}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-ink/30 font-body">
                    <span>{new Date(call.created_at).toLocaleDateString("es-ES")} {new Date(call.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                    {call.duration_seconds > 0 && <span><Clock className="w-3 h-3 inline mr-0.5" />{formatDuration(call.duration_seconds)}</span>}
                    {call.cost_eur > 0 && <span>{Number(call.cost_eur).toFixed(3)}€</span>}
                  </div>
                </div>
                {call.outcome && (
                  <span className="text-xs text-ink/50 font-body flex-shrink-0 max-w-[200px] truncate">{call.outcome}</span>
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3 ml-12">
                  {call.summary && (
                    <div>
                      <div className="text-[11px] text-ink/30 font-body mb-1">Resumen</div>
                      <p className="text-sm text-ink/70 font-body">{call.summary}</p>
                    </div>
                  )}
                  {call.next_action && (
                    <div>
                      <div className="text-[11px] text-ink/30 font-body mb-1">Siguiente accion</div>
                      <p className="text-sm text-brand-primary/80 font-body">{call.next_action}</p>
                    </div>
                  )}
                  {call.transcript && (
                    <div>
                      <div className="text-[11px] text-ink/30 font-body mb-1">Transcripcion</div>
                      <p className="text-xs text-ink/50 font-body whitespace-pre-wrap max-h-48 overflow-auto">{call.transcript}</p>
                    </div>
                  )}
                  {/* AI Summarize button for calls with transcripts but no summary */}
                  {call.transcript && !call.summary && (
                    <Button
                      variant="outline" size="sm"
                      onClick={(e) => { e.stopPropagation(); handleSummarize(call.id); }}
                      disabled={summarizing === call.id}
                      className="gap-1.5"
                    >
                      {summarizing === call.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Analizar con IA
                    </Button>
                  )}
                  {!call.transcript && !call.summary && (
                    <div className="flex items-center gap-2 text-xs text-ink/50 font-body">
                      <AlertCircle className="w-3 h-3" />
                      Sin transcripcion ni resumen
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
