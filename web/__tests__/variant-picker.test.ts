import { describe, it, expect } from "vitest";
import { pickVariant, type Variant } from "@/lib/lifecycle/variant-picker";

const v = (overrides: Partial<Variant>): Variant => ({
  variant_key: overrides.variant_key || "A",
  subject: overrides.subject || "subject A",
  preheader: overrides.preheader ?? null,
  weight: overrides.weight,
  is_active: overrides.is_active ?? true,
});

describe("pickVariant", () => {
  it("devuelve null si no hay variantes activas", () => {
    expect(pickVariant([], "c-1", "welcome_d0")).toBeNull();
    expect(
      pickVariant(
        [v({ variant_key: "A", is_active: false })],
        "c-1",
        "welcome_d0"
      )
    ).toBeNull();
  });

  it("si hay 1 activa, siempre la elige", () => {
    const only = v({ variant_key: "SOLO" });
    for (let i = 0; i < 20; i++) {
      expect(pickVariant([only], `c-${i}`, "welcome_d0")?.variant_key).toBe("SOLO");
    }
  });

  it("es determinista para mismo client + email_type", () => {
    const variants = [
      v({ variant_key: "A", weight: 1 }),
      v({ variant_key: "B", weight: 1 }),
      v({ variant_key: "C", weight: 1 }),
    ];
    const first = pickVariant(variants, "client-abc", "welcome_d0");
    for (let i = 0; i < 10; i++) {
      expect(pickVariant(variants, "client-abc", "welcome_d0")?.variant_key).toBe(
        first?.variant_key
      );
    }
  });

  it("diferente email_type puede dar diferente variant al mismo client", () => {
    const variants = [
      v({ variant_key: "A", weight: 1 }),
      v({ variant_key: "B", weight: 1 }),
    ];
    // Para ~500 clients distintos en 2 tipos, debe haber diferencias en al menos 1
    let anyDifferent = false;
    for (let i = 0; i < 500; i++) {
      const a = pickVariant(variants, `cx-${i}`, "welcome_d0")?.variant_key;
      const b = pickVariant(variants, `cx-${i}`, "tips_d2")?.variant_key;
      if (a !== b) {
        anyDifferent = true;
        break;
      }
    }
    expect(anyDifferent).toBe(true);
  });

  it("distribuye aproximadamente segun weight (50/50)", () => {
    const variants = [
      v({ variant_key: "A", weight: 1 }),
      v({ variant_key: "B", weight: 1 }),
    ];
    const counts: Record<string, number> = { A: 0, B: 0 };
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const pick = pickVariant(variants, `client-${i}`, "welcome_d0");
      if (pick) counts[pick.variant_key]++;
    }
    // Esperamos ~50%, permitimos 40-60%
    expect(counts.A / N).toBeGreaterThan(0.4);
    expect(counts.A / N).toBeLessThan(0.6);
    expect(counts.B / N).toBeGreaterThan(0.4);
    expect(counts.B / N).toBeLessThan(0.6);
  });

  it("respeta weights desbalanceados (3:1)", () => {
    const variants = [
      v({ variant_key: "A", weight: 3 }),
      v({ variant_key: "B", weight: 1 }),
    ];
    const counts: Record<string, number> = { A: 0, B: 0 };
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const pick = pickVariant(variants, `c2-${i}`, "tips_d2");
      if (pick) counts[pick.variant_key]++;
    }
    // A debe ser ~75%, B ~25%. Permitimos +/- 7%
    expect(counts.A / N).toBeGreaterThan(0.68);
    expect(counts.A / N).toBeLessThan(0.82);
  });

  it("ignora variants con is_active=false", () => {
    const variants = [
      v({ variant_key: "A", is_active: true }),
      v({ variant_key: "B-dead", is_active: false, weight: 100 }),
    ];
    for (let i = 0; i < 100; i++) {
      expect(pickVariant(variants, `c-${i}`, "welcome_d0")?.variant_key).toBe("A");
    }
  });

  it("ignora variants con weight<=0", () => {
    const variants = [
      v({ variant_key: "A", weight: 1 }),
      v({ variant_key: "B-zero", weight: 0 }),
    ];
    for (let i = 0; i < 100; i++) {
      expect(pickVariant(variants, `c-${i}`, "welcome_d0")?.variant_key).toBe("A");
    }
  });
});
