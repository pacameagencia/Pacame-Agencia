import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Admin: KPIs globales del programa de afiliados.
 *
 *   GET /api/referrals/admin/overview?days=30
 *
 * Devuelve:
 *  - totals: { clicks, conversions, mrr_eur, pending_cents, approved_cents, paid_cents, voided_cents }
 *  - timeseries: { date, clicks, conversions }[]   (últimos N días)
 *  - top_affiliates: top 10 por earnings
 *  - top_products: top 10 productos vendidos vía afiliados
 *  - recent_conversions: últimas 10 conversiones con producto + afiliado + monto
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days") || 30), 1), 365);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [
    visitsCount,
    conversionsCount,
    commissionsAll,
    visitsRows,
    conversionsRows,
    affiliatesRows,
    recentConversions,
  ] = await Promise.all([
    supabase
      .from("aff_visits")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", config.tenantId),
    supabase
      .from("aff_referrals")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", config.tenantId)
      .eq("status", "converted"),
    supabase
      .from("aff_commissions")
      .select("amount_cents,status,affiliate_id,metadata")
      .eq("tenant_id", config.tenantId),
    supabase
      .from("aff_visits")
      .select("created_at")
      .eq("tenant_id", config.tenantId)
      .gte("created_at", since),
    supabase
      .from("aff_referrals")
      .select("created_at,metadata")
      .eq("tenant_id", config.tenantId)
      .eq("status", "converted")
      .gte("created_at", since),
    supabase
      .from("aff_affiliates")
      .select("id, email, referral_code, status")
      .eq("tenant_id", config.tenantId),
    supabase
      .from("aff_referrals")
      .select("id, affiliate_id, created_at, metadata")
      .eq("tenant_id", config.tenantId)
      .eq("status", "converted")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Totals
  const buckets = { pending: 0, approved: 0, paid: 0, voided: 0 };
  const earningsByAffiliate = new Map<string, number>();
  const productCounts = new Map<string, { count: number; total_cents: number }>();

  for (const c of commissionsAll.data ?? []) {
    if (c.status in buckets) buckets[c.status as keyof typeof buckets] += c.amount_cents;
    if (c.status === "approved" || c.status === "paid") {
      earningsByAffiliate.set(
        c.affiliate_id,
        (earningsByAffiliate.get(c.affiliate_id) ?? 0) + c.amount_cents,
      );
    }
  }

  // Top products from referrals.metadata.product
  for (const r of recentConversions.data ?? []) {
    const product = (r.metadata as Record<string, unknown> | null)?.product as string | undefined;
    if (!product) continue;
    const prev = productCounts.get(product) ?? { count: 0, total_cents: 0 };
    productCounts.set(product, { count: prev.count + 1, total_cents: prev.total_cents });
  }

  // Full product breakdown from all converted referrals
  const { data: allConverted } = await supabase
    .from("aff_referrals")
    .select("metadata")
    .eq("tenant_id", config.tenantId)
    .eq("status", "converted");

  productCounts.clear();
  for (const r of allConverted ?? []) {
    const md = (r.metadata as Record<string, unknown> | null) || {};
    const product = (md.product as string) || "(sin producto)";
    const amount = Number(md.amount_eur || 0);
    const prev = productCounts.get(product) ?? { count: 0, total_cents: 0 };
    productCounts.set(product, {
      count: prev.count + 1,
      total_cents: prev.total_cents + Math.round(amount * 100),
    });
  }

  // Timeseries — bucket per day
  const dayKey = (iso: string) => iso.slice(0, 10);
  const ts = new Map<string, { clicks: number; conversions: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    ts.set(d, { clicks: 0, conversions: 0 });
  }
  for (const v of visitsRows.data ?? []) {
    const k = dayKey(v.created_at);
    if (ts.has(k)) ts.get(k)!.clicks += 1;
  }
  for (const r of conversionsRows.data ?? []) {
    const k = dayKey(r.created_at);
    if (ts.has(k)) ts.get(k)!.conversions += 1;
  }

  // Top affiliates
  const affiliateMap = new Map(
    (affiliatesRows.data ?? []).map((a) => [a.id, a] as const),
  );
  const topAffiliates = Array.from(earningsByAffiliate.entries())
    .map(([id, cents]) => {
      const a = affiliateMap.get(id);
      return {
        id,
        email: a?.email ?? null,
        code: a?.referral_code ?? null,
        status: a?.status ?? null,
        earnings_cents: cents,
      };
    })
    .sort((a, b) => b.earnings_cents - a.earnings_cents)
    .slice(0, 10);

  const topProducts = Array.from(productCounts.entries())
    .map(([product, v]) => ({ product, count: v.count, total_cents: v.total_cents }))
    .sort((a, b) => b.total_cents - a.total_cents)
    .slice(0, 10);

  const recent = (recentConversions.data ?? []).map((r) => {
    const md = (r.metadata as Record<string, unknown> | null) || {};
    const a = affiliateMap.get(r.affiliate_id);
    return {
      id: r.id,
      created_at: r.created_at,
      affiliate_email: a?.email ?? null,
      affiliate_code: a?.referral_code ?? null,
      product: (md.product as string) || null,
      amount_eur: Number(md.amount_eur || 0),
    };
  });

  // Approximate MRR generated = sum of recurring active subscriptions
  // Simple: approved+paid commissions converted back to gross sale
  const grossEur = (buckets.approved + buckets.paid) / (config.commissionPercent / 100) / 100;

  return NextResponse.json({
    tenant_id: config.tenantId,
    days,
    totals: {
      clicks: visitsCount.count ?? 0,
      conversions: conversionsCount.count ?? 0,
      gross_revenue_eur: Math.round(grossEur),
      pending_cents: buckets.pending,
      approved_cents: buckets.approved,
      paid_cents: buckets.paid,
      voided_cents: buckets.voided,
      total_affiliates: affiliatesRows.data?.length ?? 0,
    },
    timeseries: Array.from(ts.entries()).map(([date, v]) => ({ date, ...v })),
    top_affiliates: topAffiliates,
    top_products: topProducts,
    recent_conversions: recent,
  });
}
