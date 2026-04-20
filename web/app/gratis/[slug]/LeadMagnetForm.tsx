"use client";

import { useState } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface LeadMagnetFormProps {
  slug: string;
  ctaText: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export default function LeadMagnetForm({ slug, ctaText }: LeadMagnetFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/lead-magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, website }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(data.error || "Error al enviar el formulario");
      }

      setState("success");
    } catch (err) {
      setState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Error al enviar. Intentalo de nuevo."
      );
    }
  };

  if (state === "success") {
    return (
      <div className="rounded-2xl bg-paper-deep border border-mint/20 p-8 text-center">
        <CheckCircle className="w-12 h-12 text-mint mx-auto mb-4" />
        <h3 className="font-heading font-bold text-xl text-ink mb-2">
          Solicitud recibida
        </h3>
        <p className="text-ink/60 font-body text-sm">
          Revisa tu email en las proximas 24 horas. Recibirás tu auditoria
          completa con un plan de mejora personalizado.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-8"
    >
      <h2 className="font-heading font-bold text-xl text-ink mb-6">
        Solicita tu auditoria gratis
      </h2>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="lm-name"
            className="block text-sm font-body text-ink/60 mb-1.5"
          >
            Nombre
          </label>
          <input
            id="lm-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-ink/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-body text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="lm-email"
            className="block text-sm font-body text-ink/60 mb-1.5"
          >
            Email
          </label>
          <input
            id="lm-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            className="w-full rounded-xl border border-ink/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-body text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-colors"
          />
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="lm-website"
            className="block text-sm font-body text-ink/60 mb-1.5"
          >
            URL de tu web
          </label>
          <input
            id="lm-website"
            type="url"
            required
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://tuempresa.com"
            className="w-full rounded-xl border border-ink/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-body text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Error message */}
      {state === "error" && (
        <div className="mt-4 flex items-center gap-2 text-accent-burgundy-soft text-sm font-body">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Submit */}
      <div className="mt-6">
        <button type="submit" disabled={state === "submitting"} className="w-full">
          <ShinyButton className="w-full shadow-glow-gold px-6 py-4 text-base font-heading font-semibold cursor-pointer">
            <span className="flex items-center justify-center gap-2 text-ink">
              {state === "submitting" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  {ctaText}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </span>
          </ShinyButton>
        </button>
      </div>

      <p className="mt-4 text-center text-ink/30 font-body text-xs">
        Sin spam. Solo recibirás tu auditoria y un email de seguimiento.
      </p>
    </form>
  );
}
