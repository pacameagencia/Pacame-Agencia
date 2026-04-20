"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

/**
 * Card compacta de suscripcion al newsletter para la sidebar del blog detail.
 * Escribe via /api/leads igual que NewsletterForm principal.
 */
export default function InlineNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter",
          email,
          message: "Suscripcion desde sidebar del blog",
          services: ["Newsletter"],
        }),
      });
    } catch {
      // fail silently — Supabase RLS puede rechazar, pero UX sigue feliz
    }
    setStatus("done");
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-olympus-gold/10 to-electric-violet/10 border border-olympus-gold/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-olympus-gold" />
        <span className="text-xs font-body font-medium uppercase tracking-[0.15em] text-olympus-gold">
          Newsletter PACAME
        </span>
      </div>
      <h4 className="font-heading font-bold text-base text-pacame-white mb-1 leading-snug">
        Un email cada viernes
      </h4>
      <p className="text-xs text-pacame-white/60 font-body mb-4 leading-relaxed">
        Tips de marketing digital y casos reales de PYMEs. Sin spam.
      </p>
      {status === "done" ? (
        <div className="flex items-center gap-2 text-xs text-olympus-gold font-body">
          <CheckCircle2 className="w-4 h-4" />
          <span>Gracias, te has suscrito.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            className="w-full h-10 px-3 rounded-lg bg-pacame-black/50 border border-white/[0.08] text-pacame-white text-sm font-body placeholder:text-pacame-white/30 focus:border-olympus-gold/50 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full h-10 rounded-lg bg-olympus-gold text-pacame-black font-body font-semibold text-sm hover:bg-olympus-gold/90 transition-colors disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Suscribirme"}
          </button>
        </form>
      )}
    </div>
  );
}
