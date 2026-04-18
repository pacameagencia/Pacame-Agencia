import { llmChat, extractJSON, type LLMTier, type LLMMessage } from "@/lib/llm";
import type { ServiceDelivery, DeliveryContext, DeliveryResult } from "./types";

/**
 * Abstract base class for delivery implementations.
 * Provides shared helpers for LLM calls, cost tracking, and safety defaults.
 */
export abstract class BaseDelivery implements ServiceDelivery {
  abstract readonly slug: string;
  abstract readonly name: string;
  abstract execute(ctx: DeliveryContext): Promise<DeliveryResult>;

  /** Estimated USD cost per 1K tokens by tier — rough */
  protected estimateLLMCost(
    tier: LLMTier,
    tokensIn: number,
    tokensOut: number
  ): number {
    const rates: Record<LLMTier, { in: number; out: number }> = {
      titan: { in: 0.003, out: 0.009 },
      premium: { in: 0.001, out: 0.003 },
      standard: { in: 0.0003, out: 0.0009 },
      economy: { in: 0.00005, out: 0.00015 },
    };
    const r = rates[tier];
    return (tokensIn / 1000) * r.in + (tokensOut / 1000) * r.out;
  }

  /**
   * Wrapper around llmChat that returns content + estimated cost.
   * Throws on failure — caller should try/catch for orchestrator escalation.
   */
  protected async chat(
    messages: LLMMessage[],
    tier: LLMTier = "standard",
    opts: { maxTokens?: number; temperature?: number } = {}
  ): Promise<{ content: string; costUsd: number; tokensIn: number; tokensOut: number; model: string }> {
    const result = await llmChat(messages, {
      tier,
      maxTokens: opts.maxTokens ?? 1200,
      temperature: opts.temperature ?? 0.7,
    });
    const costUsd = this.estimateLLMCost(tier, result.tokensIn, result.tokensOut);
    return {
      content: result.content,
      costUsd,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      model: result.model,
    };
  }

  /** Parse JSON with fallback to empty object */
  protected safeJSON<T = Record<string, unknown>>(text: string): T | null {
    return extractJSON<T>(text);
  }
}
