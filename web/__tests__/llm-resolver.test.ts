import { describe, it, expect } from "vitest";
import {
  resolveTierToModel,
  resolveStrategy,
  degradeTier,
  type ResolverEnv,
} from "@/lib/llm/resolver";

describe("resolveTierToModel", () => {
  it("quality-first: reasoning → Claude Opus primary + extended thinking", () => {
    const r = resolveTierToModel("reasoning", "quality-first");
    expect(r.providerOrder[0]).toBe("claude");
    expect(r.models.claude).toBe("claude-opus-4-6");
    expect(r.extras?.extendedThinking?.budgetTokens).toBe(5000);
  });

  it("quality-first: titan → Claude Opus primary (sin extended thinking)", () => {
    const r = resolveTierToModel("titan", "quality-first");
    expect(r.providerOrder).toEqual(["claude", "nebius"]);
    expect(r.models.claude).toBe("claude-opus-4-6");
    expect(r.extras).toBeUndefined();
  });

  it("quality-first: premium → Claude Sonnet primary", () => {
    const r = resolveTierToModel("premium", "quality-first");
    expect(r.providerOrder[0]).toBe("claude");
    expect(r.models.claude).toBe("claude-sonnet-4-6");
    expect(r.models.nebius).toContain("Qwen3-235B");
  });

  it("quality-first: standard → Nebius primary (NO Claude primary)", () => {
    const r = resolveTierToModel("standard", "quality-first");
    expect(r.providerOrder[0]).toBe("nebius");
    expect(r.providerOrder[1]).toBe("claude");
  });

  it("quality-first: economy → Gemma primary, luego Nebius, luego Claude", () => {
    const r = resolveTierToModel("economy", "quality-first");
    expect(r.providerOrder).toEqual(["gemma", "nebius", "claude"]);
  });

  it("cost-first: titan → Nebius primary (Kimi o override env)", () => {
    const r = resolveTierToModel("titan", "cost-first");
    expect(r.providerOrder[0]).toBe("nebius");
    expect(r.providerOrder[1]).toBe("claude");
    expect(r.models.nebius).toContain("Kimi");
  });

  it("cost-first: premium → Nebius primary", () => {
    const r = resolveTierToModel("premium", "cost-first");
    expect(r.providerOrder[0]).toBe("nebius");
  });

  it("cost-first no afecta economy (siempre gemma first)", () => {
    const r = resolveTierToModel("economy", "cost-first");
    expect(r.providerOrder[0]).toBe("gemma");
  });

  it("env override: CLAUDE_MODEL_TITAN cambia el modelo", () => {
    const env: ResolverEnv = { CLAUDE_MODEL_TITAN: "claude-next-preview" };
    const r = resolveTierToModel("titan", "quality-first", env);
    expect(r.models.claude).toBe("claude-next-preview");
  });

  it("env override: NEBIUS_MODEL_PREMIUM cambia el modelo", () => {
    const env: ResolverEnv = { NEBIUS_MODEL_PREMIUM: "custom/model-x" };
    const r = resolveTierToModel("premium", "quality-first", env);
    expect(r.models.nebius).toBe("custom/model-x");
  });

  it("env override: LLM_THINKING_BUDGET_TOKENS ajusta extended thinking", () => {
    const env: ResolverEnv = { LLM_THINKING_BUDGET_TOKENS: "10000" };
    const r = resolveTierToModel("reasoning", "quality-first", env);
    expect(r.extras?.extendedThinking?.budgetTokens).toBe(10000);
  });

  it("reasoning en cost-first NO usa extended thinking (Nebius primary no soporta Claude thinking)", () => {
    const r = resolveTierToModel("reasoning", "cost-first");
    expect(r.providerOrder[0]).toBe("nebius");
    expect(r.extras).toBeUndefined();
  });

  it("tier invalido lanza", () => {
    // @ts-expect-error invalid tier for test
    expect(() => resolveTierToModel("superultra", "quality-first")).toThrow();
  });
});

describe("resolveStrategy", () => {
  it("opts.strategy tiene prioridad maxima", () => {
    expect(resolveStrategy("cost-first", { LLM_STRATEGY: "quality-first" })).toBe("cost-first");
    expect(resolveStrategy("quality-first", { LLM_STRATEGY: "cost-first" })).toBe("quality-first");
  });

  it("env.LLM_STRATEGY se aplica si opts.strategy undefined", () => {
    expect(resolveStrategy(undefined, { LLM_STRATEGY: "cost-first" })).toBe("cost-first");
  });

  it("default = quality-first si nada esta seteado", () => {
    expect(resolveStrategy(undefined, {})).toBe("quality-first");
  });

  it("env.LLM_STRATEGY con valor desconocido → default quality-first", () => {
    expect(resolveStrategy(undefined, { LLM_STRATEGY: "foo" })).toBe("quality-first");
  });
});

describe("degradeTier", () => {
  it("cadena correcta", () => {
    expect(degradeTier("reasoning")).toBe("titan");
    expect(degradeTier("titan")).toBe("premium");
    expect(degradeTier("premium")).toBe("standard");
    expect(degradeTier("standard")).toBe("economy");
    expect(degradeTier("economy")).toBeNull();
  });
});
