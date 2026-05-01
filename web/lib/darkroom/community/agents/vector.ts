/**
 * VECTOR · lead capture + cualificación 4Q + outreach afiliados.
 *
 * Plan §6.3 — tier `titan` (Claude Sonnet) obligatorio: cualificar es decisión
 * crítica, no se ahorra. Score de lead 0..100, escala humano si >85 + ticket
 * >100€ (Studio o Lifetime).
 *
 * Voz: estilo numérico + tuteo cómplice. "Te ahorras 213€/mes. ¿Probamos los
 * 14 días sin tarjeta?"
 */

import { extractJSON } from "@/lib/llm";
import { bumpLeadScore } from "../members";
import { recordEvent } from "../messages";
import {
  AgentContext,
  buildEscalationResponse,
  callLLMSafe,
  escalateToPablo,
  fireDRSynapse,
} from "./shared";
import type { AgentResponse, LeadQualification, MemberTier } from "../types";

const PERSONA_VECTOR = `
Eres VECTOR, captador y cualificador de leads de DarkRoom.

# Tu rol
Cuando alguien muestra interés comercial, abres conversación 1:1 y cualificas en 4 preguntas:
Q1 ¿En qué trabajas? · Q2 ¿Qué herramientas pagas hoy? · Q3 ¿Cuánto al mes? · Q4 ¿Qué te frenaba probar DR?

A partir de las respuestas:
- Ingresos <800€ + estudiante → recomendar Starter 15€.
- 800€–3.500€ + freelance/creator/dropshipper/marketer → recomendar Pro 29€ (mayoría).
- Power user/agencia pequeña 1-2 cuentas → recomendar Studio 49€.
- Agencia >5 personas → soft block (anti-ICP). Educar: "te conviene Adobe Creative Cloud Teams".

# Cómo respondes
- Frases con datos: "Te ahorras 213€/mes". Cero promesas vagas.
- 1 pregunta a la vez (NO bombardeo). Espera respuesta antes de la siguiente.
- Si el usuario dice "ya soy afiliado/cliente de X competidor", paras y escalas a Pablo.
- Cierre: "14 días gratis sin tarjeta · darkroomcreative.cloud" + 1 frase de garantía pro-rata.

# Reglas
- Tutea siempre. Frases ≤15 palabras. Cero superlativos vacíos.
- Cero promesas imposibles ("Adobe gratis"). Habla "membresía colectiva" siempre.
- Si confidence baja → no inventas, le dices "te paso a Pablo" y escalas.

# Formato JSON al final (importante)
Cuando completes Q4 (cualificación cerrada), incluye al final del mensaje un bloque:

\`\`\`json
{"profile":"dropshipper|creator_visual|ai_creator|freelance|student|agency","tools":["..."],"monthly_eur":N,"blocker":"...","recommended":"starter|pro|studio","anti_icp":false}
\`\`\`

Antes de Q4: NO incluyas el JSON.
`.trim();

interface QualifierState {
  questionsAnswered: 0 | 1 | 2 | 3 | 4;
  history?: string[];
}

/** Detecta cuántas Qs respondió ya el lead — heurística simple en meta del miembro. */
function getQualifierState(ctx: AgentContext): QualifierState {
  const meta = (ctx.member.meta ?? {}) as Record<string, unknown>;
  const answered = (meta.vector_q_answered as 0 | 1 | 2 | 3 | 4) ?? 0;
  return { questionsAnswered: answered };
}

function leadScoreFromQual(q: LeadQualification): number {
  let score = 30;
  if (q.profile === "freelance" || q.profile === "creator_visual" || q.profile === "ai_creator")
    score += 25;
  if (q.profile === "dropshipper") score += 20;
  if ((q.monthlySpendEur ?? 0) >= 100) score += 20;
  if ((q.monthlySpendEur ?? 0) >= 200) score += 10;
  if (q.recommended === "studio") score += 5;
  if (q.recommended === "pro") score += 8;
  if (q.antiIcp) score = Math.max(0, score - 40);
  return Math.max(0, Math.min(100, score));
}

export async function handleWithVector(ctx: AgentContext): Promise<AgentResponse> {
  const state = getQualifierState(ctx);

  // 1. Si lead score ya alto + ticket alto → escalar SIEMPRE a Pablo
  if (ctx.member.leadScore >= 85) {
    await escalateToPablo({
      agent: "vector",
      member: ctx.member,
      reason: `lead_score_high:${ctx.member.leadScore}`,
      channel: ctx.channel,
      preview: ctx.contentRaw,
    });
    await fireDRSynapse("vector", "human:pablo", "escalates_high_value_lead", true);
    return buildEscalationResponse({
      agent: "vector",
      intent: ctx.intent,
      reason: "lead_score_high",
      reply: "Pablo te escribe en directo. Quería atender esto él.",
    });
  }

  // 2. Detectar mención de competidor → handover
  if (/\b(scaleboost|toolzilla|tugboat|grupobuy)\b/i.test(ctx.contentRaw)) {
    await escalateToPablo({
      agent: "vector",
      member: ctx.member,
      reason: "competitor_mention",
      channel: ctx.channel,
      preview: ctx.contentRaw,
    });
    return buildEscalationResponse({
      agent: "vector",
      intent: ctx.intent,
      reason: "competitor_mention",
      reply: "Te escribe Pablo personalmente — quería responder él esta.",
    });
  }

  // 3. LLM titan con persona VECTOR
  const { result, fallbackText } = await callLLMSafe(ctx, {
    tier: "titan",
    persona: PERSONA_VECTOR,
    callSite: "darkroom/community/vector",
    agent: "vector",
    maxTokens: 700,
    temperature: 0.5,
  });

  if (!result) {
    return buildEscalationResponse({
      agent: "vector",
      intent: ctx.intent,
      reason: "llm_failure",
      reply: fallbackText ?? "Te paso al equipo en menos de 2h.",
    });
  }

  // 4. Si hubo JSON al final → cualificación cerrada → score + recomendación
  const qualMatch = extractJSON<{
    profile: LeadQualification["profile"];
    tools?: string[];
    monthly_eur?: number;
    blocker?: string;
    recommended: "starter" | "pro" | "studio";
    anti_icp?: boolean;
  }>(result.content);

  let leadScoreDelta = state.questionsAnswered === 0 ? 5 : 8; // baseline por interacción
  if (qualMatch) {
    const qual: LeadQualification = {
      questionsAnswered: 4,
      profile: qualMatch.profile,
      toolsPaying: qualMatch.tools,
      monthlySpendEur: qualMatch.monthly_eur,
      blocker: qualMatch.blocker,
      recommended: (qualMatch.recommended ?? "pro") as MemberTier,
      antiIcp: !!qualMatch.anti_icp,
    };
    const score = leadScoreFromQual(qual);
    leadScoreDelta = Math.max(0, score - ctx.member.leadScore);
    await bumpLeadScore(ctx.member.id, leadScoreDelta);

    if (qual.antiIcp) {
      await recordEvent({
        memberId: ctx.member.id,
        eventType: "abuse_flagged", // anti-ICP no es abuse, pero lo marcamos para Pablo lo vea
        payload: { reason: "anti_icp_agency", profile: qual.profile },
        deliveredVia: "internal",
        status: "recorded",
      });
    }

    if (score >= 70 && !qual.antiIcp) {
      // Lead caliente — invitar a trial sin tarjeta
      await recordEvent({
        memberId: ctx.member.id,
        eventType: "lifetime_offered",
        payload: { recommended: qual.recommended, score },
        deliveredVia: "discord_dm",
        status: "delivered",
      });
    }
  } else {
    // Pregunta intermedia respondida — bump pequeño
    await bumpLeadScore(ctx.member.id, leadScoreDelta);
  }

  return {
    reply: result.content,
    agent: "vector",
    llmTier: result.tier,
    llmConfidence: ctx.intent.confidence,
    escalated: false,
    leadScoreDelta,
    intent: ctx.intent.intent,
    tokensUsed: result.tokensIn + result.tokensOut,
    latencyMs: result.latencyMs,
  };
}
