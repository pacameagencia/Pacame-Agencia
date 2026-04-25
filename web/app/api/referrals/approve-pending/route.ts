import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Promotes commissions whose hold period has elapsed:
 *   pending + due_at <= now()  →  approved
 *
 * Run via Vercel cron daily (Bearer CRON_SECRET) or from the dashboard.
 * Idempotent — running twice is a no-op.
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_commissions")
    .update({ status: "approved" })
    .eq("tenant_id", config.tenantId)
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString())
    .select("id, affiliate_id, amount_cents");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    approved: data?.length ?? 0,
    total_cents: (data ?? []).reduce((sum, row) => sum + row.amount_cents, 0),
  });
}

export async function GET(request: NextRequest) {
  // Allow GET for Vercel cron simplicity
  return POST(request);
}
