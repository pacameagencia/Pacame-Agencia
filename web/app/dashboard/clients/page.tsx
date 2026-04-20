"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import { Users, Plus, Building2, Mail, Phone, Globe, X, Edit3, Trash2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, { label: string; color: string }> = {
  onboarding: { label: "Onboarding", color: "#D97706" },
  active: { label: "Activo", color: "#16A34A" },
  paused: { label: "Pausado", color: "#6B7280" },
  churned: { label: "Baja", color: "#EF4444" },
};

const planOptions = ["Starter", "Growth", "Scale", "Custom"];

interface Client {
  id: string;
  name: string;
  business_name: string;
  business_type: string;
  email: string;
  phone: string;
  website: string;
  plan: string;
  monthly_fee: number;
  status: string;
  created_at: string;
  notes: string;
}

const emptyForm = { name: "", business_name: "", email: "", phone: "", website: "", business_type: "", plan: "", monthly_fee: "", notes: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      business_name: form.business_name,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      business_type: form.business_type || null,
      plan: form.plan || null,
      monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null,
      notes: form.notes || null,
    };

    if (editingId) {
      await dbCall({ table: "clients", op: "update", data: payload, filter: { column: "id", value: editingId } });
    } else {
      await dbCall({ table: "clients", op: "insert", data: payload });
    }

    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    fetchClients();
  }

  function startEdit(client: Client) {
    setForm({
      name: client.name || "",
      business_name: client.business_name || "",
      email: client.email || "",
      phone: client.phone || "",
      website: client.website || "",
      business_type: client.business_type || "",
      plan: client.plan || "",
      monthly_fee: client.monthly_fee ? String(client.monthly_fee) : "",
      notes: client.notes || "",
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  async function updateStatus(clientId: string, newStatus: string) {
    await dbCall({ table: "clients", op: "update", data: { status: newStatus }, filter: { column: "id", value: clientId } });
    setStatusDropdownId(null);
    fetchClients();
  }

  async function deleteClient(clientId: string) {
    await dbCall({ table: "clients", op: "delete", filter: { column: "id", value: clientId } });
    fetchClients();
  }

  function cancelForm() {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  }

  const filtered = filter === "all" ? clients : clients.filter((c) => c.status === filter);
  const activeCount = clients.filter((c) => c.status === "active").length;
  const mrr = clients.filter((c) => c.status === "active").reduce((s, c) => s + (Number(c.monthly_fee) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink">Clientes</h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            {loading ? "Cargando..." : `${clients.length} total · ${activeCount} activos · MRR: ${mrr.toLocaleString("es-ES")}€`}
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }} className="gap-1.5">
          <Plus className="w-4 h-4" />Nuevo cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[{ key: "all", label: "Todos" }, ...Object.entries(statusLabels).map(([key, v]) => ({ key, label: v.label }))].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-body transition-colors ${
              filter === f.key ? "bg-brand-primary/20 text-brand-primary" : "bg-white/[0.04] text-ink/50 hover:text-ink/70"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 text-ink/30">
                {clients.filter((c) => c.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-paper-deep border border-brand-primary/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-ink">{editingId ? "Editar cliente" : "Nuevo cliente"}</h2>
            <button type="button" onClick={cancelForm} className="text-ink/30 hover:text-ink/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required placeholder="Nombre contacto *"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              required placeholder="Nombre negocio *"
              value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              type="email" placeholder="Email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              placeholder="Telefono"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              placeholder="Web"
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <input
              placeholder="Tipo de negocio"
              value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
            <select
              value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="" className="bg-dark-bg">Plan</option>
              {planOptions.map((p) => (
                <option key={p} value={p} className="bg-dark-bg">{p}</option>
              ))}
            </select>
            <input
              type="number" placeholder="Fee mensual (€)" step="0.01"
              value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
          </div>
          <textarea
            placeholder="Notas internas"
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none resize-none"
          />
          <div className="flex gap-3">
            <Button type="submit" variant="gradient" size="sm" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cliente"}
            </Button>
            {editingId && (
              <button type="button" onClick={cancelForm} className="text-xs text-ink/40 hover:text-ink/60 font-body">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Client list */}
      <div className="space-y-3">
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
            <Users className="w-8 h-8 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40 font-body">
              {filter === "all" ? "Sin clientes aun" : `Sin clientes con estado "${statusLabels[filter]?.label || filter}"`}
            </p>
            <p className="text-xs text-ink/50 font-body mt-1">
              {filter === "all" ? "Anade tu primer cliente para empezar" : "Cambia el filtro para ver otros clientes"}
            </p>
          </div>
        )}
        {filtered.map((client) => {
          const st = statusLabels[client.status] || { label: client.status, color: "#6B7280" };
          return (
            <div key={client.id} className="group rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 p-5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-ink">{client.business_name}</h3>

                    {/* Status dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdownId(statusDropdownId === client.id ? null : client.id)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-body font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${st.color}20`, color: st.color }}
                      >
                        {st.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {statusDropdownId === client.id && (
                        <div className="absolute top-full left-0 mt-1 rounded-lg bg-paper-deep border border-ink/[0.1] shadow-xl z-10 overflow-hidden min-w-[120px]">
                          {Object.entries(statusLabels).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => updateStatus(client.id, key)}
                              className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs font-body hover:bg-white/[0.06] transition-colors ${
                                client.status === key ? "bg-white/[0.04]" : ""
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                              <span style={{ color: val.color }}>{val.label}</span>
                              {client.status === key && <Check className="w-3 h-3 ml-auto" style={{ color: val.color }} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {client.plan && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary/70 font-body">{client.plan}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-ink/50 font-body">
                      <Building2 className="w-3 h-3" />{client.name}
                    </span>
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-brand-primary/70 font-body transition-colors">
                        <Mail className="w-3 h-3" />{client.email}
                      </a>
                    )}
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-brand-primary/70 font-body transition-colors">
                        <Phone className="w-3 h-3" />{client.phone}
                      </a>
                    )}
                    {client.website && (
                      <a href={client.website.startsWith("http") ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-brand-primary/70 font-body transition-colors">
                        <Globe className="w-3 h-3" />{client.website}
                      </a>
                    )}
                  </div>
                  {client.notes && (
                    <p className="text-xs text-ink/30 font-body mt-2 italic">{client.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {client.monthly_fee > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-heading font-bold text-mint">{Number(client.monthly_fee).toLocaleString("es-ES")}€</div>
                      <div className="text-[11px] text-ink/40 font-body">/mes</div>
                    </div>
                  )}
                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(client)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-ink/40" />
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400/50" />
                    </button>
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
