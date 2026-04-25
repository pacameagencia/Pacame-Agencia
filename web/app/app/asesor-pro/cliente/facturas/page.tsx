import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Download, ArrowUpRight } from "lucide-react";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext, listClientInvoices } from "@/lib/products/asesor-pro/client-queries";

export const dynamic = "force-dynamic";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default async function ClienteFacturasPage() {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") redirect("/p/asesor-pro");
  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");

  const invoices = await listClientInvoices(ctx.asesor_client_id);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            Mis facturas
          </span>
          <h1
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            {invoices.length} factura{invoices.length === 1 ? "" : "s"}
          </h1>
        </div>
        <Link
          href="/app/asesor-pro/cliente/facturas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors"
          style={{ boxShadow: "3px 3px 0 #B54E30" }}
        >
          <Plus className="w-4 h-4" />
          Nueva factura
        </Link>
      </div>

      <div className="bg-paper border-2 border-ink overflow-hidden" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-sans text-ink-mute mb-4">Aún no has emitido ninguna factura.</p>
            <Link
              href="/app/asesor-pro/cliente/facturas/nueva"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-[14px] font-sans hover:bg-terracotta-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear la primera
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-sand-100 border-b-2 border-ink">
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Nº</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Fecha</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Cliente</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Base</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">IVA</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Total</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} className={`border-b border-ink/10 hover:bg-sand-50 ${i === invoices.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink">
                    {inv.series ? `${inv.series}-` : ""}{inv.number}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-soft">
                    {new Date(inv.issue_date).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-sans text-ink text-[13px] font-medium">{inv.customer_fiscal_name}</span>
                    <span className="block font-mono text-[10px] text-ink-mute mt-0.5">{inv.customer_nif}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-ink-soft">{eur(inv.subtotal_cents)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-ink-soft">{eur(inv.iva_cents)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums font-medium text-ink">{eur(inv.total_cents)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 bg-ink-mute/15 text-ink-mute">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/products/asesor-pro/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-mono uppercase tracking-[0.15em] text-ink hover:text-terracotta-500"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
