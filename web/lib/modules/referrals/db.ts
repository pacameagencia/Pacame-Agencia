import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralConfig } from "./config";

export type Campaign = {
  id: string;
  tenant_id: string;
  name: string;
  commission_percent: number;
  cookie_days: number;
  max_commission_period_months: number;
  attribution: "last_click" | "first_click";
  is_default: boolean;
};

export type Affiliate = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  email: string;
  referral_code: string;
  campaign_id: string | null;
  status: "active" | "suspicious" | "disabled";
  tier: "standard" | "vip" | "partner";
  brand_id: string | null;
  extra_brand_ids: string[];
  stripe_connect_account_id: string | null;
  stripe_payouts_enabled: boolean;
  created_at: string;
};

export type Brand = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  domain: string | null;
  description: string | null;
  active: boolean;
  display_order: number;
};

export type BrandProduct = {
  id: string;
  brand_id: string;
  product_key: string;
  product_name: string;
  price_cents: number;
  is_recurring: boolean;
  standard_flat_commission_cents: number;
  vip_first_flat_commission_cents: number;
  vip_recurring_flat_cents: number;
  vip_recurring_months: number;
  active: boolean;
  display_order: number;
};

export async function getDefaultCampaign(
  supabase: SupabaseClient,
  config: ReferralConfig,
): Promise<Campaign> {
  const { data } = await supabase
    .from("aff_campaigns")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .eq("is_default", true)
    .maybeSingle<Campaign>();

  if (data) return data;

  // fallback: any campaign for tenant; if none, derive from config
  const { data: any } = await supabase
    .from("aff_campaigns")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .limit(1)
    .maybeSingle<Campaign>();

  return (
    any ?? {
      id: "",
      tenant_id: config.tenantId,
      name: "config-default",
      commission_percent: config.commissionPercent,
      cookie_days: config.cookieDays,
      max_commission_period_months: config.maxCommissionMonths,
      attribution: config.attribution,
      is_default: true,
    }
  );
}

export async function getCampaignById(
  supabase: SupabaseClient,
  config: ReferralConfig,
  id: string | null,
): Promise<Campaign> {
  if (!id) return getDefaultCampaign(supabase, config);
  const { data } = await supabase
    .from("aff_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle<Campaign>();
  return data ?? getDefaultCampaign(supabase, config);
}

export async function getOrCreateAffiliate(params: {
  supabase: SupabaseClient;
  config: ReferralConfig;
  userId: string;
  email: string;
}): Promise<Affiliate> {
  const { supabase, config, userId, email } = params;

  const { data: existing } = await supabase
    .from("aff_affiliates")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .eq("user_id", userId)
    .maybeSingle<Affiliate>();

  if (existing) return existing;

  const campaign = await getDefaultCampaign(supabase, config);
  const code = await generateUniqueCode(supabase, config, email);

  const { data, error } = await supabase
    .from("aff_affiliates")
    .insert({
      tenant_id: config.tenantId,
      user_id: userId,
      email,
      referral_code: code,
      campaign_id: campaign.id || null,
      status: "active",
    })
    .select("*")
    .single<Affiliate>();

  if (error || !data) {
    throw new Error(`Failed to create affiliate: ${error?.message || "unknown"}`);
  }
  return data;
}

export async function getAffiliateById(
  supabase: SupabaseClient,
  id: string,
): Promise<Affiliate | null> {
  const { data } = await supabase
    .from("aff_affiliates")
    .select("*")
    .eq("id", id)
    .maybeSingle<Affiliate>();
  return data;
}

export async function getAffiliateByCode(
  supabase: SupabaseClient,
  config: ReferralConfig,
  code: string,
): Promise<Affiliate | null> {
  const { data } = await supabase
    .from("aff_affiliates")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .eq("referral_code", code)
    .maybeSingle<Affiliate>();
  return data;
}

async function generateUniqueCode(
  supabase: SupabaseClient,
  config: ReferralConfig,
  email: string,
): Promise<string> {
  const base = slugifyBase(email);
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix(4)}`;
    const { data } = await supabase
      .from("aff_affiliates")
      .select("id")
      .eq("tenant_id", config.tenantId)
      .eq("referral_code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${randomSuffix(8)}`;
}

function slugifyBase(email: string): string {
  const local = email.split("@")[0] || "ref";
  const slug = local
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug || `ref-${randomSuffix(6)}`;
}

function randomSuffix(len: number): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ════════════════════════════════════════════════════════════════════
// Brands & Brand Products
// ════════════════════════════════════════════════════════════════════

export async function listBrands(
  supabase: SupabaseClient,
  config: ReferralConfig,
  onlyActive = true,
): Promise<Brand[]> {
  let q = supabase
    .from("aff_brands")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .order("display_order", { ascending: true });
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return data ?? [];
}

export async function getBrandBySlug(
  supabase: SupabaseClient,
  config: ReferralConfig,
  slug: string,
): Promise<Brand | null> {
  const { data } = await supabase
    .from("aff_brands")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .eq("slug", slug)
    .maybeSingle<Brand>();
  return data;
}

export async function getBrandById(
  supabase: SupabaseClient,
  id: string,
): Promise<Brand | null> {
  const { data } = await supabase
    .from("aff_brands")
    .select("*")
    .eq("id", id)
    .maybeSingle<Brand>();
  return data;
}

export async function listBrandProducts(
  supabase: SupabaseClient,
  brandId: string,
  onlyActive = true,
): Promise<BrandProduct[]> {
  let q = supabase
    .from("aff_brand_products")
    .select("*")
    .eq("brand_id", brandId)
    .order("display_order", { ascending: true });
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return data ?? [];
}

export async function getBrandProductByKey(
  supabase: SupabaseClient,
  brandId: string,
  productKey: string,
): Promise<BrandProduct | null> {
  const { data } = await supabase
    .from("aff_brand_products")
    .select("*")
    .eq("brand_id", brandId)
    .eq("product_key", productKey)
    .maybeSingle<BrandProduct>();
  return data;
}

/**
 * Resolves the brand/product for an affiliate from a Stripe metadata.product
 * value. Looks up by product_key in the affiliate's primary brand first,
 * then in each opt-in extra brand. Returns null if no match (caller falls
 * back to legacy campaign or skips commission).
 */
export async function resolveProductForAffiliate(
  supabase: SupabaseClient,
  affiliate: Affiliate,
  productKey: string,
): Promise<{ brand: Brand; product: BrandProduct } | null> {
  const brandIds = [
    ...(affiliate.brand_id ? [affiliate.brand_id] : []),
    ...affiliate.extra_brand_ids,
  ];
  for (const bid of brandIds) {
    const product = await getBrandProductByKey(supabase, bid, productKey);
    if (product) {
      const brand = await getBrandById(supabase, bid);
      if (brand) return { brand, product };
    }
  }
  return null;
}

/**
 * For an affiliate, returns the IDs of brands they can see content from.
 */
export function getAffiliateBrandIds(affiliate: Affiliate): string[] {
  return [
    ...(affiliate.brand_id ? [affiliate.brand_id] : []),
    ...affiliate.extra_brand_ids,
  ];
}
