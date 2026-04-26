import Link from "next/link";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { listAllExpenses, listAsesorClients } from "@/lib/products/asesor-pro/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt, ArrowRight, ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-mustard-500/15 text-mustard-700" },
  reviewed: { label: "Revisado", color: "bg-green-600/15 text-green-700" },
  rejected: { label: "Rechazado", color: "bg-rose-alert/10 text-rose-alert" },
  archived: { label: "Archivado", color: "bg-ink/10 text-ink-mute" },
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; estado?: string }>;
}) {
  const user = await requireOwnerOrAdmin();
  const sp = await searchParams;
  const clients = await listAsesorClients(user.id);
  const expenses = await listAllExpenses(user.id, {
    client_id: sp.client || null,
    status: sp.estado || null,
  });

  const ivaSoportado = expenses
    .filter((e) => e.status !== "rejected")
    .reduce((a, e) => a + e.iva_cents, 0);
  const totalGasto = expenses
    .filter((e) => e.status !== "rejected")
    .reduce((a, e) => a + e.total_cents, 0);
  const pendingCount = expenses.filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            AsesorPro · Gastos
          </span>
          <h1
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            {expenses.length} gasto{expenses.length === 1 ? "" : "s"}
          </h1>
          <p className="font-sans text-ink-mute mt-1 text-sm">
            IVA soportado <strong className="text-ink">{fmt(ivaSoportado)}</strong> · Total {fmt(totalGasto)} ·{" "}
            <span className="text-mustard-700">{pendingCount} pendientes</span>
          </p>
        </div>
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
        <button
          type="submit"
          className="px-4 py-2 bg-ink text-paper text-sm font-sans hover:bg-terracotta-500 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin gastos registrados"
          description="Cuando tus clientes suban tickets desde su panel, aparecerán aquí con OCR aplicado para revisión."
          cta={{ label: "Ver clientes", href: "/app/asesor-pro/clientes", icon: ArrowRight }}
        />
      ) : (
        <div className="bg-paper border-2 border-ink/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 border-b-2 border-ink/15">
                <tr className="text-left">
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Fecha</th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                    Cliente / Proveedor
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden md:table-cell">
                    Categoría
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden lg:table-cell">
                    Base
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden lg:table-cell">
                    IVA
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute text-right">
                    Total
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Estado</th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute" aria-label="Adjunto" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => {
                  const stat = STATUS_LABEL[e.status] ?? { label: e.status, color: "bg-ink/10" };
                  return (
                    <tr key={e.id} className="border-b border-ink/10 hover:bg-sand-100/50">
                      <td className="px-4 py-3 font-mono text-[12px] text-ink-mute whitespace-nowrap">
                        {new Date(e.expense_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        <div className="font-sans">{e.client_fiscal_name}</div>
                        <div className="font-mono text-[11px] text-ink-mute">{e.vendor_name ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-mute hidden md:table-cell">{e.category ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink hidden lg:table-cell">{fmt(e.base_cents)}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink hidden lg:table-cell">{fmt(e.iva_cents)}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-ink font-semibold text-right whitespace-nowrap">
                        {fmt(e.total_cents)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase ${stat.color}`}>
                          {stat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.photo_url && (
                          <a
                            href={e.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink-mute hover:text-terracotta-500"
                            aria-label="Ver foto del ticket"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
