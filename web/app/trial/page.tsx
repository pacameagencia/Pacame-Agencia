/**
 * Landing Dark Room Pro Trial · /trial
 *
 * Hero + breakdown 12 tools + comparativa retail vs DR + CTA → checkout Stripe.
 */

import TrialCTA from "./TrialCTA";

export const runtime = "nodejs";

export const metadata = {
  title: "DarkRoom Pro · 2 días de prueba",
  description:
    "Stack premium completo de 12 herramientas IA. 24,90€/mes. 2 días de prueba. Cancela antes y no se cobra.",
};

const TOOLS = [
  ["ChatGPT Plus", "22€"],
  ["Claude Pro", "22€"],
  ["Gemini Advanced", "22€"],
  ["Canva Pro", "12€"],
  ["CapCut Pro", "8€"],
  ["Freepik Premium+", "22€"],
  ["Higgsfield", "29€"],
  ["ElevenLabs", "22€"],
  ["Minea", "39€"],
  ["Dropsip.io", "29€"],
  ["PiPiAds", "38€"],
  ["Seedance", "43€"],
];

export default function TrialPage() {
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
            DarkRoom Pro
          </div>
        </div>
        <h1
          style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: "clamp(40px, 8vw, 80px)",
            lineHeight: 1.05,
            color: "#FFF",
            textAlign: "center",
            margin: "0 0 24px",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          12 herramientas IA<br />
          <span style={{ color: "#CFFF00" }}>24,90€/mes</span>
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
          <strong style={{ color: "#FFF" }}>2 días de prueba.</strong> Cancela antes del día 2 y no se cobra.
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
          Group buy legal · acuerdo colectivo · 50 personas comparten = el precio se prorratea.
        </p>
        <TrialCTA />
      </section>

      {/* Comparativa retail vs DR */}
      <section style={{ padding: "20px 20px 40px", maxWidth: 720, margin: "0 auto" }}>
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
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "rgba(207,255,0,0.06)", color: "#CFFF00" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Tool</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Retail/mes</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map(([name, price]) => (
                <tr key={name} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "10px 16px" }}>{name}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: "#B5B5B5" }}>{price}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #CFFF00", background: "rgba(255,59,59,0.06)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700 }}>RETAIL TOTAL</td>
                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#FF3B3B", textDecoration: "line-through" }}>
                  308€/mes
                </td>
              </tr>
              <tr style={{ background: "rgba(207,255,0,0.10)" }}>
                <td style={{ padding: "14px 16px", color: "#CFFF00", fontWeight: 700 }}>DARKROOM PRO</td>
                <td style={{ padding: "14px 16px", textAlign: "right", color: "#CFFF00", fontWeight: 700 }}>
                  24,90€/mes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, color: "#888", fontSize: 13, textAlign: "center" }}>
          Ahorras <strong style={{ color: "#CFFF00" }}>283€/mes · 3.396€/año</strong>.
        </p>
      </section>

      {/* CTA repeat */}
      <section style={{ padding: "20px 20px 80px", maxWidth: 540, margin: "0 auto" }}>
        <TrialCTA />
        <p style={{ marginTop: 16, color: "#666", fontSize: 12, textAlign: "center" }}>
          Te cobramos automáticamente al día 2. Cancela 1-click antes desde tu panel y no se cobra.
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
