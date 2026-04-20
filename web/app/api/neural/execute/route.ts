/**
 * POST /api/neural/execute
 * El cerebro RESPONDE: recibe input, consulta cerebro, ejecuta Claude/LLM
 * con contexto neural inyectado, registra memoria + discovery + sinapsis.
 *
 * Este es el endpoint completo del "nervio central" — entidad IA con cerebro propio.
 *
 * Body: {
 *   input: string,              // requerido
 *   source?: StimulusSource,    // default 'external_api'
 *   channel?: string,           // 'telegram' | 'whatsapp' | ...
 *   agent_hint?: AgentId,       // opcional
 *   tier?: 'titan'|'premium'|'standard'|'economy',  // default 'premium'
 *   mode?: 'answer'|'think',    // 'think' usa tier titan (Opus/DeepSeek-671B)
 *   store_memory?: boolean      // default true: guarda memoria del intercambio
 * }
 *
 * Response: {
 *   ok: true,
 *   agent: 'nexus',
 *   reply: "respuesta generada por Claude/LLM",
 *   context_used: { skill, memories_count, discoveries_count },
 *   provider: 'nebius'|'claude'|'gemma',
 *   model: 'deepseek-v3.2',
 *   tokens: { in: 500, out: 800 },
 *   cost_usd: 0.0012,
 *   latency_ms: 2340,
 *   memory_id?: uuid,            // si se creó memoria
 *   discovery_id?: uuid,         // si se detectó pattern nuevo
 *   stimulus_id: uuid
 * }
 */
import { NextResponse } from "next/server";
import {
  routeInput,
  logLlmCall,
  fireSynapse,
  recordDiscovery,
  rememberMemory,
  markStimulusProcessed,
  semanticSearchNodes,
  type AgentId,
  type StimulusSource,
} from "@/lib/neural";
import { llmChat, type LLMTier } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_PERSONAS: Record<string, { role: string; domain: string }> = {
  dios: { role: "orquestador supremo", domain: "delegación multi-agente" },
  nova: { role: "agente de branding", domain: "identidad visual, logo, guías de marca" },
  atlas: { role: "agente SEO", domain: "contenido orgánico, posicionamiento, blog" },
  nexus: { role: "agente de growth", domain: "ads, embudos, CRO, lead generation" },
  pixel: { role: "agente de frontend", domain: "Next.js, React, UI, diseño web" },
  core: { role: "agente backend", domain: "APIs, infra, Supabase, deploy" },
  pulse: { role: "agente social", domain: "Instagram, TikTok, reels, comunidad" },
  sage: { role: "agente estratega", domain: "estrategia, pricing, propuestas, consejo" },
  copy: { role: "agente copywriter", domain: "texto publicitario, email, CTAs" },
  lens: { role: "agente analytics", domain: "dashboards, métricas, KPIs" },
};

function buildSystemPrompt(agent: AgentId | string, context: string): string {
  const persona = AGENT_PERSONAS[agent] || AGENT_PERSONAS.dios;
  return [
    `Eres ${agent.toUpperCase()}, ${persona.role} de la agencia PACAME (agencia digital para PYMEs en España).`,
    `Dominio: ${persona.domain}.`,
    `Tono: directo, cercano, sin humo. Frases cortas, verbos activos, tutear siempre.`,
    `Cada respuesta cierra con un próximo paso accionable.`,
    ``,
    `Contexto cerebral (consulta esto antes de responder):`,
    context || "[cerebro vacío para este tema — usa tu juicio]",
    ``,
    `Si detectas un patrón, técnica o insight NUEVO que PACAME no conocía, márcalo al final con la línea:`,
    `DISCOVERY: <descripción breve en una línea>`,
  ].join("\n");
}

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const body = await req.json().catch(() => null);
    if (!body?.input || typeof body.input !== "string") {
      return NextResponse.json({ error: "input (string) requerido" }, { status: 400 });
    }

    // 1) Enrutar: agente + contexto
    const route = await routeInput({
      input: body.input,
      source: (body.source as StimulusSource) ?? "external_api",
      channel: body.channel,
      agentHint: body.agent_hint,
    });

    // 2) Ejecutar LLM con contexto cerebral
    const mode = body.mode === "think" ? "think" : "answer";
    const tier: LLMTier = mode === "think"
      ? "titan"                                 // DeepSeek-V3.2 671B (o Claude Opus fallback)
      : (body.tier as LLMTier) || "premium";    // DeepSeek-V3.2 por defecto

    const system = buildSystemPrompt(route.agent, route.context);
    let llmResult;
    try {
      llmResult = await llmChat(
        [
          { role: "system", content: system },
          { role: "user", content: body.input },
        ],
        {
          tier,
          maxTokens: mode === "think" ? 4096 : 2048,
          temperature: 0.6,
          agentId: route.agent,
          source: `neural/execute/${body.channel || "api"}`,
          metadata: { route_stimulus: route.stimulus_id, mode },
        }
      );
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message, agent: route.agent },
        { status: 502 }
      );
    }

    // 3) Detectar DISCOVERY en la respuesta
    const discoveryMatch = llmResult.content.match(/^DISCOVERY:\s*(.+)$/im);
    let discoveryId: string | null = null;
    if (discoveryMatch) {
      discoveryId = await recordDiscovery({
        agentId: route.agent,
        discoveryType: "pattern",
        title: discoveryMatch[1].slice(0, 200),
        description: llmResult.content.slice(0, 1000),
        impact: "medium",
        source: body.channel || "neural/execute",
        metadata: { stimulus_id: route.stimulus_id, provider: llmResult.provider, model: llmResult.model },
      });
    }

    // 4) Guardar memoria (si importance > 0.5)
    let memoryId: string | null = null;
    if (body.store_memory !== false && body.input.length > 20) {
      memoryId = await rememberMemory({
        agentId: route.agent,
        memoryType: "episodic",
        title: body.input.slice(0, 150),
        content: `Q: ${body.input}\n\nA: ${llmResult.content.slice(0, 2000)}`,
        importance: 0.6,
        tags: ["neural/execute", body.channel || "api", mode],
      });
    }

    // 5) Reforzar sinapsis DIOS → agente elegido (delegación exitosa)
    if (route.agent !== "dios") {
      fireSynapse("dios", route.agent, "delegates_to", true).catch(() => {});
    }

    // 6) Marcar stimulus procesado
    if (route.stimulus_id) {
      markStimulusProcessed(route.stimulus_id, null).catch(() => {});
    }

    // 7) Log detallado en llm_calls (complementario a agent_llm_usage)
    const latencyMs = Date.now() - started;
    logLlmCall({
      callSite: `neural/execute/${body.channel || "api"}`,
      provider: llmResult.provider,
      model: llmResult.model,
      tokensIn: llmResult.tokensIn,
      tokensOut: llmResult.tokensOut,
      latencyMs,
      success: true,
      tier,
      strategy: mode,
      fallbackUsed: llmResult.fallback,
      metadata: {
        agent: route.agent,
        skill: route.skill?.label,
        memories_count: route.memories.length,
        discoveries_count: route.discoveries.length,
        memory_id: memoryId,
        discovery_id: discoveryId,
        stimulus_id: route.stimulus_id,
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      agent: route.agent,
      reply: llmResult.content,
      context_used: {
        skill: route.skill,
        memories_count: route.memories.length,
        discoveries_count: route.discoveries.length,
      },
      provider: llmResult.provider,
      model: llmResult.model,
      tokens: { in: llmResult.tokensIn, out: llmResult.tokensOut },
      latency_ms: latencyMs,
      fallback_used: llmResult.fallback,
      memory_id: memoryId,
      discovery_id: discoveryId,
      stimulus_id: route.stimulus_id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/neural/execute",
    method: "POST",
    description:
      "Nervio central de PACAME: recibe input, consulta cerebro (memorias+discoveries+skill), elige agente, ejecuta Claude/DeepSeek/Gemma con contexto, detecta discoveries, guarda memoria, refuerza sinapsis.",
    tiers: ["titan (DeepSeek-671B / Claude Opus fallback)", "premium (DeepSeek-671B)", "standard (DeepSeek)", "economy (Gemma VPS, gratis)"],
    modes: {
      answer: "Respuesta rápida, tier premium",
      think: "Razonamiento profundo, tier titan (modelos más potentes)",
    },
  });
}
