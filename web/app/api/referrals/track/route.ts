import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  loadReferralConfig,
  readRefCookieFromRequest,
  resolveAttribution,
  writeRefCookieOnResponse,
} from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

export async function POST(request: NextRequest) {
  let body: { ref?: string; path?: string };
  try {
    body = (await request.json()) as { ref?: string; path?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ref = (body.ref || "").trim();
  if (!ref || ref.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(ref)) {
    return NextResponse.json({ error: "invalid_ref" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const existingCookie = readRefCookieFromRequest(request);
  const authed = await getAuthedUser(request);

  const result = await resolveAttribution({
    supabase,
    config,
    refCode: ref,
    request,
    existingCookie,
    authenticatedUserId: authed?.id ?? null,
    landedPath: body.path,
  });

  if (!result.ok) {
    return NextResponse.json({ tracked: false, reason: result.reason }, { status: 200 });
  }

  const response = NextResponse.json({ tracked: true });
  return writeRefCookieOnResponse(response, result.cookie, config.cookieDays);
}
