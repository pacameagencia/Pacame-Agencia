"use client";

import { useState } from "react";
import { Boxes, Loader2, ArrowRight } from "lucide-react";

export interface AppAddonData {
  slug: string;
  name: string;
  tagline: string | null;
  price_monthly_cents: number;
  features: string[] | null;
}

interface Props {
  apps: AppAddonData[];
}

export default function AppAddonsGrid({ apps }: Props) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function buy(slug: string) {
    setLoadingSlug(slug);
    setErr(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_slug: slug,
          billing_interval: "month",
          source: "public",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "No se pudo crear el checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setLoadingSlug(null);
    }
  }

  if (!apps.length) return null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-wider text-accent-gold mb-3">
            <Boxes className="w-4 h-4" />
            Apps productizadas
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-ink mb-3">
            Apps como add-on
          </h2>
          <p className="text-ink/60 font-body max-w-xl mx-auto">
            Productos digitales autoservicio que funcionan solos. Contratalos
            sueltos o incluidos en un plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app) => (
            <div
              key={app.slug}
              className="rounded-2xl p-6 bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/30 transition flex flex-col"
            >
              <h3 className="font-heading font-bold text-lg text-ink mb-1">
                {app.name}
              </h3>
              {app.tagline && (
                <p className="text-ink/50 font-body text-sm mb-4">
                  {app.tagline}
                </p>
              )}
              <ul className="space-y-1.5 mb-4 flex-1">
                {(app.features || []).slice(0, 4).map((f, i) => (
                  <li
                    key={i}
                    className="text-xs font-body text-ink/60 flex items-start gap-2"
                  >
                    <span className="text-accent-gold">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <div className="font-heading font-bold text-2xl text-ink">
                    {(app.price_monthly_cents / 100).toFixed(0)}€
                    <span className="text-ink/50 text-sm font-body">/mes</span>
                  </div>
                </div>
                <button
                  onClick={() => buy(app.slug)}
                  disabled={loadingSlug === app.slug}
                  className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 text-ink font-heading font-semibold px-4 py-2 rounded-xl transition text-sm"
                >
                  {loadingSlug === app.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Activar
                </button>
              </div>
            </div>
          ))}
        </div>
        {err && <p className="text-center text-rose-400 font-body mt-4">{err}</p>}
      </div>
    </section>
  );
}
