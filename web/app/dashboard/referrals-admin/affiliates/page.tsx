"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/modules/referrals/components/StatusPill";

type Affiliate = {
  id: string;
  email: string;
  code: string;
  status: "active" | "suspicious" | "disabled";
  conversions: number;
  pending_cents: number;
  approved_cents: number;
  paid_cents: number;
  voided_cents: number;
  created_at: string;
};

const fmtEur = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function AffiliatesAdminPage() {
  const [items, setItems] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [hasPending, setHasPending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (hasPending) qs.set("has_pending", "1");
    try {
      const r = await fetch(`/api/referrals/admin/affiliates?${qs}`, { credentials: "include" });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      const j = (await r.json()) as { affiliates: Affiliate[] };
      setItems(j.affiliates);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, hasPending]);

  const setStatus = async (id: string, status: Affiliate["status"]) => {
    setBusy(id);
    try {
      const r = await fetch("/api/referrals/admin/affiliate-status", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ affiliate_id: id, status }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const markPaid = async (id: string) => {
    if (!confirm("¿Marcar todas las comisiones aprobadas como pagadas?")) return;
    setBusy(id);
    try {
      const r = await fetch("/api/referrals/payouts/mark-paid", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ affiliate_id: id }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="suspicious">Sospechosos</option>
          <option value="disabled">Desactivados</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={hasPending}
            onChange={(e) => setHasPending(e.target.checked)}
          />
          Solo con pagos pendientes
        </label>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-ink/60">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Sin afiliados con esos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr className="text-left text-xs uppercase text-ink/60">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2 text-right">Conv.</th>
                <th className="px-3 py-2 text-right">Pendiente</th>
                <th className="px-3 py-2 text-right">Aprobado</th>
                <th className="px-3 py-2 text-right">Pagado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2 text-ink/80">{a.email}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                  <td className="px-3 py-2"><StatusPill status={a.status} /></td>
                  <td className="px-3 py-2 text-right">{a.conversions}</td>
                  <td className="px-3 py-2 text-right">{fmtEur(a.pending_cents)}</td>
                  <td className="px-3 py-2 text-right">{fmtEur(a.approved_cents)}</td>
                  <td className="px-3 py-2 text-right">{fmtEur(a.paid_cents)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <select
                        value={a.status}
                        onChange={(e) => setStatus(a.id, e.target.value as Affiliate["status"])}
                        disabled={busy === a.id}
                        className="rounded-sm border border-ink/15 bg-paper px-2 py-1 text-xs"
                      >
                        <option value="active">active</option>
                        <option value="suspicious">suspicious</option>
                        <option value="disabled">disabled</option>
                      </select>
                      {a.approved_cents > 0 && (
                        <button
                          type="button"
                          onClick={() => markPaid(a.id)}
                          disabled={busy === a.id}
                          className="rounded-sm bg-terracotta-500 px-2 py-1 text-xs text-paper hover:bg-terracotta-600 disabled:opacity-50"
                        >
                          Marcar pagado
                        </button>
                      )}
                    </div>
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
