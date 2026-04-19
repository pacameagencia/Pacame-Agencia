import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

export const revalidate = 60;

/**
 * GET /api/public/search?q=texto
 *
 * Busca en marketplace + apps + planes. Devuelve resultados rankeados.
 * Full-text via tsvector + fallback ILIKE.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [], query: q });
  }
  if (q.length > 100) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const ilike = `%${q.toLowerCase()}%`;

  try {
    const [services, apps, plans, categoriesData] = await Promise.all([
      supabase
        .from("service_catalog")
        .select("slug, name, tagline, category, price_cents")
        .eq("is_active", true)
        .or(`name.ilike.${ilike},tagline.ilike.${ilike},description.ilike.${ilike}`)
        .limit(8),
      supabase
        .from("apps_catalog")
        .select("slug, name, tagline, category, price_monthly_cents")
        .eq("is_active", true)
        .or(`name.ilike.${ilike},tagline.ilike.${ilike},description.ilike.${ilike}`)
        .limit(4),
      supabase
        .from("subscription_plans")
        .select("slug, name, tagline, price_monthly_cents")
        .eq("is_active", true)
        .or(`name.ilike.${ilike},tagline.ilike.${ilike},description.ilike.${ilike}`)
        .limit(4),
      supabase
        .from("service_categories")
        .select("slug, name, description")
        .eq("is_active", true)
        .or(`name.ilike.${ilike},description.ilike.${ilike}`)
        .limit(3),
    ]);

    type Result = {
      kind: "service" | "app" | "plan" | "category";
      slug: string;
      url: string;
      title: string;
      subtitle?: string | null;
      price?: string;
      category?: string | null;
    };

    const results: Result[] = [];

    for (const s of services.data || []) {
      results.push({
        kind: "service",
        slug: s.slug as string,
        url: `/servicios/${s.slug}`,
        title: s.name as string,
        subtitle: s.tagline as string,
        price: s.price_cents ? `${(s.price_cents as number) / 100}€` : undefined,
        category: s.category as string | null,
      });
    }
    for (const a of apps.data || []) {
      results.push({
        kind: "app",
        slug: a.slug as string,
        url: `/apps/${a.slug}`,
        title: a.name as string,
        subtitle: a.tagline as string,
        price: a.price_monthly_cents
          ? `${(a.price_monthly_cents as number) / 100}€/mes`
          : undefined,
        category: a.category as string | null,
      });
    }
    for (const p of plans.data || []) {
      results.push({
        kind: "plan",
        slug: p.slug as string,
        url: `/planes`,
        title: p.name as string,
        subtitle: p.tagline as string,
        price: p.price_monthly_cents
          ? `${(p.price_monthly_cents as number) / 100}€/mes`
          : undefined,
      });
    }
    for (const c of categoriesData.data || []) {
      results.push({
        kind: "category",
        slug: c.slug as string,
        url: `/servicios#${c.slug}`,
        title: c.name as string,
        subtitle: c.description as string,
      });
    }

    return NextResponse.json({ results: results.slice(0, 20), query: q });
  } catch (err) {
    getLogger().error({ err, q }, "public search failed");
    return NextResponse.json({ results: [], query: q });
  }
}
