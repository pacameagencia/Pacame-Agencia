import Link from "next/link";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { listAllInvoices, listAsesorClients } from "@/lib/products/asesor-pro/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-ink/10 text-ink-mute" },
  issued: { label: "Emitida", color: "bg-indigo-600/10 text-indigo-600" },
  sent: { label: "Enviada", color: "bg-indigo-600/10 text-indigo-600" },
  paid: { label: "Pagada", color: "bg-green-600/15 text-green-700" },
  overdue: { label: "Vencida", color: "bg-rose-alert/10 text-rose-alert" },
  cancelled: { label: "Anulada", color: "bg-ink/10 text-ink-mute line-through" },
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

interface SP { client?: string; estado?: string; trimestre?: string }

export default async function FacturasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireOwnerOrAdmin();
  const sp = await searchParams;
  const clients = await listAsesorClients(user.id);
  const year = new Date().getFullYear();
  const quarter = sp.trimestre ? (parseInt(sp.trimestre, 10) as 1 | 2 | 3 | 4) : null;
  const invoices = await listAllInvoices(user.id, {
    client_id: sp.client || null,
    quarter: quarter && [1, 2, 3, 4].includes(quarter) ? quarter : null,
    year: quarter ? year : null,
  });

  const filtered = sp.estado
    ? invoices.filter((i) => i.status === sp.estado)
    : invoices;

  const totalBase = filtered.reduce((a, i) => a + i.subtotal_cents, 0);
  const totalIva = filtered.reduce((a, i) => a + i.iva_cents, 0);
  const totalTotal = filtered.reduce((a, i) => a + i.total_cents, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          AsesorPro · Facturas
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          {filtered.length} factura{filtered.length === 1 ? "" : "s"}
        </h1>
        <p className="font-sans text-ink-mute mt-1 text-sm">
          Base {fmt(totalBase)} · IVA {fmt(totalIva)} · Total <strong className="text-ink">{fmt(totalTotal)}</strong>
        </p>
      </header>

      <form className="bg-paper border-2 border-ink/15 p-4 flex flex-wrap gap-3 items-end" method="get">
        <label className="block flex-1 min-w-[180px]">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">
            Cliente
          </span>
          <select
            name="client"
            defaultValue={sp.client ?? ""}
            className="w-full bg-paper border border-ink/30 px-3 py-2 text-sm font-sans focus-visible:outline-2 focus-visible:outline-terracotta-500"
          >
            <option value="">Todos</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fiscal_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">Estado</span>
          <select
            name="estado"
            defaultValue={sp.estado ?? ""}
            className="bg-paper border border-ink/30 px-3 py-2 text-sm font-sans focus-visible:outline-2 focus-visible:outline-terracotta-500"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">Trimestre</span>
          <select
            name="trimestre"
            defaultValue={sp.trimestre ?? ""}
            className="bg-paper border border-ink/30 px-3 py-2 text-sm font-sans focus-visible:outline-2 focus-visible:outline-terracotta-500"
          >
            <option value="">Todos</option>
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Q{q} {year}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-ink text-paper text-sm font-sans hover:bg-terracotta-500 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin facturas todavía"
          description="Cuando tus clientes emitan facturas las verás aquí, con base, IVA y estado."
          cta={{ label: "Ver clientes", href: "/app/asesor-pro/clientes", icon: ArrowRight }}
        />
      ) : (
        <div className="bg-paper border-2 border-ink/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 border-b-2 border-ink/15">
                <tr className="text-left">
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                    Fecha
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                    Nº
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                    Cliente / Destinatario
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden md:table-cell">
                    Base
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden md:table-cell">
                    IVA
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute text-right">
                    Total
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const stat = STATUS_LABEL[inv.status] ?? { label: inv.status, color: "bg-ink/10" };
                  const needsReview = !inv.reviewed_by_asesor_at && inv.status !== "draft";
                  return (
                    <tr key={inv.id} className="border-b border-ink/10 hover:bg-sand-100/50">
                      <td className="px-4 py-3 font-mono text-[12px] text-ink-mute whitespace-nowrap">
                        {new Date(inv.issue_date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink whitespace-nowrap">
                        {inv.series ? `${inv.series}/` : ""}
                        {inv.number ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        <div className="font-sans">{inv.client_fiscal_name}</div>
                        <div className="font-mono text-[11px] text-ink-mute">→ {inv.customer_fiscal_name ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink hidden md:table-cell">
                        {fmt(inv.subtotal_cents)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink hidden md:table-cell">
                        {fmt(inv.iva_cents)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-ink font-semibold text-right whitespace-nowrap">
                        {fmt(inv.total_cents)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase ${stat.color}`}>
                          {inv.status === "paid" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : inv.status === "overdue" ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {stat.label}
                        </span>
                        {needsReview && (
                          <span className="ml-2 font-mono text-[10px] tracking-[0.15em] uppercase text-mustard-700">
                            · revisar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-ink/10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em] text-ink-mute">
            <span>{filtered.length} resultados</span>
            <Link href="/app/asesor-pro/clientes" className="text-terracotta-500 hover:text-terracotta-600">
              Ver clientes →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
