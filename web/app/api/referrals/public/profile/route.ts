import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { readAffiliateSessionFromRequest } from "@/lib/modules/referrals/affiliate-auth";

const PAYOUT_METHODS = ["iban", "paypal", "bizum", "revolut", "wise"] as const;

/**
 *   GET  /api/referrals/public/profile  → datos completos del afiliado autenticado
 *   PATCH /api/referrals/public/profile  → actualizar full_name, phone, datos de cobro
 */
export async function GET(request: NextRequest) {
  const session = readAffiliateSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_affiliates")
    .select(
      "id, email, referral_code, status, full_name, phone, country, tax_id, payout_method, payout_iban, payout_paypal, payout_phone, marketing_consent, created_at, last_login_at",
    )
    .eq("tenant_id", config.tenantId)
    .eq("id", session.affiliate_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: NextRequest) {
  const session = readAffiliateSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const update: Record<string, unknown> = {};
  const fields = [
    "full_name", "phone", "country", "tax_id",
    "payout_iban", "payout_paypal", "payout_phone",
    "marketing_consent",
  ];
  for (const f of fields) if (f in body) update[f] = body[f];

  if (typeof body.payout_method === "string") {
    if (!PAYOUT_METHODS.includes(body.payout_method as (typeof PAYOUT_METHODS)[number])) {
      return NextResponse.json({ error: "invalid_payout_method" }, { status: 400 });
    }
    update.payout_method = body.payout_method;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("aff_affiliates")
    .update(update)
    .eq("tenant_id", config.tenantId)
    .eq("id", session.affiliate_id)
    .select(
      "id, email, full_name, phone, country, tax_id, payout_method, payout_iban, payout_paypal, payout_phone, marketing_consent",
    )
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
