"use client";

import { useEffect, useState } from "react";

type Campaign = {
  id: string;
  name: string;
  commission_percent: number;
  cookie_days: number;
  max_commission_period_months: number;
  attribution: "last_click" | "first_click";
};

const PRESET = [
  { label: "Conservador (10% × 6m)", percent: 10, months: 6 },
  { label: "Estándar (20% × 12m)",   percent: 20, months: 12 },
  { label: "Agresivo (30% × 12m)",   percent: 30, months: 12 },
  { label: "Lifetime (20% para siempre)", percent: 20, months: 0 },
] as const;

export default function ConfiguracionPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [original, setOriginal] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals/admin/campaign", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.campaign) {
          setCampaign(j.campaign);
          setOriginal(j.campaign);
        } else {
          setError("No se ha encontrado la campaña por defecto.");
        }
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!campaign) return <p className="text-sm text-ink/60">Cargando configuración…</p>;

  const dirty = JSON.stringify(campaign) !== JSON.stringify(original);

  const update = (k: keyof Campaign, v: unknown) =>
    setCampaign((c) => (c ? { ...c, [k]: v } : c));

  const applyPreset = (p: (typeof PRESET)[number]) => {
    setCampaign((c) =>
      c
        ? { ...c, commission_percent: p.percent, max_commission_period_months: p.months }
        : c,
    );
  };

  const reset = () => setCampaign(original);

  const save = async () => {
    if (!campaign) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/referrals/admin/campaign", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: campaign.name,
          commission_percent: campaign.commission_percent,
          cookie_days: campaign.cookie_days,
          max_commission_period_months: campaign.max_commission_period_months,
          attribution: campaign.attribution,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      const j = await r.json();
      setCampaign(j.campaign);
      setOriginal(j.campaign);
      setSavedAt(new Date().toLocaleTimeString("es-ES"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  // Live earnings preview
  const samples = [
    { product: "Web Corporativa", price: 800, recurring: false },
    { product: "Plan Redes", price: 197, recurring: true },
    { product: "Plan SEO", price: 297, recurring: true },
    { product: "Pack Web + Redes", price: 193, recurring: true },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* === EDITOR === */}
      <div className="space-y-6">
        <div className="rounded-md border border-ink/10 bg-paper p-6">
          <h2 className="font-heading text-xl">Política de comisiones</h2>
          <p className="mt-1 text-sm text-ink/60">
            Estos valores se aplican a <strong>las nuevas comisiones</strong>.
            Las que ya están generadas mantienen su importe — son inmutables.
          </p>

          <div className="mt-5 space-y-5">
            {/* Preset shortcuts */}
            <div>
              <span className="block text-xs uppercase tracking-wide text-ink/60">Presets rápidos</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-sm border border-ink/15 px-3 py-1.5 text-xs text-ink hover:bg-ink/5"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comisión % */}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink/80">% de comisión sobre cada pago</span>
                <span className="font-heading text-2xl text-terracotta-500">
                  {campaign.commission_percent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={0.5}
                value={campaign.commission_percent}
                onChange={(e) => update("commission_percent", Number(e.target.value))}
                className="mt-2 w-full accent-terracotta-500"
              />
              <div className="mt-1 flex justify-between text-xs text-ink/50">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Meses de comisión */}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink/80">
                  Meses con comisión (suscripciones)
                </span>
                <span className="font-heading text-2xl text-terracotta-500">
                  {campaign.max_commission_period_months === 0
                    ? "Lifetime"
                    : `${campaign.max_commission_period_months}m`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={campaign.max_commission_period_months}
                onChange={(e) =>
                  update("max_commission_period_months", Number(e.target.value))
                }
                className="mt-2 w-full accent-terracotta-500"
              />
              <div className="mt-1 flex justify-between text-xs text-ink/50">
                <span>Lifetime</span>
                <span>12 meses</span>
                <span>24 meses</span>
              </div>
            </div>

            {/* Cookie days */}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink/80">Duración de la cookie de tracking</span>
                <span className="font-heading text-2xl text-terracotta-500">
                  {campaign.cookie_days}d
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={90}
                step={1}
                value={campaign.cookie_days}
                onChange={(e) => update("cookie_days", Number(e.target.value))}
                className="mt-2 w-full accent-terracotta-500"
              />
              <div className="mt-1 flex justify-between text-xs text-ink/50">
                <span>1d</span>
                <span>30d</span>
                <span>90d</span>
              </div>
            </div>

            {/* Atribución */}
            <div>
              <span className="block text-sm text-ink/80">Modelo de atribución</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["last_click", "first_click"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => update("attribution", a)}
                    className={
                      "rounded-sm border px-3 py-2 text-sm transition " +
                      (campaign.attribution === a
                        ? "border-terracotta-500 bg-terracotta-500/10 text-terracotta-500"
                        : "border-ink/15 text-ink/70 hover:bg-ink/5")
                    }
                  >
                    {a === "last_click" ? "Último click (recomendado)" : "Primer click"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/60">
                {campaign.attribution === "last_click"
                  ? "El último link usado se lleva la comisión. Estilo FirstPromoter."
                  : "El primer link usado fija la atribución para 30 días. Estilo Rewardful default."}
              </p>
            </div>

            {/* Nombre interno */}
            <div>
              <label className="block text-sm">
                <span className="block text-ink/80">Nombre interno</span>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="mt-1 w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper p-4 shadow-sm">
          <div className="text-sm">
            {dirty ? (
              <span className="text-amber-700">⚠ Cambios sin guardar</span>
            ) : savedAt ? (
              <span className="text-emerald-700">✓ Guardado a las {savedAt}</span>
            ) : (
              <span className="text-ink/60">Sin cambios pendientes</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!dirty || saving}
              className="rounded-sm border border-ink/15 px-4 py-2 text-sm disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-sm bg-terracotta-500 px-5 py-2 text-sm font-medium text-paper hover:bg-terracotta-600 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar y aplicar"}
            </button>
          </div>
        </div>
      </div>

      {/* === PREVIEW === */}
      <aside className="space-y-4">
        <div className="rounded-md border border-ink/10 bg-paper p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-ink/60">
            Previsualización
          </h3>
          <p className="mt-1 text-xs text-ink/60">
            Lo que va a cobrar un afiliado por venta con la nueva config:
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {samples.map((s) => {
              const perPayment = s.price * (campaign.commission_percent / 100);
              const months = campaign.max_commission_period_months || 12;
              const total = s.recurring
                ? perPayment * months
                : perPayment;
              return (
                <li key={s.product} className="flex items-baseline justify-between border-b border-ink/10 pb-2 last:border-0">
                  <div>
                    <div className="text-ink">{s.product}</div>
                    <div className="text-xs text-ink/50">
                      {s.recurring ? `${s.price} €/mes` : `${s.price} € único`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-base text-terracotta-500">
                      {total.toFixed(0)} €
                    </div>
                    {s.recurring && (
                      <div className="text-xs text-ink/50">
                        {perPayment.toFixed(1)} €/mes × {months}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-ink/60">
            Si vendes 5 webs/mes →{" "}
            <strong>
              {(800 * (campaign.commission_percent / 100) * 5).toFixed(0)} €
            </strong>{" "}
            en una sola tanda.
          </p>
        </div>

        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>Nota:</strong> los cambios afectan solo a las{" "}
          <strong>nuevas comisiones</strong>. Las ya generadas (estados <em>pending</em>,{" "}
          <em>approved</em>, <em>paid</em>, <em>voided</em>) mantienen su importe original.
        </div>

        <div className="rounded-md border border-ink/10 bg-paper p-4 text-xs text-ink/70">
          Para asignar un % distinto a un afiliado VIP, crea otra campaña en{" "}
          <code className="rounded-sm bg-ink/5 px-1">aff_campaigns</code> y asígnala
          en <code className="rounded-sm bg-ink/5 px-1">aff_affiliates.campaign_id</code>.
        </div>
      </aside>
    </div>
  );
}
