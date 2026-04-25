import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

type LegacyCommercial = {
  id: string;
  name: string;
  email: string;
  partner_code: string;
  status: string;
};

/**
 * One-shot, idempotent migration: legacy `commercials` (PACAME human partners)
 * → `aff_affiliates` with tenant_id='pacame'.
 *
 * Reads commercials WHERE status='active', and inserts a matching aff_affiliates
 * row using their partner_code as referral_code. Skips rows that already exist
 * (matched by tenant_id + email).
 *
 * Does NOT delete or modify the legacy table — they coexist until you choose
 * to retire the old endpoints.
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: legacy, error } = await supabase
    .from("commercials")
    .select("id, name, email, partner_code, status")
    .eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = { imported: 0, skipped: 0, failed: [] as string[] };

  for (const row of (legacy ?? []) as LegacyCommercial[]) {
    if (!row.email || !row.partner_code) {
      result.skipped += 1;
      continue;
    }

    const { data: existing } = await supabase
      .from("aff_affiliates")
      .select("id")
      .eq("tenant_id", config.tenantId)
      .eq("email", row.email)
      .maybeSingle<{ id: string }>();

    if (existing) {
      result.skipped += 1;
      continue;
    }

    const { error: insertError } = await supabase.from("aff_affiliates").insert({
      tenant_id: config.tenantId,
      user_id: null,                              // commercials sin cuenta cliente
      email: row.email,
      referral_code: row.partner_code.toLowerCase(),
      status: "active",
    });

    if (insertError) {
      result.failed.push(`${row.email}: ${insertError.message}`);
    } else {
      result.imported += 1;
    }
  }

  return NextResponse.json(result);
}
