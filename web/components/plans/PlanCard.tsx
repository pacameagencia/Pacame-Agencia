"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { getReferralCode } from "@/lib/referral-client";

export interface PlanCardData {
  slug: string;
  tier: string;
  name: string;
  tagline: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number | null;
  features: string[] | null;
  included_apps: string[] | null;
  is_featured?: boolean;
}

interface Props {
  plan: PlanCardData;
  interval: "month" | "year";
  featured?: boolean;
}

export default function PlanCard({ plan, interval, featured }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const monthly = plan.price_monthly_cents;
  const yearly = plan.price_yearly_cents ?? monthly * 10; // ~17% off default
  const displayCents = interval === "year" ? Math.round(yearly / 12) : monthly;
  const billedNote =
    interval === "year"
      ? `Facturado ${(yearly / 100).toFixed(0)}€/ano`
      : "Cancela cuando quieras";

  async function handleBuy() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_slug: plan.slug,
          billing_interval: interval,
          source: "public",
          ref: getReferralCode() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "No se pudo crear el checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col transition ${
        featured
          ? "bg-gradient-to-br from-olympus-gold/[0.08] to-transparent border-2 border-olympus-gold/40 shadow-[0_0_60px_-15px_rgba(212,165,116,0.3)]"
          : "bg-dark-card border border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-olympus-gold text-pacame-black text-[10px] font-heading font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          MAS ELEGIDO
        </div>
      )}

      <div className="mb-5">
        <div className="text-xs font-body font-semibold uppercase tracking-wider text-olympus-gold mb-1">
          {plan.tier}
        </div>
        <h3 className="font-heading font-bold text-xl text-pacame-white">
          {plan.name}
        </h3>
        {plan.tagline && (
          <p className="text-pacame-white/50 font-body text-sm mt-2">
            {plan.tagline}
          </p>
        )}
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="font-heading font-bold text-4xl text-pacame-white">
            {(displayCents / 100).toFixed(0)}€
          </span>
          <span className="text-pacame-white/50 font-body text-sm">/mes</span>
        </div>
        <p className="text-pacame-white/40 font-body text-xs mt-1">{billedNote}</p>
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        className={`w-full mb-6 py-3 rounded-xl font-heading font-semibold transition ${
          featured
            ? "bg-olympus-gold hover:bg-olympus-gold/90 text-pacame-black"
            : "bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-pacame-white"
        } disabled:opacity-50 inline-flex items-center justify-center gap-2`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Empezar {plan.tier}
      </button>
      {err && <p className="text-xs text-rose-400 font-body mb-3">{err}</p>}

      <ul className="space-y-2 flex-1">
        {(plan.features || []).map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm font-body text-pacame-white/70"
          >
            <CheckCircle2 className="w-4 h-4 text-olympus-gold mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {(plan.included_apps || []).length > 0 && (
        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <p className="text-[11px] font-body font-semibold text-olympus-gold uppercase tracking-wider mb-2">
            Apps incluidas
          </p>
          <div className="flex flex-wrap gap-1">
            {(plan.included_apps || []).map((a) => (
              <span
                key={a}
                className="text-[11px] font-body px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/70"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
