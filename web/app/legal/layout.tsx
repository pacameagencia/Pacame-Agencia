/**
 * DarkRoom · Legal hub layout.
 *
 * Aplica voz visual DarkRoom (dark mode minimalista, acento rojo señal).
 * Sin header de navegación, sin CTAs a producto, sin teasers — sección
 * funcional puro. Cumple `proteccion-identidad.md`: no destacar.
 *
 * SEO: noindex en TODA la sección. Estos textos no deben aparecer en Google
 * salvo que el visitante busque deliberadamente. Esto reduce la superficie
 * pública de los datos legales del operador.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Información legal · DarkRoom",
  description: "Documentación legal de DarkRoom.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#F5F5F0",
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        fontSize: 15,
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 24px 96px",
        }}
      >
        <header style={{ marginBottom: 48 }}>
          <a
            href="/"
            style={{
              color: "#A1A1AA",
              textDecoration: "none",
              fontSize: 13,
              letterSpacing: "0.02em",
            }}
          >
            ← darkroomcreative.cloud
          </a>
        </header>

        <main>{children}</main>

        <footer
          style={{
            marginTop: 80,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#52525B",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0 }}>
            <a href="/legal" style={{ color: "#71717A", textDecoration: "none" }}>
              ← volver al índice legal
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
