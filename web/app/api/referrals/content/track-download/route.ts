import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

/**
 * Affiliate-facing: increments the `downloads` counter on an asset and
 * returns the download URL. Atomic via the SQL helper
 * `aff_content_increment_counter` (created in 003 migration).
 *
 *   POST /api/referrals/content/track-download
 *   Body: { asset_id }
 */
export async function POST(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { asset_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = (body.asset_id || "").trim();
  if (!id) return NextResponse.json({ error: "asset_id_required" }, { status: 400 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: asset, error } = await supabase
    .from("aff_content_assets")
    .select("id, type, download_url, body, active")
    .eq("tenant_id", config.tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!asset || !asset.active) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Atomic counter via RPC; if RPC missing, fallback to optimistic update.
  const rpc = await supabase.rpc("aff_content_increment_counter", {
    p_id: id,
    p_field: "downloads",
  });
  if (rpc.error) {
    await supabase
      .from("aff_content_assets")
      .update({ downloads: (asset as Record<string, number>).downloads ? undefined : 1 })
      .eq("id", id);
  }

  return NextResponse.json({
    download_url: asset.download_url,
    body: asset.body,
    type: asset.type,
  });
}
