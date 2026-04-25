// API: 5 métricas Hormozi de la factoría PACAME para dashboard interno LENS.
// Calcula desde Supabase los 5 KPIs definidos en
// PacameCueva/05-Strategy/factoria-de-soluciones-con-ia.md.

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SeriesPoint {
  date: string;
  value: number;
}

export async function GET() {
  const supabase = createServerSupabase();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ── M1: Densidad neuronal ────────────────────────────────────────────
  // % de knowledge_nodes con embedding (768-dim) sobre el total.
  const [totalNodesRes, embeddedNodesRes] = await Promise.all([
    supabase.from("knowledge_nodes").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_nodes").select("*", { count: "exact", head: true }).not("embedding", "is", null),
  ]);
  const totalNodes = totalNodesRes.count ?? 0;
  const embeddedNodes = embeddedNodesRes.count ?? 0;
  const densityPct = totalNodes > 0 ? (embeddedNodes / totalNodes) * 100 : 0;

  // ── M2: Velocidad de aprendizaje ─────────────────────────────────────
  // Discoveries últimos 7 días × confidence promedio.
  const { data: recentDiscoveries } = await supabase
    .from("agent_discoveries")
    .select("created_at, confidence, impact, status")
    .gte("created_at", sevenDaysAgo.toISOString());

  const weeklyDiscoveries = recentDiscoveries?.length ?? 0;
  const avgConfidence =
    recentDiscoveries && recentDiscoveries.length > 0
      ? recentDiscoveries.reduce((acc, d) => acc + (d.confidence ?? 0.5), 0) / recentDiscoveries.length
      : 0;
  const learningSpeed = weeklyDiscoveries * avgConfidence;

  // Series temporal últimos 7 días.
  const learningSeries: SeriesPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day.setHours(23, 59, 59, 999));
    const count = recentDiscoveries?.filter((d) => {
      const created = new Date(d.created_at);
      return created >= dayStart && created <= dayEnd;
    }).length ?? 0;
    learningSeries.push({
      date: dayStart.toISOString().slice(0, 10),
      value: count,
    });
  }

  // ── M3: Tiempo discovery → producto ──────────────────────────────────
  // Avg días entre created_at y reviewed_at de discoveries con status final.
  const { data: completedDiscoveries } = await supabase
    .from("agent_discoveries")
    .select("created_at, reviewed_at, status")
    .in("status", ["accepted", "implemented", "shipped"])
    .not("reviewed_at", "is", null);

  let avgPackagingDays = 0;
  if (completedDiscoveries && completedDiscoveries.length > 0) {
    const totalDays = completedDiscoveries.reduce((acc, d) => {
      if (!d.reviewed_at) return acc;
      const days = (new Date(d.reviewed_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return acc + days;
    }, 0);
    avgPackagingDays = totalDays / completedDiscoveries.length;
  }

  // ── M4: Reutilización ────────────────────────────────────────────────
  // % de memorias accedidas más de una vez (last_accessed_at posterior a created_at)
  // como proxy de reuse en clientes/sesiones distintas.
  const { count: memoriesTotal } = await supabase
    .from("agent_memories")
    .select("*", { count: "exact", head: true });

  const { data: memoriesData } = await supabase
    .from("agent_memories")
    .select("created_at, last_accessed_at, importance, agent_id");

  let reusedMemories = 0;
  if (memoriesData) {
    reusedMemories = memoriesData.filter((m) => {
      if (!m.last_accessed_at) return false;
      return new Date(m.last_accessed_at).getTime() > new Date(m.created_at).getTime() + 60 * 1000;
    }).length;
  }
  const reusePct = memoriesTotal && memoriesTotal > 0 ? (reusedMemories / memoriesTotal) * 100 : 0;

  // Distribución por agente.
  const reuseByAgent: Record<string, number> = {};
  for (const m of memoriesData ?? []) {
    if (!m.agent_id) continue;
    if (!reuseByAgent[m.agent_id]) reuseByAgent[m.agent_id] = 0;
    if (m.last_accessed_at && new Date(m.last_accessed_at).getTime() > new Date(m.created_at).getTime() + 60 * 1000) {
      reuseByAgent[m.agent_id] += 1;
    }
  }

  // ── M5: Margen marginal ──────────────────────────────────────────────
  // Proxy: ratio entre nuevas memorias creadas vs sinapsis nuevas (peso reforzado)
  // últimos 30 días. Cuanto más alto, más se reutiliza el conocimiento existente
  // en lugar de recrearlo desde cero.
  const [{ count: newSynapses }, { count: newMemories }] = await Promise.all([
    supabase
      .from("agent_synapses")
      .select("*", { count: "exact", head: true })
      .gte("last_fired_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("agent_memories")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const synapseFires = newSynapses ?? 0;
  const newMems = newMemories ?? 0;
  const marginalRatio = newMems > 0 ? synapseFires / newMems : 0;

  // ── Top discoveries por impacto ──────────────────────────────────────
  const { data: topDiscoveries } = await supabase
    .from("agent_discoveries")
    .select("title, type, impact, confidence, status, created_at, agent_id")
    .neq("status", "dismissed")
    .order("impact", { ascending: false })
    .limit(5);

  // ── Sinapsis más reforzadas ──────────────────────────────────────────
  const { data: topSynapses } = await supabase
    .from("agent_synapses")
    .select("from_agent, to_agent, synapse_type, weight, fire_count, success_count")
    .order("weight", { ascending: false })
    .limit(8);

  // ── Health summary ───────────────────────────────────────────────────
  const health = {
    excellent: densityPct >= 95 && weeklyDiscoveries >= 5,
    score: Math.round(
      densityPct * 0.3 +
        Math.min(100, weeklyDiscoveries * 10) * 0.2 +
        Math.min(100, reusePct) * 0.25 +
        Math.min(100, marginalRatio * 50) * 0.25
    ),
  };

  return NextResponse.json({
    timestamp: now.toISOString(),
    health,
    metrics: {
      density: {
        label: "Densidad neuronal",
        value: densityPct,
        unit: "%",
        target: 100,
        detail: { embedded: embeddedNodes, total: totalNodes },
      },
      learning_speed: {
        label: "Velocidad de aprendizaje",
        value: learningSpeed,
        unit: "discoveries × confidence",
        weekly: weeklyDiscoveries,
        avg_confidence: avgConfidence,
        series: learningSeries,
      },
      packaging_time: {
        label: "Tiempo discovery → producto",
        value: avgPackagingDays,
        unit: "días",
        sample: completedDiscoveries?.length ?? 0,
      },
      reuse: {
        label: "Reutilización",
        value: reusePct,
        unit: "%",
        reused: reusedMemories,
        total: memoriesTotal ?? 0,
        by_agent: reuseByAgent,
      },
      marginal: {
        label: "Margen marginal",
        value: marginalRatio,
        unit: "fires/memorias_nuevas",
        synapse_fires_30d: synapseFires,
        new_memories_30d: newMems,
      },
    },
    top_discoveries: topDiscoveries ?? [],
    top_synapses: topSynapses ?? [],
  });
}
