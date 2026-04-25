"use client";

import { useEffect, useState } from "react";
import { ReferralLinkCard } from "./ReferralLinkCard";
import { Tabs } from "./Tabs";
import { SparkChart, type SparkPoint } from "./SparkChart";
import { StatusPill } from "./StatusPill";
import { AffiliateContentLibrary } from "./AffiliateContentLibrary";

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

type Referral = {
  id: string;
  status: "pending" | "converted" | "cancelled";
  created_at: string;
  converted_at: string | null;
  stripe_subscription_id: string | null;
};

type MeResponse = {
  affiliate: { id: string; referral_code: string; email: string; status: string };
  stats: Stats;
  referrals: Referral[];
};

function formatEur(cents: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function AffiliateDashboard() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [series, setSeries] = useState<SparkPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/referrals/me", { credentials: "include" });
        if (!r.ok) throw new Error((await r.json()).error || "Error");
        const me = (await r.json()) as MeResponse;
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enroll = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/referrals/affiliates", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      const me = await fetch("/api/referrals/me", { credentials: "include" });
      setData((await me.json()) as MeResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-ink/60">Cargando…</div>;

  if (error && !data) {
    return (
      <div className="rounded-md border border-ink/10 bg-paper p-6">
        <p className="text-sm text-ink/80">Aún no eres afiliado.</p>
        <button
          type="button"
          onClick={enroll}
          className="mt-3 rounded-sm bg-terracotta-500 px-4 py-2 text-sm font-medium text-paper transition hover:bg-terracotta-600"
        >
          Activar mi enlace de referido
        </button>
      </div>
    );
  }
  if (!data) return null;

  const { affiliate, stats, referrals } = data;
  const tabItems = [
    { id: "overview", label: "Resumen" },
    { id: "referrals", label: "Mis referidos", count: referrals.length },
    { id: "commissions", label: "Comisiones" },
    { id: "content", label: "Contenido para vender" },
  ];

  return (
    <Tabs items={tabItems}>
      {(active) => {
        if (active === "overview") {
          return (
            <div className="space-y-6">
              <ReferralLinkCard code={affiliate.referral_code} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kpi label="Clicks" value={String(stats.clicks)} />
                <Kpi label="Conversiones" value={String(stats.conversions)} />
                <Kpi label="Ganado" value={formatEur(stats.earnings_cents)} />
                <Kpi label="Pendiente" value={formatEur(stats.pending_cents)} />
              </div>

              <div className="rounded-md border border-ink/10 bg-paper p-4">
                <h3 className="mb-3 text-sm font-medium text-ink">Últimos 30 días</h3>
                {series.length ? (
                  <SparkChart data={series} />
                ) : (
                  <p className="text-sm text-ink/60">Sin actividad reciente.</p>
                )}
              </div>
            </div>
          );
        }

        if (active === "referrals") {
          return <ReferralsList referrals={referrals} />;
        }

        if (active === "commissions") {
          return <CommissionsSummary stats={stats} />;
        }

        return <AffiliateContentLibrary />;
      }}
    </Tabs>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <div className="text-xs uppercase tracking-wide text-ink/60">{label}</div>
      <div className="mt-1 text-xl font-medium text-ink">{value}</div>
    </div>
  );
}

function ReferralsList({ referrals }: { referrals: Referral[] }) {
  if (!referrals.length) {
    return (
      <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
        Todavía no tienes referidos. Comparte tu enlace para empezar.
      </p>
    );
  }
  return (
    <div className="rounded-md border border-ink/10 bg-paper">
      <table className="w-full text-sm">
        <thead className="border-b border-ink/10">
          <tr className="text-left text-xs uppercase text-ink/60">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Suscripción</th>
            <th className="px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id} className="border-b border-ink/5 last:border-b-0">
              <td className="px-4 py-2 font-mono text-xs text-ink/60">{r.id.slice(0, 8)}</td>
              <td className="px-4 py-2 text-ink/80">
                {new Date(r.created_at).toLocaleDateString("es-ES")}
              </td>
              <td className="px-4 py-2 font-mono text-xs text-ink/60">
                {r.stripe_subscription_id?.slice(0, 14) ?? "—"}
              </td>
              <td className="px-4 py-2">
                <StatusPill status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Commission = {
  id: string;
  source_event: string;
  amount_cents: number;
  status: string;
  month_index: number;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
};

function CommissionsSummary({ stats }: { stats: Stats }) {
  const [items, setItems] = useState<Commission[] | null>(null);

  useEffect(() => {
    fetch("/api/referrals/me/commissions", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<{ commissions: Commission[] }>) : null))
      .then((j) => setItems(j?.commissions ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Pendiente" value={formatEur(stats.pending_cents)} />
        <Kpi label="Aprobado" value={formatEur(stats.approved_cents)} />
        <Kpi label="Pagado" value={formatEur(stats.paid_cents)} />
        <Kpi label="Anulado" value={formatEur(stats.voided_cents)} />
      </div>
      {items === null ? (
        <p className="text-sm text-ink/60">Cargando comisiones…</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Aún no tienes comisiones generadas.
        </p>
      ) : (
        <div className="rounded-md border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr className="text-left text-xs uppercase text-ink/60">
                <th className="px-4 py-2">Mes</th>
                <th className="px-4 py-2">Origen</th>
                <th className="px-4 py-2 text-right">Importe</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-ink/5 last:border-b-0">
                  <td className="px-4 py-2">#{c.month_index}</td>
                  <td className="px-4 py-2 font-mono text-xs text-ink/60">
                    {c.source_event.slice(0, 18)}
                  </td>
                  <td className="px-4 py-2 text-right">{formatEur(c.amount_cents)}</td>
                  <td className="px-4 py-2">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-4 py-2 text-xs text-ink/60">
                    {c.paid_at
                      ? new Date(c.paid_at).toLocaleDateString("es-ES")
                      : c.due_at
                        ? new Date(c.due_at).toLocaleDateString("es-ES")
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
