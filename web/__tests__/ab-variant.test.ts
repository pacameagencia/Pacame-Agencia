import { describe, it, expect } from "vitest";
import { pickVariant } from "@/lib/ab/variant";

describe("pickVariant", () => {
  it("devuelve una variante del array pasado", () => {
    const variants = ["control", "variant-a"];
    const result = pickVariant("session-123", "hero-test", variants);
    expect(variants).toContain(result);
  });

  it("deterministic: mismo seed + mismo test = misma variant", () => {
    const v1 = pickVariant("session-abc", "hero-test", ["control", "variant-a"]);
    const v2 = pickVariant("session-abc", "hero-test", ["control", "variant-a"]);
    expect(v1).toBe(v2);
  });

  it("diferente test name = potencialmente diferente variant", () => {
    // Con suficientes samples, al menos 1 par difiere
    const variants = ["a", "b", "c", "d"];
    let sameCount = 0;
    for (let i = 0; i < 20; i++) {
      const seed = `seed-${i}`;
      const v1 = pickVariant(seed, "test-1", variants);
      const v2 = pickVariant(seed, "test-2", variants);
      if (v1 === v2) sameCount++;
    }
    // Con 4 variants + hash diferente, no deberian coincidir todas las 20
    expect(sameCount).toBeLessThan(20);
  });

  it("distribucion aproximadamente uniforme sobre 1000 seeds", () => {
    const variants = ["a", "b"];
    const counts: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 1000; i++) {
      const v = pickVariant(`session-${i}`, "test", variants);
      counts[v]++;
    }
    // Cada bucket entre 30% y 70% (permite desviacion)
    expect(counts.a).toBeGreaterThan(300);
    expect(counts.a).toBeLessThan(700);
    expect(counts.b).toBeGreaterThan(300);
    expect(counts.b).toBeLessThan(700);
  });

  it("variants vacio devuelve empty string (no crashea)", () => {
    expect(pickVariant("seed", "test", [])).toBe("");
  });

  it("variants 1 elemento siempre devuelve ese", () => {
    expect(pickVariant("seed-1", "test", ["only"])).toBe("only");
    expect(pickVariant("seed-2", "test", ["only"])).toBe("only");
  });
});
