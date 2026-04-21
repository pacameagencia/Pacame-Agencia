/**
 * GET /api/neural/auto-discovery
 * Cron: escanea el cerebro diariamente y genera discoveries automáticos
 * detectando patrones, gaps, sinapsis emergentes.
 *
 * Lógica:
 * 1. Top 3 sinapsis que más crecieron en las últimas 24h → discovery "emergent collaboration"
 * 2. Agentes con memorias duplicadas semánticamente → discovery "consolidation opportunity"
 * 3. Keywords recurrentes en stimuli nuevos → discovery "market signal"
 *
 * Se activa desde vercel.json cada día a las 4am UTC.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { recordDiscovery } from "@/lib/neural";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

interface Synapse {
  from_agent: string;
  to_agent: string;
  synapse_type: string;
  weight: number;
  fire_count: number;
  last_fired_at: string | null;
}

interface StimuliRow {
  signal: string;
  source: string;
  channel: string | null;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const yesterday = new Date(Date.now() - 86400_000).toISOString();

  const discoveries: string[] = [];

  // 1) Sinapsis emergentes
  const { data: synapsesRaw } = await supabase
    .from("agent_synapses")
    .select("from_agent, to_agent, synapse_type, weight, fire_count, last_fired_at")
    .gte("last_fired_at", yesterday)
    .order("weight", { ascending: false })
    .limit(3);

  const synapses = (synapsesRaw || []) as Synapse[];
  for (const s of synapses) {
    if (s.weight >= 0.65) {
      const id = await recordDiscovery({
        agentId: "dios",
        type: "pattern",
        title: `Sinapsis emergente: ${s.from_agent.toUpperCase()} → ${s.to_agent.toUpperCase()}`,
        description: `La relación ${s.synapse_type} entre ${s.from_agent} y ${s.to_agent} alcanzó weight ${s.weight.toFixed(2)} tras ${s.fire_count} activaciones. Revisar si merece formalizar en workflow o SOP.`,
        impact: "medium",
        confidence: s.weight,
        actionable: true,
        suggestedAction: `Considerar añadir SOP o workflow explícito ${s.from_agent}↔${s.to_agent} ${s.synapse_type}`,
        metadata: { source: "auto-discovery", kind: "synapse_emergent", synapse: s },
      });
      if (id) discoveries.push(id);
    }
  }

  // 2) Señales de mercado en stimuli nuevos
  const { data: stimuliRaw } = await supabase
    .from("agent_stimuli")
    .select("signal, source, channel")
    .gte("received_at", yesterday)
    .limit(100);

  const stimuli = (stimuliRaw || []) as StimuliRow[];
  const keywordFreq: Record<string, number> = {};
  for (const st of stimuli) {
    const words = (st.signal || "")
      .toLowerCase()
      .replace(/[^\w\sáéíóúñ]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 5);
    for (const w of words) keywordFreq[w] = (keywordFreq[w] || 0) + 1;
  }
  const trending = Object.entries(keywordFreq)
    .filter(([, c]) => c >= 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (trending.length > 0) {
    const id = await recordDiscovery({
      agentId: "atlas",
      type: "market_signal",
      title: `Tendencias en últimas 24h: ${trending.map(([w]) => w).join(", ")}`,
      description: `Keywords más frecuentes en inputs: ${trending.map(([w, c]) => `"${w}" (${c}x)`).join(", ")}. Posible señal de demanda creciente.`,
      impact: "medium",
      confidence: 0.6,
      actionable: true,
      suggestedAction: `Considerar contenido/artículo SEO sobre: ${trending.map(([w]) => w).slice(0, 2).join(" y ")}`,
      metadata: { source: "auto-discovery", kind: "market_signal", trending },
    });
    if (id) discoveries.push(id);
  }

  // 3) Gap: agentes sin actividad reciente
  const { data: inactiveAgentsRaw } = await supabase
    .from("neural_topology")
    .select("agent_id, name, last_fired_at")
    .lte("last_fired_at", new Date(Date.now() - 7 * 86400_000).toISOString())
    .limit(5);

  const inactive = (inactiveAgentsRaw || []) as Array<{ agent_id: string; name: string; last_fired_at: string }>;
  for (const a of inactive) {
    const id = await recordDiscovery({
      agentId: "dios",
      type: "anomaly",
      title: `Agente ${a.name} inactivo hace >7 días`,
      description: `${a.name} (${a.agent_id}) no se ha activado desde ${a.last_fired_at}. Riesgo: especialización decayendo. Considerar task piloto para reactivarlo.`,
      impact: "low",
      confidence: 0.7,
      actionable: true,
      suggestedAction: `Lanzar task piloto a ${a.agent_id} para reactivar sinapsis`,
      metadata: { source: "auto-discovery", kind: "inactive_agent", agent_id: a.agent_id },
    });
    if (id) discoveries.push(id);
  }

  return NextResponse.json({
    ok: true,
    discoveries_created: discoveries.length,
    ids: discoveries,
    analyzed: {
      synapses_24h: synapses.length,
      stimuli_24h: stimuli.length,
      trending_keywords: trending,
      inactive_agents: inactive.map(a => a.agent_id),
    },
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
