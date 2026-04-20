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
    // Auto-embed: si no viene explicito, genera vector(768) via Ollama VPS.
    // No-bloqueante: si Ollama falla, se guarda sin embedding.
    let embeddingLiteral: string | null = null;
    if (!p.embedding) {
      const text = `${p.title}\n${p.content}`.slice(0, 4000);
      const vec = await embed(text);
      if (vec) embeddingLiteral = `[${vec.join(",")}]`;
    } else if (Array.isArray(p.embedding)) {
      embeddingLiteral = `[${(p.embedding as number[]).join(",")}]`;
    }
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
        embedding: embeddingLiteral,
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
    // Auto-embed: discoveries son la base del aprendizaje. Siempre intentar indexar.
    const text = `${p.title}\n${p.description || ""}\n${p.suggestedAction || ""}`.slice(0, 4000);
    const vec = await embed(text);
    const embeddingLiteral = vec ? `[${vec.join(",")}]` : null;
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
        embedding: embeddingLiteral,
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

// ============================================================================
// REFUERZO DE ESPECIALIZACIÓN — usado por agents/closer tras cierres exitosos
// ============================================================================

export async function reinforceSpecialization(
  agentId: string,
  topic: string,
  score: number | boolean = 1
): Promise<void> {
  try {
    const numericScore = typeof score === "boolean" ? (score ? 1 : 0) : score;
    const supabase = createServerSupabase();
    await supabase.rpc("reinforce_specialization", {
      p_agent_id: agentId,
      p_topic: topic,
      p_score: numericScore,
    });
  } catch {
    // no-op: el refuerzo no debe romper el flujo de cierre
  }
}

// ============================================================================
// EMBEDDINGS + SEMANTIC SEARCH (bloque 1 cerebro con pgvector + Ollama VPS)
// ============================================================================

const OLLAMA_URL = process.env.PACAME_OLLAMA_URL || "http://72.62.185.125:11434";
const OLLAMA_MODEL = process.env.PACAME_EMBED_MODEL || "nomic-embed-text";

/**
 * Genera un embedding 768-dim via Ollama VPS (nomic-embed-text).
 * Devuelve null si el modelo no responde; el flujo principal no se rompe.
 */
export async function embed(text: string): Promise<number[] | null> {
  if (!text || text.trim().length < 3) return null;
  try {
    const r = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text.slice(0, 8000) }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { embedding: number[] };
    return Array.isArray(j.embedding) && j.embedding.length === 768 ? j.embedding : null;
  } catch {
    return null;
  }
}

export interface SemanticHit {
  id: string;
  node_type?: string;
  label?: string;
  title?: string;
  content?: string;
  owner_agent?: string | null;
  agent_id?: string | null;
  importance?: number | null;
  similarity: number;
}

export async function semanticSearchNodes(
  query: string,
  options: { matchCount?: number; type?: string } = {}
): Promise<SemanticHit[]> {
  const vec = await embed(query);
  if (!vec) return [];
  try {
    const supabase = createServerSupabase();
    // Supabase-js convierte el array a pgvector automáticamente si lo pasamos
    // como string literal "[0.1,0.2,...]". El array directo falla con type mismatch.
    const literal = `[${vec.join(",")}]`;
    const { data, error } = await supabase.rpc("semantic_search_nodes", {
      query_embedding: literal,
      match_count: options.matchCount ?? 8,
      filter_type: options.type ?? null,
    });
    if (error) {
      console.warn("[semanticSearchNodes]", error.message);
      return [];
    }
    return (data || []) as SemanticHit[];
  } catch (e) {
    console.warn("[semanticSearchNodes] exception:", (e as Error).message);
    return [];
  }
}

export async function semanticSearchMemories(
  query: string,
  options: { matchCount?: number; agentId?: string } = {}
): Promise<SemanticHit[]> {
  const vec = await embed(query);
  if (!vec) return [];
  try {
    const supabase = createServerSupabase();
    const literal = `[${vec.join(",")}]`;
    const { data, error } = await supabase.rpc("semantic_search_memories", {
      query_embedding: literal,
      match_count: options.matchCount ?? 5,
      filter_agent: options.agentId ?? null,
    });
    if (error) {
      console.warn("[semanticSearchMemories]", error.message);
      return [];
    }
    return (data || []) as SemanticHit[];
  } catch (e) {
    console.warn("[semanticSearchMemories] exception:", (e as Error).message);
    return [];
  }
}

// ============================================================================
// LLM CALLS LOGGER — registra cada llamada Claude/OpenAI/Ollama
// ============================================================================

export interface LlmCallParams {
  callSite: string;
  provider: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  tokensThinking?: number;
  costUsd?: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string | null;
  tier?: string;
  strategy?: string;
  fallbackUsed?: boolean;
  requestId?: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logLlmCall(p: LlmCallParams): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("llm_calls")
      .insert({
        call_site: p.callSite,
        provider: p.provider,
        model: p.model,
        tokens_in: p.tokensIn ?? 0,
        tokens_out: p.tokensOut ?? 0,
        tokens_thinking: p.tokensThinking ?? 0,
        cost_usd: p.costUsd ?? 0,
        latency_ms: p.latencyMs ?? 0,
        success: p.success ?? true,
        error_message: p.errorMessage ?? null,
        tier: p.tier ?? "default",
        strategy: p.strategy ?? "default",
        fallback_used: p.fallbackUsed ?? false,
        request_id: p.requestId ?? null,
        actor_id: p.actorId ?? null,
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
// ROUTER NEURAL — el orquestador (nervio central)
// ============================================================================

export interface RouteResult {
  agent: AgentId | string;
  skill?: { label: string; id: string; similarity: number } | null;
  memories: SemanticHit[];
  discoveries: SemanticHit[];
  context: string;
  stimulus_id?: string | null;
}

const AGENT_HINT_MAP: Record<string, AgentId> = {
  // NOVA — branding e identidad visual
  branding: "nova", identidad: "nova", logo: "nova", visual: "nova",
  banner: "nova", paleta: "nova", tipografia: "nova", "manual-marca": "nova",
  "brand-guidelines": "nova", mockup: "nova", moodboard: "nova",
  // ATLAS — SEO + contenido orgánico
  seo: "atlas", contenido: "atlas", organico: "atlas", blog: "atlas",
  articulo: "atlas", keyword: "atlas", "meta-description": "atlas",
  sitemap: "atlas", "search-console": "atlas", ahrefs: "atlas", semrush: "atlas",
  // NEXUS — ads, embudos, CRO
  ads: "nexus", embudo: "nexus", cro: "nexus", lead: "nexus", funnel: "nexus",
  "landing-page": "nexus", "lead-magnet": "nexus", conversion: "nexus",
  "meta-ads": "nexus", "google-ads": "nexus", "tiktok-ads": "nexus",
  campaña: "nexus", retargeting: "nexus", roas: "nexus",
  // PIXEL — frontend + diseño web
  frontend: "pixel", web: "pixel", design: "pixel", ui: "pixel", next: "pixel",
  landing: "pixel", hero: "pixel", componente: "pixel", formulario: "pixel",
  "tailwind": "pixel", react: "pixel", figma: "pixel", animacion: "pixel",
  portfolio: "pixel", vercel: "pixel",
  // CORE — backend, APIs, infra
  backend: "core", api: "core", infra: "core", supabase: "core", deploy: "core",
  sql: "core", migration: "core", rls: "core", "edge-function": "core",
  webhook: "core", cron: "core", docker: "core", vps: "core", nginx: "core",
  n8n: "core",
  // PULSE — social media
  social: "pulse", instagram: "pulse", tiktok: "pulse", reels: "pulse",
  carrusel: "pulse", post: "pulse", story: "pulse", "video-corto": "pulse",
  "community-management": "pulse", engagement: "pulse", hashtag: "pulse",
  linkedin: "pulse", twitter: "pulse",
  // SAGE — estrategia, pricing, propuestas
  estrategia: "sage", pricing: "sage", consejo: "sage", proposal: "sage",
  propuesta: "sage", presupuesto: "sage", "cliente-nuevo": "sage",
  cotizacion: "sage", roadmap: "sage", okr: "sage", "post-mortem": "sage",
  pivot: "sage",
  // COPY — copywriting
  copy: "copy", texto: "copy", email: "copy", cta: "copy",
  guion: "copy", hook: "copy", titular: "copy", subject: "copy",
  "email-marketing": "copy", newsletter: "copy", "video-script": "copy",
  "sales-page": "copy",
  // LENS — analytics
  analytics: "lens", dashboard: "lens", metrica: "lens", kpi: "lens",
  reporte: "lens", "google-analytics": "lens", ga4: "lens",
  "looker-studio": "lens", "data-studio": "lens", cohort: "lens",
  "churn-rate": "lens", ltv: "lens", cac: "lens",
};

function agentHintFromText(t: string): AgentId | null {
  const low = t.toLowerCase();
  for (const [k, v] of Object.entries(AGENT_HINT_MAP)) {
    if (low.includes(k)) return v;
  }
  return null;
}

/**
 * Orquestador central: dado un input del mundo exterior, decide agente + skill
 * + contexto cerebral. No ejecuta Claude: devuelve el bundle para el caller.
 */
export async function routeInput(params: {
  input: string;
  source?: StimulusSource;
  channel?: string;
  agentHint?: string;
}): Promise<RouteResult> {
  const { input } = params;
  const stimulus_id = await recordStimulus({
    source: params.source ?? "external_api",
    channel: params.channel ?? null,
    signal: input.slice(0, 200),
    payload: { full_input: input.slice(0, 2000) },
    intensity: 0.6,
  });
  const agent = (params.agentHint as AgentId)
    || agentHintFromText(input)
    || "dios";
  // Buscar memorias sin filtrar por agente: el cerebro debe recordar en todo
  // el grafo neural, no solo las del agente elegido. Filtrar por agente
  // fragmenta el conocimiento artificialmente.
  const [skillHits, memories, discoveries] = await Promise.all([
    semanticSearchNodes(input, { matchCount: 3, type: "skill" }),
    semanticSearchMemories(input, { matchCount: 5 }),
    semanticSearchNodes(input, { matchCount: 3, type: "discovery" }),
  ]);
  const skill = skillHits[0] ? {
    label: skillHits[0].label || "",
    id: skillHits[0].id,
    similarity: skillHits[0].similarity,
  } : null;
  const contextLines: string[] = [];
  if (skill) contextLines.push(`Skill sugerido: ${skill.label} (similarity ${skill.similarity.toFixed(2)})`);
  if (memories.length) {
    contextLines.push(`\nMemorias relevantes del agente ${agent.toUpperCase()}:`);
    memories.forEach(m => contextLines.push(`- ${m.title}: ${(m.content || "").slice(0, 200)}`));
  }
  if (discoveries.length) {
    contextLines.push(`\nDiscoveries relacionados:`);
    discoveries.forEach(d => contextLines.push(`- ${d.label}: ${(d.content || "").slice(0, 200)}`));
  }
  return {
    agent,
    skill,
    memories,
    discoveries,
    context: contextLines.join("\n"),
    stimulus_id,
  };
}
