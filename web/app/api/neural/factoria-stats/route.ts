// API: stats agregadas para la página pública /factoria.
// Devuelve métricas del cerebro PACAME en formato compacto para hero/metricas.
// Cacheado 60s para no martillear Supabase desde tráfico orgánico.

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  const supabase = createServerSupabase();

  const [
    nodesRes,
    edgesRes,
    skillsRes,
    subspecRes,
    memoriesRes,
    discoveriesRes,
    synapsesRes,
  ] = await Promise.all([
    supabase.from("knowledge_nodes").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_edges").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_nodes").select("*", { count: "exact", head: true }).eq("node_type", "skill"),
    supabase.from("knowledge_nodes").select("*", { count: "exact", head: true }).contains("tags", ["type/subspecialist"]),
    supabase.from("agent_memories").select("*", { count: "exact", head: true }),
    supabase.from("agent_discoveries").select("*", { count: "exact", head: true }).neq("status", "dismissed"),
    supabase.from("agent_synapses").select("*", { count: "exact", head: true }),
  ]);

  const nodes = nodesRes.count ?? 0;
  const edges = edgesRes.count ?? 0;
  const skills = skillsRes.count ?? 0;
  const subspecialists = subspecRes.count ?? 0;
  const memories = memoriesRes.count ?? 0;
  const discoveries = discoveriesRes.count ?? 0;
  const synapses = synapsesRes.count ?? 0;

  const { data: lastDiscoveries } = await supabase
    .from("agent_discoveries")
    .select("title, type, created_at")
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(3);

  return NextResponse.json({
    nodes,
    edges,
    skills,
    subspecialists,
    memories,
    discoveries,
    synapses,
    agents: 10,
    apis: 8,
    lastDiscoveries: lastDiscoveries ?? [],
    timestamp: new Date().toISOString(),
  });
}
