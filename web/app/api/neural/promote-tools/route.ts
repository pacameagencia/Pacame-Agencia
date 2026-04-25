/**
 * GET /api/neural/promote-tools
 *
 * Cron diario que evalúa drafts y promueve tools maduras.
 * Flujo:
 *   1. Drafts con usage≥5 ∧ success_rate≥0.85 ∧ last_invoked en últimos 14d
 *      → status=probation (probation_started_at=now)
 *   2. Probation con probation_started_at ≥7d atrás y mismos criterios
 *      → status=promoted
 *
 * Subagentes: NUNCA se promueven solos (riesgo prompt injection irreversible).
 * Quedan en drafted hasta que Pablo los apruebe manualmente.
 *
 * Cron: vercel.json "30 9 * * *"
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { promoteToolGap, type ToolGap } from "@/lib/neural";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const FOURTEEN_DAYS_AGO = () => new Date(Date.now() - 14 * 86400_000).toISOString();

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const startedAt = Date.now();
  const supabase = createServerSupabase();

  // Buscar candidatos: drafted + probation, no subagentes, last_invoked dentro 14d
  const { data: candidates, error } = await supabase
    .from("agent_tool_gaps")
    .select("*")
    .in("status", ["drafted", "probation"])
    .neq("tool_kind", "subagent")
    .gte("last_invoked_at", FOURTEEN_DAYS_AGO())
    .gte("usage_count", 5)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "query candidates failed", detail: error.message },
      { status: 500 }
    );
  }

  const results: Array<{
    gap_id: string;
    tool_name: string | null;
    previous_status: string;
    promoted: boolean;
    new_status?: string;
    reason?: string;
  }> = [];

  for (const c of (candidates || []) as ToolGap[]) {
    const r = await promoteToolGap(c.id, {
      minUsage: 5,
      minSuccessRate: 0.85,
      probationDays: 7,
    });
    results.push({
      gap_id: c.id,
      tool_name: c.tool_name,
      previous_status: c.status,
      promoted: r.promoted,
      new_status: r.new_status,
      reason: r.reason,
    });
  }

  // Subagentes que cumplen criterios → notificar (drafted, no se mueven)
  const { data: subagentReady } = await supabase
    .from("agent_tool_gaps")
    .select("id, tool_name, requested_by_agent, usage_count, success_count")
    .eq("status", "drafted")
    .eq("tool_kind", "subagent")
    .gte("usage_count", 5);

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    candidates_checked: results.length,
    results,
    promoted_to_probation: results.filter((r) => r.new_status === "probation").length,
    promoted_to_production: results.filter((r) => r.promoted).length,
    subagent_awaiting_manual_approval: (subagentReady || []).length,
    subagent_pending: subagentReady || [],
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
