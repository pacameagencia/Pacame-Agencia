import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase (usado por observability async fire-and-forget)
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/resend", () => ({
  notifyPablo: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/observability/request-context", () => ({
  getContext: vi.fn(() => null),
}));

import { llmChat } from "@/lib/llm";

/**
 * Test del camino reasoning → Claude Opus extended thinking.
 * Mockeamos fetch para devolver la shape exacta que la API Anthropic usa con
 * extended thinking (content blocks incluyen tipo "thinking" + "text").
 * Si Anthropic cambia el shape, este test rompe antes de llegar a prod.
 */

describe("llmChat — extended thinking (reasoning tier)", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLAUDE_API_KEY = "test-key";
    process.env.LLM_STRATEGY = "quality-first";
    process.env.LLM_BUDGET_OVERRIDE = "true"; // saltar check budget en test
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("envia thinking parameter + temperature=1 + ajusta max_tokens", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          model: "claude-opus-4-6",
          content: [
            { type: "thinking", thinking: "Analyzing the problem step by step..." },
            { type: "text", text: "Final answer" },
          ],
          usage: { input_tokens: 50, output_tokens: 30 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const result = await llmChat(
      [{ role: "user", content: "solve X" }],
      { tier: "reasoning", maxTokens: 2000, callSite: "test/thinking" }
    );

    // Claude body debe incluir thinking + temperature=1
    expect(capturedBody).toBeTruthy();
    expect((capturedBody as unknown as Record<string, unknown>).thinking).toEqual({
      type: "enabled",
      budget_tokens: 5000,
    });
    expect((capturedBody as unknown as Record<string, unknown>).temperature).toBe(1);
    // max_tokens debe haber subido a thinking budget + 1024 (6024 > 2000 original)
    expect((capturedBody as unknown as Record<string, unknown>).max_tokens).toBe(5000 + 1024);

    // LLMResult debe incluir thinkingContent + provider claude
    expect(result.provider).toBe("claude");
    expect(result.model).toBe("claude-opus-4-6");
    expect(result.content).toBe("Final answer");
    expect(result.thinkingContent).toBe("Analyzing the problem step by step...");
    expect(result.tier).toBe("reasoning");
    expect(result.strategy).toBe("quality-first");
    expect(result.tokensIn).toBe(50);
    expect(result.tokensOut).toBe(30);
    // tokensThinking estimado desde chars del thinking block (~/4)
    expect(result.tokensThinking).toBeGreaterThan(0);
  });

  it("tier premium NO envia thinking parameter (no aplicable)", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          model: "claude-sonnet-4-6",
          content: [{ type: "text", text: "Plain reply" }],
          usage: { input_tokens: 20, output_tokens: 10 },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const result = await llmChat(
      [{ role: "user", content: "hola" }],
      { tier: "premium", maxTokens: 500, callSite: "test/premium" }
    );

    expect((capturedBody as unknown as Record<string, unknown>).thinking).toBeUndefined();
    expect(result.thinkingContent).toBeUndefined();
    expect(result.provider).toBe("claude");
    expect(result.model).toBe("claude-sonnet-4-6");
  });

  it("reasoning en cost-first strategy usa Nebius (sin extended thinking)", async () => {
    // Para este test necesitamos mockear nebiusChat via module mock.
    // Mas simple: forzar Claude a fallar y usar fallback Nebius... pero
    // cost-first pone Nebius PRIMARY asi que lo mas limpio es verificar
    // que no se pasa thinking param cuando el primary es nebius.
    // Mockeamos fetch que al recibir url Nebius devuelve OpenAI-compat shape.
    globalThis.fetch = vi.fn(async (url, init) => {
      const u = String(url);
      if (u.includes("anthropic")) {
        throw new Error("should not hit Claude in cost-first");
      }
      if (u.includes("nebius") || u.includes("tokenfactory")) {
        return new Response(
          JSON.stringify({
            model: "Qwen/Qwen3-Next-80B-A3B-Thinking-fast",
            choices: [
              {
                message: { role: "assistant", content: "Qwen response" },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 15, completion_tokens: 8 },
          }),
          { status: 200 }
        );
      }
      throw new Error(`unexpected fetch: ${u}`);
    }) as typeof fetch;

    const result = await llmChat(
      [{ role: "user", content: "hola" }],
      {
        tier: "reasoning",
        strategy: "cost-first",
        maxTokens: 500,
        callSite: "test/reasoning_cost",
      }
    );

    expect(result.provider).toBe("nebius");
    expect(result.thinkingContent).toBeUndefined();
  });

  it("Claude 4xx error → fallback a Nebius (no rompe el call)", async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("anthropic")) {
        return new Response("{}", { status: 503, statusText: "unavailable" });
      }
      if (u.includes("tokenfactory") || u.includes("nebius")) {
        return new Response(
          JSON.stringify({
            model: "Qwen/Qwen3-235B-A22B-Instruct-2507",
            choices: [
              {
                message: { role: "assistant", content: "Nebius fallback ok" },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 5 },
          }),
          { status: 200 }
        );
      }
      throw new Error(`unexpected: ${u}`);
    }) as typeof fetch;

    const result = await llmChat(
      [{ role: "user", content: "test" }],
      { tier: "premium", maxTokens: 200, callSite: "test/fallback" }
    );

    expect(result.provider).toBe("nebius");
    expect(result.fallback).toBe(true);
    expect(result.content).toBe("Nebius fallback ok");
  });

  it("Si falla primary Y fallback, lanza ultimo error", async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("anthropic")) {
        return new Response("claude down", { status: 503 });
      }
      throw new Error("nebius also down");
    }) as typeof fetch;

    await expect(
      llmChat([{ role: "user", content: "x" }], {
        tier: "premium",
        callSite: "test/all_fail",
      })
    ).rejects.toThrow();
  });
});
