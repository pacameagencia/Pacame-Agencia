// Observabilidad LLM — agrega tokens y coste USD por agente, provider y dia.
// Consumido por /dashboard/observability.

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";

const supabase = createServerSupabase();

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10), 1), 90);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  // 1. Totales del periodo
  const { data: totalsRaw } = await supabase
    .from("agent_llm_usage")
    .select("tokens_in, tokens_out, cost_usd, latency_ms, fallback")
    .gte("created_at", since);
  const rows = totalsRaw || [];
  const totals = {
    calls: rows.length,
    tokens_in: rows.reduce((s, r) => s + (r.tokens_in || 0), 0),
    tokens_out: rows.reduce((s, r) => s + (r.tokens_out || 0), 0),
    cost_usd: +rows.reduce((s, r) => s + Number(r.cost_usd || 0), 0).toFixed(4),
    avg_latency_ms:
      rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.latency_ms || 0), 0) / rows.length) : 0,
    fallbacks: rows.filter((r) => r.fallback).length,
  };

  // 2. Breakdown por agente
  const { data: byAgentRaw } = await supabase
    .from("agent_llm_usage")
    .select("agent_id, cost_usd, tokens_in, tokens_out")
    .gte("created_at", since);
  const byAgent = new Map<string, { agent_id: string; calls: number; tokens_in: number; tokens_out: number; cost_usd: number }>();
  for (const r of byAgentRaw || []) {
    const key = r.agent_id;
    const e = byAgent.get(key) || { agent_id: key, calls: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 };
    e.calls++;
    e.tokens_in += r.tokens_in || 0;
    e.tokens_out += r.tokens_out || 0;
    e.cost_usd += Number(r.cost_usd || 0);
    byAgent.set(key, e);
  }
  const agents = Array.from(byAgent.values())
    .map((a) => ({ ...a, cost_usd: +a.cost_usd.toFixed(4) }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  // 3. Breakdown por provider
  const { data: byProviderRaw } = await supabase
    .from("agent_llm_usage")
    .select("provider, cost_usd, tokens_in, tokens_out")
    .gte("created_at", since);
  const byProvider = new Map<string, { provider: string; calls: number; tokens_in: number; tokens_out: number; cost_usd: number }>();
  for (const r of byProviderRaw || []) {
    const key = r.provider;
    const e = byProvider.get(key) || { provider: key, calls: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 };
    e.calls++;
    e.tokens_in += r.tokens_in || 0;
    e.tokens_out += r.tokens_out || 0;
    e.cost_usd += Number(r.cost_usd || 0);
    byProvider.set(key, e);
  }
  const providers = Array.from(byProvider.values())
    .map((p) => ({ ...p, cost_usd: +p.cost_usd.toFixed(4) }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  // 4. Serie diaria (vista v_llm_usage_daily)
  const { data: daily } = await supabase
    .from("v_llm_usage_daily")
    .select("*")
    .gte("day", since.slice(0, 10))
    .order("day", { ascending: true });

  // 5. Ultimas 20 llamadas
  const { data: recent } = await supabase
    .from("agent_llm_usage")
    .select("agent_id, provider, model, tokens_in, tokens_out, cost_usd, latency_ms, source, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    ok: true,
    period: { days, since },
    totals,
    by_agent: agents,
    by_provider: providers,
    daily: daily || [],
    recent: recent || [],
  });
}
