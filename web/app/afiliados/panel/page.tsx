"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReferralLinkCard,
  SparkChart,
  type SparkPoint,
} from "@/lib/modules/referrals/client";

type Stats = {
  clicks: number;
  signups: number;
  conversions: number;
  pending_cents: number;
  approved_cents: number;
  paid_cents: number;
  voided_cents: number;
  earnings_cents: number;
  epc_cents: number;
};

type Me = {
  affiliate: { id: string; referral_code: string; email: string; status: string };
  stats: Stats;
  referrals: Array<{ id: string; status: string; created_at: string }>;
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PanelOverviewPage() {
  const sp = useSearchParams();
  const welcome = sp.get("welcome") === "1";
  const [data, setData] = useState<Me | null>(null);
  const [series, setSeries] = useState<SparkPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/referrals/me", { credentials: "include" });
        if (r.status === 401) {
          window.location.href = "/afiliados/login";
          return;
        }
        if (!r.ok) throw new Error((await r.json()).error || "Error");
        const me = (await r.json()) as Me;
        if (cancelled) return;
        setData(me);

        const ts = await fetch("/api/referrals/me/timeseries?days=30", {
          credentials: "include",
        });
        if (ts.ok) {
          const tsJson = (await ts.json()) as { timeseries: SparkPoint[] };
          if (!cancelled) setSeries(tsJson.timeseries);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="text-sm text-ink/60">Cargando…</p>;
  const { affiliate, stats } = data;

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="rounded-md border border-mustard-500/40 bg-mustard-500/15 p-4 text-sm">
          <p className="font-medium text-ink">¡Bienvenido a PACAME afiliados!</p>
          <p className="mt-1 text-ink/70">
            Tu enlace ya está activo. Empieza compartiéndolo: cada visita queda
            registrada y si esa persona compra dentro de 30 días, la comisión
            es tuya. Pásate por <a href="/afiliados/panel/contenido" className="underline">Contenido para vender</a> y coge plantillas listas.
          </p>
        </div>
      )}

      <ReferralLinkCard code={affiliate.referral_code} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Clicks" value={String(stats.clicks)} />
        <Kpi label="Conversiones" value={String(stats.conversions)} />
        <Kpi label="Ganado" value={fmt(stats.earnings_cents)} />
        <Kpi label="Pendiente" value={fmt(stats.pending_cents)} />
        <Kpi label="Pagado" value={fmt(stats.paid_cents)} />
        <Kpi label="EPC" value={fmt(stats.epc_cents)} />
      </div>

      <section className="rounded-md border border-ink/10 bg-paper p-4">
        <h3 className="mb-3 text-sm font-medium text-ink">Actividad últimos 30 días</h3>
        {series.length ? (
          <SparkChart data={series} height={240} />
        ) : (
          <p className="text-sm text-ink/60">
            Sin actividad reciente. Comparte tu enlace para empezar a ver datos aquí.
          </p>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <div className="text-xs uppercase tracking-wide text-ink/60">{label}</div>
      <div className="mt-1 font-heading text-xl text-ink">{value}</div>
    </div>
  );
}
