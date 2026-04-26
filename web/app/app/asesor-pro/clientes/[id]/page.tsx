import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Receipt, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { getAsesorClient } from "@/lib/products/asesor-pro/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import ChatThread from "@/components/products/asesor-pro/ChatThread";

export const dynamic = "force-dynamic";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOwnerOrAdmin();
  const { id } = await params;
  const client = await getAsesorClient(user.id, id);
  if (!client) notFound();

  const supabase = createServerSupabase();
  const [invoices, expenses] = await Promise.all([
    supabase
      .from("asesorpro_invoices")
      .select("id, number, series, issue_date, customer_fiscal_name, total_cents, status")
      .eq("asesor_client_id", id)
      .order("issue_date", { ascending: false })
      .limit(20),
    supabase
      .from("asesorpro_expenses")
      .select("id, vendor_name, expense_date, total_cents, category, status, ocr_confidence")
      .eq("asesor_client_id", id)
      .order("expense_date", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/app/asesor-pro/clientes" className="inline-flex items-center gap-2 text-ink-mute hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase">Volver a clientes</span>
      </Link>

      {/* Header con datos */}
      <div className="bg-paper border-2 border-ink p-6" style={{ boxShadow: "5px 5px 0 #283B70" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">{client.iva_regime}</span>
            <h1
              className="font-display text-ink mt-1 mb-2"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              {client.fiscal_name}
            </h1>
            {client.trade_name && <p className="font-sans text-ink-soft text-[14px] mb-3">{client.trade_name}</p>}
            <div className="font-mono text-[12px] text-ink-soft space-y-1">
              <div>NIF · {client.nif}</div>
              {client.email && <div className="inline-flex items-center gap-2"><Mail className="w-3 h-3" /> {client.email}</div>}
              {client.phone && <div className="inline-flex items-center gap-2 ml-3"><Phone className="w-3 h-3" /> {client.phone}</div>}
              {client.city && <div className="inline-flex items-center gap-2"><MapPin className="w-3 h-3" /> {client.city}</div>}
            </div>
          </div>
          <StatusBadge status={client.status} />
        </div>
      </div>

      {/* Grid: stats + chat */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Columna izq: facturas + gastos */}
        <div className="lg:col-span-3 space-y-4">
          <section className="bg-paper border-2 border-ink p-5" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/15">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-ink" />
                <h2 className="font-display text-ink text-base" style={{ fontWeight: 500 }}>Facturas ({invoices.data?.length ?? 0})</h2>
              </div>
            </div>
            {(invoices.data?.length ?? 0) === 0 ? (
              <p className="font-sans text-ink-mute text-sm py-4">Sin facturas todavía.</p>
            ) : (
              <ul className="divide-y divide-ink/10 max-h-64 overflow-y-auto">
                {invoices.data!.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] text-ink-mute block">
                        {inv.series ? `${inv.series}-` : ""}{inv.number} · {new Date(inv.issue_date).toLocaleDateString("es-ES")}
                      </span>
                      <span className="font-sans text-ink text-[13px] truncate block">{inv.customer_fiscal_name}</span>
                    </div>
                    <span className="font-display text-ink tabular-nums" style={{ fontSize: "1rem", fontWeight: 500 }}>
                      {eur(inv.total_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-paper border-2 border-ink p-5" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/15">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-ink" />
                <h2 className="font-display text-ink text-base" style={{ fontWeight: 500 }}>Gastos ({expenses.data?.length ?? 0})</h2>
              </div>
            </div>
            {(expenses.data?.length ?? 0) === 0 ? (
              <p className="font-sans text-ink-mute text-sm py-4">Sin gastos subidos.</p>
            ) : (
              <ul className="divide-y divide-ink/10 max-h-64 overflow-y-auto">
                {expenses.data!.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] text-ink-mute block">
                        {e.expense_date ? new Date(e.expense_date).toLocaleDateString("es-ES") : "—"}
                        {e.category && ` · ${e.category}`}
                      </span>
                      <span className="font-sans text-ink text-[13px] truncate block">{e.vendor_name ?? "Sin nombre"}</span>
                    </div>
                    <span className="font-display text-ink tabular-nums" style={{ fontSize: "1rem", fontWeight: 500 }}>
                      {eur(e.total_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Columna der: chat */}
        <div className="lg:col-span-2">
          {client.client_user_id ? (
            <ChatThread
              asesorClientId={client.id}
              currentUserId={user.id}
              counterpartName={client.fiscal_name}
              counterpartSubtitle={`NIF ${client.nif}`}
            />
          ) : (
            <div className="bg-paper border-2 border-ink/30 p-6 text-center" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
              <MessageCircle className="w-10 h-10 mx-auto text-ink-mute/40 mb-3" />
              <p className="font-sans text-ink-mute text-sm mb-2">
                {client.status === "invited"
                  ? "Esperando que el cliente acepte la invitación"
                  : "El cliente aún no ha accedido a su panel"}
              </p>
              {client.status === "invited" && (
                <p className="font-mono text-[11px] text-ink-mute/70">
                  El chat se activa cuando el cliente acepta y crea su cuenta.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: "bg-olive-500/20 text-olive-600", label: "activo" },
    invited: { color: "bg-mustard-500/20 text-mustard-700", label: "invitado · pdte aceptar" },
    paused: { color: "bg-ink-mute/20 text-ink-mute", label: "pausa" },
    archived: { color: "bg-rose-alert/20 text-rose-alert", label: "archivado" },
  };
  const cfg = map[status] ?? map.paused;
  return (
    <span className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
