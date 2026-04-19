import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import AppLanding, { AppLandingData } from "@/components/apps/AppLanding";

export const revalidate = 300;
export const dynamicParams = true;

async function fetchApp(slug: string): Promise<AppLandingData | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("apps_catalog")
    .select(
      "slug, name, tagline, description, long_description, price_monthly_cents, price_yearly_cents, features, benefits, use_cases, faq, integrations, category, hero_media_url, is_active"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  return {
    slug: data.slug as string,
    name: data.name as string,
    tagline: (data.tagline as string) || null,
    description: (data.description as string) || null,
    long_description: (data.long_description as string) || null,
    price_monthly_cents: data.price_monthly_cents as number,
    price_yearly_cents: (data.price_yearly_cents as number) || null,
    features: (data.features as string[]) || [],
    benefits:
      (data.benefits as Array<{ title: string; description: string; icon: string }>) || [],
    use_cases:
      (data.use_cases as Array<{ sector: string; title: string; description: string }>) ||
      [],
    faq: (data.faq as Array<{ q: string; a: string }>) || [],
    integrations: (data.integrations as string[]) || [],
    category: (data.category as string) || null,
    hero_media_url: (data.hero_media_url as string) || null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = await fetchApp(slug);
  if (!app) return {};
  const description = app.tagline || app.description || app.name;
  return {
    title: `${app.name} — ${(app.price_monthly_cents / 100).toFixed(0)}€/mes | PACAME`,
    description: description.slice(0, 155),
    alternates: { canonical: `https://pacameagencia.com/apps/${app.slug}` },
    openGraph: {
      title: `${app.name} | PACAME`,
      description,
      url: `https://pacameagencia.com/apps/${app.slug}`,
      siteName: "PACAME",
      type: "website",
      locale: "es_ES",
    },
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await fetchApp(slug);
  if (!app) notFound();
  return <AppLanding app={app} />;
}
