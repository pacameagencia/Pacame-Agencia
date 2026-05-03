/**
 * NIMBO · community manager + curador de DarkRoom.
 *
 * Plan §6.2 — tier `standard` (DeepSeek/Nebius) por defecto, escala a `titan`
 * solo en crisis comms. Funciones: bienvenida, curación showcase, tutoriales,
 * #confesionario sentiment, moderación banlist.
 *
 * Voz: cómplice ≠ corporativa. Tutea. Cero astroturfing.
 */

import { recordEvent } from "../messages";
import {
  AgentContext,
  buildEscalationResponse,
  callLLMSafe,
  escalateToPablo,
  fireDRSynapse,
} from "./shared";
import type { AgentResponse } from "../types";

const PERSONA_NIMBO = `
Eres NIMBO, community manager de DarkRoom.

# Tu rol
Mantienes vivo el servidor: das la bienvenida, curas trabajos en #showcase, escribes tutoriales, detectas miembros que pueden estar a punto de cancelar.

# Cómo respondes
- Bienvenida: 2-3 frases con concreto + qué hacer en las primeras 24h.
- Showcase: cuando alguien sube work, comentas algo útil/concreto. NO halagos vacíos.
- Confesionario: si detectas frustración o ausencia, ofreces algo real (pausa membresía, downgrade, llamada con el equipo). NUNCA menciones nombres propios.
- Crisis comms (PR/legal): respuesta firme, transparente, sin atacar. Escalas al equipo humano en paralelo (la herramienta interna ya etiqueta a quién corresponde, tú nunca digas el nombre al usuario).

# Reglas
- Tutea siempre. Frases ≤15 palabras. Cero superlativos vacíos.
- Cero "esto es lo más" / "increíble" / "el mejor".
- Si la pregunta es sobre precio/plan → no respondes tú, dejas que VECTOR coja el hilo.
- Si la pregunta es sobre cuenta/herramienta → no respondes tú, dejas que IRIS coja el hilo.

# Formato
Mensaje corto + acción concreta o pregunta abierta. Cero monólogos.
`.trim();

interface NimboFunction {
  kind: "welcome" | "showcase_react" | "confesionario" | "moderation" | "general";
}

/** Heurística para decidir qué función NIMBO ejecuta dado el ctx.channel + intent. */
function classifyFunction(ctx: AgentContext): NimboFunction {
  if (ctx.channel.endsWith("bienvenida")) return { kind: "welcome" };
  if (ctx.channel.endsWith("showcase") || ctx.channel.endsWith("showcase-creators"))
    return { kind: "showcase_react" };
  if (ctx.channel.endsWith("confesionario")) return { kind: "confesionario" };
  if (ctx.intent.intent === "abuse") return { kind: "moderation" };
  return { kind: "general" };
}

const RETENTION_OFFER_TEXT = `
Veo que algo no encaja. Tres opciones reales:

1. Pausa membresía 30d sin perder tu sitio.
2. Downgrade a plan menor mientras decides.
3. Llamada 15min con el equipo · sin compromiso.

¿Cuál prefieres?
`.trim();

export async function handleWithNimbo(ctx: AgentContext): Promise<AgentResponse> {
  const fn = classifyFunction(ctx);

  // Caso 1: moderation/abuse → escalar
  if (fn.kind === "moderation") {
    await escalateToPablo({
      agent: "nimbo",
      member: ctx.member,
      reason: "moderation:abuse_or_piracy",
      channel: ctx.channel,
      preview: ctx.contentRaw,
    });
    return buildEscalationResponse({
      agent: "nimbo",
      intent: ctx.intent,
      reason: "moderation",
      reply: "Esto no entra en la comunidad. Lo revisa el equipo.",
    });
  }

  // Caso 2: confesionario · sentiment analysis → si negativo, dispara churn risk
  if (fn.kind === "confesionario") {
    const negative = /\b(cancel|baj[ao]|no\s+sirve|frustra|no\s+uso|aburri|no\s+vale\s+la\s+pena)\b/i.test(
      ctx.contentRaw,
    );
    if (negative) {
      await recordEvent({
        memberId: ctx.member.id,
        eventType: "churn_risk_detected",
        payload: { signals: ctx.intent.keywords, channel: ctx.channel },
        deliveredVia: "internal",
        status: "recorded",
      });
      await fireDRSynapse("nimbo", "vector", "retention_call_needed", true);
      return {
        reply: RETENTION_OFFER_TEXT,
        agent: "nimbo",
        llmTier: "none",
        llmConfidence: 0.9,
        escalated: false,
        leadScoreDelta: 0,
        intent: ctx.intent.intent,
        events: [
          {
            memberId: ctx.member.id,
            eventType: "retention_offer_sent",
            payload: { template: "pause_or_downgrade_or_call" },
            deliveredVia: "discord_dm",
            status: "delivered",
          },
        ],
      };
    }
  }

  // Caso 3: si el intent sugiere otro agente (lead/support) deja pasar — el dispatcher
  // decide. Aquí solo cubrimos lo "social/feedback/showcase".
  const { result, fallbackText } = await callLLMSafe(ctx, {
    tier: "standard",
    persona: PERSONA_NIMBO,
    callSite: `darkroom/community/nimbo/${fn.kind}`,
    agent: "nimbo",
    maxTokens: 400,
    temperature: 0.6,
  });

  if (!result) {
    return buildEscalationResponse({
      agent: "nimbo",
      intent: ctx.intent,
      reason: "llm_failure",
      reply: fallbackText ?? "Doy un toque al equipo y te respondemos.",
    });
  }

  // Showcase: registrar event para que aparezca en `darkroom_community_events` y
  // alimentar el viernes "top 3 showcase".
  const events =
    fn.kind === "showcase_react"
      ? [
          {
            memberId: ctx.member.id,
            eventType: "showcase_post" as const,
            payload: { channel: ctx.channel, hash_preview: ctx.contentRaw.slice(0, 60) },
            deliveredVia: "discord_channel" as const,
            status: "recorded" as const,
          },
        ]
      : undefined;

  return {
    reply: result.content,
    agent: "nimbo",
    llmTier: result.tier,
    llmConfidence: ctx.intent.confidence,
    escalated: false,
    leadScoreDelta: 0,
    intent: ctx.intent.intent,
    events,
    tokensUsed: result.tokensIn + result.tokensOut,
    latencyMs: result.latencyMs,
  };
}
