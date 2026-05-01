/**
 * IRIS · soporte técnico instantáneo de DarkRoom.
 *
 * Plan §6.1 — tier `economy` para 80% queries (Gemma 4 e2b VPS, gratis),
 * fallback `standard` si confidence <0.7. KB en `darkroom_known_issues`.
 *
 * Voz: directo, cómplice, profesional. Cero emojis fuego.
 * SLA: <30s primera respuesta, ≥70% queries cerradas sin humano.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import {
  AgentContext,
  buildEscalationResponse,
  callLLMSafe,
  escalateToPablo,
  fireDRSynapse,
} from "./shared";
import type { AgentResponse, KnownIssue } from "../types";

const PERSONA_IRIS = `
Eres IRIS, soporte técnico de DarkRoom.

# Tu rol
Resuelves problemas de acceso, herramientas y facturación de la membresía DarkRoom (membresía colectiva acceso stack premium creativo + IA + ecom). Tu obsesión: respuesta útil en <30s.

# Cómo respondes
1. Si encuentras el problema en tu KB de issues conocidos, lo aplicas literal (no lo parafrasees, ya está testado).
2. Si NO lo encuentras y tienes confianza ≥0.7: respondes igual con la mejor respuesta posible.
3. Si no sabes: dices "no estoy seguro, te paso al equipo en <2h" + escalas. Cero invento.

# Reglas
- Tutea siempre. Frases ≤15 palabras. Cero superlativos vacíos.
- Si la pregunta es de cancelación/refund → responde con calma + ESCALA (no decides tú).
- Si detectas piracy talk (cracked/keygen) → responde firme + escalas + flag abuse.
- Soporte humano está en support@darkroomcreative.cloud — menciónalo cuando convenga.

# Formato
Respuesta directa al problema. Máximo 5 frases. Si hace falta más, ofrece DM.
`.trim();

/** Carga KB issues activos. Caching ligero por 60s recomendado en runtime real. */
async function loadKnownIssues(): Promise<KnownIssue[]> {
  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("darkroom_known_issues")
    .select("id, slug, title, symptom_keywords, resolution, escalate_to_human, category, active")
    .eq("active", true);
  if (error) {
    getLogger().warn({ err: error }, "[iris] loadKnownIssues error");
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    symptomKeywords: (r.symptom_keywords as string[]) ?? [],
    resolution: r.resolution as string,
    escalateToHuman: !!r.escalate_to_human,
    category: r.category as KnownIssue["category"],
    active: !!r.active,
  }));
}

/** Match simple por intersección de keywords. Devuelve mejor matched o null. */
function matchKB(text: string, issues: KnownIssue[]): KnownIssue | null {
  const lower = text.toLowerCase();
  let best: { issue: KnownIssue; hits: number } | null = null;
  for (const issue of issues) {
    let hits = 0;
    for (const kw of issue.symptomKeywords) {
      if (lower.includes(kw.toLowerCase())) hits++;
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { issue, hits };
  }
  return best?.issue ?? null;
}

/** Marca un known_issue como usado (analytics). */
async function bumpKbHit(issueId: string): Promise<void> {
  const sb = createServerSupabase();
  try {
    // RPC opcional: si no existe, ignoramos. La tabla tiene hits_count default 0.
    await sb.rpc("increment_dr_known_issue_hits", { p_id: issueId });
  } catch {
    /* noop */
  }
}

export async function handleWithIris(ctx: AgentContext): Promise<AgentResponse> {
  // 1. Escalation forzada por intent (cancellation/abuse)
  if (ctx.intent.escalateToHuman) {
    await escalateToPablo({
      agent: "iris",
      member: ctx.member,
      reason: `intent=${ctx.intent.intent} keywords=${ctx.intent.keywords.join("|")}`,
      channel: ctx.channel,
      preview: ctx.contentRaw,
    });
    return buildEscalationResponse({
      agent: "iris",
      intent: ctx.intent,
      reason: ctx.intent.intent === "cancellation" ? "cancellation_intent" : "abuse_or_piracy",
      reply:
        ctx.intent.intent === "cancellation"
          ? "Recibido. El equipo te escribe en <2h. Si quieres pausa en lugar de baja, lo vemos juntos."
          : "Esto no encaja con la comunidad. El equipo lo revisa.",
    });
  }

  // 2. Match KB
  const issues = await loadKnownIssues();
  const matched = matchKB(ctx.contentRaw, issues);
  if (matched) {
    await bumpKbHit(matched.id);
    if (matched.escalateToHuman) {
      await escalateToPablo({
        agent: "iris",
        member: ctx.member,
        reason: `kb:${matched.slug}`,
        channel: ctx.channel,
        preview: ctx.contentRaw,
      });
    }
    return {
      reply: matched.resolution,
      agent: "iris",
      llmTier: "none",
      llmConfidence: 1,
      escalated: matched.escalateToHuman,
      escalationReason: matched.escalateToHuman ? `kb:${matched.slug}` : undefined,
      leadScoreDelta: 0,
      intent: ctx.intent.intent,
      events: [],
    };
  }

  // 3. LLM economy (Gemma) con persona IRIS
  const { result, fallbackText } = await callLLMSafe(ctx, {
    tier: "economy",
    persona: PERSONA_IRIS,
    callSite: "darkroom/community/iris",
    agent: "iris",
    maxTokens: 500,
    temperature: 0.4,
  });

  if (!result) {
    await escalateToPablo({
      agent: "iris",
      member: ctx.member,
      reason: "llm_failure",
      channel: ctx.channel,
      preview: ctx.contentRaw,
    });
    return buildEscalationResponse({
      agent: "iris",
      intent: ctx.intent,
      reason: "llm_failure",
      reply: fallbackText ?? "Te paso al equipo.",
    });
  }

  const lowConfidence = ctx.intent.confidence < 0.7;
  if (lowConfidence) {
    // Fire synapse — IRIS aprendió que necesita VECTOR si parece compra disfrazada
    if (/precio|cu[aá]nto|plan/i.test(ctx.contentRaw)) {
      await fireDRSynapse("iris", "vector", "detects_buying_intent", true);
    }
  }

  return {
    reply: result.content,
    agent: "iris",
    llmTier: result.tier,
    llmConfidence: ctx.intent.confidence,
    escalated: false,
    leadScoreDelta: 0,
    intent: ctx.intent.intent,
    tokensUsed: result.tokensIn + result.tokensOut,
    latencyMs: result.latencyMs,
  };
}
