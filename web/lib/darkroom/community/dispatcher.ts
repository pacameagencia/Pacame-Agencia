/**
 * Dispatcher · enruta un mensaje entrante al agente correcto IRIS/NIMBO/VECTOR.
 *
 * Flujo:
 *   1. Anti-spam (5 mismos mensajes en 60s) → silencioso, no responde.
 *   2. Detecta intent (heurística + LLM economy si hace falta).
 *   3. Si escalateToHuman → IRIS responde + escala al humano.
 *   4. Si suggestedAgent es uno de IRIS/NIMBO/VECTOR → ejecuta.
 *   5. Registra mensaje + eventos en Supabase.
 *
 * Idempotencia: si el mismo mensaje ya está hashed en últimos 60s, salta.
 */

import { getLogger } from "@/lib/observability/logger";
import { detectIntent } from "./intent-detector";
import { isLikelySpam, recordEvent, recordMessage } from "./messages";
import { handleWithIris } from "./agents/iris";
import { handleWithNimbo } from "./agents/nimbo";
import { handleWithVector } from "./agents/vector";
import { upsertMember } from "./members";
import type {
  AgentName,
  AgentResponse,
  CommunityChannel,
  CommunityMember,
  IntentDetection,
  MemberLookup,
} from "./types";

export interface DispatchInput {
  lookup: MemberLookup;
  channel: CommunityChannel;
  contentRaw: string;
  /** Datos contextuales para crear/actualizar el miembro si no existe. */
  memberHints?: {
    discordUsername?: string;
    displayName?: string;
    email?: string;
  };
}

export interface DispatchResult {
  member: CommunityMember;
  intent: IntentDetection;
  response: AgentResponse | null;
  silent: boolean;
  reason?: string;
}

export async function dispatch(input: DispatchInput): Promise<DispatchResult> {
  const member = await upsertMember({
    lookup: input.lookup,
    patch: {
      discordUsername: input.memberHints?.discordUsername,
      displayName: input.memberHints?.displayName,
      email: input.memberHints?.email,
    },
  });

  // 1. Anti-spam
  if (await isLikelySpam(member.id, input.contentRaw)) {
    getLogger().warn({ memberId: member.id }, "[dr-dispatcher] spam detected, silent drop");
    await recordMessage({
      memberId: member.id,
      channel: input.channel,
      direction: "inbound",
      contentRaw: input.contentRaw,
      meta: { dropped_reason: "spam" },
    });
    return {
      member,
      intent: {
        intent: "abuse",
        confidence: 1,
        keywords: ["spam:repeated"],
        suggestedAgent: "iris",
        escalateToHuman: false,
      },
      response: null,
      silent: true,
      reason: "spam",
    };
  }

  // 2. Intent detect
  const intent = await detectIntent(input.contentRaw, {
    callSite: "darkroom/community/dispatcher",
  });

  // 3. Inbound message recorded ANTES de la respuesta del agente
  await recordMessage({
    memberId: member.id,
    channel: input.channel,
    direction: "inbound",
    intentDetected: intent.intent,
    contentRaw: input.contentRaw,
    meta: { keywords: intent.keywords, confidence: intent.confidence },
  });

  // 4. Pick agent
  const agent: AgentName = intent.suggestedAgent;
  const ctx = {
    member,
    intent,
    contentRaw: input.contentRaw,
    channel: input.channel,
  };

  let response: AgentResponse;
  try {
    if (agent === "iris" || intent.escalateToHuman) {
      response = await handleWithIris(ctx);
    } else if (agent === "vector") {
      response = await handleWithVector(ctx);
    } else if (agent === "nimbo") {
      response = await handleWithNimbo(ctx);
    } else {
      // human:pablo o desconocido — pasamos por IRIS para escalation segura
      response = await handleWithIris(ctx);
    }
  } catch (err) {
    getLogger().error({ err, agent, memberId: member.id }, "[dr-dispatcher] agent failed");
    return {
      member,
      intent,
      response: null,
      silent: false,
      reason: "agent_error",
    };
  }

  // 5. Outbound message + events
  await recordMessage({
    memberId: member.id,
    channel: input.channel,
    direction: "outbound",
    agentHandler: response.agent,
    intentDetected: response.intent,
    contentRaw: response.reply,
    leadScoreDelta: response.leadScoreDelta,
    escalated: response.escalated,
    llmTier: response.llmTier,
    llmConfidence: response.llmConfidence,
    meta: {
      escalation_reason: response.escalationReason,
      tokens_used: response.tokensUsed,
      latency_ms: response.latencyMs,
    },
  });

  if (response.events?.length) {
    await Promise.allSettled(response.events.map((ev) => recordEvent(ev)));
  }

  return {
    member,
    intent,
    response,
    silent: false,
  };
}
