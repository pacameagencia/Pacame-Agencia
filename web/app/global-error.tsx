"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/observability/sentry";

/**
 * Fallback de ultimo recurso cuando incluso `layout.tsx` casca.
 * Next.js renderiza este SIN el root layout — incluye html/body.
 * No podemos usar Tailwind/components aqui (nada global puede haber cargado),
 * asi que mantenemos inline styles pero con identidad PACAME.
 */
export default function GlobalError({
  error,
  reset,
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
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 30% 20%, rgba(212,165,116,0.08) 0%, transparent 55%), radial-gradient(circle at 70% 80%, rgba(124,58,237,0.06) 0%, transparent 55%), #0a0a0a",
          color: "#fff",
          fontFamily:
            "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Logo PACAME arriba a la izquierda */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 32,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#D4A574",
          }}
        >
          PACAME
        </div>

        <div
          style={{
            textAlign: "center",
            maxWidth: 520,
            padding: 32,
            position: "relative",
          }}
        >
          {/* Icono en circulo dorado */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(212,165,116,0.15), rgba(124,58,237,0.12))",
              border: "1px solid rgba(212,165,116,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              fontSize: 36,
              color: "#D4A574",
              fontWeight: 700,
              boxShadow: "0 20px 60px -20px rgba(212,165,116,0.35)",
            }}
            aria-hidden
          >
            !
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 12,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Algo ha fallado en nuestro lado.
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              marginBottom: 32,
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Ya nos han llegado las alarmas y el equipo esta revisandolo.
            Prueba a reintentar — si vuelve a fallar, escribenos y lo arreglamos nosotros.
            {error.digest && (
              <>
                <br />
                <code
                  style={{
                    fontSize: 12,
                    color: "rgba(212,165,116,0.8)",
                    background: "rgba(212,165,116,0.08)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    marginTop: 12,
                    display: "inline-block",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  }}
                >
                  ref: {error.digest}
                </code>
              </>
            )}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: "inline-block",
                padding: "14px 28px",
                background: "#D4A574",
                color: "#0a0a0a",
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                boxShadow: "0 8px 24px -6px rgba(212,165,116,0.5)",
              }}
            >
              Reintentar
            </button>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                background: "transparent",
                color: "#fff",
                borderRadius: 9999,
                fontWeight: 500,
                fontSize: 15,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "border-color 0.2s ease",
              }}
            >
              Volver al inicio
            </a>
          </div>

          <p
            style={{
              marginTop: 40,
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Necesitas ayuda ya?{" "}
            <a
              href="mailto:hola@pacameagencia.com"
              style={{
                color: "rgba(212,165,116,0.8)",
                textDecoration: "none",
              }}
            >
              hola@pacameagencia.com
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
