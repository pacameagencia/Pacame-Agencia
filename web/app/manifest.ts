import type { MetadataRoute } from "next";

/**
 * PACAME PWA Manifest — Installable en Chrome/Edge/Safari iOS.
 * Next.js sirve esto como /manifest.webmanifest.
 *
 * Refactor Sprint 23: PWA app-like UX
 *  - Colores Spanish Modernism (paper bg, terracotta theme) — antes era dark legacy
 *  - Icons estáticos generados con GPT Image 2 (no endpoint dinámico)
 *  - Screenshots wide + narrow para A2HS prompt enriquecido
 *  - Shortcuts ampliados con iconos cerámicos custom
 *  - Display "standalone" + display_override para edge cases
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "PACAME — Agencia Digital IA",
    short_name: "PACAME",
    description:
      "Tu equipo digital completo. 7 agentes IA + supervisión humana. Web, SEO, Ads, Social, Branding — 60% más barato que una agencia tradicional.",
    start_url: "/?source=pwa",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    background_color: "#F4EFE3",
    theme_color: "#B54E30",
    lang: "es-ES",
    dir: "ltr",
    scope: "/",
    categories: ["business", "productivity", "marketing", "design"],
    icons: [
      {
        src: "/generated/mobile/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/generated/mobile/pwa-icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/generated/mobile/pwa-icon-monochrome.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/generated/og/home.png",
        sizes: "1536x1024",
        type: "image/png",
        form_factor: "wide",
        label: "Home — PACAME agencia digital con IA",
      },
      {
        src: "/generated/mobile/hero-vertical.png",
        sizes: "1024x1536",
        type: "image/png",
        form_factor: "narrow",
        label: "Móvil — Tu problema digital, resuelto hoy",
      },
    ],
    shortcuts: [
      {
        name: "Servicios",
        short_name: "Servicios",
        description: "Marketplace de servicios digitales",
        url: "/servicios?source=shortcut",
        icons: [{ src: "/generated/mobile/bottomnav-services.png", sizes: "1024x1024" }],
      },
      {
        name: "Agentes",
        short_name: "Agentes",
        description: "Conoce a los 7 agentes IA",
        url: "/agentes?source=shortcut",
        icons: [{ src: "/generated/mobile/bottomnav-agents.png", sizes: "1024x1024" }],
      },
      {
        name: "Casos",
        short_name: "Casos",
        description: "Casos de éxito reales",
        url: "/casos?source=shortcut",
        icons: [{ src: "/generated/mobile/bottomnav-cases.png", sizes: "1024x1024" }],
      },
      {
        name: "Contacto",
        short_name: "Contacto",
        description: "Hablar con PACAME ahora",
        url: "/contacto?source=shortcut",
        icons: [{ src: "/generated/mobile/bottomnav-contact.png", sizes: "1024x1024" }],
      },
    ],
    prefer_related_applications: false,
  };
}
