import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Marks a batch of approved commissions as paid.
 * Body: { affiliate_id?: string; commission_ids?: string[] }
 *  - If commission_ids provided → mark only those (must be `approved`).
 *  - Else if affiliate_id provided → mark all approved commissions for that affiliate.
 *  - Else → 400.
 *
 * Use after wiring to your real payout rail (SEPA, Wise, manual transfer, etc.).
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: { affiliate_id?: string; commission_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  let query = supabase
    .from("aff_commissions")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("tenant_id", config.tenantId)
    .eq("status", "approved");

  if (body.commission_ids?.length) {
    query = query.in("id", body.commission_ids);
  } else if (body.affiliate_id) {
    query = query.eq("affiliate_id", body.affiliate_id);
  } else {
    return NextResponse.json(
      { error: "affiliate_id or commission_ids required" },
      { status: 400 },
    );
  }

  const { data, error } = await query.select("id, amount_cents, affiliate_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    paid: data?.length ?? 0,
    total_cents: (data ?? []).reduce((sum, row) => sum + row.amount_cents, 0),
    commission_ids: (data ?? []).map((row) => row.id),
  });
}
