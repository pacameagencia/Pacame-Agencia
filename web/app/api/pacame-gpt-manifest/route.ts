/**
 * GET /api/pacame-gpt-manifest
 *
 * Manifest PWA específico de PACAME GPT (con avatar Lucía + theme terracota
 * + start_url al chat). Coexiste con el manifest corporativo de PACAME en
 * `app/manifest.ts` sin colisionar — cada layout enlaza al suyo.
 *
 * Importante: cada origen sirve UN solo manifest activo, así que sólo el
 * `<link rel="manifest">` del layout actual cuenta. Cuando el user instala
 * desde /lucia o /pacame-gpt, su home screen abre la app con esta config.
 */

import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-static";

export async function GET() {
  const manifest = {
    name: "PACAME GPT · Lucía",
    short_name: "PACAME GPT",
    description:
      "Lucía es tu IA en español de España. Te ayuda con emails, WhatsApps, traducciones y mucho más. Hecho en España.",
    start_url: "/pacame-gpt",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4efe3",
    theme_color: "#b54e30",
    lang: "es-ES",
    categories: ["productivity", "lifestyle", "utilities"],
    icons: [
      { src: "/asistente/lucia.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/asistente/lucia.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Nueva conversación",
        url: "/pacame-gpt",
        description: "Empieza a hablar con Lucía",
      },
      { name: "Mi cuenta", url: "/pacame-gpt/cuenta" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
