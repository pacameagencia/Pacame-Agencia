import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

/**
 * Authenticated affiliate's own commissions, newest first.
 *
 *   GET /api/referrals/me/commissions
 */
export async function GET(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const baseQ = supabase.from("aff_affiliates").select("id").eq("tenant_id", config.tenantId);
  const { data: affiliate } = authed.affiliateOnly
    ? await baseQ.eq("id", authed.id).maybeSingle<{ id: string }>()
    : await baseQ.eq("user_id", authed.id).maybeSingle<{ id: string }>();
  if (!affiliate) return NextResponse.json({ error: "not_enrolled" }, { status: 404 });

  const { data, error } = await supabase
    .from("aff_commissions")
    .select("id, source_event, amount_cents, status, month_index, due_at, paid_at, created_at, metadata")
    .eq("tenant_id", config.tenantId)
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commissions: data ?? [] });
}
