/**
 * Registry de productos PACAME (mini-SaaS verticales bajo la marca).
 * Lee `pacame_products` table y expone helpers tipados.
 */

import { createServerSupabase } from "@/lib/supabase/server";

export interface ProductTier {
  tier: string;
  name: string;
  price_eur: number;
  interval: "month" | "year";
  limits: Record<string, number | boolean>;
  stripe_price_id?: string | null;
  recommended?: boolean;
}

export interface ProductMarketing {
  hero_headline?: string;
  hero_sub?: string;
  target_persona?: string;
  pain_quote?: string;
  primary_color?: string;
  accent_color?: string;
  trial_cta?: string;
  hero_image?: string;
  og_image?: string;
}

export interface PacameProduct {
  id: string;
  name: string;
  tagline: string;
  category: string | null;
  owner_agent: string;
  status: "draft" | "beta" | "live" | "sunset";
  pricing: ProductTier[];
  trial_days: number;
  features: string[];
  marketing: ProductMarketing;
  created_at: string;
  updated_at: string;
}

export async function listLiveProducts(): Promise<PacameProduct[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pacame_products")
    .select("*")
    .in("status", ["live", "beta"])
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as PacameProduct[];
}

export async function getProduct(id: string): Promise<PacameProduct | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pacame_products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as PacameProduct;
}

export function findTier(product: PacameProduct, tier: string): ProductTier | null {
  return product.pricing.find((t) => t.tier === tier) ?? null;
}

export function getRecommendedTier(product: PacameProduct): ProductTier {
  return product.pricing.find((t) => t.recommended) ?? product.pricing[Math.floor(product.pricing.length / 2)] ?? product.pricing[0];
}

/**
 * Formatea limits como bullets human-readable.
 * { clients: 50, sii_export: true } → ["50 clientes", "Export SII"]
 */
const LIMIT_LABELS: Record<string, (v: number | boolean) => string | null> = {
  clients: (v) => (v === -1 ? "Clientes ilimitados" : `${v} clientes`),
  asesores: (v) => (v === 1 ? "1 asesor" : v === -1 ? "Asesores ilimitados" : `${v} asesores`),
  sii_export: (v) => (v ? "Export SII a Hacienda" : null),
  api: (v) => (v ? "API + integraciones" : null),
};

export function formatTierLimits(tier: ProductTier): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(tier.limits)) {
    const formatter = LIMIT_LABELS[key];
    if (formatter) {
      const label = formatter(value);
      if (label) out.push(label);
    } else if (typeof value === "boolean" && value) {
      out.push(key.replace(/_/g, " "));
    } else if (typeof value === "number") {
      out.push(`${value === -1 ? "∞" : value} ${key.replace(/_/g, " ")}`);
    }
  }
  return out;
}
