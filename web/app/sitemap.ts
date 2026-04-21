import type { MetadataRoute } from "next";
import { generateAllCombinations } from "@/lib/data/seo";
import { blogPosts } from "@/lib/data/blog-posts";
import { getAllServiceSlugs } from "@/lib/data/services";
import { getAllNicheSlugs } from "@/lib/data/niches";
import { caseStudies } from "@/lib/data/case-studies";
import { createServerSupabase } from "@/lib/supabase/server";

const BASE_URL = "https://pacameagencia.com";

/** Fetch marketplace DB slugs (servicios express + apps + personas) */
async function fetchDbSlugs(): Promise<{
  marketplaceSlugs: string[];
  appSlugs: string[];
  verticalSlugs: string[];
  personaPaths: { vertical: string; persona: string }[];
}> {
  try {
    const supabase = createServerSupabase();
    const [svc, apps, verticals, personas] = await Promise.all([
      supabase.from("service_catalog").select("slug").eq("is_active", true),
      supabase.from("apps_catalog").select("slug").eq("is_active", true),
      supabase.from("portfolio_verticals").select("slug").eq("is_active", true),
      supabase
        .from("portfolio_personas")
        .select("vertical_slug, persona_slug")
        .eq("is_active", true),
    ]);
    return {
      marketplaceSlugs: (svc.data || []).map((r) => r.slug as string),
      appSlugs: (apps.data || []).map((r) => r.slug as string),
      verticalSlugs: (verticals.data || []).map((r) => r.slug as string),
      personaPaths: (personas.data || []).map((r) => ({
        vertical: r.vertical_slug as string,
        persona: r.persona_slug as string,
      })),
    };
  } catch {
    return {
      marketplaceSlugs: [],
      appSlugs: [],
      verticalSlugs: [],
      personaPaths: [],
    };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { marketplaceSlugs, appSlugs, verticalSlugs, personaPaths } =
    await fetchDbSlugs();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/servicios`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE_URL}/apps`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE_URL}/planes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/equipo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/agentes`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/casos`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/auditoria`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/calculadora-roi`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/colabora`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/7-errores`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/review`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/status`, lastModified: now, changeFrequency: "hourly", priority: 0.4 },
    { url: `${BASE_URL}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/aviso-legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terminos-servicio`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/accesibilidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Marketplace DB products (service_catalog)
  const marketplacePages: MetadataRoute.Sitemap = marketplaceSlugs.map((slug) => ({
    url: `${BASE_URL}/servicios/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Apps landing pages
  const appPages: MetadataRoute.Sitemap = appSlugs.map((slug) => ({
    url: `${BASE_URL}/apps/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Service detail pages (servicios/landing-page, servicios/web-corporativa, etc.)
  const servicePages: MetadataRoute.Sitemap = getAllServiceSlugs().map((slug) => ({
    url: `${BASE_URL}/servicios/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Niche pages (para/restaurantes, para/clinicas, etc.)
  const nichePages: MetadataRoute.Sitemap = getAllNicheSlugs().map((slug) => ({
    url: `${BASE_URL}/para/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Case studies
  const casePages: MetadataRoute.Sitemap = caseStudies.map((c) => ({
    url: `${BASE_URL}/casos/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Programmatic SEO pages (1600+)
  const seoCombinations = generateAllCombinations();
  const seoPages: MetadataRoute.Sitemap = seoCombinations.map((combo) => ({
    url: `${BASE_URL}/${combo.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Portfolio vertical index pages (8 rutas /portafolio/[slug])
  const verticalIndexPages: MetadataRoute.Sitemap = verticalSlugs.map((slug) => ({
    url: `${BASE_URL}/portafolio/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Portfolio persona pages (24 rutas /portafolio/[vertical]/[persona])
  const personaPages: MetadataRoute.Sitemap = personaPaths.map((p) => ({
    url: `${BASE_URL}/portafolio/${p.vertical}/${p.persona}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [
    ...staticPages,
    ...marketplacePages,
    ...appPages,
    ...servicePages,
    ...nichePages,
    ...verticalIndexPages,
    ...personaPages,
    ...blogPages,
    ...casePages,
    ...seoPages,
  ];
}
