"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  CreditCard, Send, ExternalLink, CheckCircle2, XCircle,
  Plus, X, RefreshCw, Users, Repeat, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Client {
  id: string;
  name: string;
  business_name: string;
  email: string;
  monthly_fee: number;
  plan: string;
  status: string;
}

interface PaymentRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  client_id: string;
  invoice_number: string;
  date: string;
}

const PRODUCTS = [
  { key: "landing", label: "Landing Page", price: 300, recurring: false },
  { key: "web", label: "Web Corporativa", price: 800, recurring: false },
  { key: "social_monthly", label: "RRSS Mensual", price: 197, recurring: true },
  { key: "seo_monthly", label: "SEO Mensual", price: 297, recurring: true },
  { key: "pack_web_social", label: "Pack Web + RRSS", price: 800, recurring: true },
  { key: "custom", label: "Personalizado", price: 0, recurring: false },
];

export default function PaymentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    product: "landing",
    client_id: "",
    client_email: "",
    client_name: "",
    amount: "300",
    description: "",
    recurring: false,
  });

  useEffect(() => {
    fetchData();
    // Check URL params for success/cancelled
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccessMsg("Pago completado correctamente");
      window.history.replaceState({}, "", "/dashboard/payments");
    }
    if (params.get("cancelled") === "true") {
      setError("El pago fue cancelado");
      window.history.replaceState({}, "", "/dashboard/payments");
    }
  }, []);

  async function fetchData() {
    const [clientsRes, paymentsRes] = await Promise.all([
      supabase.from("clients").select("id, name, business_name, email, monthly_fee, plan, status").order("business_name"),
      supabase.from("finances").select("*").eq("type", "income").order("date", { ascending: false }).limit(50),
    ]);
    setClients(clientsRes.data || []);
    setPayments(paymentsRes.data || []);
    setLoading(false);
  }

  function handleProductChange(productKey: string) {
    const product = PRODUCTS.find((p) => p.key === productKey);
    setForm({
      ...form,
      product: productKey,
      amount: product?.price ? String(product.price) : form.amount,
      recurring: product?.recurring ?? false,
    });
  }

  function handleClientChange(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    setForm({
      ...form,
      client_id: clientId,
      client_email: client?.email || "",
      client_name: client?.name || "",
    });
  }

  async function generatePaymentLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setLinkGenerated(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: form.product,
          client_name: form.client_name,
          client_email: form.client_email,
          client_id: form.client_id,
          amount: Number(form.amount),
          description: form.description,
          recurring: form.recurring,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar link");

      setLinkGenerated(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSending(false);
    }
  }

  async function openPortal(email: string) {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al abrir portal");
    }
  }

  // Stats
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthPayments = payments.filter((p) => p.date?.startsWith(monthKey));
  const monthTotal = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const stripePayments = payments.filter((p) => p.category === "stripe" || p.category === "subscription" || p.description?.includes("Stripe"));
  const activeSubscribers = clients.filter((c) => c.status === "active" && c.monthly_fee > 0);
  const mrr = activeSubscribers.reduce((s, c) => s + (Number(c.monthly_fee) || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink">Pagos</h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            {loading ? "Cargando..." : "Stripe Checkout · Links de pago · Suscripciones"}
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => { setShowForm(!showForm); setLinkGenerated(null); setError(null); }} className="gap-1.5">
          <Plus className="w-4 h-4" />Generar link de pago
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-300 font-body">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-400/50 hover:text-green-400"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300 font-body">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <CreditCard className="w-6 h-6 text-brand-primary mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-ink">{monthTotal.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-ink/40 font-body">Cobrado este mes</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <Repeat className="w-6 h-6 text-mint mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-mint">{mrr.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-ink/40 font-body">MRR (suscripciones)</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 text-center">
          <Users className="w-6 h-6 text-mint mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-mint">{activeSubscribers.length}</div>
          <div className="text-xs text-ink/40 font-body">Suscriptores activos</div>
        </div>
      </div>

      {/* Generate payment link form */}
      {showForm && (
        <form onSubmit={generatePaymentLink} className="rounded-2xl bg-paper-deep border border-brand-primary/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-ink">Generar link de pago</h2>
            <button type="button" onClick={() => { setShowForm(false); setLinkGenerated(null); }} className="text-ink/30 hover:text-ink/60">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product */}
            <select
              value={form.product}
              onChange={(e) => handleProductChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              {PRODUCTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} {p.price > 0 ? `(desde ${p.price}€${p.recurring ? "/mes" : ""})` : ""}
                </option>
              ))}
            </select>

            {/* Client */}
            <select
              value={form.client_id}
              onChange={(e) => handleClientChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body focus:border-brand-primary/50 outline-none"
            >
              <option value="">— Cliente (opcional) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.business_name} ({c.name})</option>
              ))}
            </select>

            {/* Email */}
            <input
              required type="email" placeholder="Email del cliente *"
              value={form.client_email}
              onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />

            {/* Name */}
            <input
              placeholder="Nombre del cliente"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />

            {/* Amount */}
            <div className="relative">
              <input
                required type="number" step="0.01" min="1" placeholder="Cantidad (€) *"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/30 font-body">
                {form.recurring ? "€/mes" : "€"}
              </span>
            </div>

            {/* Recurring toggle */}
            <label className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] cursor-pointer">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                className="w-4 h-4 rounded accent-brand-primary"
              />
              <span className="text-sm text-ink/70 font-body">Pago recurrente (mensual)</span>
            </label>

            {/* Description */}
            <input
              placeholder="Descripcion (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-full px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-sm text-ink font-body placeholder:text-ink/30 focus:border-brand-primary/50 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="gradient" size="sm" disabled={sending} className="gap-1.5">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {sending ? "Generando..." : "Generar link"}
            </Button>
          </div>

          {/* Generated link */}
          {linkGenerated && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm font-heading font-medium text-green-300">Link generado</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={linkGenerated}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-ink/[0.08] text-xs text-ink font-mono outline-none"
                />
                <Button
                  type="button" size="sm" variant="gradient"
                  onClick={() => { navigator.clipboard.writeText(linkGenerated); }}
                  className="gap-1.5 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />Copiar
                </Button>
                <a href={linkGenerated} target="_blank" rel="noopener noreferrer">
                  <Button type="button" size="sm" variant="ghost" className="gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
              <p className="text-[11px] text-green-400/60 font-body">
                Envia este link al cliente. El pago se registrara automaticamente en Finanzas.
              </p>
            </div>
          )}
        </form>
      )}

      {/* Active subscribers */}
      {activeSubscribers.length > 0 && (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02] flex items-center justify-between">
            <h2 className="font-heading font-semibold text-sm text-ink">Suscripciones activas</h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-mint/10 text-mint font-body">{activeSubscribers.length} activas</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {activeSubscribers.map((client) => (
              <div key={client.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-heading font-medium text-ink">{client.business_name}</div>
                  <div className="text-xs text-ink/40 font-body">{client.plan || "Plan activo"} · {client.email}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-heading font-bold text-mint">{Number(client.monthly_fee).toLocaleString("es-ES")}€</div>
                  <div className="text-[11px] text-ink/40 font-body">/mes</div>
                </div>
                {client.email && (
                  <button
                    onClick={() => openPortal(client.email)}
                    className="text-xs text-brand-primary/70 hover:text-brand-primary font-body flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />Portal
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent payments */}
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02]">
          <h2 className="font-heading font-semibold text-sm text-ink">Ultimos cobros</h2>
        </div>
        {!loading && payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-8 h-8 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40 font-body">Sin cobros registrados</p>
            <p className="text-xs text-ink/50 font-body mt-1">Los pagos via Stripe apareceran aqui automaticamente</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {payments.slice(0, 20).map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-heading font-medium text-ink truncate">{p.description || p.category}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-ink/30 font-body">{p.date}</span>
                    {p.invoice_number && <span className="text-xs text-ink/20 font-body">#{p.invoice_number}</span>}
                    {p.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-ink/40 font-body">{p.category}</span>
                    )}
                  </div>
                </div>
                <span className="font-heading font-bold text-green-400 flex-shrink-0">
                  +{Number(p.amount).toLocaleString("es-ES")}€
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
