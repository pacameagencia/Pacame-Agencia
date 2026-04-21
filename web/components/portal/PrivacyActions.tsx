"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  X,
} from "lucide-react";

interface ExportRow {
  id: string;
  status: string;
  file_url?: string | null;
  file_size_bytes?: number | null;
  requested_at: string;
  completed_at?: string | null;
  expires_at?: string | null;
  error?: string | null;
}

interface Props {
  clientEmail: string;
  initialExports: Array<Record<string, unknown>>;
  initialDeletionStatus: "awaiting_confirmation" | "confirmed" | null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function PrivacyActions({
  clientEmail,
  initialExports,
  initialDeletionStatus,
}: Props) {
  const [exports, setExports] = useState<ExportRow[]>(
    initialExports as unknown as ExportRow[]
  );
  const [busy, setBusy] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<
    "awaiting_confirmation" | "confirmed" | null
  >(initialDeletionStatus);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // Poll cada 10s si hay exports en processing
  useEffect(() => {
    const hasActive = exports.some((e) =>
      ["pending", "processing"].includes(e.status)
    );
    if (!hasActive) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch("/api/gdpr/export", { cache: "no-store" });
        const data = await res.json();
        if (data.exports) setExports(data.exports);
      } catch {}
    }, 10_000);
    return () => clearInterval(iv);
  }, [exports]);

  async function handleRequestExport() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/gdpr/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Error" });
      } else {
        setMessage({
          type: "ok",
          text: "Export en cola. Tardara ~1-2 min. Te avisaremos por email.",
        });
        const list = await fetch("/api/gdpr/export", { cache: "no-store" }).then((r) =>
          r.json()
        );
        if (list.exports) setExports(list.exports);
      }
    } catch {
      setMessage({ type: "err", text: "Error de red" });
    }
    setBusy(false);
  }

  async function handleRequestDelete() {
    if (confirmText !== "ELIMINAR") {
      setMessage({ type: "err", text: "Escribe ELIMINAR para confirmar" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Error" });
      } else {
        setDeletionStatus("awaiting_confirmation");
        setShowDeleteForm(false);
        setConfirmText("");
        setMessage({
          type: "ok",
          text: `Te hemos enviado un email a ${clientEmail}. Confirma desde ahi para activar la peticion.`,
        });
      }
    } catch {
      setMessage({ type: "err", text: "Error de red" });
    }
    setBusy(false);
  }

  async function handleCancelDelete() {
    setBusy(true);
    try {
      const res = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setDeletionStatus(null);
        setMessage({ type: "ok", text: "Peticion cancelada." });
      }
    } catch {
      setMessage({ type: "err", text: "Error de red" });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Message banner */}
      {message && (
        <div
          className={`rounded-lg p-3 text-sm font-body ${
            message.type === "ok"
              ? "bg-green-500/10 border border-green-500/20 text-green-300"
              : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Request export button */}
      <button
        onClick={handleRequestExport}
        disabled={busy}
        className="inline-flex items-center gap-2 bg-accent-gold text-ink font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-gold/90 disabled:opacity-50 transition"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Generar nuevo export
      </button>

      {/* Export list */}
      {exports.length > 0 && (
        <div className="space-y-2 pt-2">
          {exports.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg p-3 bg-white/[0.02] border border-white/[0.04] text-sm"
            >
              <div className="flex items-center gap-3">
                {e.status === "ready" && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
                {(e.status === "pending" || e.status === "processing") && (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                )}
                {(e.status === "failed" || e.status === "expired") && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <div>
                  <div className="text-ink">
                    {formatDate(e.requested_at)}{" "}
                    <span className="text-ink/40 text-xs">
                      · {e.status}
                      {e.file_size_bytes ? ` · ${formatSize(e.file_size_bytes)}` : ""}
                    </span>
                  </div>
                  {e.error && (
                    <div className="text-xs text-red-400 mt-0.5">{e.error}</div>
                  )}
                </div>
              </div>
              {e.status === "ready" && e.file_url && (
                <a
                  href={e.file_url}
                  className="text-accent-gold hover:underline font-semibold text-xs"
                  download
                >
                  Descargar
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-6 border-t border-white/[0.04]">
        {deletionStatus === null ? (
          <>
            {!showDeleteForm ? (
              <button
                onClick={() => setShowDeleteForm(true)}
                className="inline-flex items-center gap-2 border border-red-500/30 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar mi cuenta
              </button>
            ) : (
              <div className="space-y-3 rounded-xl p-4 bg-red-500/5 border border-red-500/20">
                <p className="text-sm text-ink/80 font-body">
                  Esto es irreversible tras 30 dias de reflexion. Escribe{" "}
                  <strong>ELIMINAR</strong> para confirmar.
                </p>
                <input
                  type="text"
                  placeholder="Escribe ELIMINAR"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-black/40 border border-ink/[0.08] rounded-lg px-3 py-2 text-ink"
                />
                <textarea
                  placeholder="Motivo (opcional, nos ayuda a mejorar)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-black/40 border border-ink/[0.08] rounded-lg px-3 py-2 text-ink text-sm"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestDelete}
                    disabled={busy || confirmText !== "ELIMINAR"}
                    className="inline-flex items-center gap-2 bg-red-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-red-600 disabled:opacity-30 transition"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Solicitar eliminacion
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteForm(false);
                      setConfirmText("");
                      setReason("");
                    }}
                    className="inline-flex items-center gap-2 bg-white/[0.04] text-ink/70 font-semibold px-5 py-2 rounded-lg hover:bg-white/[0.08] transition"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl p-4 bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-ink font-semibold">
                {deletionStatus === "confirmed"
                  ? "Eliminacion confirmada"
                  : "Esperando confirmacion por email"}
              </p>
              <p className="text-ink/60 text-sm font-body mt-0.5">
                {deletionStatus === "confirmed"
                  ? "Tus datos se purgaran en ~30 dias. Puedes cancelar en cualquier momento."
                  : `Revisa tu email (${clientEmail}) y haz clic en el link de confirmacion.`}
              </p>
              <button
                onClick={handleCancelDelete}
                disabled={busy}
                className="mt-3 text-xs text-ink/60 hover:text-ink underline"
              >
                Cancelar peticion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
