/**
 * GET /api/neural/tools/lookup?intent=...&kind=...&agent=...
 *
 * Tool registry consultable para agentes PACAME.
 * Antes de actuar, el agente consulta si ya existe una tool que cubre su intent.
 * Si no hay match (cosine ≥0.85), debe registrar gap via /api/neural/tool-gap.
 *
 * Devuelve top-3 matches con status drafted | probation | promoted.
 */

import { NextRequest, NextResponse } from "next/server";
import { findSimilarGaps, type ToolKind } from "@/lib/neural";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

function normalizeKind(k: string | null): ToolKind | undefined {
  if (k === "endpoint" || k === "skill" || k === "script" || k === "subagent") return k;
  return undefined;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const kind = normalizeKind(url.searchParams.get("kind"));
  const agent = url.searchParams.get("agent");

  if (!intent || intent.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "intent requerido (≥5 chars)" },
      { status: 400 }
    );
  }

  const matches = await findSimilarGaps(intent, {
    matchCount: 3,
    minSimilarity: 0.5,
    kind,
  });

  // Solo devolver tools usables (no pending/draft_failed/rejected/disabled/corrupted)
  const usableStatuses = new Set(["drafted", "probation", "promoted"]);
  const usable = matches.filter((m) => usableStatuses.has(m.status));

  return NextResponse.json({
    ok: true,
    intent,
    kind: kind ?? null,
    agent: agent ?? null,
    matches: usable.map((m) => ({
      gap_id: m.gap_id,
      tool_name: m.tool_name,
      tool_kind: m.tool_kind,
      status: m.status,
      similarity: Number(m.similarity.toFixed(3)),
      draft_path: m.draft_path,
      invoke_url:
        m.tool_kind === "endpoint" && m.tool_name
          ? `/api/neural/invoke-tool/${m.tool_name}`
          : null,
    })),
    recommendation:
      usable.length === 0
        ? "no-match: registra gap via POST /api/neural/tool-gap"
        : usable[0].similarity >= 0.85
        ? "high-confidence: usa el primer match directamente"
        : "low-confidence: revisa o registra gap",
  });
}
