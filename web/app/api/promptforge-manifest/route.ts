/**
 * GET /api/promptforge-manifest
 *
 * Manifest PWA de PromptForge — mejorador de prompts NASA-tier.
 * Theme terracotta (acento PACAME). Instalable desde Chrome/iOS Safari.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const manifest = {
    name: "PromptForge · PACAME",
    short_name: "PromptForge",
    description:
      "Pega tu idea cruda, elige target (Claude, Midjourney, Sora…) y recibe 2-5 variantes profesionales con análisis técnico.",
    start_url: "/app/promptforge",
    scope: "/app/promptforge",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FAF6EE",
    theme_color: "#B54E30",
    lang: "es-ES",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Forjar prompt", url: "/app/promptforge", description: "Empezar nuevo prompt" },
      { name: "Plantillas", url: "/app/promptforge/templates" },
      { name: "Historial", url: "/app/promptforge/history" },
      { name: "Favoritos", url: "/app/promptforge/starred" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
