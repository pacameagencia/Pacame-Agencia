"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Euro,
  DollarSign,
} from "lucide-react";

interface OrderRow {
  id: string;
  order_number: string | null;
  client_id: string | null;
  service_slug: string;
  amount_cents: number;
  status: string;
  progress_pct: number | null;
  escalated_to_pablo: boolean;
  delivered_at: string | null;
  rating: number | null;
  cost_usd: number | null;
  pacame_margin_cents: number | null;
  customer_email: string | null;
  customer_name: string | null;
  created_at: string;
}

interface Summary {
  total: number;
  delivered: number;
  processing: number;
  escalated: number;
  revenue_cents: number;
  margin_cents: number;
  cost_usd: number;
}

const statusColors: Record<string, string> = {
  paid: "text-yellow-400 bg-yellow-400/10",
  inputs_pending: "text-yellow-400 bg-yellow-400/10",
  processing: "text-blue-400 bg-blue-400/10",
  delivered: "text-green-400 bg-green-400/10",
  revision_requested: "text-blue-400 bg-blue-400/10",
  escalated: "text-orange-400 bg-orange-400/10",
  refunded: "text-white/40 bg-white/5",
  cancelled: "text-white/40 bg-white/5",
  failed: "text-red-400 bg-red-400/10",
};

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/orders?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setSummary(d.summary || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-olympus-gold" />
            Pedidos Marketplace
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Todos los pedidos con delivery automatico y escalada a Pablo cuando hace falta.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Kpi
            label="Pedidos totales"
            value={String(summary.total)}
            icon={<ShoppingBag className="w-4 h-4" />}
          />
          <Kpi
            label="Entregados"
            value={String(summary.delivered)}
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
          />
          <Kpi
            label="Revenue"
            value={`${(summary.revenue_cents / 100).toFixed(0)}€`}
            icon={<Euro className="w-4 h-4 text-olympus-gold" />}
          />
          <Kpi
            label="Margen PACAME"
            value={`${(summary.margin_cents / 100).toFixed(0)}€`}
            subtext={`Coste IA: $${summary.cost_usd.toFixed(2)}`}
            icon={<TrendingUp className="w-4 h-4 text-olympus-gold" />}
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {[
          ["all", "Todos"],
          ["processing", "En proceso"],
          ["delivered", "Entregados"],
          ["escalated", "Escalados"],
          ["inputs_pending", "Esperan brief"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
              filter === val
                ? "bg-olympus-gold text-black font-semibold"
                : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/50">Cargando...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white/[0.03] border border-white/[0.06] text-center">
          <ShoppingBag className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No hay pedidos con este filtro.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-white/50">
              <tr>
                <th className="text-left p-3">Pedido</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Servicio</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Precio</th>
                <th className="text-right p-3">Margen</th>
                <th className="text-left p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="p-3">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-mono text-xs text-olympus-gold hover:underline"
                    >
                      {o.order_number || o.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="text-white">{o.customer_name || "—"}</div>
                    <div className="text-xs text-white/40">{o.customer_email || "—"}</div>
                  </td>
                  <td className="p-3 text-white/70">{o.service_slug}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        statusColors[o.status] || "text-white/60"
                      }`}
                    >
                      {o.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                      {o.status === "delivered" && <CheckCircle2 className="w-3 h-3" />}
                      {o.status === "escalated" && <AlertCircle className="w-3 h-3" />}
                      {o.status === "paid" && <Clock className="w-3 h-3" />}
                      {o.status === "inputs_pending" && <Clock className="w-3 h-3" />}
                      {o.status}
                      {o.progress_pct && o.status === "processing" && ` ${o.progress_pct}%`}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-white">
                    {(o.amount_cents / 100).toFixed(0)}€
                  </td>
                  <td className="p-3 text-right">
                    {o.pacame_margin_cents !== null ? (
                      <span className="text-olympus-gold">
                        {(o.pacame_margin_cents / 100).toFixed(0)}€
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                    {o.cost_usd ? (
                      <div className="text-[10px] text-white/40 flex items-center justify-end gap-0.5">
                        <DollarSign className="w-2.5 h-2.5" />
                        {o.cost_usd.toFixed(2)} IA
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-xs text-white/50">
                    {new Date(o.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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

function Kpi({
  label,
  value,
  icon,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="font-bold text-2xl text-white">{value}</div>
      {subtext && <div className="text-xs text-white/40 mt-0.5">{subtext}</div>}
    </div>
  );
}
