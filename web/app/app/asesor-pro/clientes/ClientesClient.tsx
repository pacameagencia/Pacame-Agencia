"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, X, ArrowUpRight, Loader2, Copy, Check } from "lucide-react";
import type { AsesorClient } from "@/lib/products/asesor-pro/queries";
import { validateClientCreate, type FieldError } from "@/lib/validators";

interface Props {
  initialClients: AsesorClient[];
}

interface NewClientForm {
  fiscal_name: string;
  nif: string;
  email: string;
  phone: string;
  city: string;
  iva_regime: string;
  send_invite: boolean;
}

const EMPTY_FORM: NewClientForm = {
  fiscal_name: "",
  nif: "",
  email: "",
  phone: "",
  city: "",
  iva_regime: "general",
  send_invite: false,
};

export default function ClientesClient({ initialClients }: Props) {
  const [clients, setClients] = useState<AsesorClient[]>(initialClients);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewClientForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.fiscal_name.toLowerCase().includes(q) ||
      c.nif.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateClientCreate(form);
    if (validation.length > 0) {
      const fe: Record<string, string> = {};
      for (const v of validation) fe[v.field] = v.message;
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    setError(null);
    setInviteUrl(null);
    try {
      const res = await fetch("/api/products/asesor-pro/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "validation_failed" && Array.isArray(json.details)) {
          const fe: Record<string, string> = {};
          for (const v of json.details as FieldError[]) fe[v.field] = v.message;
          setFieldErrors(fe);
        } else {
          setError(json.error ?? "error creando cliente");
        }
        return;
      }
      setClients([json.client, ...clients]);
      if (json.invite_url) setInviteUrl(json.invite_url);
      setForm(EMPTY_FORM);
      if (!json.invite_url) setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            AsesorPro · Clientes
          </span>
          <h1
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors"
          style={{ boxShadow: "3px 3px 0 #B54E30" }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Nuevo cliente"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="bg-paper border-2 border-indigo-600 p-6 space-y-4"
          style={{ boxShadow: "5px 5px 0 #283B70" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Razón social" required value={form.fiscal_name} onChange={(v) => setForm({ ...form, fiscal_name: v })} placeholder="Ej: Casa Marisol S.L." error={fieldErrors.fiscal_name} />
            <Field label="NIF / CIF" required value={form.nif} onChange={(v) => setForm({ ...form, nif: v })} placeholder="Ej: B12345678" error={fieldErrors.nif} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="opcional" error={fieldErrors.email} />
            <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="opcional" error={fieldErrors.phone} />
            <Field label="Ciudad" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="opcional" />
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
                Régimen IVA
              </span>
              <select
                value={form.iva_regime}
                onChange={(e) => setForm({ ...form, iva_regime: e.target.value })}
                className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-indigo-600"
              >
                <option value="general">General</option>
                <option value="recargo_eq">Recargo equivalencia</option>
                <option value="simplificado">Simplificado / módulos</option>
                <option value="agricultura">Agricultura</option>
                <option value="exento">Exento</option>
              </select>
            </label>
          </div>

          {form.email && (
            <label className="flex items-center gap-2 text-[13px] font-sans text-ink">
              <input
                type="checkbox"
                checked={form.send_invite}
                onChange={(e) => setForm({ ...form, send_invite: e.target.checked })}
                className="accent-indigo-600"
              />
              Generar link de invitación para que el cliente acceda a su panel
            </label>
          )}

          {error && (
            <div className="p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">{error}</div>
          )}

          {inviteUrl && (
            <div className="p-4 border-2 border-mustard-500 bg-mustard-500/10">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink mb-2">
                Link de invitación generado
              </p>
              <div className="flex items-center gap-2 bg-paper border border-ink/15 p-2">
                <code className="flex-1 text-[11px] font-mono text-ink-soft truncate">{inviteUrl}</code>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="flex items-center gap-1 px-2 py-1 bg-ink text-paper text-[10px] font-mono uppercase tracking-[0.1em]"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "copiado" : "copiar"}
                </button>
              </div>
              <p className="font-mono text-[11px] text-ink-mute mt-2">
                Envíaselo por WhatsApp al cliente. Cuando entre, podrá crear su cuenta y empezar a facturar.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-ink/15">
            <button
              type="submit"
              disabled={submitting || !form.fiscal_name || !form.nif}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-paper font-sans text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Guardar cliente
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-paper border-2 border-ink/30 focus-within:border-ink">
        <Search className="w-4 h-4 text-ink-mute" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, NIF o email..."
          className="flex-1 bg-transparent text-ink text-[14px] focus:outline-none placeholder:text-ink-mute/60"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-ink-mute hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-paper border-2 border-ink overflow-hidden" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-sans text-ink-mute text-sm mb-4">
              {search ? "Ningún cliente coincide con la búsqueda." : "Aún no tienes clientes."}
            </p>
            {!search && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper text-[13px] font-sans hover:bg-terracotta-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Añadir el primero
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-sand-100 border-b-2 border-ink">
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Razón social</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">NIF</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden md:table-cell">Email / Tel</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden lg:table-cell">Régimen</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-ink/10 hover:bg-sand-50 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-sans text-ink text-[14px] font-medium">{c.fiscal_name}</span>
                    {c.trade_name && (
                      <span className="block font-mono text-[10px] text-ink-mute mt-0.5">{c.trade_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-soft">{c.nif}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.email && <span className="font-mono text-[12px] text-ink-soft block">{c.email}</span>}
                    {c.phone && <span className="font-mono text-[11px] text-ink-mute">{c.phone}</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">{c.iva_regime}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/asesor-pro/clientes/${c.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-mono uppercase tracking-[0.15em] text-ink hover:text-terracotta-500 transition-colors"
                    >
                      Abrir
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string;
  type?: "text" | "email";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
        {label}
        {required && <span className="text-rose-alert ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        className={`w-full px-3 py-2 bg-paper border ${
          error ? "border-rose-alert" : "border-ink/30"
        } text-ink text-[14px] focus:outline-none focus:border-indigo-600 placeholder:text-ink-mute/50`}
      />
      {error && (
        <span className="block mt-1 font-sans text-[12px] text-rose-alert">{error}</span>
      )}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: "bg-olive-500/20 text-olive-600", label: "activo" },
    invited: { color: "bg-mustard-500/20 text-mustard-700", label: "invitado" },
    paused: { color: "bg-ink-mute/20 text-ink-mute", label: "pausa" },
    archived: { color: "bg-rose-alert/20 text-rose-alert", label: "archivado" },
  };
  const cfg = map[status] ?? map.paused;
  return (
    <span className={`inline-block font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
