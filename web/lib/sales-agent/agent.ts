/**
 * DarkRoom Sales Agent · runner con Claude tool_use loop.
 *
 * Recibe un mensaje del usuario (vía webhook WhatsApp/Telegram/IG),
 * orquesta una conversación con Claude API (Anthropic Messages) usando
 * el system prompt anónimo de DarkRoom + las tools de tools.ts.
 *
 * Loop:
 *   1. POST /messages con system + messages + tools
 *   2. Si Claude devuelve tool_use → ejecuta dispatchTool, añade tool_result
 *   3. Repetir hasta stop_reason === "end_turn" (máx 4 vueltas)
 *   4. Devuelve la respuesta final (string) + side effects ya ejecutados
 *
 * Modelo: claude-sonnet-4-6 por defecto. Sonnet maneja bien
 * objeciones legales y conversación natural en español.
 *
 * Brand awareness: por ahora solo DarkRoom. PACAME usa otro pipeline
 * (`telegram-assistant.ts`). Cuando converja → mismo runner con `brand`.
 */

import { dispatchTool, DARKROOM_TOOLS, type DarkRoomToolName } from "./tools";
import { darkRoomAgentSystem, type DarkRoomAgentContext } from "./persona-darkroom";
import { qualifyIntent, shouldEscalateImmediately } from "./intent";
import { handleEscalateHuman } from "./tools";
import { getLogger } from "@/lib/observability/logger";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = process.env.CLAUDE_MODEL_DARKROOM_AGENT || "claude-sonnet-4-6";
const MAX_TOOL_ITERATIONS = 4;

interface AnthropicTextBlock { type: "text"; text: string }
interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
interface AnthropicToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}
type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock | AnthropicToolResultBlock;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

interface AnthropicResponse {
  id: string;
  content: AnthropicContentBlock[];
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
  usage?: { input_tokens?: number; output_tokens?: number };
}

export interface RunAgentInput {
  /** Mensaje del usuario (último turn). */
  userMessage: string;
  /** Histórico previo (assistant + user prior turns). Vacío en primer mensaje. */
  history?: AnthropicMessage[];
  /** Contexto del canal + contacto. */
  context: DarkRoomAgentContext;
  /** ID externo del contacto — pasa a las tools. */
  contactId: string;
}

export interface RunAgentResult {
  /** Texto final que se manda al usuario por su canal. */
  reply: string;
  /** Tools que se ejecutaron durante el loop (con su input + result). */
  toolCalls: Array<{ name: string; input: Record<string, unknown>; resultJson: string }>;
  /** Mensajes (assistant) acumulados — se persisten para el próximo turno. */
  conversation: AnthropicMessage[];
  /** True si forzamos escalado humano (legal/refund) sin pasar por Claude. */
  escalatedImmediately: boolean;
  /** Tokens usados (info para budget). */
  tokensIn: number;
  tokensOut: number;
}

/**
 * Runner principal. Orquesta el ciclo Claude ↔ tools hasta que el modelo
 * cierra la respuesta. Devuelve el texto final que se enviará al canal.
 */
export async function runDarkRoomAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const log = getLogger();
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return fallbackResponse("No tenemos disponible el agente ahora mismo. Te derivamos a un humano.", []);
  }

  // Detectar intent + escalado obligatorio (legal/refund) antes de pagar al LLM
  const qualified = qualifyIntent(input.userMessage);
  if (shouldEscalateImmediately(qualified.intent)) {
    await handleEscalateHuman({
      contact_id: input.contactId,
      reason: qualified.intent === "legal" ? "legal" : "refund",
      summary: `Mensaje del usuario: ${input.userMessage.slice(0, 220)}`,
    });
    const reply =
      qualified.intent === "legal"
        ? "Tu pregunta requiere respuesta cuidadosa de nuestro equipo. Lo derivamos al humano y te respondemos pronto. Mientras, todos los términos legales están en darkroomcreative.cloud/legal."
        : "Tu solicitud de devolución la atiende un humano para resolverla bien. Lo escalamos y te volvemos a escribir desde support@darkroomcreative.cloud.";
    return {
      reply,
      toolCalls: [{ name: "escalate_human", input: { reason: qualified.intent }, resultJson: "{}" }],
      conversation: [
        { role: "user", content: input.userMessage },
        { role: "assistant", content: reply },
      ],
      escalatedImmediately: true,
      tokensIn: 0,
      tokensOut: 0,
    };
  }

  const enrichedCtx: DarkRoomAgentContext = { ...input.context, qualified };
  const system = darkRoomAgentSystem(enrichedCtx);

  const messages: AnthropicMessage[] = [
    ...(input.history || []),
    { role: "user", content: input.userMessage },
  ];

  const toolCalls: RunAgentResult["toolCalls"] = [];
  let totalIn = 0;
  let totalOut = 0;

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    let resp: AnthropicResponse;
    try {
      resp = await callClaude({
        apiKey,
        system,
        messages,
        tools: DARKROOM_TOOLS,
      });
    } catch (err) {
      log.error({ err, iter }, "[sales-agent] Claude call failed");
      return fallbackResponse(
        "El sistema está sobrecargado un momento. Vuelve a escribir en 1 minuto, va.",
        toolCalls
      );
    }

    totalIn += resp.usage?.input_tokens || 0;
    totalOut += resp.usage?.output_tokens || 0;

    // Acumular respuesta del assistant en el histórico
    messages.push({ role: "assistant", content: resp.content });

    // Si el modelo cierra el turno, extraemos texto y salimos
    if (resp.stop_reason === "end_turn" || resp.stop_reason === "max_tokens" || resp.stop_reason === "stop_sequence") {
      const text = extractText(resp.content);
      return {
        reply: text || "Vale, anotado. Si necesitas algo más, dímelo.",
        toolCalls,
        conversation: messages,
        escalatedImmediately: false,
        tokensIn: totalIn,
        tokensOut: totalOut,
      };
    }

    // Si pidió tool_use, ejecutar todas las tool_use blocks de esta respuesta
    if (resp.stop_reason === "tool_use") {
      const toolUses = resp.content.filter(
        (b): b is AnthropicToolUseBlock => b.type === "tool_use"
      );
      const toolResults: AnthropicToolResultBlock[] = [];
      for (const t of toolUses) {
        const resultJson = await dispatchTool(t.name as DarkRoomToolName, t.input);
        toolCalls.push({ name: t.name, input: t.input, resultJson });
        toolResults.push({
          type: "tool_result",
          tool_use_id: t.id,
          content: resultJson,
        });
      }
      // Inyectar tool_results como user para próximo round
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Stop reason no esperado
    log.warn({ stop_reason: resp.stop_reason, iter }, "[sales-agent] unexpected stop_reason");
    break;
  }

  // Si llegamos aquí, agotamos iteraciones — devolvemos lo último coherente o fallback
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const text = lastAssistant ? extractText(toBlocks(lastAssistant.content)) : "";
  return {
    reply: text || "Te respondemos en cuanto el equipo lo confirme.",
    toolCalls,
    conversation: messages,
    escalatedImmediately: false,
    tokensIn: totalIn,
    tokensOut: totalOut,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callClaude(args: {
  apiKey: string;
  system: string;
  messages: AnthropicMessage[];
  tools: typeof DARKROOM_TOOLS | readonly unknown[];
}): Promise<AnthropicResponse> {
  const body = {
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system: args.system,
    messages: args.messages,
    tools: args.tools,
  };
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Claude HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as AnthropicResponse;
}

function extractText(content: AnthropicContentBlock[]): string {
  return content
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function toBlocks(content: string | AnthropicContentBlock[]): AnthropicContentBlock[] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  return content;
}

function fallbackResponse(
  msg: string,
  toolCalls: RunAgentResult["toolCalls"]
): RunAgentResult {
  return {
    reply: msg,
    toolCalls,
    conversation: [],
    escalatedImmediately: false,
    tokensIn: 0,
    tokensOut: 0,
  };
}
