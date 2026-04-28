/**
 * PACAME — Brain Context Injection
 *
 * Inyecta contexto del cerebro neural (memorias + sinapsis) en el prompt
 * de un agente ANTES de generar respuesta. Resuelve el problema "los agentes
 * no se enteran de lo aprendido" — solo DIOS+SAGE consultaban el cerebro
 * en cron; ahora cualquier agente registrado lo consulta automaticamente.
 *
 * No-bloqueante: si la consulta al cerebro falla por cualquier motivo,
 * el agente sigue respondiendo sin contexto. Nunca rompe el flujo principal.
 *
 * Uso (manual):
 *   const enriched = await withBrainContext("nova", messages, { tags: ["branding"] });
 *   await llmChat(enriched, opts);
 *
 * Uso (automatico via llmChat):
 *   await llmChat(messages, { tier: "premium", agentId: "nova", brainContext: true });
 */
import { recallMemories, getAgentConnections, type AgentId } from "@/lib/neural";
import type { LLMMessage } from "@/lib/llm";

const REGISTERED_AGENTS = new Set<AgentId>([
  "dios", "sage", "atlas", "nexus", "pixel",
  "core", "pulse", "nova", "copy", "lens",
]);

/** Agentes registrados de PACAME (validador). */
export function isRegisteredAgent(agentId: string | undefined | null): agentId is AgentId {
  return !!agentId && REGISTERED_AGENTS.has(agentId.toLowerCase() as AgentId);
}

export interface BrainContextOptions {
  /** Tags semanticos para filtrar memorias relevantes a la tarea actual. */
  tags?: string[];
  /** Numero maximo de memorias a recuperar (default 3). */
  memoryLimit?: number;
  /** Importancia minima para considerar una memoria (default 0.5, rango [0,1]). */
  minImportance?: number;
  /** Numero maximo de sinapsis a incluir en el contexto (default 5). */
  synapseLimit?: number;
  /** Si true, no inyecta nada y devuelve los messages tal cual. Util para tests o debug. */
  skip?: boolean;
}

/**
 * Construye un bloque de texto plano con las memorias y sinapsis recientes
 * del agente. Este bloque se prepende como system message al prompt original.
 *
 * Si no hay memorias ni sinapsis relevantes, devuelve null y el caller
 * sigue sin inyectar nada.
 */
export async function buildBrainContextBlock(
  agentId: AgentId,
  opts: BrainContextOptions = {}
): Promise<string | null> {
  const memoryLimit = opts.memoryLimit ?? 3;
  const minImportance = opts.minImportance ?? 0.5;
  const synapseLimit = opts.synapseLimit ?? 5;

  try {
    const [memories, synapses] = await Promise.all([
      recallMemories(agentId, {
        limit: memoryLimit,
        minImportance,
        tags: opts.tags,
      }),
      getAgentConnections(agentId),
    ]);

    const hasMemories = memories && memories.length > 0;
    const hasSynapses = synapses && synapses.length > 0;
    if (!hasMemories && !hasSynapses) return null;

    const lines: string[] = [
      `[Cerebro PACAME · contexto activo del agente ${agentId.toUpperCase()}]`,
    ];

    if (hasMemories) {
      lines.push("", "Memorias relevantes (top " + memories.length + "):");
      for (const m of memories) {
        const title = (m.title as string | undefined) || "(sin titulo)";
        const content = (m.content as string | undefined) || "";
        const importance = typeof m.importance === "number" ? m.importance : 0;
        const tags = Array.isArray(m.tags) ? (m.tags as string[]).join(", ") : "";
        const tagsSuffix = tags ? ` [${tags}]` : "";
        const trimmedContent = content.length > 220 ? content.slice(0, 220).trim() + "…" : content;
        lines.push(`- ${title} (importancia ${importance.toFixed(2)})${tagsSuffix}`);
        if (trimmedContent) lines.push(`  ${trimmedContent}`);
      }
    }

    if (hasSynapses) {
      const top = synapses.slice(0, synapseLimit);
      lines.push("", `Sinapsis activas (top ${top.length}):`);
      for (const s of top) {
        const from = (s.from_agent as string | undefined) || "?";
        const to = (s.to_agent as string | undefined) || "?";
        const type = (s.type as string | undefined) || "collaborates_with";
        const weight = typeof s.weight === "number" ? s.weight : 0;
        lines.push(`- ${from} →[${type}]→ ${to} · peso ${weight.toFixed(2)}`);
      }
    }

    lines.push(
      "",
      "Usa este contexto para mantener coherencia con decisiones, aprendizajes y colaboraciones previas. No lo cites textualmente; intégralo en tu razonamiento."
    );

    return lines.join("\n");
  } catch {
    // No-bloqueante: si Supabase falla, agente responde sin contexto.
    return null;
  }
}

/**
 * Envoltura idempotente sobre `messages`: si `agentId` es un agente PACAME
 * registrado, recupera memorias/sinapsis del cerebro y las prepende como
 * system message. Devuelve siempre un array nuevo (no muta el original).
 *
 * Si `agentId` no es un agente registrado, o si la consulta no devuelve
 * datos, devuelve `messages` sin cambios.
 */
export async function withBrainContext(
  agentId: string | undefined | null,
  messages: LLMMessage[],
  opts: BrainContextOptions = {}
): Promise<LLMMessage[]> {
  if (opts.skip) return messages;
  if (!isRegisteredAgent(agentId)) return messages;

  const block = await buildBrainContextBlock(agentId.toLowerCase() as AgentId, opts);
  if (!block) return messages;

  // Prepend as system message. If there is already a system message at index 0,
  // we keep it and add ours BEFORE so the agent persona stays as the dominant
  // system instruction (closest to user message has more weight in some models).
  return [{ role: "system" as const, content: block }, ...messages];
}
