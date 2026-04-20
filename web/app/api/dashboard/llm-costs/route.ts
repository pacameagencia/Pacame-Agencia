import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/llm-costs
 *
 * Devuelve snapshot para /dashboard/llm-costs:
 *  - today_by_tier: v_llm_today_by_tier
 *  - daily_spend_30d: v_llm_daily_spend (30d)
 *  - top_call_sites: agregado ultimos 7d por call_site
 *  - recent_calls: ultimas 50 calls
 *  - budgets: caps por tier + spent hoy + usage_pct
 */

const USD_TO_EUR = Number(process.env.LLM_USD_TO_EUR) || 0.92;

const DEFAULT_BUDGETS_EUR: Record<string, number> = {
  reasoning: 15,
  titan: 20,
  premium: 30,
  standard: 10,
  economy: 3,
};

function budgetCapEur(tier: string): number {
  const envKey = `LLM_BUDGET_${tier.toUpperCase()}_EUR_DAILY`;
  const v = Number(process.env[envKey]);
  if (Number.isFinite(v) && v >= 0) return v;
  return DEFAULT_BUDGETS_EUR[tier] || 0;
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const log = getLogger();

  try {
    const [todayByTier, daily30d, topCallSites, recentCalls] = await Promise.all([
      supabase.from("v_llm_today_by_tier").select("*"),
      supabase.from("v_llm_daily_spend").select("*").limit(200),
      supabase
        .from("llm_calls")
        .select("call_site, tier, cost_usd, tokens_in, tokens_out, success, fallback_used")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
        ),
      supabase
        .from("llm_calls")
        .select(
          "id, call_site, tier, strategy, provider, model, tokens_in, tokens_out, tokens_thinking, cost_usd, latency_ms, fallback_used, success, error_message, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Agregar top call sites
    type RowMin = {
      call_site: string;
      tier: string;
      cost_usd: number | null;
      tokens_in: number;
      tokens_out: number;
      success: boolean;
      fallback_used: boolean;
    };
    const bySite = new Map<
      string,
      {
        call_site: string;
        tier: string;
        calls: number;
        cost_usd: number;
        tokens: number;
        errors: number;
        fallbacks: number;
      }
    >();
    for (const r of (topCallSites.data || []) as RowMin[]) {
      const key = r.call_site;
      const existing = bySite.get(key);
      if (!existing) {
        bySite.set(key, {
          call_site: key,
          tier: r.tier,
          calls: 1,
          cost_usd: Number(r.cost_usd) || 0,
          tokens: (r.tokens_in || 0) + (r.tokens_out || 0),
          errors: r.success ? 0 : 1,
          fallbacks: r.fallback_used ? 1 : 0,
        });
      } else {
        existing.calls += 1;
        existing.cost_usd += Number(r.cost_usd) || 0;
        existing.tokens += (r.tokens_in || 0) + (r.tokens_out || 0);
        if (!r.success) existing.errors += 1;
        if (r.fallback_used) existing.fallbacks += 1;
      }
    }
    const topSites = Array.from(bySite.values())
      .sort((a, b) => b.cost_usd - a.cost_usd)
      .slice(0, 15);

    // Budgets: spent hoy por tier + cap + pct + trend 7d
    const tiers = ["reasoning", "titan", "premium", "standard", "economy"] as const;

    // Agregar daily_spend por tier x dia (collapsing providers)
    type DailyRow = {
      day: string;
      tier: string;
      cost_usd: number | null;
    };
    const byTierDay = new Map<string, Map<string, number>>();
    for (const r of (daily30d.data || []) as DailyRow[]) {
      if (!byTierDay.has(r.tier)) byTierDay.set(r.tier, new Map());
      const dayMap = byTierDay.get(r.tier)!;
      dayMap.set(r.day, (dayMap.get(r.day) || 0) + (Number(r.cost_usd) || 0));
    }
    // Ultimos 7 dias (oldest → newest para sparkline)
    const days7: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      days7.push(d.toISOString().slice(0, 10));
    }

    const budgets = tiers.map((tier) => {
      const row = (todayByTier.data || []).find((r) => r.tier === tier);
      const spentUsd = Number(row?.cost_usd) || 0;
      const spentEur = spentUsd * USD_TO_EUR;
      const capEur = budgetCapEur(tier);
      const trendMap = byTierDay.get(tier) || new Map();
      const trend7d = days7.map((d) => (trendMap.get(d) || 0) * USD_TO_EUR);
      return {
        tier,
        spent_eur: Math.round(spentEur * 100) / 100,
        spent_usd: Math.round(spentUsd * 1000) / 1000,
        cap_eur: capEur,
        usage_pct: capEur > 0 ? Math.min(100, Math.round((spentEur / capEur) * 100)) : null,
        calls: Number(row?.calls) || 0,
        errors: Number(row?.errors) || 0,
        fallbacks: Number(row?.fallbacks) || 0,
        avg_latency_ms: Number(row?.avg_latency_ms) || 0,
        trend_7d_eur: trend7d,
      };
    });

    return NextResponse.json({
      ok: true,
      updated_at: new Date().toISOString(),
      budgets,
      daily_spend_30d: daily30d.data || [],
      top_call_sites: topSites,
      recent_calls: recentCalls.data || [],
    });
  } catch (err) {
    log.error({ err }, "[llm-costs] query fallo");
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
