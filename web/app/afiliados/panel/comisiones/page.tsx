"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/modules/referrals/client";

type Commission = {
  id: string;
  source_event: string;
  amount_cents: number;
  status: string;
  month_index: number;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function ComisionesPage() {
  const [items, setItems] = useState<Commission[] | null>(null);

  useEffect(() => {
    fetch("/api/referrals/me/commissions", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) { window.location.href = "/afiliados/login"; return null; }
        return r.ok ? r.json() : null;
      })
      .then((j) => setItems(j?.commissions ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <p className="text-sm text-ink/60">Cargando…</p>;

  const totals = (items ?? []).reduce(
    (acc, c) => {
      if (c.status in acc) (acc as Record<string, number>)[c.status] += c.amount_cents;
      return acc;
    },
    { pending: 0, approved: 0, paid: 0, voided: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Pendiente" value={fmt(totals.pending)} />
        <Kpi label="Aprobado" value={fmt(totals.approved)} />
        <Kpi label="Pagado" value={fmt(totals.paid)} />
        <Kpi label="Anulado" value={fmt(totals.voided)} />
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Aún no tienes comisiones. Cada vez que un cliente que trajiste pague,
          se generará una fila aquí en pocos minutos.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr className="text-left text-xs uppercase text-ink/60">
                <th className="px-4 py-2">Mes</th>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2 text-right">Importe</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const md = c.metadata || {};
                const product = (md as Record<string, unknown>).product as string | undefined;
                return (
                  <tr key={c.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-2">#{c.month_index}</td>
                    <td className="px-4 py-2 text-ink/80">{product ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(c.amount_cents)}</td>
                    <td className="px-4 py-2"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-2 text-xs text-ink/60">
                      {c.paid_at
                        ? new Date(c.paid_at).toLocaleDateString("es-ES")
                        : c.due_at
                          ? new Date(c.due_at).toLocaleDateString("es-ES")
                          : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
