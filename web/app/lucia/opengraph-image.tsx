/**
 * OG image dinámica para /lucia.
 * 1200x630 con paleta Spanish Modernism: paper + terracota + mostaza.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PACAME GPT · El ChatGPT español que habla como tú";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f4efe3",
          color: "#1a1813",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #b54e30 0%, #e8b730 50%, #283b70 100%)",
            display: "flex",
          }}
        />
        {/* Mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 56 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #b54e30, #e8b730)",
              color: "#f4efe3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 600,
            }}
          >
            L
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em" }}>
              PACAME GPT
            </div>
            <div
              style={{
                fontSize: 15,
                fontFamily: "system-ui, sans-serif",
                color: "#6e6858",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              con Lucía · IA española
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 500,
            lineHeight: 1.0,
            letterSpacing: "-0.035em",
            maxWidth: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>El ChatGPT</span>
          <span>
            que <span style={{ color: "#b54e30", fontStyle: "italic" }}>habla como tú</span>.
          </span>
        </div>

        {/* Sub */}
        <div
          style={{
            marginTop: 36,
            fontSize: 26,
            fontFamily: "system-ui, sans-serif",
            color: "#3a362c",
            maxWidth: 880,
            display: "flex",
          }}
        >
          Castellano de calle, factura española, voz nativa. Hecho en España.
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 64,
            right: 64,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "system-ui, sans-serif",
            fontSize: 18,
            color: "#6e6858",
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            <Pill text="14 días gratis" />
            <Pill text="9,90€/mes" />
            <Pill text="Sin tarjeta" />
          </div>
          <div>pacameagencia.com/lucia</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function Pill({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "#ebe3d0",
        color: "#1a1813",
        padding: "8px 16px",
        borderRadius: 999,
        fontSize: 16,
        fontWeight: 600,
        display: "flex",
      }}
    >
      {text}
    </div>
  );
}
