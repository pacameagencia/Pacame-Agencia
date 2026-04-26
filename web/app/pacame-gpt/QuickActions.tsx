/**
 * QuickActions — botoncitos de acción bajo cada respuesta de Lucía.
 *
 * Acciones:
 *   - Copiar al portapapeles (cliente, no necesita auth)
 *   - Descargar PDF (auth, abre HTML printable en nueva pestaña)
 *   - Enviarme por email (auth, dispara Resend al user)
 *   - Recordármelo (auth, abre date picker simple)
 *
 * Si el user es anónimo, las acciones server-side aparecen pero al click
 * redirigen a /pacame-gpt/login (es la conversión natural a cuenta).
 */

"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  /** id real en pacame_gpt_messages. Si no hay, solo Copiar funciona. */
  serverId?: string;
  content: string;
  authenticated: boolean;
}

type Status = { kind: "idle" } | { kind: "ok"; msg: string } | { kind: "err"; msg: string };

export default function QuickActions({ serverId, content, authenticated }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [showReminder, setShowReminder] = useState(false);

  function flash(kind: "ok" | "err", msg: string) {
    setStatus({ kind, msg });
    setTimeout(() => setStatus({ kind: "idle" }), 3500);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      flash("ok", "Copiado al portapapeles 👍");
    } catch {
      flash("err", "No he podido copiar — selecciona y copia a mano.");
    }
  }

  function handlePdf() {
    if (!authenticated) {
      window.location.href = "/pacame-gpt/login";
      return;
    }
    if (!serverId) {
      flash("err", "Espera a que termine de escribir.");
      return;
    }
    window.open(`/api/pacame-gpt/actions/pdf?messageId=${serverId}`, "_blank");
  }

  async function handleEmail() {
    if (!authenticated) {
      window.location.href = "/pacame-gpt/login";
      return;
    }
    if (!serverId) {
      flash("err", "Espera a que termine de escribir.");
      return;
    }
    try {
      const res = await fetch("/api/pacame-gpt/actions/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageId: serverId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        flash("err", json.message || "No te lo he podido mandar. Inténtalo en un rato.");
        return;
      }
      flash("ok", `Te lo he enviado a ${json.sent_to} 🙌`);
    } catch {
      flash("err", "No he podido conectar.");
    }
  }

  async function handleReminderSubmit(due_at: string) {
    if (!authenticated) {
      window.location.href = "/pacame-gpt/login";
      return;
    }
    if (!serverId) {
      flash("err", "Espera a que termine de escribir.");
      return;
    }
    try {
      const res = await fetch("/api/pacame-gpt/actions/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageId: serverId, due_at }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        flash("err", json.message || "No he podido programar el recordatorio.");
        return;
      }
      const when = new Date(json.due_at).toLocaleString("es-ES", {
        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
      });
      flash("ok", `Te lo recuerdo el ${when} ✅`);
      setShowReminder(false);
    } catch {
      flash("err", "No he podido conectar.");
    }
  }

  return (
    <div className="pg-actions">
      <ActionBtn label="Copiar" emoji="📋" onClick={handleCopy} />
      <ActionBtn label="PDF" emoji="📄" onClick={handlePdf} />
      <ActionBtn label="Email" emoji="✉️" onClick={handleEmail} />
      <ActionBtn label="Recordar" emoji="⏰" onClick={() => setShowReminder(true)} />

      {showReminder && (
        <ReminderPicker
          onCancel={() => setShowReminder(false)}
          onSubmit={handleReminderSubmit}
        />
      )}

      {status.kind !== "idle" && (
        <span
          className={`pg-actions-status ${status.kind === "ok" ? "is-ok" : "is-err"}`}
        >
          {status.msg}
        </span>
      )}

      {!authenticated && (
        <Link
          href="/pacame-gpt/login"
          style={{ fontSize: 11, color: "#6e6858", marginLeft: 6, textDecoration: "underline" }}
        >
          Inicia sesión para guardarlo
        </Link>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  emoji,
  onClick,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button className="pg-action-btn" onClick={onClick} type="button">
      <span aria-hidden>{emoji}</span> {label}
    </button>
  );
}

/**
 * Mini-picker de fecha/hora en presets cómodos para el español de pie.
 * Sin DatePicker pesado: 4 atajos + un input datetime-local opcional.
 */
function ReminderPicker({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (iso: string) => void;
}) {
  const [custom, setCustom] = useState("");

  function preset(offsetHours: number) {
    const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
    onSubmit(d.toISOString());
  }

  function tomorrowAt(hour: number) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    onSubmit(d.toISOString());
  }

  function nextMondayAt9() {
    const d = new Date();
    const daysToMon = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysToMon);
    d.setHours(9, 0, 0, 0);
    onSubmit(d.toISOString());
  }

  function submitCustom() {
    if (!custom) return;
    const d = new Date(custom);
    if (isNaN(d.getTime())) return;
    onSubmit(d.toISOString());
  }

  return (
    <div className="pg-reminder">
      <div className="pg-reminder-row">
        <button className="pg-action-btn" onClick={() => preset(1)}>En 1 hora</button>
        <button className="pg-action-btn" onClick={() => tomorrowAt(9)}>Mañana 9h</button>
        <button className="pg-action-btn" onClick={() => tomorrowAt(18)}>Mañana 18h</button>
        <button className="pg-action-btn" onClick={nextMondayAt9}>Lunes 9h</button>
      </div>
      <div className="pg-reminder-row">
        <input
          type="datetime-local"
          className="pg-reminder-input"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          className="pg-action-btn pg-action-primary"
          onClick={submitCustom}
          disabled={!custom}
        >
          Guardar
        </button>
        <button className="pg-action-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
