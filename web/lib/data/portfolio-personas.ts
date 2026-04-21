/**
 * PACAME Portfolio Personas — fetcher + types (Sprint 21 PR #42 Bloque A)
 *
 * Each persona = una mini propuesta comercial lista para una sub-audience
 * dentro de un vertical (ej. "entrenador-personal" dentro de "gym").
 */

import { createServerSupabase } from "@/lib/supabase/server";

export interface PersonaPainBullet {
  icon?: string;
  text: string;
}

export interface PersonaFaqItem {
  q: string;
  a: string;
}

export interface PersonaCaseStudy {
  client_name: string;
  before: Record<string, string | number>;
  after: Record<string, string | number>;
  quote: string;
  disclaimer: string;
}

export interface PortfolioPersona {
  id: string;
  vertical_slug: string;
  persona_slug: string;
  persona_name: string;
  persona_tagline: string | null;
  persona_emoji: string | null;
  pain_headline: string;
  pain_bullets: string[];
  solution_headline: string;
  solution_bullets: string[];
  deliverables: string[];
  case_study: PersonaCaseStudy | null;
  starting_price_cents: number | null;
  timeline_days: number | null;
  faq: PersonaFaqItem[];
  hero_image_url: string | null;
  og_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  sort_order: number;
}

/**
 * Normaliza JSONB -> typed arrays, evita crashes si la DB devuelve shapes
 * inesperados (tests de migrations, staging, etc).
 */
function normalizePersona(row: Record<string, unknown>): PortfolioPersona {
  return {
    id: row.id as string,
    vertical_slug: row.vertical_slug as string,
    persona_slug: row.persona_slug as string,
    persona_name: row.persona_name as string,
    persona_tagline: (row.persona_tagline as string | null) ?? null,
    persona_emoji: (row.persona_emoji as string | null) ?? null,
    pain_headline: row.pain_headline as string,
    pain_bullets: Array.isArray(row.pain_bullets) ? (row.pain_bullets as string[]) : [],
    solution_headline: row.solution_headline as string,
    solution_bullets: Array.isArray(row.solution_bullets)
      ? (row.solution_bullets as string[])
      : [],
    deliverables: Array.isArray(row.deliverables) ? (row.deliverables as string[]) : [],
    case_study: (row.case_study as PersonaCaseStudy | null) ?? null,
    starting_price_cents: (row.starting_price_cents as number | null) ?? null,
    timeline_days: (row.timeline_days as number | null) ?? null,
    faq: Array.isArray(row.faq) ? (row.faq as PersonaFaqItem[]) : [],
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    og_image_url: (row.og_image_url as string | null) ?? null,
    meta_title: (row.meta_title as string | null) ?? null,
    meta_description: (row.meta_description as string | null) ?? null,
    is_active: (row.is_active as boolean) ?? true,
    sort_order: (row.sort_order as number) ?? 0,
  };
}

export async function listPersonas(): Promise<PortfolioPersona[]> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("portfolio_personas")
      .select("*")
      .eq("is_active", true)
      .order("vertical_slug", { ascending: true })
      .order("sort_order", { ascending: true });
    return (data || []).map(normalizePersona);
  } catch {
    return [];
  }
}

export async function listPersonasByVertical(
  verticalSlug: string
): Promise<PortfolioPersona[]> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("portfolio_personas")
      .select("*")
      .eq("vertical_slug", verticalSlug)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data || []).map(normalizePersona);
  } catch {
    return [];
  }
}

export async function getPersona(
  verticalSlug: string,
  personaSlug: string
): Promise<PortfolioPersona | null> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("portfolio_personas")
      .select("*")
      .eq("vertical_slug", verticalSlug)
      .eq("persona_slug", personaSlug)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return null;
    return normalizePersona(data);
  } catch {
    return null;
  }
}
