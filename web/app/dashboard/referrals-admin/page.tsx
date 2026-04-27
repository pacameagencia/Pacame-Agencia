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
  brands?: {
    id: string;
    slug: string;
    name: string;
    domain: string | null;
    affiliates: number;
    vip: number;
    conversions: number;
    pending_cents: number;
    paid_cents: number;
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
  const cvr = t.clicks > 0 ? ((t.conversions / t.clicks) * 100).toFixed(1) : "—";
  const alerts: { type: "warn" | "info" | "danger"; text: string; href?: string }[] = [];
  if (t.approved_cents > 0) {
    alerts.push({
      type: "warn",
      text: `${fmtEur(t.approved_cents)} aprobado pendiente de pagar a afiliados.`,
      href: "/dashboard/referrals-admin/affiliates?has_pending=1",
    });
  }
  const suspicious = (data.top_affiliates || []).filter((a) => a.status === "suspicious");
  if (suspicious.length > 0) {
    alerts.push({
      type: "danger",
      text: `${suspicious.length} afiliado(s) marcado(s) como sospechosos por antifraude.`,
      href: "/dashboard/referrals-admin/affiliates?status=suspicious",
    });
  }
  if (t.total_affiliates === 0) {
    alerts.push({
      type: "info",
      text: "Aún no tienes afiliados. Comparte la URL pacameagencia.com/afiliados.",
    });
  } else if (t.clicks === 0 && t.total_affiliates > 0) {
    alerts.push({
      type: "info",
      text: "Tienes afiliados pero ningún click este mes. Mándales un email recordatorio.",
    });
  }

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <section className="space-y-2">
          {alerts.map((a, i) => (
            <Alert key={i} type={a.type} text={a.text} href={a.href} />
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Afiliados" value={String(t.total_affiliates)} />
        <Kpi label="Clicks (30d)" value={String(t.clicks)} />
        <Kpi label="Conversiones" value={String(t.conversions)} />
        <Kpi label="Conv. rate" value={`${cvr}${cvr === "—" ? "" : "%"}`} />
        <Kpi label="Ingreso bruto" value={`${t.gross_revenue_eur.toLocaleString("es-ES")} €`} />
        <Kpi label="Pendiente" value={fmtEur(t.pending_cents)} />
        <Kpi label="Pagado" value={fmtEur(t.paid_cents)} />
      </div>

      <Section title="Por marca">
        {(data.brands?.length ?? 0) === 0 ? (
          <p className="text-sm text-ink/60">No hay marcas configuradas. Ve a <a href="/dashboard/referrals-admin/marcas" className="underline">Marcas</a> para crear las primeras.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(data.brands ?? []).map((b) => (
              <article key={b.id} className="rounded-md border border-ink/10 bg-paper p-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading text-lg text-ink">{b.name}</h3>
                  <span className="text-xs uppercase tracking-wider text-ink/50">{b.slug}</span>
                </div>
                {b.domain && <p className="mt-1 font-mono text-xs text-ink/55">{b.domain}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-ink/60">Afiliados</div>
                    <div className="font-heading text-xl text-ink">{b.affiliates}</div>
                    {b.vip > 0 && <div className="text-xs text-terracotta-500">{b.vip} VIP</div>}
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Conversiones</div>
                    <div className="font-heading text-xl text-ink">{b.conversions}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Pendiente</div>
                    <div className="text-sm text-ink">{fmtEur(b.pending_cents)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Pagado</div>
                    <div className="text-sm text-emerald-700">{fmtEur(b.paid_cents)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

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

function Alert({
  type, text, href,
}: {
  type: "warn" | "info" | "danger"; text: string; href?: string;
}) {
  const styles =
    type === "danger"
      ? "border-rose-300 bg-rose-50 text-rose-900"
      : type === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-ink/10 bg-paper text-ink/80";
  const icon = type === "danger" ? "⚠" : type === "warn" ? "⏳" : "ℹ";
  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border p-3 text-sm ${styles}`}>
      <div className="flex gap-2">
        <span aria-hidden>{icon}</span>
        <span>{text}</span>
      </div>
      {href && (
        <a href={href} className="shrink-0 underline hover:no-underline">
          Resolver →
        </a>
      )}
    </div>
  );
}
