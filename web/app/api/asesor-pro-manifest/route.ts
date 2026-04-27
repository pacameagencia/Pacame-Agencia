/**
 * GET /api/asesor-pro-manifest
 *
 * Manifest PWA de AsesorPro. Cuando se instala desde el navegador
 * (Chrome desktop o "Añadir a pantalla de inicio" iOS/Android), abre
 * la app standalone con tema azul ink + cuadros de PACAME.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const manifest = {
    name: "AsesorPro · PACAME",
    short_name: "AsesorPro",
    description:
      "Tus clientes facturan, suben tickets por foto, tú revisas y al cierre de mes el ZIP se empaqueta solo. El sistema operativo del asesor fiscal.",
    start_url: "/app/asesor-pro",
    scope: "/app/asesor-pro",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FAF6EE",
    theme_color: "#283B70",
    lang: "es-ES",
    categories: ["productivity", "business", "finance"],
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Pipeline",
        url: "/app/asesor-pro/pipeline",
        description: "Revisa pendientes y empaquetados",
      },
      { name: "Clientes", url: "/app/asesor-pro/clientes" },
      { name: "Facturas", url: "/app/asesor-pro/facturas" },
      { name: "Gastos", url: "/app/asesor-pro/gastos" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
