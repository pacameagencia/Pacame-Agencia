"use client";

import { useEffect, useState } from "react";
import { SparkChart, type SparkPoint } from "@/lib/modules/referrals/components/SparkChart";

type Overview = {
  totals: {
    clicks: number;
    conversions: number;
    gross_revenue_eur: number;
    pending_cents: number;
    approved_cents: number;
    paid_cents: number;
    voided_cents: number;
    total_affiliates: number;
  };
  timeseries: SparkPoint[];
  top_affiliates: {
    id: string;
    email: string | null;
    code: string | null;
    earnings_cents: number;
    status: string | null;
  }[];
  top_products: { product: string; count: number; total_cents: number }[];
  recent_conversions: {
    id: string;
    created_at: string;
    affiliate_email: string | null;
    affiliate_code: string | null;
    product: string | null;
    amount_eur: number;
  }[];
};

const fmtEur = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function ReferralsAdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals/admin/overview?days=30", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Error");
        return r.json() as Promise<Overview>;
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="text-sm text-ink/60">Cargando…</p>;

  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Afiliados" value={String(t.total_affiliates)} />
        <Kpi label="Clicks (30d)" value={String(t.clicks)} />
        <Kpi label="Conversiones" value={String(t.conversions)} />
        <Kpi label="Ingreso bruto" value={`${t.gross_revenue_eur.toLocaleString("es-ES")} €`} />
        <Kpi label="Pendiente" value={fmtEur(t.pending_cents)} />
        <Kpi label="Pagado" value={fmtEur(t.paid_cents)} />
      </div>

      <Section title="Actividad últimos 30 días">
        {data.timeseries.length ? (
          <SparkChart data={data.timeseries} height={260} />
        ) : (
          <p className="text-sm text-ink/60">Sin actividad reciente.</p>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Top 10 afiliados por earnings">
          {data.top_affiliates.length === 0 ? (
            <p className="text-sm text-ink/60">Sin datos todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10">
                <tr className="text-left text-xs uppercase text-ink/60">
                  <th className="px-2 py-2">Afiliado</th>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2 text-right">Ganado</th>
                </tr>
              </thead>
              <tbody>
                {data.top_affiliates.map((a) => (
                  <tr key={a.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-2 py-2 text-ink/80">{a.email ?? "—"}</td>
                    <td className="px-2 py-2 font-mono text-xs text-ink/60">{a.code ?? "—"}</td>
                    <td className="px-2 py-2 text-right">{fmtEur(a.earnings_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Top productos vendidos vía afiliados">
          {data.top_products.length === 0 ? (
            <p className="text-sm text-ink/60">Sin datos todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10">
                <tr className="text-left text-xs uppercase text-ink/60">
                  <th className="px-2 py-2">Producto</th>
                  <th className="px-2 py-2 text-right">Compras</th>
                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p) => (
                  <tr key={p.product} className="border-b border-ink/5 last:border-0">
                    <td className="px-2 py-2 text-ink/80">{p.product}</td>
                    <td className="px-2 py-2 text-right">{p.count}</td>
                    <td className="px-2 py-2 text-right">{fmtEur(p.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <Section title="Conversiones recientes">
        {data.recent_conversions.length === 0 ? (
          <p className="text-sm text-ink/60">Aún no hay conversiones.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr className="text-left text-xs uppercase text-ink/60">
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Afiliado</th>
                <th className="px-2 py-2">Producto</th>
                <th className="px-2 py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_conversions.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-2 py-2 text-ink/80">
                    {new Date(r.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="px-2 py-2 text-ink/80">
                    {r.affiliate_email ?? "—"}
                    {r.affiliate_code && (
                      <span className="ml-2 font-mono text-xs text-ink/50">
                        ({r.affiliate_code})
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-ink/80">{r.product ?? "—"}</td>
                  <td className="px-2 py-2 text-right">
                    {r.amount_eur ? `${r.amount_eur.toFixed(2)} €` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-ink/10 bg-paper p-4">
      <h2 className="mb-3 text-sm font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}
