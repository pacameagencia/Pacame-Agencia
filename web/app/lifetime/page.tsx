/**
 * Landing Dark Room Lifetime · /lifetime
 *
 * Hero + math amortización + CTA → checkout one-time 349€.
 */

import LifetimeCTA from "./LifetimeCTA";

export const runtime = "nodejs";

export const metadata = {
  title: "DarkRoom Lifetime · 349€ · Acceso de por vida",
  description:
    "Pago único 349€. Acceso al stack premium IA de por vida. Amortiza en 35 días vs retail (308€/mes).",
};

export default function LifetimePage() {
  return (
    <div
      style={{
        background: "#0A0A0A",
        color: "#E6E6E6",
        minHeight: "100vh",
        fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Hero */}
      <section style={{ padding: "80px 20px 32px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#CFFF00",
            }}
          >
            DarkRoom Lifetime
          </div>
        </div>
        <h1
          style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: "clamp(44px, 9vw, 96px)",
            lineHeight: 1,
            color: "#FFF",
            textAlign: "center",
            margin: "0 0 24px",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          349<span style={{ color: "#CFFF00" }}>€</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            maxWidth: 640,
            margin: "0 auto 12px",
            fontSize: 18,
            color: "#B5B5B5",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#FFF" }}>Pago único.</strong> Acceso al stack premium <strong>de por vida</strong>.
        </p>
        <p
          style={{
            textAlign: "center",
            maxWidth: 640,
            margin: "0 auto 32px",
            fontSize: 14,
            color: "#777",
          }}
        >
          12 herramientas IA premium · cero suscripción mensual · cero cargos recurrentes.
        </p>
        <LifetimeCTA />
      </section>

      {/* Math */}
      <section style={{ padding: "20px 20px 40px", maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            background: "#141414",
            border: "1px solid rgba(207,255,0,0.12)",
            borderRadius: 8,
            padding: 32,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#CFFF00",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Math · sin embellecer
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
            }}
          >
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "12px 0", color: "#888" }}>Stack retail mensual</td>
                <td style={{ padding: "12px 0", textAlign: "right", color: "#FF3B3B" }}>308€/mes</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "12px 0", color: "#888" }}>DarkRoom Pro mensual</td>
                <td style={{ padding: "12px 0", textAlign: "right" }}>24,90€/mes</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "12px 0", color: "#888" }}>Amortiza vs retail en</td>
                <td style={{ padding: "12px 0", textAlign: "right", color: "#CFFF00" }}>35 días</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "12px 0", color: "#888" }}>Amortiza vs Pro en</td>
                <td style={{ padding: "12px 0", textAlign: "right", color: "#CFFF00" }}>14 meses</td>
              </tr>
              <tr style={{ background: "rgba(207,255,0,0.08)" }}>
                <td style={{ padding: "14px 0", fontWeight: 700, color: "#CFFF00" }}>Después · de por vida</td>
                <td style={{ padding: "14px 0", textAlign: "right", fontWeight: 700, color: "#CFFF00" }}>0€</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 16, color: "#FF3B3B", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            Plazas limitadas este mes · no se rompe el modelo colectivo.
          </p>
        </div>
      </section>

      {/* CTA repeat */}
      <section style={{ padding: "20px 20px 80px", maxWidth: 540, margin: "0 auto" }}>
        <LifetimeCTA />
        <p style={{ marginTop: 16, color: "#666", fontSize: 12, textAlign: "center" }}>
          Pago único vía Stripe · factura automática · acceso inmediato.
        </p>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 20px 40px",
          textAlign: "center",
          color: "#555",
          fontSize: 12,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        DarkRoom · Pablo Calleja ·{" "}
        <a href="https://darkroomcreative.cloud" style={{ color: "#CFFF00", textDecoration: "none" }}>
          darkroomcreative.cloud
        </a>{" "}
        ·{" "}
        <a href="mailto:support@darkroomcreative.cloud" style={{ color: "#CFFF00", textDecoration: "none" }}>
          support@darkroomcreative.cloud
        </a>
      </footer>
    </div>
  );
}
