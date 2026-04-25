import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Camera, Receipt } from "lucide-react";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ExpenseRow {
  id: string;
  vendor_name: string | null;
  expense_date: string | null;
  total_cents: number;
  iva_cents: number | null;
  category: string | null;
  ocr_confidence: number | null;
  status: string;
  photo_url: string | null;
}

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

const STATUS_LABELS: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-mustard-500/20 text-mustard-700", label: "pendiente revisar" },
  reviewed: { color: "bg-olive-500/20 text-olive-600", label: "revisado" },
  rejected: { color: "bg-rose-alert/20 text-rose-alert", label: "rechazado" },
  archived: { color: "bg-ink-mute/20 text-ink-mute", label: "archivado" },
};

export default async function GastosPage() {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") redirect("/p/asesor-pro");
  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_expenses")
    .select("id, vendor_name, expense_date, total_cents, iva_cents, category, ocr_confidence, status, photo_url")
    .eq("asesor_client_id", ctx.asesor_client_id)
    .order("expense_date", { ascending: false })
    .limit(200);

  const expenses = (data ?? []) as ExpenseRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            Mis gastos
          </span>
          <h1
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            {expenses.length} gasto{expenses.length === 1 ? "" : "s"}
          </h1>
        </div>
        <Link
          href="/app/asesor-pro/cliente/gastos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors"
          style={{ boxShadow: "3px 3px 0 #B54E30" }}
        >
          <Camera className="w-4 h-4" />
          Subir foto
        </Link>
      </div>

      <div className="bg-paper border-2 border-ink overflow-hidden" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
        {expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 mx-auto text-ink-mute/40 mb-4" />
            <p className="font-sans text-ink-mute mb-4">Aún no has subido gastos.</p>
            <Link
              href="/app/asesor-pro/cliente/gastos/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-[14px] font-sans hover:bg-terracotta-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Sube el primero
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-sand-100 border-b-2 border-ink">
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Fecha</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Comercio</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden md:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden lg:table-cell">IVA</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Total</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">Estado</th>
                <th className="text-center px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute hidden md:table-cell">OCR</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => {
                const cfg = STATUS_LABELS[e.status] ?? STATUS_LABELS.pending;
                return (
                  <tr key={e.id} className={`border-b border-ink/10 hover:bg-sand-50 ${i === expenses.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink-soft">
                      {e.expense_date ? new Date(e.expense_date).toLocaleDateString("es-ES") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sans text-ink text-[13px] font-medium">{e.vendor_name ?? "Sin nombre"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {e.category && (
                        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">{e.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-ink-soft hidden lg:table-cell">
                      {eur(e.iva_cents ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums font-medium text-ink">
                      {eur(e.total_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {e.ocr_confidence !== null && (
                        <span
                          className={`font-mono text-[10px] ${
                            e.ocr_confidence >= 0.8 ? "text-olive-600" : e.ocr_confidence >= 0.5 ? "text-mustard-700" : "text-rose-alert"
                          }`}
                        >
                          {Math.round(e.ocr_confidence * 100)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
