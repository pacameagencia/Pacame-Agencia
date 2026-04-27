/**
 * Modal upgrade que aparece cuando el user free agota su límite diario.
 * Hormozi-style: pinta el VALOR primero, después el precio. Cierre fácil.
 */

"use client";

import { useState } from "react";
import { track } from "@/lib/lucia/tracking";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Texto contextual del bloqueo (ej. cuando reset). */
  resetIn?: string | null;
}

export default function UpgradeModal({ open, onClose, resetIn }: Props) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleUpgrade() {
    track("pacame_upgrade_click", { from: "limit_modal" });
    setLoading(true);
    try {
      const res = await fetch("/api/products/pacame-gpt/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier: "premium" }),
      });
      const json = await res.json();
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,24,19,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 18,
          maxWidth: 460,
          width: "100%",
          padding: "30px 28px 28px",
          boxShadow: "0 30px 80px rgba(26,24,19,0.25)",
          fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
          color: "#1a1813",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#6e6858",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#b54e30,#e8b730)",
            color: "#f4efe3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontWeight: 600,
            fontSize: 26,
            marginBottom: 16,
          }}
        >
          L
        </div>
        <h2
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            margin: "0 0 8px",
          }}
        >
          Has llegado al límite gratis de hoy
        </h2>
        <p style={{ fontSize: 14, color: "#3a362c", lineHeight: 1.55, margin: "0 0 18px" }}>
          Vuelves mañana y sigues gratis con 20 mensajes, o te pasas a Premium y
          hablamos sin parar.
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", fontSize: 14 }}>
          {[
            "Mensajes ilimitados",
            "Voz de Lucía castellana",
            "PDF, email y recordatorios",
            "Factura española deducible",
            "Bájate cuando quieras",
          ].map((t) => (
            <li
              key={t}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "5px 0" }}
            >
              <span style={{ color: "#9c3e24", fontWeight: 700 }}>✓</span> {t}
            </li>
          ))}
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%",
            background: "#1a1813",
            color: "#f4efe3",
            border: "none",
            padding: "14px 18px",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit",
            marginBottom: 10,
          }}
        >
          {loading ? "Abriendo pasarela…" : "Pasar a Premium · 9,90€/mes"}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "transparent",
            color: "#6e6858",
            border: "none",
            padding: "10px 12px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {resetIn ? "Vuelvo mañana" : "Ahora no"}
        </button>
      </div>
    </div>
  );
}
