"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/modules/referrals/client";

type Referral = {
  id: string;
  status: "pending" | "converted" | "cancelled";
  created_at: string;
  converted_at: string | null;
  stripe_subscription_id: string | null;
};

export default function ReferidosPage() {
  const [items, setItems] = useState<Referral[] | null>(null);

  useEffect(() => {
    fetch("/api/referrals/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) { window.location.href = "/afiliados/login"; return null; }
        return r.ok ? r.json() : null;
      })
      .then((j) => setItems(j?.referrals ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <p className="text-sm text-ink/60">Cargando…</p>;
  if (!items.length) {
    return (
      <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
        Aún no tienes referidos. Comparte tu enlace para empezar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-ink/10 bg-paper">
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
          {items.map((r) => (
            <tr key={r.id} className="border-b border-ink/5 last:border-0">
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
