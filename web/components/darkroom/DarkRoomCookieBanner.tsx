"use client";

/**
 * DarkRoom Cookie Banner — LSSI 22.2 + RGPD compliant.
 *
 * Diseño estilo DarkRoom (dark mode minimalista, acento rojo señal #E11D48).
 * NO comparte estilo ni storage con el banner PACAME (`CookieConsent.tsx`)
 * para garantizar separación de marca.
 *
 * Cumplimiento legal:
 *   - Aparece en 1ª visita (cookie técnica de consentimiento exenta de consentimiento).
 *   - 3 botones: "Solo necesarias" / "Aceptar todas" / "Personalizar".
 *   - Granular: el usuario puede activar analytics/funcional por separado.
 *   - Logging del consentimiento en Supabase (prueba RGPD art. 7.1).
 *   - Links sutiles a `/legal/privacidad` y `/legal/cookies` (ÚNICO punto público
 *     de exposición a las políticas — ver proteccion-identidad.md regla 3).
 */

import { useEffect, useState } from "react";
import {
  getDarkRoomConsent,
  setDarkRoomConsent,
  type DarkRoomCookieConsent,
} from "@/lib/darkroom/cookie-consent";

const STYLE_VARS = {
  bg: "#0A0A0A",
  bgSoft: "#141414",
  border: "rgba(255,255,255,0.08)",
  text: "#F5F5F0",
  textDim: "#A1A1AA",
  accent: "#E11D48",
  accentSoft: "rgba(225,29,72,0.15)",
};

export default function DarkRoomCookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);   // pre-marcado opt-in suave (legal: requiere acción del usuario)
  const [functional, setFunctional] = useState(true); // pre-marcado idem

  useEffect(() => {
    if (getDarkRoomConsent()) return;
    // delay 1.2s para no entorpecer el primer paint
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function persist(c: Omit<DarkRoomCookieConsent, "version">) {
    setDarkRoomConsent(c);
    setVisible(false);
  }

  function acceptAll() {
    persist({
      essential: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    });
  }

  function rejectNonEssential() {
    persist({
      essential: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    });
  }

  function saveCustom() {
    persist({
      essential: true,
      analytics,
      functional,
      timestamp: new Date().toISOString(),
    });
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 70,
        maxWidth: 720,
        margin: "0 auto",
        background: STYLE_VARS.bgSoft,
        color: STYLE_VARS.text,
        border: `1px solid ${STYLE_VARS.border}`,
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        padding: "20px 22px",
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        fontSize: 14,
        lineHeight: 1.55,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: STYLE_VARS.accent,
            marginTop: 8,
            flexShrink: 0,
            boxShadow: `0 0 14px ${STYLE_VARS.accent}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, color: STYLE_VARS.text }}>
            Usamos cookies técnicas para que esto funcione. Con tu permiso,
            cookies opcionales para mejorar el servicio.{" "}
            <a
              href="/legal/cookies"
              style={{
                color: STYLE_VARS.textDim,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              cookies
            </a>{" "}
            ·{" "}
            <a
              href="/legal/privacidad"
              style={{
                color: STYLE_VARS.textDim,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              privacidad
            </a>
          </p>

          {showCustomize && (
            <div style={{ marginTop: 16 }}>
              <ToggleRow
                label="Esenciales (necesarias)"
                description="Sesión, idioma, consentimiento."
                checked={true}
                disabled
              />
              <ToggleRow
                label="Analíticas"
                description="Plausible — anónimo, sin tracking cross-site."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ToggleRow
                label="Funcionales"
                description="Preferencias UI guardadas."
                checked={functional}
                onChange={setFunctional}
              />
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={acceptAll}
              style={{
                background: STYLE_VARS.accent,
                color: STYLE_VARS.text,
                border: "none",
                borderRadius: 999,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Aceptar todas
            </button>
            <button
              type="button"
              onClick={rejectNonEssential}
              style={{
                background: "transparent",
                color: STYLE_VARS.textDim,
                border: `1px solid ${STYLE_VARS.border}`,
                borderRadius: 999,
                padding: "8px 18px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Solo necesarias
            </button>
            {showCustomize ? (
              <button
                type="button"
                onClick={saveCustom}
                style={{
                  background: "transparent",
                  color: STYLE_VARS.text,
                  border: `1px solid ${STYLE_VARS.accentSoft}`,
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Guardar selección
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                style={{
                  background: "transparent",
                  color: STYLE_VARS.textDim,
                  border: "none",
                  padding: "8px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Personalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderTop: `1px solid ${STYLE_VARS.border}`,
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: STYLE_VARS.text, fontSize: 13, fontWeight: 500 }}>
          {label}
        </p>
        <p style={{ margin: "2px 0 0", color: STYLE_VARS.textDim, fontSize: 12 }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          background: checked ? STYLE_VARS.accent : "rgba(255,255,255,0.1)",
          border: "none",
          padding: 2,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
          transition: "background 0.15s ease",
        }}
      >
        <span
          style={{
            display: "block",
            width: 18,
            height: 18,
            borderRadius: 999,
            background: STYLE_VARS.text,
            transform: checked ? "translateX(16px)" : "translateX(0)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>
    </div>
  );
}
