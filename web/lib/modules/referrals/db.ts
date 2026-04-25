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
  created_at: string;
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
