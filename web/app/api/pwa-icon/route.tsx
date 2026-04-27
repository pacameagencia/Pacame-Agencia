import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get("size") || "192");
  const s = Math.min(Math.max(size, 48), 1024);
  const radius = Math.round(s * 0.2);
  const fontSize = Math.round(s * 0.6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8B5CF6, #283B70)",
          borderRadius: `${radius}px`,
        }}
      >
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            color: "white",
            display: "flex",
          }}
        >
          P
        </div>
      </div>
    ),
    { width: s, height: s }
  );
}
