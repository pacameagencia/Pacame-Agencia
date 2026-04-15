// Neural Network — helpers server-side para la red neuronal de agentes PACAME.
// Sinapsis con aprendizaje hebbiano, memoria, estimulos, cadenas de pensamiento
// y descubrimientos. Todos los helpers son no-bloqueantes: si fallan, el flujo
// principal no se rompe.

import { createServerSupabase } from "./supabase/server";

// ============================================================================
// TIPOS
// ============================================================================

export type AgentId =
  | "dios" | "sage" | "atlas" | "nexus" | "pixel"
  | "core" | "pulse" | "nova"  | "copy"  | "lens";

export type SynapseType =
  | "collaborates_with" | "reports_to"  | "delegates_to" | "consults"
  | "reviews"           | "orchestrates" | "learns_from"  | "supervises";

export type MemoryType =
  | "episodic" | "semantic" | "procedural" | "emotional" | "working";

export type StimulusSource =
  | "webhook" | "cron" | "user" | "agent" | "sensor" | "system" | "external_api";

export type DiscoveryType =
  | "trend" | "service_idea" | "technique" | "competitor_insight"
  | "optimization" | "market_signal" | "content_idea" | "pattern" | "anomaly";

export type Impact = "low" | "medium" | "high" | "critical";

// ============================================================================
// SINAPSIS — aprendizaje hebbiano
// ============================================================================

/**
 * Dispara una sinapsis: incrementa peso si success=true, lo reduce si no.
 * Clamping automatico en [0, 1]. Crea la sinapsis si no existe (weight=0.55).
 * Devuelve el nuevo peso o null si fallo.
 */
export async function fireSynapse(
  from: AgentId | string,
  to: AgentId | string,
  type: SynapseType = "collaborates_with",
  success = true
): Promise<number | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.rpc("fire_synapse", {
      p_from: from,
      p_to: to,
      p_type: type,
      p_success: success,
    });
    if (error) return null;
    return typeof data === "number" ? data : null;
  } catch {
    return null;
  }
}

/**
 * Dispara varias sinapsis en paralelo. Util en handoffs multi-agente.
 */
export async function fireSynapses(
  edges: Array<{ from: string; to: string; type?: SynapseType; success?: boolean }>
): Promise<void> {
  await Promise.allSettled(
    edges.map((e) => fireSynapse(e.from, e.to, e.type ?? "collaborates_with", e.success ?? true))
  );
}

// ============================================================================
// ESTIMULOS — inputs que activan neuronas
// ============================================================================

export interface RecordStimulusParams {
  targetAgent?: AgentId | string | null;
  source: StimulusSource;
  sourceId?: string;
  channel?: string;
  signal: string;
  payload?: Record<string, unknown>;
  intensity?: number;
}

export async function recordStimulus(p: RecordStimulusParams): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("agent_stimuli")
      .insert({
        target_agent: p.targetAgent ?? null,
        source: p.source,
        source_id: p.sourceId ?? null,
        channel: p.channel ?? null,
        signal: p.signal,
        payload: p.payload ?? {},
        intensity: p.intensity ?? 0.5,
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

export async function markStimulusProcessed(
  stimulusId: string,
  responseActivityId?: string | null
): Promise<void> {
  try {
    const supabase = createServerSupabase();
    await supabase
      .from("agent_stimuli")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        response_activity_id: responseActivityId ?? null,
      })
      .eq("id", stimulusId);
  } catch {
    /* no-op */
  }
}

// ============================================================================
// CADENAS DE PENSAMIENTO — razonamientos multi-paso, multi-agente
// ============================================================================

export interface StartThoughtChainParams {
  initiatingAgent: AgentId | string;
  goal: string;
  participatingAgents?: string[];
  triggerStimulusId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function startThoughtChain(p: StartThoughtChainParams): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("thought_chains")
      .insert({
        initiating_agent: p.initiatingAgent,
        goal: p.goal,
        participating_agents: p.participatingAgents ?? [p.initiatingAgent],
        trigger_stimulus_id: p.triggerStimulusId ?? null,
        metadata: p.metadata ?? {},
        status: "active",
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

export async function endThoughtChain(
  chainId: string,
  outcome: string,
  qualityScore?: number,
  status: "completed" | "abandoned" = "completed"
): Promise<void> {
  try {
    const supabase = createServerSupabase();
    await supabase
      .from("thought_chains")
      .update({
        status,
        outcome,
        quality_score: qualityScore ?? null,
        ended_at: new Date().toISOString(),
      })
      .eq("id", chainId);
  } catch {
    /* no-op */
  }
}

export async function addChainStep(chainId: string): Promise<void> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("thought_chains")
      .select("step_count,participating_agents")
      .eq("id", chainId)
      .single();
    if (data) {
      await supabase
        .from("thought_chains")
        .update({ step_count: (data.step_count ?? 0) + 1 })
        .eq("id", chainId);
    }
  } catch {
    /* no-op */
  }
}

// ============================================================================
// MEMORIA
// ============================================================================

export interface RememberParams {
  agentId: AgentId | string;
  type?: MemoryType;
  title: string;
  content: string;
  importance?: number;
  decayRate?: number;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  embedding?: Record<string, unknown> | number[];
  metadata?: Record<string, unknown>;
}

export async function rememberMemory(p: RememberParams): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("agent_memories")
      .insert({
        agent_id: p.agentId,
        memory_type: p.type ?? "episodic",
        title: p.title,
        content: p.content,
        importance: p.importance ?? 0.5,
        decay_rate: p.decayRate ?? 0.05,
        tags: p.tags ?? [],
        related_entity_type: p.relatedEntityType ?? null,
        related_entity_id: p.relatedEntityId ?? null,
        embedding: p.embedding ?? null,
        metadata: p.metadata ?? {},
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

export async function recallMemories(
  agentId: AgentId | string,
  opts: { limit?: number; minImportance?: number; tags?: string[] } = {}
): Promise<Array<Record<string, unknown>>> {
  try {
    const supabase = createServerSupabase();
    let q = supabase
      .from("agent_memories")
      .select("*")
      .eq("agent_id", agentId)
      .gte("importance", opts.minImportance ?? 0)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 10);

    if (opts.tags && opts.tags.length) {
      q = q.contains("tags", opts.tags);
    }

    const { data } = await q;

    // Touch last_accessed_at (incremento de accessed_count via RPC en futuro)
    if (data && data.length) {
      const ids = data.map((m) => m.id as string);
      void supabase
        .from("agent_memories")
        .update({ last_accessed_at: new Date().toISOString() })
        .in("id", ids);
    }
    return (data ?? []) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

// ============================================================================
// DESCUBRIMIENTOS — insights consolidados
// ============================================================================

export interface RecordDiscoveryParams {
  agentId: AgentId | string;
  type: DiscoveryType;
  title: string;
  description: string;
  evidence?: string;
  impact?: Impact;
  confidence?: number;
  actionable?: boolean;
  suggestedAction?: string;
  thoughtChainId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordDiscovery(p: RecordDiscoveryParams): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("agent_discoveries")
      .insert({
        agent_id: p.agentId,
        type: p.type,
        title: p.title,
        description: p.description,
        evidence: p.evidence ?? null,
        impact: p.impact ?? "medium",
        confidence: p.confidence ?? 0.7,
        actionable: p.actionable ?? true,
        suggested_action: p.suggestedAction ?? null,
        thought_chain_id: p.thoughtChainId ?? null,
        metadata: p.metadata ?? {},
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

// ============================================================================
// GRAFO DE CONOCIMIENTO
// ============================================================================

export interface KnowledgeNodeParams {
  nodeType:
    | "concept" | "entity" | "fact" | "hypothesis"
    | "question" | "skill" | "tool" | "playbook";
  label: string;
  content?: string;
  confidence?: number;
  ownerAgent?: AgentId | string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function addKnowledgeNode(p: KnowledgeNodeParams): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("knowledge_nodes")
      .insert({
        node_type: p.nodeType,
        label: p.label,
        content: p.content ?? "",
        confidence: p.confidence ?? 0.7,
        owner_agent: p.ownerAgent ?? null,
        tags: p.tags ?? [],
        metadata: p.metadata ?? {},
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

export async function linkKnowledge(
  fromNodeId: string,
  toNodeId: string,
  relation: string,
  strength = 0.5
): Promise<void> {
  try {
    const supabase = createServerSupabase();
    await supabase.from("knowledge_edges").insert({
      from_node: fromNodeId,
      to_node: toNodeId,
      relation,
      strength,
    });
  } catch {
    /* no-op */
  }
}

// ============================================================================
// TOPOLOGIA — lectura del estado de la red
// ============================================================================

export async function getNeuralTopology() {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.from("neural_topology").select("*");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getAgentConnections(agentId: AgentId | string) {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("agent_synapses")
      .select("*")
      .or(`from_agent.eq.${agentId},to_agent.eq.${agentId}`)
      .order("weight", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

// ============================================================================
// DECAIMIENTO — ejecutado por cron
// ============================================================================

export async function decayMemories(): Promise<number> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.rpc("decay_memories");
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}
