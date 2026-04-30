/**
 * Landing pública DarkRoom Crew · /crew
 *
 * Hero + tabla 6 tiers + ejemplo TOP gana 3.500€/año + form inline registro.
 * Paleta verde ácido `#CFFF00` + bg `#0A0A0A` + Anton/Space Grotesk/JetBrains Mono.
 */

import { TIERS } from "@/lib/darkroom/crew-tiers";
import CrewRegisterForm from "./CrewRegisterForm";

export const runtime = "nodejs";

export const metadata = {
  title: "DarkRoom Crew — Trae a tu gente. Sube de rango. Cobra cada mes.",
  description:
    "Programa de afiliados Dark Room · 6 tiers escalonados · hasta 10€ one-time + 5€/ref/mes recurrente · pago día 5 PayPal/SEPA.",
};

export default function CrewLandingPage() {
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
      <section style={{ padding: "80px 20px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#CFFF00",
            }}
          >
            DARKROOM CREW
          </div>
        </div>
        <h1
          style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: "clamp(40px, 8vw, 88px)",
            lineHeight: 1.05,
            color: "#FFF",
            textAlign: "center",
            margin: "0 0 24px",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Trae a tu gente.<br />
          Sube de rango.<br />
          <span style={{ color: "#CFFF00" }}>Cobra cada mes.</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            maxWidth: 680,
            margin: "0 auto 12px",
            fontSize: 18,
            color: "#B5B5B5",
            lineHeight: 1.6,
          }}
        >
          Si tu audiencia paga 200€/mes en stack creativo, le ahorras 2.500€/año.
          Y tú ganas hasta <strong style={{ color: "#CFFF00" }}>3.500€/año pasivos</strong> con 50 refs activos.
        </p>
        <p
          style={{
            textAlign: "center",
            maxWidth: 680,
            margin: "0 auto 40px",
            fontSize: 14,
            color: "#777",
          }}
        >
          Group buy legal · Cookie 30 días · Pago día 5 PayPal/SEPA · Mín 50€ acumulado.
        </p>
      </section>

      {/* Tabla tiers */}
      <section style={{ padding: "20px 20px 60px", maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: "#141414",
            border: "1px solid rgba(207,255,0,0.12)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: "rgba(207,255,0,0.06)", color: "#CFFF00" }}>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Rango</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Refs activos</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Pago único</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Recurrente / mes</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr
                  key={t.key}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ marginRight: 8 }}>{t.emoji}</span>
                    <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t.label}</strong>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#B5B5B5" }}>
                    {t.refsMax === null ? `${t.refsMin}+` : `${t.refsMin}-${t.refsMax}`}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#FFF" }}>
                    {(t.oneTimeCents / 100).toFixed(0)}€
                  </td>
                  <td style={{ padding: "14px 16px", color: "#CFFF00", fontWeight: 600 }}>
                    {(t.recurringCents / 100).toFixed(0)}€/ref
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16, color: "#888", fontSize: 13, textAlign: "center" }}>
          Subes de rango → todos tus refs activos pasan al rate del nuevo rango (motivador máximo).
          TOPE: 10€ pago único + 5€/ref/mes recurrente.
        </p>
      </section>

      {/* Ejemplo TOP */}
      <section style={{ padding: "20px 20px 60px", maxWidth: 1100, margin: "0 auto" }}>
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
              marginBottom: 12,
            }}
          >
            Ejemplo · creator con 50 refs activos
          </div>
          <h2
            style={{
              fontFamily: "'Anton', 'Impact', sans-serif",
              fontSize: 42,
              color: "#FFF",
              margin: "0 0 24px",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            ~3.500€/año <span style={{ color: "#CFFF00" }}>pasivos</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>One-time acumulado</div>
              <div style={{ fontSize: 24, color: "#FFF", fontFamily: "'JetBrains Mono', monospace" }}>350€</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                10×5€ + 10×6€ + 10×7€ + 10×8€ + 10×9€
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Recurrente / mes (rango Producer)</div>
              <div style={{ fontSize: 24, color: "#CFFF00", fontFamily: "'JetBrains Mono', monospace" }}>250€</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                50 × 5€/ref/mes
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>MRR generado a Dark Room</div>
              <div style={{ fontSize: 24, color: "#FFF", fontFamily: "'JetBrains Mono', monospace" }}>1.450€/mes</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Tú cobras 17% · margen DR 83%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form registro */}
      <section style={{ padding: "20px 20px 80px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2
            style={{
              fontFamily: "'Anton', 'Impact', sans-serif",
              fontSize: 40,
              color: "#FFF",
              margin: "0 0 12px",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Únete al Crew
          </h2>
          <p style={{ color: "#888", fontSize: 14 }}>
            Te llega tu code + link en menos de 1 minuto.
          </p>
        </div>
        <CrewRegisterForm />
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
