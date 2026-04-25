import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

/**
 * Affiliate-facing: list all active content assets so the affiliate can
 * grab ready-made marketing material for their community.
 *
 *   GET /api/referrals/content?type=
 *
 * Returns only `active=true` rows. Auth-gated to authenticated users.
 */
export async function GET(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const type = request.nextUrl.searchParams.get("type");

  let q = supabase
    .from("aff_content_assets")
    .select(
      "id, type, category, title, description, body, preview_url, download_url, mime_type, bytes, tags, downloads, created_at",
    )
    .eq("tenant_id", config.tenantId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (type) q = q.eq("type", type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assets: data ?? [] });
}
