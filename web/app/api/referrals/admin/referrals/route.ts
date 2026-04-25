import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Admin: listado paginado de referrals con producto + afiliado + comisiones.
 *
 *   GET /api/referrals/admin/referrals?page=1&size=50&status=&product=&affiliate_id=&from=&to=
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const sp = request.nextUrl.searchParams;
  const page = Math.max(Number(sp.get("page") || 1), 1);
  const size = Math.min(Math.max(Number(sp.get("size") || 50), 1), 200);

  let q = supabase
    .from("aff_referrals")
    .select(
      "id, created_at, converted_at, status, affiliate_id, referred_user_id, stripe_subscription_id, metadata",
      { count: "exact" },
    )
    .eq("tenant_id", config.tenantId)
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);

  const status = sp.get("status");
  const affiliateId = sp.get("affiliate_id");
  const from = sp.get("from");
  const to = sp.get("to");

  if (status) q = q.eq("status", status);
  if (affiliateId) q = q.eq("affiliate_id", affiliateId);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data: referrals, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter by product (jsonb client-side, sufficient for typical volumes)
  const product = sp.get("product");
  const filtered = product
    ? (referrals ?? []).filter(
        (r) => (r.metadata as Record<string, unknown> | null)?.product === product,
      )
    : referrals ?? [];

  // Enrich
  const ids = Array.from(new Set(filtered.map((r) => r.affiliate_id)));
  const { data: affiliates } = ids.length
    ? await supabase
        .from("aff_affiliates")
        .select("id, email, referral_code")
        .in("id", ids)
    : { data: [] };
  const affMap = new Map((affiliates ?? []).map((a) => [a.id, a] as const));

  const referralIds = filtered.map((r) => r.id);
  const { data: comms } = referralIds.length
    ? await supabase
        .from("aff_commissions")
        .select("referral_id, amount_cents, status")
        .in("referral_id", referralIds)
    : { data: [] };
  const commsByReferral = new Map<
    string,
    { count: number; total_cents: number; latest_status: string | null }
  >();
  for (const c of comms ?? []) {
    const prev = commsByReferral.get(c.referral_id) ?? {
      count: 0,
      total_cents: 0,
      latest_status: null,
    };
    commsByReferral.set(c.referral_id, {
      count: prev.count + 1,
      total_cents: prev.total_cents + c.amount_cents,
      latest_status: c.status,
    });
  }

  return NextResponse.json({
    page,
    size,
    total: count ?? 0,
    referrals: filtered.map((r) => {
      const md = (r.metadata as Record<string, unknown> | null) || {};
      const a = affMap.get(r.affiliate_id);
      const c = commsByReferral.get(r.id) ?? { count: 0, total_cents: 0, latest_status: null };
      return {
        id: r.id,
        created_at: r.created_at,
        converted_at: r.converted_at,
        status: r.status,
        affiliate_id: r.affiliate_id,
        affiliate_email: a?.email ?? null,
        affiliate_code: a?.referral_code ?? null,
        referred_user_id: r.referred_user_id,
        stripe_subscription_id: r.stripe_subscription_id,
        product: (md.product as string) || null,
        amount_eur: Number(md.amount_eur || 0),
        commissions_count: c.count,
        commissions_total_cents: c.total_cents,
        latest_commission_status: c.latest_status,
      };
    }),
  });
}
