import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Public lookup of an affiliate by referral_code.
 * Used by landing pages to render "te ha invitado X" without auth.
 * Never returns email or sensitive data — only the public-safe fields.
 *
 *   GET /api/referrals/info?ref=CODE
 *   → 200 { valid: true, name, code }
 *   → 404 { valid: false }
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref")?.trim();
  if (!ref || ref.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(ref)) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data } = await supabase
    .from("aff_affiliates")
    .select("referral_code, status, email")
    .eq("tenant_id", config.tenantId)
    .eq("referral_code", ref)
    .maybeSingle<{ referral_code: string; status: string; email: string }>();

  if (!data || data.status !== "active") {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    code: data.referral_code,
    name: maskName(data.email),
  });
}

function maskName(email: string): string {
  const local = email.split("@")[0] || "alguien";
  if (local.length <= 3) return local;
  return `${local.slice(0, 2)}***`;
}
