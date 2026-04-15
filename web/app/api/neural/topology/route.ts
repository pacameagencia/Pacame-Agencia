// API: topologia completa de la red neuronal PACAME.
// Devuelve: nodos (agentes con personalidad/energia/firing), aristas (sinapsis
// con pesos), totales y memorias/descubrimientos recientes.

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerSupabase();

  const [nodesRes, edgesRes, memoriesRes, discoveriesRes, chainsRes, stimuliRes] = await Promise.all([
    supabase
      .from("agent_states")
      .select(
        "agent_id, name, role, specialty, status, energy_level, fire_count, last_fired_at, model_tier, personality, specialization_weights, current_task, tasks_today"
      )
      .order("agent_id"),
    supabase
      .from("agent_synapses")
      .select("from_agent, to_agent, synapse_type, weight, fire_count, success_count, last_fired_at"),
    supabase
      .from("agent_memories")
      .select("id, agent_id, memory_type, title, importance, created_at, tags")
      .order("importance", { ascending: false })
      .limit(20),
    supabase
      .from("agent_discoveries")
      .select("id, agent_id, type, title, impact, confidence, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("thought_chains")
      .select("id, initiating_agent, goal, status, step_count, started_at, ended_at, participating_agents")
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("agent_stimuli")
      .select("id, target_agent, source, signal, intensity, processed, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const nodes = nodesRes.data ?? [];
  const edges = edgesRes.data ?? [];

  return NextResponse.json({
    nodes,
    edges,
    memories: memoriesRes.data ?? [],
    discoveries: discoveriesRes.data ?? [],
    thoughtChains: chainsRes.data ?? [],
    stimuli: stimuliRes.data ?? [],
    stats: {
      neurons: nodes.length,
      synapses: edges.length,
      activeChains: (chainsRes.data ?? []).filter((c) => c.status === "active").length,
      pendingStimuli: (stimuliRes.data ?? []).filter((s) => !s.processed).length,
      avgWeight:
        edges.length > 0
          ? edges.reduce((sum, e) => sum + Number(e.weight ?? 0), 0) / edges.length
          : 0,
      totalFirings: edges.reduce((sum, e) => sum + (e.fire_count ?? 0), 0),
    },
  });
}
