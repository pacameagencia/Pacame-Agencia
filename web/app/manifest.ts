import type { MetadataRoute } from "next";

/**
 * PWA Manifest — Installable en Chrome/Edge/Safari iOS.
 * Next.js sirve esto como /manifest.webmanifest.
 *
 * Para deeplink y branding consistente — shortcuts incluyen las
 * rutas mas usadas (servicios, planes, casos, contacto).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PACAME — Agencia Digital IA",
    short_name: "PACAME",
    description:
      "Tu equipo digital completo. 10 agentes IA + supervision humana. Web, SEO, Ads, Social, Branding — 60% mas barato que una agencia tradicional.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0A0A0A",
    theme_color: "#D4A574",
    lang: "es-ES",
    dir: "ltr",
    scope: "/",
    categories: ["business", "productivity", "marketing"],
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    shortcuts: [
      {
        name: "Servicios",
        short_name: "Servicios",
        description: "Marketplace de servicios digitales",
        url: "/servicios",
      },
      {
        name: "Planes",
        short_name: "Planes",
        description: "Suscripciones mensuales",
        url: "/planes",
      },
      {
        name: "Casos",
        short_name: "Casos",
        description: "Casos de exito",
        url: "/casos",
      },
      {
        name: "Contacto",
        short_name: "Contacto",
        description: "Hablar con PACAME",
        url: "/contacto",
      },
    ],
  };
}
