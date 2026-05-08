import { ImageResponse } from "next/og";

/**
 * OG image dinámica para la home Storybook 3D.
 *
 * Diseño Spanish Modernism: paleta brand exacta, tipografía display,
 * 5 dots representando los servicios PACAME.
 *
 * Pre-renderizada en build: cuando alguien comparte
 * https://pacameagencia.com/ en Twitter/LinkedIn/WhatsApp, ven esta imagen.
 *
 * Tamaño Twitter card / LinkedIn: 1200×630.
 */

export const runtime = "edge";
export const alt = "PACAME — Tu agencia de IA. 5 servicios, 1 transformación.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = {
  paper: "#F4EFE3",
  ink: "#1A1813",
  terracotta: "#B54E30",
  indigo: "#283B70",
  mustard: "#E8B730",
  olive: "#6B7535",
} as const;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: BRAND.paper,
          padding: "80px 96px",
          position: "relative",
        }}
      >
        {/* Sutil noise overlay con repeating-linear-gradient sería ideal pero
            ImageResponse no soporta backgrounds complejos. Usamos color plano. */}

        {/* Header — logo wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "28px",
            fontWeight: 700,
            color: BRAND.ink,
            letterSpacing: "-0.02em",
            marginBottom: "auto",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "9999px",
              backgroundColor: BRAND.terracotta,
            }}
          />
          PACAME
        </div>

        {/* Hero text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "108px",
              fontWeight: 800,
              color: BRAND.ink,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
            }}
          >
            Tu agencia
          </div>
          <div
            style={{
              fontSize: "108px",
              fontWeight: 800,
              color: BRAND.terracotta,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
            }}
          >
            de IA.
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 400,
              color: BRAND.ink,
              opacity: 0.6,
              marginTop: "24px",
            }}
          >
            5 servicios. 1 transformación.
          </div>
        </div>

        {/* Footer — 5 dots colores brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "auto",
          }}
        >
          {[BRAND.terracotta, BRAND.indigo, BRAND.mustard, BRAND.olive, BRAND.terracotta].map((color, i) => (
            <div
              key={i}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "9999px",
                backgroundColor: color,
              }}
            />
          ))}
          <div
            style={{
              fontSize: "18px",
              color: BRAND.ink,
              opacity: 0.5,
              marginLeft: "20px",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            pacameagencia.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
