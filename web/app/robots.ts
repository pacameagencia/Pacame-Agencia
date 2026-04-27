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
        crawlDelay: 1,
      },
      // AI search bots (allow indexing for citations in AI answers)
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "anthropic-ai", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "Bytespider", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "CCBot", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      // Russian + Asian search engines
      { userAgent: "YandexBot", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/api/", "/dashboard/", "/portal/", "/admin/"] },
    ],
    sitemap: "https://pacameagencia.com/sitemap.xml",
    host: "https://pacameagencia.com",
  };
}
