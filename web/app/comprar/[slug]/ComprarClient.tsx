"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowRight, Check, Lock } from "lucide-react";
import { getReferralCode } from "@/lib/referral-client";

interface Props {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
}

type Step = "contact" | "company" | "review";

interface FormState {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  company_website: string;
  company_sector: string;
  project_description: string;
  accept_terms: boolean;
}

const SECTORS = [
  "Restauracion",
  "Hoteles / Turismo",
  "Clinica / Salud",
  "Gym / Fitness",
  "Inmobiliaria",
  "Ecommerce / Retail",
  "Formacion / Academy",
  "SaaS / Tech",
  "Belleza / Spa",
  "Servicios profesionales",
  "Otro",
];

export default function ComprarClient({ slug, name, priceCents, currency }: Props) {
  const [step, setStep] = useState<Step>("contact");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    company_website: "",
    company_sector: "",
    project_description: "",
    accept_terms: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist entre steps en sessionStorage
  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? sessionStorage.getItem(`pacame_checkout_${slug}`)
      : null;
    if (saved) {
      try {
        setForm((f) => ({ ...f, ...JSON.parse(saved) }));
      } catch { /* ignore */ }
    }
  }, [slug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`pacame_checkout_${slug}`, JSON.stringify(form));
    }
  }, [form, slug]);

  const price = (priceCents / 100).toLocaleString("es-ES");

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateContact(): boolean {
    if (!form.name.trim()) return setErr("Falta tu nombre");
    if (!form.email.trim() || !form.email.includes("@")) return setErr("Email invalido");
    return true;
  }
  function validateCompany(): boolean {
    if (!form.company_sector) return setErr("Elige tu sector");
    if (form.project_description.trim().length < 10)
      return setErr("Cuentanos un poco mas sobre tu proyecto");
    return true;
  }
  function setErr(msg: string): false {
    setError(msg);
    setTimeout(() => setError(null), 4000);
    return false;
  }

  function goNext() {
    if (step === "contact" && !validateContact()) return;
    if (step === "company" && !validateCompany()) return;
    setStep(step === "contact" ? "company" : "review");
  }

  async function handlePay() {
    if (!form.accept_terms) return setErr("Acepta terminos para continuar");
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_slug: slug,
          source: "public",
          client_name: form.name,
          client_email: form.email,
          ref: getReferralCode() || undefined,
          success_url: `${window.location.origin}/gracias?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`,
          cancel_url: window.location.href,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json?.error || `Error ${res.status}`);
      }
      // Persist pre-checkout data en notifications via checkout-flow API (opcional)
      try {
        await fetch("/api/checkout-flow", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            company_name: form.company_name,
            company_website: form.company_website,
            company_sector: form.company_sector,
            project_description: form.project_description,
            service_slug: slug,
            service_name: name,
            service_price: priceCents,
            recurring: false,
          }),
        });
      } catch { /* non critical */ }

      // Limpiar state antes de redirect
      sessionStorage.removeItem(`pacame_checkout_${slug}`);
      window.location.href = json.url;
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] overflow-hidden">
      {/* Progress header */}
      <div className="flex items-stretch border-b border-ink/[0.06]">
        {(["contact", "company", "review"] as const).map((s, idx) => {
          const isActive = step === s;
          const isDone =
            (step === "company" && s === "contact") ||
            (step === "review" && (s === "contact" || s === "company"));
          return (
            <div
              key={s}
              className={`flex-1 px-4 py-4 border-r border-ink/[0.06] last:border-r-0 transition-colors ${
                isActive
                  ? "bg-accent-gold/[0.08]"
                  : isDone
                  ? "bg-mint/[0.05]"
                  : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                    isActive
                      ? "bg-accent-gold text-paper"
                      : isDone
                      ? "bg-mint text-paper"
                      : "bg-ink/10 text-ink/50"
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[11px] font-mono uppercase tracking-wider ${
                      isActive ? "text-accent-gold" : "text-ink/50"
                    }`}
                  >
                    Paso {idx + 1}
                  </div>
                  <div
                    className={`text-[13px] font-heading font-semibold truncate ${
                      isActive ? "text-ink" : "text-ink/60"
                    }`}
                  >
                    {s === "contact" && "Tus datos"}
                    {s === "company" && "Tu proyecto"}
                    {s === "review" && "Revisar y pagar"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-400/10 border border-rose-400/30 text-rose-300 text-[13px]">
            {error}
          </div>
        )}

        {/* STEP 1 — Contact */}
        {step === "contact" && (
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ana Martinez Gomez"
                autoFocus
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="ana@miempresa.com"
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
              />
              <div className="text-[11px] text-ink/40 mt-1.5 font-body">
                Te enviaremos factura y acceso al portal aqui.
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                Telefono / WhatsApp (opcional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+34 600 00 00 00"
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
              />
            </div>
            <button
              type="button"
              onClick={goNext}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[14px] hover:brightness-110 transition"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2 — Company */}
        {step === "company" && (
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                Nombre empresa (opcional)
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setField("company_name", e.target.value)}
                placeholder="Peluqueria Ana"
                autoFocus
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                Web actual (si tienes)
              </label>
              <input
                type="url"
                value={form.company_website}
                onChange={(e) => setField("company_website", e.target.value)}
                placeholder="https://miweb.com"
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                Sector *
              </label>
              <select
                value={form.company_sector}
                onChange={(e) => setField("company_sector", e.target.value)}
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink outline-none focus:border-accent-gold/40 transition"
              >
                <option value="">Elige tu sector...</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink/50 mb-2">
                ¿Que quieres conseguir con esto? *
              </label>
              <textarea
                value={form.project_description}
                onChange={(e) => setField("project_description", e.target.value)}
                placeholder="Ej: quiero reservas online para mi peluqueria, tengo 40 clientes habituales y quiero captar 20 nuevos al mes..."
                rows={4}
                maxLength={1000}
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition resize-none"
              />
              <div className="text-[11px] text-ink/40 mt-1.5 font-body">
                Pablo lee esto antes de empezar. Cuanto mas concreto, mejor encaje.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("contact")}
                className="flex-1 px-5 py-3.5 rounded-xl bg-ink/[0.04] border border-ink/[0.08] text-ink font-heading font-medium text-[14px] hover:bg-ink/[0.06] transition"
              >
                Atras
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[14px] hover:brightness-110 transition"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Review + Pay */}
        {step === "review" && (
          <div className="space-y-5">
            <div className="rounded-xl bg-ink/[0.04] border border-ink/[0.08] p-5 space-y-3 text-[13px]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold mb-2">
                Resumen pedido
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Producto</span>
                <span className="text-ink font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Cliente</span>
                <span className="text-ink font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Email</span>
                <span className="text-ink font-medium">{form.email}</span>
              </div>
              {form.company_name && (
                <div className="flex justify-between">
                  <span className="text-ink/60">Empresa</span>
                  <span className="text-ink font-medium">{form.company_name}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-ink/[0.08] text-[15px]">
                <span className="text-ink font-heading font-semibold">Total a pagar</span>
                <span className="text-accent-gold font-heading font-bold">
                  {price} {currency}
                </span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.accept_terms}
                onChange={(e) => setField("accept_terms", e.target.checked)}
                className="mt-1 w-4 h-4 accent-accent-gold"
              />
              <span className="text-[12px] text-ink/60 leading-relaxed">
                He leido y acepto los{" "}
                <a href="/terminos-servicio" target="_blank" className="text-accent-gold hover:underline">
                  terminos del servicio
                </a>
                , la{" "}
                <a href="/privacidad" target="_blank" className="text-accent-gold hover:underline">
                  politica de privacidad
                </a>{" "}
                y la{" "}
                <a href="/cookies" target="_blank" className="text-accent-gold hover:underline">
                  politica de cookies
                </a>
                . Entiendo que tengo 30 dias de garantia para refund total.
              </span>
            </label>

            <button
              type="button"
              onClick={handlePay}
              disabled={submitting || !form.accept_terms}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a pago seguro...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Pagar {price} {currency} con Stripe
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-ink/40 font-body">
              <Lock className="w-3 h-3" />
              <span>
                Redireccion encriptada a Stripe Checkout · PCI-DSS · Tus datos nunca
                tocan nuestro servidor
              </span>
            </div>

            <button
              type="button"
              onClick={() => setStep("company")}
              className="w-full text-center text-[12px] text-ink/50 hover:text-ink transition-colors py-2"
            >
              ← Editar datos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
