import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig, getDefaultCampaign } from "@/lib/modules/referrals";
import {
  hashPassword,
  isStrongEnough,
  writeAffiliateCookie,
} from "@/lib/modules/referrals/affiliate-auth";

/**
 * Public affiliate signup. No auth required.
 *
 *   POST /api/referrals/public/signup
 *   Body: { email, password, full_name, phone?, country?, tax_id?, marketing_consent? }
 *
 * Creates an `aff_affiliates` row with `password_hash`, generates a unique
 * referral_code, and sets the `pacame_aff_auth` cookie. The new affiliate
 * is `active` immediately (no admin moderation by default).
 */
export async function POST(request: NextRequest) {
  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
    country?: string;
    tax_id?: string;
    marketing_consent?: boolean;
    source?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.full_name || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!isStrongEnough(password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  // Reject if email already used (with password) — case-insensitive
  const { data: existing } = await supabase
    .from("aff_affiliates")
    .select("id")
    .eq("tenant_id", config.tenantId)
    .ilike("email", email)
    .not("password_hash", "is", null)
    .maybeSingle<{ id: string }>();
  if (existing) {
    return NextResponse.json({ error: "email_in_use" }, { status: 409 });
  }

  // Generate unique referral_code from email local-part
  const baseSlug = email.split("@")[0]
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "afiliado";

  let code = baseSlug;
  for (let i = 0; i < 6; i++) {
    const { data: dup } = await supabase
      .from("aff_affiliates")
      .select("id")
      .eq("tenant_id", config.tenantId)
      .eq("referral_code", code)
      .maybeSingle<{ id: string }>();
    if (!dup) break;
    code = `${baseSlug}-${randomSuffix(4)}`;
  }

  const campaign = await getDefaultCampaign(supabase, config);
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  // If a row already exists without password (legacy import), upgrade it
  const { data: legacy } = await supabase
    .from("aff_affiliates")
    .select("id")
    .eq("tenant_id", config.tenantId)
    .ilike("email", email)
    .is("password_hash", null)
    .maybeSingle<{ id: string }>();

  let affiliateId: string;
  if (legacy) {
    const { data, error } = await supabase
      .from("aff_affiliates")
      .update({
        password_hash: passwordHash,
        full_name: fullName,
        phone: body.phone || null,
        country: body.country || "ES",
        tax_id: body.tax_id || null,
        marketing_consent: body.marketing_consent !== false,
        source: body.source || "public_signup",
        approved_at: now,
        last_login_at: now,
      })
      .eq("id", legacy.id)
      .select("id, referral_code")
      .single<{ id: string; referral_code: string }>();
    if (error || !data) return NextResponse.json({ error: error?.message || "update_failed" }, { status: 500 });
    affiliateId = data.id;
    code = data.referral_code;
  } else {
    const { data, error } = await supabase
      .from("aff_affiliates")
      .insert({
        tenant_id: config.tenantId,
        user_id: null,
        email,
        referral_code: code,
        campaign_id: campaign.id || null,
        status: "active",
        password_hash: passwordHash,
        full_name: fullName,
        phone: body.phone || null,
        country: body.country || "ES",
        tax_id: body.tax_id || null,
        marketing_consent: body.marketing_consent !== false,
        source: body.source || "public_signup",
        approved_at: now,
        last_login_at: now,
      })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return NextResponse.json({ error: error?.message || "create_failed" }, { status: 500 });
    affiliateId = data.id;
  }

  const response = NextResponse.json({
    ok: true,
    affiliate: { id: affiliateId, referral_code: code, email },
    redirect: "/afiliados/panel",
  });
  return writeAffiliateCookie(response, { affiliate_id: affiliateId, email });
}

function randomSuffix(len: number): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
