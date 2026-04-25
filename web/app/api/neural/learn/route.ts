/**
 * GET /api/neural/learn
 *
 * Loop de aprendizaje autónomo PACAME.
 * Cada llamada:
 *   1. Selecciona un dominio rotando entre los 10 agentes (DIOS no aprende, orquesta).
 *   2. Pregunta al LLM (tier titan) por la última técnica/herramienta/insight relevante
 *      del dominio en el contexto PYME España + automatización IA.
 *   3. Obliga formato JSON: title, summary, key_insights, applications, cross_agent_links,
 *      sources_referenced, tags.
 *   4. Persiste en cerebro:
 *        - rememberMemory()  → semantic, importance 0.78 (alto, conocimiento curado)
 *        - recordDiscovery() → type technique/trend
 *        - addKnowledgeNode()→ skill/playbook
 *        - fireSynapse()     → learns_from para cada cross-agent link
 *   5. Devuelve summary + IDs creados (vault sync se hace via brain-pull script).
 *
 * Cron: 4x/día desde vercel.json (00, 06, 12, 18 UTC).
 * Ratón manual: GET con header Authorization Bearer CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { llmChat, extractJSON } from "@/lib/llm";
import {
  rememberMemory,
  recordDiscovery,
  addKnowledgeNode,
  fireSynapse,
  type AgentId,
} from "@/lib/neural";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AgentDomain {
  id: Exclude<AgentId, "dios">;
  name: string;
  domain: string;
  focus: string;
  /** Sub-temas para rotar y no repetir el mismo enfoque cada ciclo */
  topics: string[];
}

const AGENT_DOMAINS: AgentDomain[] = [
  {
    id: "nova",
    name: "NOVA",
    domain: "Branding e identidad visual para PYMEs",
    focus: "Diseño que convierte y diferencia, low-budget, mobile-first",
    topics: [
      "tendencia branding 2026 PYMEs hostelería España",
      "logo systems modulares con IA (Midjourney/Gemini) listos para producción",
      "paletas y tipografía que aumentan conversión en landings PYME",
      "rebrand express PYME en 7 días: framework",
    ],
  },
  {
    id: "atlas",
    name: "ATLAS",
    domain: "SEO y contenido orgánico",
    focus: "SEO programático IA-driven, AEO, GEO, vertical PYMEs España",
    topics: [
      "AEO answer-engine optimization para Perplexity y ChatGPT 2026",
      "SEO local Google + Maps para restaurantes y servicios España últimas señales",
      "SEO programático con Claude/Gemini para PYMEs verticales",
      "schema markup avanzado y Knowledge Graph PYME",
    ],
  },
  {
    id: "nexus",
    name: "NEXUS",
    domain: "Paid ads, embudos y CRO",
    focus: "Meta/Google/TikTok Ads + landings + CRO para PYMEs <5k€/mes ad spend",
    topics: [
      "Meta Ads Advantage+ y creativos IA UGC 2026 micro-budget",
      "Google Ads PMax y demand gen para PYMEs hostelería/servicios",
      "TikTok Ads spark + creator + viralidad orgánica → ads",
      "CRO sub-3s landing PYME + heatmaps + IA copy testing",
    ],
  },
  {
    id: "pixel",
    name: "PIXEL",
    domain: "Frontend, web y experiencia",
    focus: "Next.js 15 + React 19 + UX premium, microinteracciones, Lighthouse 95+",
    topics: [
      "Next.js 15 App Router patterns para SaaS y landings PYME",
      "Animaciones Framer Motion + view transitions React 19",
      "Component libraries y design systems en producción 2026",
      "Performance Core Web Vitals INP/CLS técnicas avanzadas",
    ],
  },
  {
    id: "core",
    name: "CORE",
    domain: "Backend, infra, automatización",
    focus: "Supabase + n8n + edge functions + LLM ops + VPS/Docker",
    topics: [
      "n8n workflows IA agentes + Claude/Gemma para PYMEs",
      "Supabase RLS y vector search avanzado para producto IA",
      "Edge functions + queue patterns para latencia <100ms",
      "Self-hosted Ollama/vLLM + routing multi-LLM coste-óptimo",
    ],
  },
  {
    id: "pulse",
    name: "PULSE",
    domain: "Social media y contenido viral",
    focus: "Instagram + TikTok + LinkedIn growth orgánico para PYMEs y agencias",
    topics: [
      "Instagram Reels y carousels alta conversión 2026 algoritmo",
      "TikTok hooks 3 segundos + edición CapCut/AI 2026",
      "LinkedIn growth orgánico para founders y agencias B2B",
      "Threads/Bluesky/X estrategia cross-posting eficiente",
    ],
  },
  {
    id: "sage",
    name: "SAGE",
    domain: "Estrategia, pricing, propuestas",
    focus: "Pricing variable Hormozi-style, propuestas que cierran, posicionamiento",
    topics: [
      "Pricing valor-based vs hourly para agencias IA 2026",
      "Propuestas comerciales que convierten >40% en B2B PYME",
      "Posicionamiento de agencia IA vs comoditización (categoría propia)",
      "Modelos de retainer + revenue-share para servicios IA",
    ],
  },
  {
    id: "copy",
    name: "COPY",
    domain: "Copywriting y mensajes",
    focus: "Copy directo, hooks que paran scroll, frameworks probados",
    topics: [
      "Hooks IA-detección-resistente para ads y posts 2026",
      "Email cold + outbound LinkedIn que convierten para PYMEs",
      "Frameworks copywriting actualizados PAS, AIDA, 4P, evolución 2026",
      "Voice & tone humanizado en era AI slop",
    ],
  },
  {
    id: "lens",
    name: "LENS",
    domain: "Analytics y data-driven decisions",
    focus: "GA4 + Mixpanel + dashboards Supabase + KPIs PYME útiles",
    topics: [
      "GA4 server-side y Consent Mode v2 PYME 2026",
      "Dashboards SaaS metrics LTV/CAC/MRR/churn para agencia",
      "Atribución multi-touch sin cookies para PYME",
      "Cohort analysis y retención para servicios recurrentes",
    ],
  },
];

interface LearnPayload {
  title: string;
  summary: string;
  key_insights: string[];
  applications: string[];
  cross_agent_links: Array<{ agent: string; reason: string }>;
  sources_referenced: string[];
  tags: string[];
  discovery_type?: "trend" | "technique" | "competitor_insight" | "optimization" | "market_signal" | "service_idea";
  knowledge_node_type?: "skill" | "playbook" | "concept" | "tool";
}

/** Selecciona el agente con menos memorias en últimas 24h (anti-bias hacia un dominio) */
async function pickLeastFedAgent(): Promise<AgentDomain> {
  try {
    const supabase = createServerSupabase();
    const since = new Date(Date.now() - 86400_000).toISOString();
    const counts: Record<string, number> = {};
    for (const a of AGENT_DOMAINS) counts[a.id] = 0;
    const { data } = await supabase
      .from("agent_memories")
      .select("agent_id")
      .gte("created_at", since)
      .in("agent_id", AGENT_DOMAINS.map((a) => a.id));
    for (const row of data || []) {
      const id = (row as { agent_id: string }).agent_id;
      if (id in counts) counts[id]++;
    }
    const sorted = AGENT_DOMAINS.slice().sort((a, b) => counts[a.id] - counts[b.id]);
    return sorted[0];
  } catch {
    // Fallback: random
    return AGENT_DOMAINS[Math.floor(Math.random() * AGENT_DOMAINS.length)];
  }
}

function pickTopic(domain: AgentDomain): string {
  // Topic determinista por hora del día → spread natural a lo largo del día
  const idx = new Date().getUTCHours() % domain.topics.length;
  return domain.topics[idx];
}

function buildPrompt(domain: AgentDomain, topic: string): { system: string; user: string } {
  const system = `Eres ${domain.name}, agente PACAME especializado en: ${domain.domain}.
Foco: ${domain.focus}.

Misión: investigar UNA pieza de conocimiento de oro reciente (último año, idealmente 2025-2026)
sobre el tema que se te pide. NO inventes. NO uses humo. Si no estás seguro de un dato, dilo.

Contexto PACAME: agencia digital española, clientes PYMEs (presupuestos 500-5000€), mercado España.
Tono: directo, sin jerga vacía, con números/ejemplos concretos.

Devuelves SIEMPRE JSON válido, nada más, sin markdown fence. Schema:
{
  "title": "string corto (<80 char), accionable, no genérico",
  "summary": "string 2-4 frases, directo, qué es y por qué importa para PACAME",
  "key_insights": ["3-5 insights concretos, cada uno una frase con dato/número/ejemplo"],
  "applications": ["3-5 aplicaciones concretas para PACAME o sus clientes PYME, accionables"],
  "cross_agent_links": [{"agent":"sage|atlas|nexus|pixel|core|pulse|nova|copy|lens","reason":"1 frase: por qué ese agente debería conocer esto"}],
  "sources_referenced": ["3-5 nombres de fuentes, herramientas o estudios reales que respaldan esto"],
  "tags": ["3-6 tags lowercase, kebab-case"],
  "discovery_type": "trend|technique|competitor_insight|optimization|market_signal|service_idea",
  "knowledge_node_type": "skill|playbook|concept|tool"
}`;

  const user = `Tema: ${topic}.

Investiga y devuelve UNA pieza de conocimiento de oro sobre este tema, lista para que PACAME
la aplique a sus clientes PYME en España. Si el tema es muy amplio, elige el ángulo MÁS
accionable y reciente. Devuelve SOLO el JSON.`;

  return { system, user };
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const startedAt = Date.now();
  const url = new URL(request.url);
  const forceAgentId = url.searchParams.get("agent");
  const forceTopic = url.searchParams.get("topic");

  // 1. Elegir dominio
  let domain: AgentDomain;
  if (forceAgentId) {
    const found = AGENT_DOMAINS.find((a) => a.id === forceAgentId);
    if (!found) {
      return NextResponse.json(
        { ok: false, error: `agent ${forceAgentId} no es válido. Usa: ${AGENT_DOMAINS.map((a) => a.id).join(", ")}` },
        { status: 400 }
      );
    }
    domain = found;
  } else {
    domain = await pickLeastFedAgent();
  }
  const topic = forceTopic || pickTopic(domain);

  // 2. Llamar LLM tier titan (Claude Opus/Sonnet) — conocimiento de oro requiere mejor modelo
  const { system, user } = buildPrompt(domain, topic);
  let llmResult;
  try {
    llmResult = await llmChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { tier: "titan", maxTokens: 2000, temperature: 0.6 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "llm-failed", detail: (err as Error).message, agent: domain.id, topic },
      { status: 500 }
    );
  }

  // 3. Parsear JSON
  const payload = extractJSON<LearnPayload>(llmResult.content);
  if (!payload || !payload.title || !payload.summary) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid-payload",
        agent: domain.id,
        topic,
        raw_preview: llmResult.content.slice(0, 400),
      },
      { status: 500 }
    );
  }

  // 4. Persistir en cerebro (paralelo, no-bloqueante uno respecto del otro)
  const memoryContent = [
    payload.summary,
    "",
    "INSIGHTS:",
    ...payload.key_insights.map((i) => `- ${i}`),
    "",
    "APLICACIONES PACAME:",
    ...payload.applications.map((a) => `- ${a}`),
    "",
    `FUENTES: ${payload.sources_referenced.join(" · ")}`,
  ].join("\n");

  const tags = [
    ...(payload.tags || []),
    "auto-aprendizaje",
    `dominio:${domain.id}`,
    `cron:${new Date().toISOString().slice(0, 10)}`,
  ];

  const [memoryId, discoveryId, knowledgeNodeId] = await Promise.all([
    rememberMemory({
      agentId: domain.id,
      type: "semantic",
      title: payload.title,
      content: memoryContent,
      importance: 0.78,
      decayRate: 0.02, // baja: conocimiento curado decae lento
      tags,
      metadata: {
        source: "auto-learn",
        topic,
        provider: llmResult.provider,
        model: llmResult.model,
        cross_agent_links: payload.cross_agent_links,
      },
    }),
    recordDiscovery({
      agentId: domain.id,
      type: payload.discovery_type || "technique",
      title: payload.title,
      description: payload.summary,
      evidence: `Insights: ${payload.key_insights.join(" | ")}\nFuentes: ${payload.sources_referenced.join(", ")}`,
      impact: "medium",
      confidence: 0.75,
      actionable: true,
      suggestedAction: payload.applications[0] || undefined,
      metadata: {
        source: "auto-learn",
        topic,
        applications: payload.applications,
        cross_agent_links: payload.cross_agent_links,
      },
    }),
    addKnowledgeNode({
      nodeType: payload.knowledge_node_type || "playbook",
      label: payload.title,
      content: memoryContent,
      confidence: 0.75,
      ownerAgent: domain.id,
      tags,
      metadata: {
        source: "auto-learn",
        topic,
        applications: payload.applications,
        sources: payload.sources_referenced,
      },
    }),
  ]);

  // 5. Disparar sinapsis cross-agent learns_from
  const validIds = new Set(AGENT_DOMAINS.map((a) => a.id));
  const synapseResults = await Promise.all(
    (payload.cross_agent_links || [])
      .filter((l) => l && validIds.has(l.agent as AgentDomain["id"]))
      .map((l) => fireSynapse(l.agent, domain.id, "learns_from", true))
  );

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    agent: domain.id,
    topic,
    payload: {
      title: payload.title,
      summary: payload.summary,
      insights_count: payload.key_insights.length,
      applications_count: payload.applications.length,
      cross_agent_links: payload.cross_agent_links,
    },
    persisted: {
      memory_id: memoryId,
      discovery_id: discoveryId,
      knowledge_node_id: knowledgeNodeId,
      synapses_fired: synapseResults.filter((w) => w !== null).length,
    },
    llm: {
      provider: llmResult.provider,
      model: llmResult.model,
      tokens_in: llmResult.tokensIn,
      tokens_out: llmResult.tokensOut,
      latency_ms: llmResult.latencyMs,
      fallback: llmResult.fallback,
    },
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
