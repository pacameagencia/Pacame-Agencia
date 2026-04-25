"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, ArrowLeft, Loader2, AlertCircle, Check } from "lucide-react";

interface Line {
  description: string;
  quantity: number;
  unit_price_cents: number;
  iva_pct: number;
}

const EMPTY_LINE: Line = { description: "", quantity: 1, unit_price_cents: 0, iva_pct: 21 };

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

function parseEur(input: string): number {
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export default function NewInvoiceForm({
  issuerName,
  issuerNif,
  nextNumber,
}: {
  issuerName: string;
  issuerNif: string;
  nextNumber: string;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerNif, setCustomerNif] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totals = useMemo(() => {
    let subtotal = 0;
    let iva = 0;
    for (const l of lines) {
      const lineSub = Math.round(l.quantity * l.unit_price_cents);
      subtotal += lineSub;
      iva += Math.round((lineSub * l.iva_pct) / 100);
    }
    return { subtotal, iva, total: subtotal + iva };
  }, [lines]);

  function updateLine(idx: number, partial: Partial<Line>) {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...partial } : l)));
  }

  function addLine() {
    setLines([...lines, { ...EMPTY_LINE }]);
  }

  function removeLine(idx: number) {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/products/asesor-pro/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_fiscal_name: customerName,
          customer_nif: customerNif,
          customer_email: customerEmail || undefined,
          customer_address: customerAddress || undefined,
          issue_date: issueDate,
          lines,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.invoice) {
        setError(json.error ?? "No se pudo crear la factura");
        return;
      }
      setSuccess(`Factura ${json.invoice.number} creada`);
      // redirigir tras 1s
      setTimeout(() => router.push("/app/asesor-pro/cliente/facturas"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/asesor-pro/cliente/facturas"
          className="text-ink-mute hover:text-ink"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            Nueva factura
          </span>
          <h1
            className="font-display text-ink mt-1"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Nº {nextNumber}
          </h1>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Emisor + Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sand-100 border-2 border-ink/15 p-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
              Emisor (tú)
            </span>
            <span className="font-display text-ink text-lg block" style={{ fontWeight: 500 }}>{issuerName}</span>
            <span className="font-mono text-[12px] text-ink-soft">NIF {issuerNif}</span>
          </div>
          <div className="bg-paper border-2 border-ink p-4 space-y-3" style={{ boxShadow: "3px 3px 0 #283B70" }}>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block">
              Cliente <span className="text-rose-alert">*</span>
            </span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Razón social"
              required
              className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerNif}
                onChange={(e) => setCustomerNif(e.target.value.toUpperCase())}
                placeholder="NIF / CIF"
                required
                className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink"
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email (opcional)"
                className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink"
              />
            </div>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="dirección (opcional)"
              className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        {/* Fecha */}
        <div className="flex items-end gap-4">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
              Fecha emisión
            </span>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink"
            />
          </label>
        </div>

        {/* Líneas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink">Líneas</span>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 text-[12px] font-mono uppercase tracking-[0.15em] text-ink hover:text-terracotta-500"
            >
              <Plus className="w-3 h-3" />
              Añadir línea
            </button>
          </div>
          <div className="bg-paper border-2 border-ink overflow-hidden" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
            <table className="w-full">
              <thead>
                <tr className="bg-sand-100 border-b border-ink/15">
                  <th className="text-left px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">Descripción</th>
                  <th className="text-right px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute w-20">Cant</th>
                  <th className="text-right px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute w-32">Precio (€)</th>
                  <th className="text-right px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute w-20">IVA %</th>
                  <th className="text-right px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute w-28">Subtotal</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const lineSubtotal = Math.round(line.quantity * line.unit_price_cents);
                  return (
                    <tr key={idx} className="border-b border-ink/10 last:border-b-0">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(idx, { description: e.target.value })}
                          placeholder="Descripción del producto/servicio"
                          required
                          className="w-full px-2 py-1.5 bg-paper border border-transparent hover:border-ink/20 focus:border-ink text-ink text-[13px] focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-16 px-2 py-1.5 bg-paper border border-transparent hover:border-ink/20 focus:border-ink text-ink text-[13px] tabular-nums focus:outline-none text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={(line.unit_price_cents / 100).toFixed(2).replace(".", ",")}
                          onChange={(e) => updateLine(idx, { unit_price_cents: parseEur(e.target.value) })}
                          className="w-24 px-2 py-1.5 bg-paper border border-transparent hover:border-ink/20 focus:border-ink text-ink text-[13px] tabular-nums focus:outline-none text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <select
                          value={line.iva_pct}
                          onChange={(e) => updateLine(idx, { iva_pct: parseInt(e.target.value, 10) })}
                          className="w-16 px-2 py-1.5 bg-paper border border-transparent hover:border-ink/20 focus:border-ink text-ink text-[13px] focus:outline-none"
                        >
                          <option value="0">0</option>
                          <option value="4">4</option>
                          <option value="10">10</option>
                          <option value="21">21</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums text-ink">
                        {eur(lineSubtotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-ink-mute hover:text-rose-alert"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm bg-paper border-2 border-ink p-5 space-y-3" style={{ boxShadow: "5px 5px 0 #B54E30" }}>
            <Row label="Base imponible" value={eur(totals.subtotal)} />
            <Row label="IVA" value={eur(totals.iva)} />
            <div className="pt-3 border-t-2 border-ink flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">TOTAL</span>
              <span className="font-display text-ink tabular-nums" style={{ fontSize: "1.5rem", fontWeight: 500 }}>
                {eur(totals.total)}
              </span>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
            Notas (opcional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-ink resize-none"
            placeholder="Forma de pago, IBAN, condiciones..."
          />
        </label>

        {error && (
          <div className="flex items-start gap-3 p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-3 border border-olive-500/40 bg-olive-500/10 text-sm text-olive-600">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-ink/15">
          <Link
            href="/app/asesor-pro/cliente/facturas"
            className="px-5 py-2.5 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors font-sans text-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || !customerName || !customerNif || lines.some((l) => !l.description || l.unit_price_cents === 0)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors disabled:opacity-50"
            style={{ boxShadow: "3px 3px 0 #B54E30" }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? "Creando..." : "Emitir factura"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-mute">{label}</span>
      <span className="font-mono text-[14px] tabular-nums text-ink">{value}</span>
    </div>
  );
}
