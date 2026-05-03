import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const PACAME_HOST = "pacameagencia.com";
const DARKROOM_HOST = "darkroomcreative.cloud";

async function detectHost(): Promise<"pacame" | "darkroom"> {
  try {
    const h = await headers();
    const raw = (h.get("x-forwarded-host") || h.get("host") || "")
      .toLowerCase()
      .replace(/:\d+$/, "");
    if (raw === DARKROOM_HOST || raw.endsWith("." + DARKROOM_HOST)) return "darkroom";
    return "pacame";
  } catch {
    return "pacame";
  }
}

/**
 * Multi-host robots.txt.
 *
 * Cumple `proteccion-identidad.md` regla 3 — en DarkRoom las páginas legales
 * NO deben indexarse aunque el host sea correcto. Reforzamos doblemente con
 * disallow `/legal/` + el `robots: noindex` ya presente en `app/legal/layout.tsx`.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const brand = await detectHost();

  if (brand === "darkroom") {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/legal/",     // doble noindex (también layout)
            "/api/",
            "/dashboard/",
            "/portal/",
            "/login",
            "/monitoring",
            "/r/",
            "/*?utm_*",
            "/*?session_id=*",
          ],
        },
        // No abrimos GPTBot/ClaudeBot/PerplexityBot al contenido DarkRoom hasta
        // que tengamos posicionamiento publico decidido.
      ],
      sitemap: `https://${DARKROOM_HOST}/sitemap.xml`,
      host: `https://${DARKROOM_HOST}`,
    };
  }

  // PACAME default
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/portal/",
          "/login",
          "/monitoring",
          "/docs/",
          "/legal/",      // ruta DarkRoom-only — disallow en pacame para no leakear
          "/crew/",       // ruta DarkRoom-only — disallow en pacame
          "/*?utm_*",
          "/*?session_id=*",
        ],
      },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
    ],
    sitemap: `https://${PACAME_HOST}/sitemap.xml`,
    host: `https://${PACAME_HOST}`,
  };
}
