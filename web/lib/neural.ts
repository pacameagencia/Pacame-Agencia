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
  options: { matchCount?: number; agentId?: string; minSimilarity?: number } = {}
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
    const threshold = options.minSimilarity ?? 0.45;
    return ((data || []) as SemanticHit[]).filter(h => h.similarity >= threshold);
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
  // PULSE — social media (reel/reels + variants)
  social: "pulse", instagram: "pulse", tiktok: "pulse", reels: "pulse",
  reel: "pulse", carrusel: "pulse", post: "pulse", story: "pulse",
  "video-corto": "pulse", stories: "pulse", "community-management": "pulse",
  engagement: "pulse", hashtag: "pulse", linkedin: "pulse", twitter: "pulse",
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
    channel: params.channel,
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
  // Identity injection: SIEMPRE se recuperan las top-5 memorias con tag 'identity'
  // de Pablo, independientemente del match semántico con el input. Esto asegura
  // que visión, pricing, estilo y directivas viajan en CADA prompt del cerebro.
  const supabaseClient = createServerSupabase();
  const identityPromise = supabaseClient
    .from("agent_memories")
    .select("id, title, content, importance, tags")
    .eq("agent_id", "pablo")
    .contains("tags", ["identity"])
    .order("importance", { ascending: false })
    .limit(5);

  const [skillHits, memories, discoveries, identityRes] = await Promise.all([
    semanticSearchNodes(input, { matchCount: 3, type: "skill" }),
    semanticSearchMemories(input, { matchCount: 5 }),
    semanticSearchNodes(input, { matchCount: 3, type: "discovery" }),
    identityPromise,
  ]);
  const identity = (identityRes.data || []) as Array<{
    id: string; title: string; content: string; importance: number;
  }>;

  const skill = skillHits[0] ? {
    label: skillHits[0].label || "",
    id: skillHits[0].id,
    similarity: skillHits[0].similarity,
  } : null;
  const contextLines: string[] = [];

  // 1) Identidad Pablo SIEMPRE primero (si existe)
  if (identity.length > 0) {
    contextLines.push("=== IDENTIDAD PABLO (obligatorio respetar) ===");
    identity.forEach(i => contextLines.push(`- ${i.title}: ${(i.content || "").slice(0, 300)}`));
    contextLines.push("");
  }

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

// ============================================================================
// AUTO-TOOLS — tool-creation autónoma
// ============================================================================

export type ToolKind = "endpoint" | "skill" | "script" | "subagent";
export type ToolGapStatus =
  | "pending" | "drafting" | "drafted" | "probation"
  | "promoted" | "rejected" | "disabled" | "draft_failed" | "corrupted";

export interface ToolGap {
  id: string;
  requested_by_agent: string;
  intent: string;
  examples: unknown;
  status: ToolGapStatus;
  tool_kind: ToolKind | null;
  tool_name: string | null;
  draft_path: string | null;
  promoted_path: string | null;
  code_hash: string | null;
  usage_count: number;
  success_count: number;
  failure_count: number;
  consecutive_failures: number;
  last_invoked_at: string | null;
  draft_tokens_used: number;
  created_at: string;
  drafted_at: string | null;
  probation_started_at: string | null;
  promoted_at: string | null;
  metadata: Record<string, unknown>;
}

export interface SimilarGap {
  gap_id: string;
  similarity: number;
  status: ToolGapStatus;
  tool_kind: ToolKind | null;
  tool_name: string | null;
  draft_path: string | null;
  intent: string;
}

/**
 * Busca gaps similares por embedding del intent. Usa cosine distance via SQL.
 * Devuelve top N con similarity descendente.
 */
export async function findSimilarGaps(
  intent: string,
  options: { matchCount?: number; minSimilarity?: number; kind?: ToolKind } = {}
): Promise<SimilarGap[]> {
  const vec = await embed(intent);
  if (!vec) return [];
  try {
    const supabase = createServerSupabase();
    const literal = `[${vec.join(",")}]`;
    const matchCount = options.matchCount ?? 3;
    const minSim = options.minSimilarity ?? 0.0;
    // Inline SQL: no hay RPC dedicada, usamos el operador <=> (cosine distance)
    const { data, error } = await supabase.rpc("find_similar_tool_gaps", {
      query_embedding: literal,
      match_count: matchCount,
      filter_kind: options.kind ?? null,
    });
    if (error) {
      // Si la función no existe aún (migración pendiente), fallback a query simple sin similarity
      console.warn("[findSimilarGaps] RPC fallo, fallback:", error.message);
      const { data: fb } = await supabase
        .from("agent_tool_gaps")
        .select("id, status, tool_kind, tool_name, draft_path, intent")
        .ilike("intent", `%${intent.slice(0, 40)}%`)
        .limit(matchCount);
      return (fb || []).map((r) => ({
        gap_id: r.id as string,
        similarity: 0.5,
        status: r.status as ToolGapStatus,
        tool_kind: r.tool_kind as ToolKind | null,
        tool_name: r.tool_name as string | null,
        draft_path: r.draft_path as string | null,
        intent: r.intent as string,
      }));
    }
    return ((data || []) as SimilarGap[]).filter((h) => h.similarity >= minSim);
  } catch (e) {
    console.warn("[findSimilarGaps] exception:", (e as Error).message);
    return [];
  }
}

export interface RecordToolGapParams {
  agent: AgentId | string;
  intent: string;
  examples?: unknown[];
  metadata?: Record<string, unknown>;
}

/**
 * Registra un gap de tool. Hace dedupe semántico (cosine ≥0.85): si encuentra
 * un gap existente similar, devuelve su ID en vez de crear uno nuevo.
 */
export async function recordToolGap(
  p: RecordToolGapParams
): Promise<{ gap_id: string; deduped: boolean } | null> {
  try {
    // Dedupe semántico
    const similar = await findSimilarGaps(p.intent, { matchCount: 1, minSimilarity: 0.85 });
    if (similar.length > 0) {
      return { gap_id: similar[0].gap_id, deduped: true };
    }

    const supabase = createServerSupabase();
    const vec = await embed(p.intent);
    const embeddingLiteral = vec ? `[${vec.join(",")}]` : null;
    const { data, error } = await supabase
      .from("agent_tool_gaps")
      .insert({
        requested_by_agent: p.agent,
        intent: p.intent,
        intent_embedding: embeddingLiteral,
        examples: p.examples ?? [],
        metadata: p.metadata ?? {},
      })
      .select("id")
      .single();
    if (error || !data) {
      console.warn("[recordToolGap]", error?.message);
      return null;
    }
    // Sinapsis: agente solicita ayuda a dios
    void fireSynapse(p.agent, "dios", "consults", true);
    return { gap_id: data.id as string, deduped: false };
  } catch (e) {
    console.warn("[recordToolGap] exception:", (e as Error).message);
    return null;
  }
}

export interface MarkToolDraftedParams {
  gapId: string;
  kind: ToolKind;
  name: string;
  draftPath: string;
  codeHash: string;
  tokensUsed: number;
  metadata?: Record<string, unknown>;
}

export async function markToolDrafted(p: MarkToolDraftedParams): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("agent_tool_gaps")
      .update({
        status: "drafted",
        tool_kind: p.kind,
        tool_name: p.name,
        draft_path: p.draftPath,
        code_hash: p.codeHash,
        draft_tokens_used: p.tokensUsed,
        drafted_at: new Date().toISOString(),
        metadata: p.metadata ?? {},
      })
      .eq("id", p.gapId);
    if (error) {
      console.warn("[markToolDrafted]", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[markToolDrafted] exception:", (e as Error).message);
    return false;
  }
}

export async function markToolDraftFailed(gapId: string, reason: string): Promise<void> {
  try {
    const supabase = createServerSupabase();
    await supabase
      .from("agent_tool_gaps")
      .update({
        status: "draft_failed",
        metadata: { draft_failure_reason: reason, failed_at: new Date().toISOString() },
      })
      .eq("id", gapId);
  } catch {
    /* no-op */
  }
}

export interface RecordInvocationParams {
  gapId: string;
  toolName: string;
  agent?: string | null;
  success: boolean;
  durationMs?: number;
  error?: string | null;
}

/**
 * Registra una invocación a auto-tool. Atómicamente:
 *  - INSERT en auto_tool_invocations
 *  - UPDATE counters en agent_tool_gaps (usage_count, success_count, failure_count, consecutive_failures, last_invoked_at)
 *  - Si consecutive_failures alcanza 10, el trigger SQL marca status=disabled
 */
export async function recordToolInvocation(p: RecordInvocationParams): Promise<void> {
  try {
    const supabase = createServerSupabase();
    // 1. Insert en log
    await supabase.from("auto_tool_invocations").insert({
      gap_id: p.gapId,
      tool_name: p.toolName,
      invoker_agent: p.agent ?? null,
      success: p.success,
      duration_ms: p.durationMs ?? null,
      error_message: p.error ?? null,
    });
    // 2. Update counters: leer + escribir (no hay incremento atómico nativo en supabase-js)
    const { data: cur } = await supabase
      .from("agent_tool_gaps")
      .select("usage_count, success_count, failure_count, consecutive_failures")
      .eq("id", p.gapId)
      .single();
    if (!cur) return;
    const usage = (cur.usage_count as number) + 1;
    const succ = (cur.success_count as number) + (p.success ? 1 : 0);
    const fail = (cur.failure_count as number) + (p.success ? 0 : 1);
    const consecutive = p.success ? 0 : (cur.consecutive_failures as number) + 1;
    await supabase
      .from("agent_tool_gaps")
      .update({
        usage_count: usage,
        success_count: succ,
        failure_count: fail,
        consecutive_failures: consecutive,
        last_invoked_at: new Date().toISOString(),
      })
      .eq("id", p.gapId);
  } catch (e) {
    console.warn("[recordToolInvocation] exception:", (e as Error).message);
  }
}

/**
 * Reserva un nombre de auto-tool de forma atómica via INSERT ON CONFLICT DO NOTHING.
 * Devuelve true si lo reservó, false si ya estaba tomado.
 */
export async function reserveToolName(name: string, gapId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    // upsert con onConflict='name' + ignoreDuplicates emula INSERT ... ON CONFLICT DO NOTHING
    const { data, error } = await supabase
      .from("auto_tool_names")
      .upsert({ name, gap_id: gapId }, { onConflict: "name", ignoreDuplicates: true })
      .select("name");
    if (error) {
      console.warn("[reserveToolName]", error.message);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.warn("[reserveToolName] exception:", (e as Error).message);
    return false;
  }
}

/**
 * Promueve un gap drafted → probation (con probation_started_at).
 * Si ya está en probation ≥7d con counters OK → marca como promoted y devuelve {promoted:true}.
 * Si está en drafted pero counters no llegan a umbral, devuelve {promoted:false, reason}.
 */
export async function promoteToolGap(
  gapId: string,
  options: { minUsage?: number; minSuccessRate?: number; probationDays?: number } = {}
): Promise<{ promoted: boolean; new_status?: ToolGapStatus; reason?: string }> {
  const minUsage = options.minUsage ?? 5;
  const minRate = options.minSuccessRate ?? 0.85;
  const probationDays = options.probationDays ?? 7;
  try {
    const supabase = createServerSupabase();
    const { data: gap } = await supabase
      .from("agent_tool_gaps")
      .select("*")
      .eq("id", gapId)
      .single();
    if (!gap) return { promoted: false, reason: "gap not found" };

    const usage = gap.usage_count as number;
    const succ = gap.success_count as number;
    const status = gap.status as ToolGapStatus;
    const successRate = usage > 0 ? succ / usage : 0;

    if (usage < minUsage) {
      return { promoted: false, reason: `usage ${usage} < ${minUsage}` };
    }
    if (successRate < minRate) {
      return { promoted: false, reason: `success_rate ${successRate.toFixed(2)} < ${minRate}` };
    }

    if (status === "drafted") {
      await supabase
        .from("agent_tool_gaps")
        .update({
          status: "probation",
          probation_started_at: new Date().toISOString(),
        })
        .eq("id", gapId);
      return { promoted: false, new_status: "probation", reason: "moved to probation" };
    }

    if (status === "probation") {
      const probStart = gap.probation_started_at ? new Date(gap.probation_started_at as string) : null;
      if (!probStart) {
        return { promoted: false, reason: "probation_started_at missing" };
      }
      const ageDays = (Date.now() - probStart.getTime()) / 86400_000;
      if (ageDays < probationDays) {
        return { promoted: false, reason: `probation age ${ageDays.toFixed(1)}d < ${probationDays}d` };
      }
      await supabase
        .from("agent_tool_gaps")
        .update({
          status: "promoted",
          promoted_at: new Date().toISOString(),
        })
        .eq("id", gapId);
      void fireSynapse("dios", gap.requested_by_agent as string, "learns_from", true);
      return { promoted: true, new_status: "promoted" };
    }

    return { promoted: false, reason: `status ${status} not eligible` };
  } catch (e) {
    return { promoted: false, reason: (e as Error).message };
  }
}
