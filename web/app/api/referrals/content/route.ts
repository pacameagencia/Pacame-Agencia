import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig, getAffiliateById, getAffiliateBrandIds } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

/**
 * Affiliate-facing: assets active del afiliado autenticado, FILTRADOS por
 * su(s) brand(s). Un afiliado de Dark Room solo ve assets de Dark Room.
 *
 *   GET /api/referrals/content?type=
 *
 * Si el afiliado no tiene brand_id (caso legacy), devuelve todos los assets
 * activos del tenant para no romper el panel.
 */
export async function GET(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const type = request.nextUrl.searchParams.get("type");

  // Resolver brand_ids del afiliado (si es affiliateOnly su id ES el aff_affiliates.id)
  let brandIds: string[] = [];
  if (authed.affiliateOnly) {
    const aff = await getAffiliateById(supabase, authed.id);
    if (aff) brandIds = getAffiliateBrandIds(aff);
  } else {
    // PACAME client: buscar afiliado por user_id
    const { data: aff } = await supabase
      .from("aff_affiliates")
      .select("brand_id, extra_brand_ids")
      .eq("tenant_id", config.tenantId)
      .eq("user_id", authed.id)
      .maybeSingle<{ brand_id: string | null; extra_brand_ids: string[] }>();
    if (aff) {
      brandIds = [
        ...(aff.brand_id ? [aff.brand_id] : []),
        ...(aff.extra_brand_ids ?? []),
      ];
    }
  }

  let q = supabase
    .from("aff_content_assets")
    .select(
      "id, type, category, title, description, body, preview_url, download_url, mime_type, bytes, tags, downloads, brand_id, created_at",
    )
    .eq("tenant_id", config.tenantId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  // Filtro por brand: si el afiliado tiene brand_ids, filtrar; si no, devolver todo (compat legacy)
  if (brandIds.length > 0) {
    q = q.in("brand_id", brandIds);
  }
  if (type) q = q.eq("type", type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assets: data ?? [] });
}
