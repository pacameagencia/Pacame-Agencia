import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
          "/*?utm_*",
          "/*?session_id=*",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
    ],
    sitemap: "https://pacameagencia.com/sitemap.xml",
    host: "https://pacameagencia.com",
  };
}
