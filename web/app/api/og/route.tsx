import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "PACAME — Agencia Digital IA";
  const category = searchParams.get("category") || "";

  const categoryColors: Record<string, string> = {
    SEO: "#2563EB",
    "Desarrollo Web": "#283B70",
    Publicidad: "#EA580C",
    Estrategia: "#D97706",
    Branding: "#B54E30",
    "Redes Sociales": "#EC4899",
    default: "#B54E30",
  };

  const accentColor = categoryColors[category] || categoryColors.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "#0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: `linear-gradient(90deg, ${accentColor}, #283B70)`,
            display: "flex",
          }}
        />

        {/* Category badge */}
        {category && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: "3px",
                display: "flex",
              }}
            >
              {category}
            </div>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? "48px" : "60px",
              fontWeight: 800,
              color: "#F5F5F7",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              display: "flex",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #8B5CF6, #283B70)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "white",
              }}
            >
              P
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#F5F5F7",
                display: "flex",
              }}
            >
              PACAME
            </div>
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "rgba(245, 245, 247, 0.4)",
              display: "flex",
            }}
          >
            pacameagencia.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
