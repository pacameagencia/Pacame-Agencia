"use client";

import { useEffect, useState } from "react";
import { ReferralLinkCard } from "./ReferralLinkCard";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals/me", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Error");
        return r.json() as Promise<MeResponse>;
      })
      .then((json) => setData(json))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
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

  return (
    <div className="space-y-6">
      <ReferralLinkCard code={affiliate.referral_code} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Clicks" value={String(stats.clicks)} />
        <Kpi label="Conversiones" value={String(stats.conversions)} />
        <Kpi label="Ganado" value={formatEur(stats.earnings_cents)} />
        <Kpi label="Pendiente" value={formatEur(stats.pending_cents)} />
      </div>

      <div className="rounded-md border border-ink/10 bg-paper">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-medium text-ink">Referidos</h3>
        </div>
        {referrals.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink/60">
            Todavía no tienes referidos. Comparte tu enlace para empezar.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-mono text-xs text-ink/60">
                    {r.id.slice(0, 8)}
                  </span>
                  <span className="ml-3 text-ink/80">
                    {new Date(r.created_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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

function StatusBadge({ status }: { status: Referral["status"] }) {
  const styles =
    status === "converted"
      ? "bg-emerald-100 text-emerald-800"
      : status === "cancelled"
        ? "bg-rose-100 text-rose-800"
        : "bg-ink/5 text-ink/70";
  return <span className={`rounded-sm px-2 py-0.5 text-xs ${styles}`}>{status}</span>;
}
