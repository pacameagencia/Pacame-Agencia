// Mantenimiento semanal de la red neural:
// 1. Backfill: promueve memorias episodicas viejas + importantes a semanticas
// 2. Poda: elimina sinapsis debiles sin actividad (weight<0.3, fires=0, >30d)
// 3. Decay suave: -0.005 a sinapsis inactivas >14 dias
//
// Disparado por vercel cron (lunes 06:00) y manualmente desde dashboard.

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { recordDiscovery } from "@/lib/neural";

export const maxDuration = 60;

const supabase = createServerSupabase();

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;
  return runMaintenance();
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;
  return runMaintenance();
}

async function runMaintenance() {
  const started = Date.now();
  const results: Record<string, unknown> = {};

  // 1. Backfill episodicas -> semanticas
  try {
    const { data: promoted, error: e1 } = await supabase.rpc("backfill_episodic_to_semantic");
    results.memories_promoted = e1 ? { error: e1.message } : (promoted ?? 0);
  } catch (e) {
    results.memories_promoted = { error: String(e) };
  }

  // 2. Podar sinapsis debiles + decay suave
  try {
    const { data: pruned, error: e2 } = await supabase.rpc("prune_weak_synapses");
    results.synapses_pruned = e2 ? { error: e2.message } : (pruned ?? 0);
  } catch (e) {
    results.synapses_pruned = { error: String(e) };
  }

  // 3. Snapshot post-mantenimiento
  const { count: totalSynapses } = await supabase
    .from("agent_synapses")
    .select("id", { count: "exact", head: true });
  const { count: semanticMemories } = await supabase
    .from("agent_memories")
    .select("id", { count: "exact", head: true })
    .eq("memory_type", "semantic");

  results.snapshot = {
    total_synapses: totalSynapses ?? 0,
    semantic_memories: semanticMemories ?? 0,
    duration_ms: Date.now() - started,
  };

  // Log + discovery (no bloqueante)
  const promoted = typeof results.memories_promoted === "number" ? results.memories_promoted : 0;
  const pruned = typeof results.synapses_pruned === "number" ? results.synapses_pruned : 0;

  logAgentActivity({
    agentId: "core",
    type: "update",
    title: "Mantenimiento neural semanal",
    description: `${promoted} memorias promovidas a semantica, ${pruned} sinapsis debiles podadas.`,
    metadata: { ...(results as Record<string, unknown>), source: "cron" },
  });

  if (promoted > 0 || pruned > 0) {
    recordDiscovery({
      agentId: "core",
      type: "optimization",
      title: `Mantenimiento: +${promoted} memorias semanticas, -${pruned} sinapsis`,
      description: `La red se consolida: conocimiento episodico cristaliza y las conexiones inactivas se podan.`,
      impact: "medium",
      confidence: 0.95,
    });
  }

  return NextResponse.json({ ok: true, ...results });
}
