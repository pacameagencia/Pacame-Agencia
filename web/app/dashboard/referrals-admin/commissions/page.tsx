"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/modules/referrals/components/StatusPill";

type Referral = {
  id: string;
  created_at: string;
  status: string;
  affiliate_email: string | null;
  affiliate_code: string | null;
  product: string | null;
  amount_eur: number;
  commissions_count: number;
  commissions_total_cents: number;
  latest_commission_status: string | null;
  stripe_subscription_id: string | null;
};

const fmtEur = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function CommissionsAdminPage() {
  const [items, setItems] = useState<Referral[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(50);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) qs.set("status", status);
    if (product) qs.set("product", product);
    const r = await fetch(`/api/referrals/admin/referrals?${qs}`, { credentials: "include" });
    if (r.ok) {
      const j = (await r.json()) as { referrals: Referral[]; total: number };
      setItems(j.referrals);
      setTotal(j.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const exportCsv = () => {
    const headers = ["fecha", "afiliado", "code", "producto", "importe", "estado", "comisiones", "comision_total"];
    const rows = items.map((r) => [
      r.created_at,
      r.affiliate_email ?? "",
      r.affiliate_code ?? "",
      r.product ?? "",
      String(r.amount_eur),
      r.status,
      String(r.commissions_count),
      String(r.commissions_total_cents / 100),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="converted">Convertidos</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <input
          placeholder="Producto (web, seo_monthly, …)"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm font-mono"
        />
        <button
          type="button"
          onClick={() => {
            setPage(1);
            load();
          }}
          className="rounded-sm bg-terracotta-500 px-3 py-1.5 text-sm font-medium text-paper hover:bg-terracotta-600"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm text-ink hover:bg-ink/5"
        >
          Exportar CSV
        </button>
      </div>

      <p className="text-xs text-ink/60">{total} referidos — página {page}</p>

      {loading ? (
        <p className="text-sm text-ink/60">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Sin resultados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr className="text-left text-xs uppercase text-ink/60">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Afiliado</th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2 text-right">Importe</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2 text-right">Comisiones</th>
                <th className="px-3 py-2 text-right">Total comisión</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2 text-xs text-ink/70">
                    {new Date(r.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-ink/80">
                    {r.affiliate_email ?? "—"}
                    {r.affiliate_code && (
                      <span className="ml-1 font-mono text-xs text-ink/50">({r.affiliate_code})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink/80">{r.product ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {r.amount_eur ? `${r.amount_eur.toFixed(2)} €` : "—"}
                  </td>
                  <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-2 text-right">{r.commissions_count}</td>
                  <td className="px-3 py-2 text-right">{fmtEur(r.commissions_total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-sm border border-ink/15 px-3 py-1 text-sm disabled:opacity-50"
        >
          ← Anterior
        </button>
        <button
          type="button"
          disabled={page * size >= total}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-sm border border-ink/15 px-3 py-1 text-sm disabled:opacity-50"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
