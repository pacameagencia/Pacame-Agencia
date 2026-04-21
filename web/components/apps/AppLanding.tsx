"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Shield,
  Zap,
  Clock,
  BookOpen,
  Users,
  AlertCircle,
  Layers,
  BarChart3,
  Code,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import AppBuyButton from "./AppBuyButton";

const ICONS: Record<string, React.ElementType> = {
  Clock,
  BookOpen,
  Users,
  AlertCircle,
  Layers,
  BarChart3,
  Code,
  Calendar,
  Bell,
  Settings,
  Shield,
  Zap,
  Sparkles,
};

export interface AppLandingData {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  long_description: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number | null;
  features: string[];
  benefits: Array<{ title: string; description: string; icon: string }>;
  use_cases: Array<{ sector: string; title: string; description: string }>;
  faq: Array<{ q: string; a: string }>;
  integrations: string[];
  category: string | null;
  hero_media_url: string | null;
}

export default function AppLanding({ app }: { app: AppLandingData }) {
  const [interval, setInterval] = useState<"month" | "year">("month");

  const monthlyEur = app.price_monthly_cents / 100;
  const yearlyEur = app.price_yearly_cents ? app.price_yearly_cents / 100 : null;
  const yearlySavings =
    yearlyEur !== null ? (monthlyEur * 12 - yearlyEur).toFixed(0) : null;

  return (
    <div className="bg-paper min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-olympus-radial pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <Link
              href="/apps"
              className="inline-flex items-center gap-2 text-xs font-body text-ink/40 hover:text-accent-gold mb-6 transition"
            >
              ← Volver a apps
            </Link>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-body font-semibold text-accent-gold uppercase tracking-wider bg-accent-gold/10 rounded-full px-3 py-1 mb-6 border border-accent-gold/20">
              <Sparkles className="w-3 h-3" />
              App productizada · Entregada por IA
            </span>

            <h1 className="font-accent font-bold text-4xl sm:text-6xl text-ink mb-6 text-balance">
              {app.name}
            </h1>
            <p className="text-xl sm:text-2xl text-ink/70 font-body max-w-3xl mx-auto mb-8 font-light">
              {app.tagline}
            </p>

            {/* Price + CTA */}
            <div className="inline-flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-ink/[0.08] rounded-full p-1">
                <button
                  onClick={() => setInterval("month")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    interval === "month"
                      ? "bg-accent-gold text-ink"
                      : "text-ink/60"
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setInterval("year")}
                  disabled={!yearlyEur}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition inline-flex items-center gap-1.5 disabled:opacity-40 ${
                    interval === "year"
                      ? "bg-accent-gold text-ink"
                      : "text-ink/60"
                  }`}
                >
                  Anual
                  {yearlyEur && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                      -{yearlySavings}€
                    </span>
                  )}
                </button>
              </div>

              <div className="text-6xl font-heading font-bold text-ink">
                {interval === "year" && yearlyEur ? `${Math.round(yearlyEur)}€` : `${monthlyEur}€`}
                <span className="text-lg font-normal text-ink/40 ml-1">
                  /{interval === "month" ? "mes" : "año"}
                </span>
              </div>

              <AppBuyButton
                appSlug={app.slug}
                appName={app.name}
                priceMonthlyCents={app.price_monthly_cents}
                priceYearlyCents={app.price_yearly_cents}
                billingInterval={interval}
                className="w-full"
              />
              <div className="flex items-center gap-4 text-xs text-ink/50 font-body">
                <span className="inline-flex items-center gap-1">
                  <Shield className="w-3 h-3 text-accent-gold" />
                  Sin permanencia
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="w-3 h-3 text-accent-gold" />
                  Cancel 1-click
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent-gold" />
                  Setup 10 min
                </span>
              </div>
            </div>
          </div>

          {/* Long description */}
          {app.long_description && (
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-ink/70 font-body leading-relaxed text-center">
                {app.long_description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      {app.benefits.length > 0 && (
        <section className="py-20 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-accent font-bold text-3xl sm:text-4xl text-ink mb-4">
                Lo que te llevas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {app.benefits.map((b, i) => {
                const Icon = ICONS[b.icon] || Sparkles;
                return (
                  <div
                    key={i}
                    className="rounded-2xl p-6 bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/30 transition card-golden-shine"
                  >
                    <div className="w-11 h-11 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-accent-gold" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-ink mb-2">
                      {b.title}
                    </h3>
                    <p className="text-sm text-ink/60 font-body leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── USE CASES ─── */}
      {app.use_cases.length > 0 && (
        <section className="py-20 bg-white/[0.02] border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-accent font-bold text-3xl sm:text-4xl text-ink mb-4">
                Quien lo usa
              </h2>
              <p className="text-ink/60 font-body max-w-2xl mx-auto">
                {app.name} esta optimizado para estos sectores — con templates pre-configurados.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {app.use_cases.map((uc, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 bg-paper-deep border border-ink/[0.06]"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-accent-gold/60 mb-2">
                    {uc.sector}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-ink mb-2">
                    {uc.title}
                  </h3>
                  <p className="text-sm text-ink/70 font-body leading-relaxed">
                    {uc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURES LIST ─── */}
      {app.features.length > 0 && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="font-accent font-bold text-3xl sm:text-4xl text-ink mb-4">
                Todo incluido
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.features.map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]"
                >
                  <Check className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-ink/80 font-body">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── INTEGRATIONS ─── */}
      {app.integrations.length > 0 && (
        <section className="py-16 bg-white/[0.02] border-y border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-xs font-mono uppercase tracking-wider text-ink/40 mb-6">
              Integra con
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {app.integrations.map((integ) => (
                <span
                  key={integ}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] border border-ink/[0.08] text-sm text-ink/70 font-mono"
                >
                  {integ.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      {app.faq.length > 0 && (
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="font-accent font-bold text-3xl sm:text-4xl text-ink mb-4 inline-flex items-center gap-3">
                <HelpCircle className="w-8 h-8 text-accent-gold" />
                Preguntas frecuentes
              </h2>
            </div>
            <div className="space-y-3">
              {app.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl p-5 bg-paper-deep border border-ink/[0.06]"
                >
                  <summary className="cursor-pointer font-heading font-semibold text-ink flex items-center justify-between gap-3">
                    <span>{item.q}</span>
                    <span className="text-accent-gold group-open:rotate-45 transition-transform text-xl flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-ink/70 font-body text-sm leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-olympus-radial pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-accent font-bold text-3xl sm:text-4xl text-ink mb-4">
            Empieza hoy
          </h2>
          <p className="text-ink/60 font-body mb-8">
            Sin permanencia. Sin setup fee. Cancela cuando quieras.
          </p>
          <AppBuyButton
            appSlug={app.slug}
            appName={app.name}
            priceMonthlyCents={app.price_monthly_cents}
            priceYearlyCents={app.price_yearly_cents}
            billingInterval={interval}
            className="max-w-sm mx-auto"
          />
          <div className="mt-6 text-sm text-ink/50 font-body">
            ¿Dudas? <a href="mailto:hola@pacameagencia.com" className="text-accent-gold hover:underline">Escribe a Pablo</a>
          </div>
        </div>
      </section>
    </div>
  );
}
