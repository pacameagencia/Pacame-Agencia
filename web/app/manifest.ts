import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PACAME — Agencia Digital IA",
    short_name: "PACAME",
    description:
      "Agencia digital con IA especializada. Diseno web, SEO, publicidad, redes sociales y branding para PYMEs espanolas.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#7C3AED",
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
