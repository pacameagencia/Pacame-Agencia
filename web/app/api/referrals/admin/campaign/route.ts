import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

const ATTRIBUTIONS = ["last_click", "first_click"] as const;

/**
 * GET  /api/referrals/admin/campaign  → devuelve la campaña por defecto del tenant.
 * PATCH /api/referrals/admin/campaign → actualiza commission_percent, max_months,
 *   cookie_days, attribution. Las comisiones ya generadas NO cambian; las nuevas
 *   se calculan con la nueva config.
 */

type CampaignRow = {
  id: string;
  tenant_id: string;
  name: string;
  commission_percent: number;
  cookie_days: number;
  max_commission_period_months: number;
  attribution: "last_click" | "first_click";
  is_default: boolean;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_campaigns")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .eq("is_default", true)
    .maybeSingle<CampaignRow>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "no_default_campaign" }, { status: 404 });

  return NextResponse.json({ campaign: data });
}

export async function PATCH(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: "name_empty" }, { status: 400 });
    update.name = v.slice(0, 80);
  }

  if (body.commission_percent !== undefined) {
    const n = Number(body.commission_percent);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return NextResponse.json({ error: "invalid_commission_percent" }, { status: 400 });
    }
    update.commission_percent = Math.round(n * 100) / 100;
  }

  if (body.cookie_days !== undefined) {
    const n = Number(body.cookie_days);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      return NextResponse.json({ error: "invalid_cookie_days" }, { status: 400 });
    }
    update.cookie_days = n;
  }

  if (body.max_commission_period_months !== undefined) {
    const n = Number(body.max_commission_period_months);
    if (!Number.isInteger(n) || n < 0 || n > 120) {
      return NextResponse.json({ error: "invalid_max_months" }, { status: 400 });
    }
    update.max_commission_period_months = n;
  }

  if (body.attribution !== undefined) {
    if (!ATTRIBUTIONS.includes(body.attribution as (typeof ATTRIBUTIONS)[number])) {
      return NextResponse.json({ error: "invalid_attribution" }, { status: 400 });
    }
    update.attribution = body.attribution;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_campaigns")
    .update(update)
    .eq("tenant_id", config.tenantId)
    .eq("is_default", true)
    .select("*")
    .maybeSingle<CampaignRow>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "no_default_campaign" }, { status: 404 });

  return NextResponse.json({ campaign: data, applied_to: "future_commissions_only" });
}
