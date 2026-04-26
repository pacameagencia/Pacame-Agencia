import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import {
  hashPassword,
  isStrongEnough,
  readAffiliateSessionFromRequest,
  verifyPassword,
} from "@/lib/modules/referrals/affiliate-auth";

export async function POST(request: NextRequest) {
  const session = readAffiliateSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { current?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const current = String(body.current || "");
  const next = String(body.next || "");
  if (!isStrongEnough(next)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: aff } = await supabase
    .from("aff_affiliates")
    .select("password_hash")
    .eq("tenant_id", config.tenantId)
    .eq("id", session.affiliate_id)
    .maybeSingle<{ password_hash: string }>();
  if (!aff?.password_hash) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ok = await verifyPassword(current, aff.password_hash);
  if (!ok) return NextResponse.json({ error: "wrong_current_password" }, { status: 401 });

  await supabase
    .from("aff_affiliates")
    .update({ password_hash: await hashPassword(next) })
    .eq("id", session.affiliate_id);

  return NextResponse.json({ ok: true });
}
