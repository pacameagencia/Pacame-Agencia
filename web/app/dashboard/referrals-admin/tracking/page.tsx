"use client";

import { useEffect, useState } from "react";

type Visit = {
  id: string;
  created_at: string;
  affiliate_id: string;
  affiliate_email: string | null;
  affiliate_code: string | null;
  visitor_uuid: string;
  ip: string | null;
  user_agent: string | null;
  http_referer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landed_path: string | null;
  converted: boolean;
};

export default function TrackingPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(50);
  const [total, setTotal] = useState(0);
  const [affiliateId, setAffiliateId] = useState("");
  const [ip, setIp] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (affiliateId) qs.set("affiliate_id", affiliateId);
    if (ip) qs.set("ip", ip);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const r = await fetch(`/api/referrals/admin/visits?${qs}`, { credentials: "include" });
    if (r.ok) {
      const j = (await r.json()) as { visits: Visit[]; total: number };
      setVisits(j.visits);
      setTotal(j.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          placeholder="Affiliate ID"
          value={affiliateId}
          onChange={(e) => setAffiliateId(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm font-mono"
        />
        <input
          placeholder="IP"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm font-mono"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-3 py-1.5 text-sm"
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
      </div>

      <p className="text-xs text-ink/60">{total} visitas — página {page}</p>

      {loading ? (
        <p className="text-sm text-ink/60">Cargando…</p>
      ) : visits.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Sin visitas con estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr className="text-left text-xs uppercase text-ink/60">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Afiliado</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Referer</th>
                <th className="px-3 py-2">UTM</th>
                <th className="px-3 py-2">Landed</th>
                <th className="px-3 py-2">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2 text-xs text-ink/70">
                    {new Date(v.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-ink/80">
                    {v.affiliate_email ?? "—"}
                    {v.affiliate_code && (
                      <span className="ml-1 font-mono text-xs text-ink/50">({v.affiliate_code})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{v.ip ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[180px] truncate text-xs text-ink/60" title={v.http_referer ?? ""}>
                    {v.http_referer ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink/70">
                    {v.utm_source ? `${v.utm_source}/${v.utm_medium ?? "—"}/${v.utm_campaign ?? "—"}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{v.landed_path ?? "/"}</td>
                  <td className="px-3 py-2">
                    {v.converted ? (
                      <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">sí</span>
                    ) : (
                      <span className="text-xs text-ink/40">—</span>
                    )}
                  </td>
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
