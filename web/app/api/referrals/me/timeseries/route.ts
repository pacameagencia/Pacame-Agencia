import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";
import { getAuthedUser } from "@/lib/modules/referrals/session";

/**
 * Per-affiliate timeseries (clicks + conversions) for the last N days.
 *
 *   GET /api/referrals/me/timeseries?days=30
 */
export async function GET(request: NextRequest) {
  const authed = await getAuthedUser(request);
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days") || 30), 1), 180);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const baseQ = supabase.from("aff_affiliates").select("id").eq("tenant_id", config.tenantId);
  const { data: affiliate } = authed.affiliateOnly
    ? await baseQ.eq("id", authed.id).maybeSingle<{ id: string }>()
    : await baseQ.eq("user_id", authed.id).maybeSingle<{ id: string }>();
  if (!affiliate) return NextResponse.json({ error: "not_enrolled" }, { status: 404 });

  const [{ data: visits }, { data: refs }] = await Promise.all([
    supabase
      .from("aff_visits")
      .select("created_at")
      .eq("tenant_id", config.tenantId)
      .eq("affiliate_id", affiliate.id)
      .gte("created_at", since),
    supabase
      .from("aff_referrals")
      .select("created_at,status")
      .eq("tenant_id", config.tenantId)
      .eq("affiliate_id", affiliate.id)
      .gte("created_at", since),
  ]);

  const ts = new Map<string, { clicks: number; conversions: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    ts.set(d, { clicks: 0, conversions: 0 });
  }
  for (const v of visits ?? []) {
    const k = v.created_at.slice(0, 10);
    if (ts.has(k)) ts.get(k)!.clicks += 1;
  }
  for (const r of refs ?? []) {
    if (r.status !== "converted") continue;
    const k = r.created_at.slice(0, 10);
    if (ts.has(k)) ts.get(k)!.conversions += 1;
  }

  return NextResponse.json({
    days,
    timeseries: Array.from(ts.entries()).map(([date, v]) => ({ date, ...v })),
  });
}
