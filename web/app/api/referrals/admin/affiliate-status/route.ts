import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Admin: change an affiliate's status (active / suspicious / disabled).
 * Used to manually un-flag a false-positive suspicious affiliate, or to ban one.
 *
 *   POST /api/referrals/admin/affiliate-status
 *   Body: { affiliate_id, status }
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: { affiliate_id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.affiliate_id || !body.status) {
    return NextResponse.json({ error: "affiliate_id and status required" }, { status: 400 });
  }
  if (!["active", "suspicious", "disabled"].includes(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_affiliates")
    .update({ status: body.status })
    .eq("tenant_id", config.tenantId)
    .eq("id", body.affiliate_id)
    .select("id, status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ affiliate: data });
}
