import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Receipt, FileText, MessageCircle, ArrowUpRight } from "lucide-react";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext, getQuarterSummary, currentQuarter, listClientInvoices } from "@/lib/products/asesor-pro/client-queries";

export const dynamic = "force-dynamic";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default async function ClienteOverview() {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") redirect("/p/asesor-pro");
  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");

  const { year, quarter } = currentQuarter();
  const [summary, recentInvoices] = await Promise.all([
    getQuarterSummary(ctx.asesor_client_id, year, quarter),
    listClientInvoices(ctx.asesor_client_id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          Resumen · {summary.quarter} {year}
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          Hola, <span style={{ color: "#283B70" }}>{(user.full_name ?? "amig@").split(" ")[0]}</span>.
        </h1>
        <p className="font-sans text-ink-soft text-[15px] mt-2">
          Tu trimestre en marcha. Crea facturas, sube tickets y deja que tu asesor haga lo demás.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/app/asesor-pro/cliente/facturas/nueva"
          className="group bg-ink text-paper p-6 hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: "5px 5px 0 #B54E30" }}
        >
          <div className="flex items-center justify-between mb-4">
            <Plus className="w-6 h-6" />
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </div>
          <span className="font-display text-paper block" style={{ fontSize: "1.5rem", lineHeight: "1.1", fontWeight: 500 }}>
            Crear factura
          </span>
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-paper/60 mt-2 block">
            En 3 clicks · IVA automático
          </span>
        </Link>
        <Link
          href="/app/asesor-pro/cliente/gastos/nuevo"
          className="group bg-paper border-2 border-ink p-6 hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: "5px 5px 0 #1A1813" }}
        >
          <div className="flex items-center justify-between mb-4">
            <Receipt className="w-6 h-6 text-ink" />
            <ArrowUpRight className="w-4 h-4 text-ink-mute group-hover:rotate-45 transition-transform" />
          </div>
          <span className="font-display text-ink block" style={{ fontSize: "1.5rem", lineHeight: "1.1", fontWeight: 500 }}>
            Subir gasto
          </span>
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-mute mt-2 block">
            Foto del ticket · OCR
          </span>
        </Link>
        <Link
          href="/app/asesor-pro/cliente/chat"
          className="group bg-paper border-2 border-ink p-6 hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: "5px 5px 0 #1A1813" }}
        >
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-6 h-6 text-ink" />
            <ArrowUpRight className="w-4 h-4 text-ink-mute group-hover:rotate-45 transition-transform" />
          </div>
          <span className="font-display text-ink block" style={{ fontSize: "1.5rem", lineHeight: "1.1", fontWeight: 500 }}>
            Chat asesor
          </span>
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-mute mt-2 block">
            Pregunta · sin emails
          </span>
        </Link>
      </div>

      {/* Resumen trimestre */}
      <section className="bg-paper border-2 border-ink p-6" style={{ boxShadow: "5px 5px 0 #283B70" }}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/15">
          <h2 className="font-display text-ink text-xl" style={{ fontWeight: 500 }}>
            {summary.quarter} {summary.year}
          </h2>
          <span
            className="font-mono text-[11px] tracking-[0.2em] uppercase px-3 py-1"
            style={{
              background: summary.iva_diff_cents >= 0 ? "#B54E3020" : "#6B753520",
              color: summary.iva_diff_cents >= 0 ? "#B54E30" : "#6B7535",
            }}
          >
            IVA {summary.iva_diff_cents >= 0 ? "a pagar" : "a compensar"}: {eur(Math.abs(summary.iva_diff_cents))}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Facturas emitidas" value={String(summary.invoices_count)} />
          <Stat label="Base imponible" value={eur(summary.base_repercutido_cents)} />
          <Stat label="IVA repercutido" value={eur(summary.iva_repercutido_cents)} accent="#B54E30" />
          <Stat label="IVA soportado" value={eur(summary.iva_soportado_cents)} accent="#283B70" />
        </div>
      </section>

      {/* Facturas recientes */}
      <section className="bg-paper border-2 border-ink p-6" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/15">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-ink" />
            <h2 className="font-display text-ink text-xl" style={{ fontWeight: 500 }}>Facturas recientes</h2>
          </div>
          <Link
            href="/app/asesor-pro/cliente/facturas"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hover:text-terracotta-500"
          >
            Ver todas →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-sans text-ink-mute mb-4">Aún no has emitido ninguna factura.</p>
            <Link
              href="/app/asesor-pro/cliente/facturas/nueva"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear la primera
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {recentInvoices.slice(0, 5).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <span className="font-mono text-[12px] text-ink-mute block">
                    {inv.series ? `${inv.series}-` : ""}{inv.number} · {new Date(inv.issue_date).toLocaleDateString("es-ES")}
                  </span>
                  <span className="font-sans text-ink text-[14px] font-medium truncate block">
                    {inv.customer_fiscal_name}
                  </span>
                </div>
                <div className="text-right ml-4">
                  <span className="font-display text-ink block tabular-nums" style={{ fontSize: "1.125rem", fontWeight: 500 }}>
                    {eur(inv.total_cents)}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">{inv.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
        {label}
      </span>
      <span
        className="font-display text-ink block tabular-nums"
        style={{ fontSize: "1.5rem", lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: 500, color: accent }}
      >
        {value}
      </span>
    </div>
  );
}
