import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase before import
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(),
}));

// Mock resend to avoid real network
vi.mock("@/lib/resend", () => ({
  notifyPablo: vi.fn().mockResolvedValue(null),
}));

import {
  checkBudget,
  enforceBudget,
  LlmBudgetExceeded,
  resetBudgetWarnings,
  getDailySpendEur,
} from "@/lib/llm/budget-guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyPablo } from "@/lib/resend";

function mockSpend(costUsd: number, error?: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue(
    error ? { data: null, error } : { data: { cost_usd: costUsd }, error: null }
  );
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  (createServerSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ from });
}

describe("budget-guard", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetBudgetWarnings();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Nuke any budget env vars so we use defaults
    delete process.env.LLM_BUDGET_TITAN_EUR_DAILY;
    delete process.env.LLM_BUDGET_PREMIUM_EUR_DAILY;
    delete process.env.LLM_BUDGET_REASONING_EUR_DAILY;
    delete process.env.LLM_BUDGET_STANDARD_EUR_DAILY;
    delete process.env.LLM_BUDGET_ECONOMY_EUR_DAILY;
    delete process.env.LLM_BUDGET_OVERRIDE;
    process.env.LLM_USD_TO_EUR = "1"; // simplifica calculos
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("under budget: allowed=true, no warning, no notify", async () => {
    mockSpend(1); // 1 USD = 1 EUR
    const r = await checkBudget("premium");
    expect(r.allowed).toBe(true);
    expect(r.warning).toBe(false);
    expect(r.capEur).toBe(30);
    expect(notifyPablo).not.toHaveBeenCalled();
  });

  it("80% budget: allowed=true PERO warning=true + notifyPablo", async () => {
    mockSpend(24); // 24€ / cap 30€ = 80%
    const r = await checkBudget("premium");
    expect(r.allowed).toBe(true);
    expect(r.warning).toBe(true);
    expect(notifyPablo).toHaveBeenCalledTimes(1);
  });

  it("80% no vuelve a disparar warning en mismo dia/tier", async () => {
    mockSpend(24);
    await checkBudget("premium");
    await checkBudget("premium");
    await checkBudget("premium");
    expect(notifyPablo).toHaveBeenCalledTimes(1);
  });

  it("100% budget: allowed=false (pero checkBudget NO lanza)", async () => {
    mockSpend(30);
    const r = await checkBudget("premium");
    expect(r.allowed).toBe(false);
  });

  it("over budget con enforceBudget → lanza LlmBudgetExceeded", async () => {
    mockSpend(31);
    await expect(enforceBudget("premium")).rejects.toBeInstanceOf(LlmBudgetExceeded);
  });

  it("LLM_BUDGET_OVERRIDE=true ignora el cap", async () => {
    mockSpend(100);
    process.env.LLM_BUDGET_OVERRIDE = "true";
    const r = await checkBudget("premium");
    expect(r.allowed).toBe(true);
    expect(r.override).toBe(true);
  });

  it("opts.skipBudgetCheck ignora el cap por call", async () => {
    mockSpend(100);
    const r = await checkBudget("premium", { skipBudgetCheck: true });
    expect(r.allowed).toBe(true);
  });

  it("env var custom override cambia el cap", async () => {
    process.env.LLM_BUDGET_PREMIUM_EUR_DAILY = "100";
    mockSpend(50);
    const r = await checkBudget("premium");
    expect(r.capEur).toBe(100);
    expect(r.allowed).toBe(true);
  });

  it("DB error → fail-open (allowed=true, spent=0)", async () => {
    mockSpend(0, new Error("db down"));
    const r = await checkBudget("premium");
    expect(r.allowed).toBe(true);
    expect(r.spentEur).toBe(0);
  });

  it("getDailySpendEur aplica tipo de cambio USD→EUR", async () => {
    process.env.LLM_USD_TO_EUR = "0.9";
    mockSpend(10); // 10 USD
    const spent = await getDailySpendEur("titan");
    expect(spent).toBeCloseTo(9, 5);
  });

  it("LlmBudgetExceeded incluye tier + spent + cap", async () => {
    mockSpend(50);
    try {
      await enforceBudget("titan");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(LlmBudgetExceeded);
      const e = err as LlmBudgetExceeded;
      expect(e.tier).toBe("titan");
      expect(e.spentEur).toBe(50);
      expect(e.capEur).toBe(20);
    }
  });
});
