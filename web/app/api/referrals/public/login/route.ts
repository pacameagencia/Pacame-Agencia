import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { verifyPassword, writeAffiliateCookie } from "@/lib/modules/referrals/affiliate-auth";

/**
 * Public affiliate login.
 *
 *   POST /api/referrals/public/login
 *   Body: { email, password }
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: affiliate } = await supabase
    .from("aff_affiliates")
    .select("id, email, password_hash, status")
    .eq("tenant_id", config.tenantId)
    .ilike("email", email)
    .not("password_hash", "is", null)
    .maybeSingle<{ id: string; email: string; password_hash: string; status: string }>();

  if (!affiliate) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  if (affiliate.status === "disabled") {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }

  const ok = await verifyPassword(password, affiliate.password_hash);
  if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  await supabase
    .from("aff_affiliates")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", affiliate.id);

  const response = NextResponse.json({
    ok: true,
    affiliate: { id: affiliate.id, email: affiliate.email },
    redirect: "/afiliados/panel",
  });
  return writeAffiliateCookie(response, { affiliate_id: affiliate.id, email: affiliate.email });
}
