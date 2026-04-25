"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ArrowLeft, Loader2, AlertCircle, Check, RotateCcw, Upload } from "lucide-react";

interface OcrResult {
  vendor_name: string | null;
  vendor_nif: string | null;
  expense_date: string | null;
  base_cents: number | null;
  iva_pct: number | null;
  iva_cents: number | null;
  total_cents: number | null;
  category: string | null;
  confidence: number;
  warnings: string[];
}

interface ExpenseRow {
  id: string;
  vendor_name: string | null;
  expense_date: string | null;
  total_cents: number;
  iva_cents: number | null;
  category: string | null;
  ocr_confidence: number | null;
  status: string;
}

function eur(cents: number | null | undefined): string {
  if (!cents) return "—";
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default function NewExpenseForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [expense, setExpense] = useState<ExpenseRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor de 5MB");
      return;
    }
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/products/asesor-pro/expenses", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error subiendo gasto");
        return;
      }
      if (json.ocr) setOcr(json.ocr);
      if (json.expense) setExpense(json.expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setOcr(null);
    setExpense(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/asesor-pro/cliente" className="text-ink-mute hover:text-ink">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">Subir gasto</span>
          <h1
            className="font-display text-ink mt-1"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Foto del ticket
          </h1>
        </div>
      </div>

      {/* Upload card */}
      {!preview && (
        <label className="block bg-paper border-2 border-dashed border-ink/30 hover:border-ink p-12 text-center cursor-pointer transition-colors group">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Camera className="w-12 h-12 mx-auto text-ink-mute group-hover:text-ink mb-4" />
          <span className="block font-display text-ink text-lg mb-2" style={{ fontWeight: 500 }}>
            Haz una foto del ticket o factura
          </span>
          <span className="block font-sans text-ink-mute text-sm">
            Lo OCR-eamos automáticamente · max 5MB · JPG/PNG/HEIC
          </span>
        </label>
      )}

      {preview && !ocr && !expense && (
        <div className="space-y-4">
          <div className="bg-paper border-2 border-ink p-4" style={{ boxShadow: "5px 5px 0 #1A1813" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Ticket preview" className="max-h-96 mx-auto block" />
          </div>
          {error && (
            <div className="flex items-start gap-3 p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors font-sans text-sm inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Otra foto
            </button>
            <button
              onClick={upload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors disabled:opacity-50"
              style={{ boxShadow: "3px 3px 0 #B54E30" }}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Procesando con IA..." : "Procesar"}
            </button>
          </div>
        </div>
      )}

      {ocr && expense && (
        <div className="space-y-4">
          <div className="bg-olive-500/10 border-2 border-olive-500/40 p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-olive-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-ink text-base" style={{ fontWeight: 500 }}>
                Gasto guardado. Tu asesor lo va a revisar.
              </p>
              <p className="font-mono text-[11px] text-ink-mute mt-1">
                Confianza OCR: {(ocr.confidence * 100).toFixed(0)}%
                {ocr.warnings.length > 0 && ` · ${ocr.warnings.length} aviso${ocr.warnings.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <div className="bg-paper border-2 border-ink p-6 grid grid-cols-2 gap-4" style={{ boxShadow: "5px 5px 0 #283B70" }}>
            <Field label="Comercio" value={ocr.vendor_name ?? "—"} />
            <Field label="NIF" value={ocr.vendor_nif ?? "—"} mono />
            <Field label="Fecha" value={ocr.expense_date ? new Date(ocr.expense_date).toLocaleDateString("es-ES") : "—"} />
            <Field label="Categoría" value={ocr.category ?? "—"} />
            <Field label="Base" value={eur(ocr.base_cents)} mono />
            <Field label={`IVA (${ocr.iva_pct ?? 21}%)`} value={eur(ocr.iva_cents)} mono />
            <div className="col-span-2 pt-3 border-t-2 border-ink flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">TOTAL</span>
              <span className="font-display text-ink tabular-nums" style={{ fontSize: "1.75rem", fontWeight: 500 }}>
                {eur(ocr.total_cents)}
              </span>
            </div>
          </div>

          {ocr.warnings.length > 0 && (
            <div className="p-3 border border-mustard-500/40 bg-mustard-500/10">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mustard-700 mb-2">Avisos</p>
              <ul className="font-sans text-[13px] text-ink space-y-1">
                {ocr.warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors font-sans text-sm"
            >
              Subir otro
            </button>
            <button
              onClick={() => router.push("/app/asesor-pro/cliente/gastos")}
              className="px-5 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors"
              style={{ boxShadow: "3px 3px 0 #B54E30" }}
            >
              Ver mis gastos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">{label}</span>
      <span className={`text-ink ${mono ? "font-mono text-[14px] tabular-nums" : "font-sans text-[14px]"}`}>{value}</span>
    </div>
  );
}
