/**
 * Sección de "Invita y gana" en /pacame-gpt/cuenta.
 *
 * Muestra:
 *   - Tu link de invitación con tu código (derivado del user_id).
 *   - Botón copiar al portapapeles.
 *   - Botón compartir nativo (mobile: navigator.share / desktop: copiar).
 *   - Stats: invitados / pagados / recompensa pendiente.
 *
 * El link apunta a /lucia?ref=CODE; ReferralCapture lo guarda en cookie.
 */

"use client";

import { useState } from "react";
import { track } from "@/lib/lucia/tracking";
import type { ReferralStats } from "@/lib/lucia/referrals";

interface Props {
  code: string;
  stats: ReferralStats;
}

const SITE = "https://pacameagencia.com";

export default function ReferralBlock({ code, stats }: Props) {
  const url = `${SITE}/lucia?ref=${code}`;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      track("pacame_referral_copy", { code });
    } catch {
      /* ignore */
    }
  }

  async function handleShare() {
    track("pacame_referral_share", { code });
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "PACAME GPT · Lucía",
          text: "Te invito a probar Lucía, el ChatGPT que habla como tú. 14 días gratis.",
          url,
        });
        return;
      } catch {
        /* user canceló o no soportado → fallback copiar */
      }
    }
    handleCopy();
  }

  return (
    <section
      style={{
        marginTop: 18,
        background: "#ffffff",
        borderRadius: 16,
        padding: "20px 22px",
        border: "1px solid rgba(26,24,19,0.06)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 4px",
        }}
      >
        Invita amigos, gana meses gratis
      </h2>
      <p style={{ fontSize: 13, color: "#6e6858", margin: "0 0 16px" }}>
        Por cada amigo que se haga Premium con tu código, te regalamos 1 mes
        gratis. Sin tope.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: "#f9f5ea",
          borderRadius: 12,
          border: "1px solid rgba(26,24,19,0.08)",
          marginBottom: 12,
        }}
      >
        <input
          readOnly
          value={url}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "#1a1813",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            minWidth: 0,
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={handleCopy}
          style={{
            background: "#1a1813",
            color: "#f4efe3",
            border: "none",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>

      <button
        onClick={handleShare}
        style={{
          width: "100%",
          background: "transparent",
          color: "#9c3e24",
          border: "1px solid rgba(181,78,48,0.4)",
          padding: "11px 14px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: 16,
        }}
      >
        Compartir invitación
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        <Stat label="Invitados" value={stats.total_invited} />
        <Stat label="Pagaron" value={stats.total_paid} accent />
        <Stat label="Premios" value={stats.pending_reward} hint="pendientes" />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div
      style={{
        background: "#f9f5ea",
        padding: "12px 8px",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 24,
          fontWeight: 600,
          color: accent ? "#9c3e24" : "#1a1813",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#6e6858", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
        {label}
      </div>
      {hint && <div style={{ fontSize: 10, color: "#9b7714", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}
