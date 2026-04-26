import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PACAME — Tu equipo digital completo. Potenciado por IA.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0A0A0F 0%, #12121A 50%, #0A0A0F 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top bar accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #8B5CF6, #283B70, #84CC16)",
            display: "flex",
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #8B5CF6, #283B70)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "#F5F5F0",
              letterSpacing: "-1px",
              display: "flex",
            }}
          >
            PACAME
          </div>
        </div>

        {/* Main text */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#F5F5F0",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "800px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>Tu equipo digital completo.</span>
          <span
            style={{
              background: "linear-gradient(90deg, #8B5CF6, #283B70)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Potenciado por IA.
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(245, 245, 240, 0.5)",
            marginTop: "24px",
            textAlign: "center",
            display: "flex",
          }}
        >
          Web, SEO, Ads, Social Media y Branding para PYMEs
        </div>

        {/* Agent pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "40px",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "700px",
          }}
        >
          {[
            { name: "Nova", color: "#B54E30" },
            { name: "Atlas", color: "#2563EB" },
            { name: "Pixel", color: "#283B70" },
            { name: "Nexus", color: "#EA580C" },
            { name: "Pulse", color: "#EC4899" },
            { name: "Sage", color: "#D97706" },
            { name: "Core", color: "#16A34A" },
          ].map((agent) => (
            <div
              key={agent.name}
              style={{
                padding: "6px 16px",
                borderRadius: "999px",
                background: `${agent.color}20`,
                border: `1px solid ${agent.color}40`,
                color: agent.color,
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
              }}
            >
              {agent.name}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "rgba(245, 245, 240, 0.3)",
            display: "flex",
          }}
        >
          pacameagencia.com
        </div>
      </div>
    ),
    { ...size }
  );
}
