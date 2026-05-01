/**
 * Helpers compartidos por los 3 agentes DR (IRIS/NIMBO/VECTOR).
 * Centralizamos: prompt builder, fireSynapse wrappers, escalation a Pablo via Telegram.
 */

import { llmChat } from "@/lib/llm";
import type { LLMTier, LLMMessage, LLMResult } from "@/lib/llm";
import { fireSynapse } from "@/lib/neural";
import { getLogger } from "@/lib/observability/logger";
import { sendTelegram } from "@/lib/telegram";
import { DR_SYSTEM_PROMPT_BASE } from "../voice";
import type { AgentName, AgentResponse, CommunityMember, IntentDetection } from "../types";

export interface AgentContext {
  member: CommunityMember;
  intent: IntentDetection;
  contentRaw: string;
  channel: string;
  /** Conversación previa reciente (últimos 6-10 turnos), opcional. */
  history?: LLMMessage[];
}

export interface AgentRunOpts {
  /** Tier LLM por defecto del agente; puede sobreescribirse por call. */
  tier: LLMTier;
  /** System prompt específico (persona del agente). */
  persona: string;
  callSite: string;
  agent: AgentName;
  /** Si true, fuerza escalation a Pablo SIEMPRE (ej. cancellation, abuse). */
  forceEscalate?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Construye el system prompt completo: voz DR base + persona del agente.
 * Mantener estable evita drift y blinda contra menciones a PACAME.
 */
export function buildSystemPrompt(persona: string): string {
  return [DR_SYSTEM_PROMPT_BASE, "", "# Persona", persona.trim()].join("\n");
}

/** Llama al LLM con safety net: si falla, devuelve fallback "te paso a humano". */
export async function callLLMSafe(
  ctx: AgentContext,
  opts: AgentRunOpts,
): Promise<{ result: LLMResult | null; fallbackText: string | null }> {
  const messages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt(opts.persona) },
    ...(ctx.history ?? []),
    { role: "user", content: ctx.contentRaw.slice(0, 2000) },
  ];
  try {
    const result = await llmChat(messages, {
      tier: opts.tier,
      maxTokens: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.5,
      callSite: opts.callSite,
      agentId: opts.agent,
      brainContext: false, // los agentes DR usan KB local, no cerebro PACAME
    });
    return { result, fallbackText: null };
  } catch (err) {
    getLogger().error({ err, agent: opts.agent }, "[dr-agent] LLM call failed");
    return {
      result: null,
      fallbackText:
        "No estoy seguro de cómo responder. Te paso al equipo en menos de 2h. Mientras: si es urgente escribe a support@darkroomcreative.cloud.",
    };
  }
}

/** Escala a Pablo via Telegram bot (PACAME bot personal). */
export async function escalateToPablo(args: {
  agent: AgentName;
  member: CommunityMember;
  reason: string;
  channel: string;
  preview: string;
}): Promise<void> {
  const text =
    `🚨 [DR · ${args.agent.toUpperCase()}] escalation\n\n` +
    `Member: ${args.member.displayName ?? args.member.email ?? args.member.id}\n` +
    `Tier: ${args.member.tier} · Score: ${args.member.leadScore}\n` +
    `Channel: ${args.channel}\n` +
    `Reason: ${args.reason}\n\n` +
    `Preview: ${args.preview.slice(0, 240)}`;
  // brand: pacame es el bot personal Pablo (mantiene canal conocido)
  try {
    await sendTelegram(text, { brand: "pacame" });
  } catch (err) {
    getLogger().error({ err }, "[dr-agent] escalate to Pablo failed");
  }
}

/**
 * Helper para registrar synapse cross-agente.
 * Ejemplos:
 *   fireDRSynapse('iris','vector','detects_buying_intent',true)
 *   fireDRSynapse('vector','nimbo','onboard_new_member',true)
 *   fireDRSynapse('nimbo','vector','retention_call_needed',true)
 */
export async function fireDRSynapse(
  from: AgentName,
  to: AgentName,
  type: string,
  success = true,
): Promise<void> {
  try {
    // Cast a string-ok: fireSynapse acepta string además del enum AgentId.
    await fireSynapse(from, to, type as never, success);
  } catch (err) {
    getLogger().warn({ err, from, to, type }, "[dr-agent] fireSynapse failed");
  }
}

/** Construye un AgentResponse mínimo cuando no hay LLM (escalation puro). */
export function buildEscalationResponse(args: {
  agent: AgentName;
  intent: IntentDetection;
  reason: string;
  reply?: string;
}): AgentResponse {
  return {
    reply:
      args.reply ??
      "Esto lo gestiona el equipo directamente. Te escribimos en menos de 2h.",
    agent: args.agent,
    llmTier: "none",
    llmConfidence: 1,
    escalated: true,
    escalationReason: args.reason,
    leadScoreDelta: 0,
    intent: args.intent.intent,
  };
}
