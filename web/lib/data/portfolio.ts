/**
 * PACAME Portfolio verticals — fetcher + types.
 * Data en tabla portfolio_verticals (migration 031).
 */

import { createServerSupabase } from "@/lib/supabase/server";

export interface PortfolioVertical {
  id: string;
  slug: string;
  sub_brand: string;
  vertical_label: string;
  hero_headline: string;
  hero_sub: string | null;
  color_primary: string | null;
  color_accent: string | null;
  icon_key: string | null;
  features: string[];
  sections: unknown[];
  cta_label: string;
  cta_price_cents: number | null;
  cta_timeline: string;
  proof_clients: number;
  proof_rating: number;
  is_active: boolean;
  sort_order: number;
}

export async function listPortfolioVerticals(): Promise<PortfolioVertical[]> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("portfolio_verticals")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data || []).map((row) => ({
      ...row,
      features: Array.isArray(row.features) ? row.features : [],
      sections: Array.isArray(row.sections) ? row.sections : [],
    })) as PortfolioVertical[];
  } catch {
    return [];
  }
}

export async function getPortfolioVertical(
  slug: string
): Promise<PortfolioVertical | null> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("portfolio_verticals")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return null;
    return {
      ...data,
      features: Array.isArray(data.features) ? data.features : [],
      sections: Array.isArray(data.sections) ? data.sections : [],
    } as PortfolioVertical;
  } catch {
    return null;
  }
}
