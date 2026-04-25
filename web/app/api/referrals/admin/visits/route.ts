import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Admin: listado paginado de visits.
 *
 *   GET /api/referrals/admin/visits?page=1&size=50&affiliate_id=&ip=&from=&to=
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const sp = request.nextUrl.searchParams;
  const page = Math.max(Number(sp.get("page") || 1), 1);
  const size = Math.min(Math.max(Number(sp.get("size") || 50), 1), 200);
  const affiliateId = sp.get("affiliate_id");
  const ip = sp.get("ip");
  const from = sp.get("from");
  const to = sp.get("to");

  let q = supabase
    .from("aff_visits")
    .select(
      "id, created_at, affiliate_id, visitor_uuid, ip, user_agent, http_referer, utm_source, utm_medium, utm_campaign, landed_path",
      { count: "exact" },
    )
    .eq("tenant_id", config.tenantId)
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);

  if (affiliateId) q = q.eq("affiliate_id", affiliateId);
  if (ip) q = q.eq("ip", ip);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data: visits, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with affiliate code/email
  const ids = Array.from(new Set((visits ?? []).map((v) => v.affiliate_id)));
  const { data: affiliates } = ids.length
    ? await supabase
        .from("aff_affiliates")
        .select("id, email, referral_code")
        .in("id", ids)
    : { data: [] };
  const map = new Map((affiliates ?? []).map((a) => [a.id, a] as const));

  // Cross-reference: did this visitor convert?
  const visitorUuids = Array.from(new Set((visits ?? []).map((v) => v.visitor_uuid)));
  const { data: conversions } = visitorUuids.length
    ? await supabase
        .from("aff_referrals")
        .select("visit_id, status")
        .in(
          "visit_id",
          (visits ?? []).map((v) => v.id),
        )
    : { data: [] };
  const convertedVisitIds = new Set(
    (conversions ?? [])
      .filter((c) => c.status === "converted")
      .map((c) => c.visit_id),
  );

  return NextResponse.json({
    page,
    size,
    total: count ?? 0,
    visits: (visits ?? []).map((v) => {
      const a = map.get(v.affiliate_id);
      return {
        id: v.id,
        created_at: v.created_at,
        affiliate_id: v.affiliate_id,
        affiliate_email: a?.email ?? null,
        affiliate_code: a?.referral_code ?? null,
        visitor_uuid: v.visitor_uuid,
        ip: v.ip,
        user_agent: v.user_agent,
        http_referer: v.http_referer,
        utm_source: v.utm_source,
        utm_medium: v.utm_medium,
        utm_campaign: v.utm_campaign,
        landed_path: v.landed_path,
        converted: convertedVisitIds.has(v.id),
      };
    }),
  });
}
