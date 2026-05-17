/**
 * @deprecated Sprint v0.10.30 (2026-05-17)
 *
 * Cliente Gemma 4 / Ollama RETIRADO del stack PACAME.
 *
 * Razón: bloqueaba migración VPS Hostinger → Contabo (consumía 2-4 GB RAM
 * en el VPS solo por Ollama). Sustituido por:
 *  - Embeddings: OpenAI text-embedding-3-large (v0.10.29, lib/embed-openai.ts)
 *  - LLM economy tier: Claude Haiku 4.5 (v0.10.30, lib/llm.ts)
 *
 * Este archivo se mantiene como STUB que lanza para detectar callers legacy.
 * Plan: borrar completamente en v0.10.33 cuando confirmemos que ningún
 * archivo del workspace lo usa.
 */

export interface GemmaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GemmaResponse {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
}

export interface GemmaOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * @deprecated Llamar a este shim lanza error — usar llmChat({ tier: "economy" })
 * que rutea automáticamente a Claude Haiku 4.5.
 */
export async function gemmaChat(
  _messages: GemmaMessage[],
  _opts: GemmaOptions = {},
): Promise<GemmaResponse> {
  throw new Error(
    "[gemma] gemmaChat() ha sido retirado en v0.10.30. " +
      'Usar `import { llmChat } from "@/lib/llm"` con `tier: "economy"` ' +
      "(rutea a Claude Haiku 4.5 + Nebius fallback)."
  );
}
