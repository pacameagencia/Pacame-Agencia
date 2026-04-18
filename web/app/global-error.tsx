"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/observability/sentry";

/**
 * Fallback de ultimo recurso cuando incluso `layout.tsx` casca.
 * Next.js renderiza este SIN el root layout — incluye html/body.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void captureException(error, {
      tags: { boundary: "global-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480, padding: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 32,
              color: "#f87171",
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
            Error critico del sistema
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
            El equipo ha sido notificado automaticamente.
            {error.digest && (
              <>
                <br />
                <code style={{ fontSize: 12 }}>ref: {error.digest}</code>
              </>
            )}
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#D4A574",
              color: "#0a0a0a",
              borderRadius: 9999,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ir al inicio
          </a>
        </div>
      </body>
    </html>
  );
}
