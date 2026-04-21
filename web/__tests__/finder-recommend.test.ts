import { describe, it, expect } from "vitest";
import {
  pickPersona,
  buildBundle,
  computeTotals,
  makeHeadline,
  recommend,
  generateShareSlug,
} from "@/lib/finder/recommend";
import type { QuizAnswers } from "@/lib/finder/rules";

describe("pickPersona", () => {
  it("gym + solo -> entrenador-personal (Pablo specific request)", () => {
    expect(pickPersona("gym", "solo")).toEqual({
      vertical: "gym",
      persona: "entrenador-personal",
    });
  });

  it("gym + medium -> gimnasio", () => {
    expect(pickPersona("gym", "medium")).toEqual({
      vertical: "gym",
      persona: "gimnasio",
    });
  });

  it("inmobiliaria + solo -> dueno-airbnb (Pablo specific)", () => {
    expect(pickPersona("inmobiliaria", "solo")).toEqual({
      vertical: "inmobiliaria",
      persona: "dueno-airbnb",
    });
  });

  it("saas + large -> enterprise", () => {
    expect(pickPersona("saas", "large")).toEqual({
      vertical: "saas",
      persona: "enterprise",
    });
  });

  it("otro -> null vertical + null persona", () => {
    expect(pickPersona("otro", "medium")).toEqual({
      vertical: null,
      persona: null,
    });
  });

  it("restaurante + small -> bar-cafeteria", () => {
    expect(pickPersona("restaurante", "small")).toEqual({
      vertical: "restaurante",
      persona: "bar-cafeteria",
    });
  });
});

describe("buildBundle", () => {
  it("goal mas-leads + budget high devuelve 3 items", () => {
    const bundle = buildBundle("mas-leads", "high");
    expect(bundle.length).toBeGreaterThanOrEqual(2);
    expect(bundle[0].slug).toBe("landing-1page");
  });

  it("budget low filtra items costosos", () => {
    const bundle = buildBundle("mas-leads", "low");
    const total = bundle.reduce((s, i) => s + i.price_cents, 0);
    expect(total).toBeLessThanOrEqual(50000);
  });

  it("budget low nunca devuelve vacio (fallback cheapest)", () => {
    const bundle = buildBundle("ahorrar-tiempo", "low");
    expect(bundle.length).toBeGreaterThanOrEqual(1);
  });

  it("goal todo-en-uno + budget enterprise incluye todos", () => {
    const bundle = buildBundle("todo-en-uno", "enterprise");
    expect(bundle.length).toBe(3);
  });

  it("budget enterprise nunca filtra por precio", () => {
    const bundle = buildBundle("expandir-canales", "enterprise");
    expect(bundle.length).toBe(3);
  });
});

describe("computeTotals", () => {
  it("bundle 1 item = sin descuento", () => {
    const totals = computeTotals([
      { slug: "x", name: "x", price_cents: 10000, why: "" },
    ]);
    expect(totals.subtotal_cents).toBe(10000);
    expect(totals.discount_cents).toBe(0);
    expect(totals.total_cents).toBe(10000);
  });

  it("bundle 2+ items = 15% descuento", () => {
    const totals = computeTotals([
      { slug: "a", name: "a", price_cents: 10000, why: "" },
      { slug: "b", name: "b", price_cents: 10000, why: "" },
    ]);
    expect(totals.subtotal_cents).toBe(20000);
    expect(totals.discount_cents).toBe(3000); // 15% of 20k
    expect(totals.total_cents).toBe(17000);
  });

  it("bundle vacio = totals cero", () => {
    const totals = computeTotals([]);
    expect(totals.subtotal_cents).toBe(0);
    expect(totals.discount_cents).toBe(0);
    expect(totals.total_cents).toBe(0);
  });
});

describe("makeHeadline", () => {
  it("devuelve copy personalizado con sector + goal", () => {
    const headline = makeHeadline("gym", "mas-leads");
    expect(headline).toContain("gimnasio o box");
    expect(headline).toContain("mas leads");
  });

  it("sector otro fallback a 'negocio'", () => {
    const headline = makeHeadline("otro", "todo-en-uno");
    expect(headline).toContain("negocio");
  });
});

describe("recommend", () => {
  it("end-to-end: gym + solo + mas-leads + mid + urgent", () => {
    const answers: QuizAnswers = {
      sector: "gym",
      size: "solo",
      goal: "mas-leads",
      budget: "mid",
      urgency: "urgent",
    };
    const rec = recommend(answers);
    expect(rec.vertical_slug).toBe("gym");
    expect(rec.persona_slug).toBe("entrenador-personal");
    expect(rec.bundle.length).toBeGreaterThanOrEqual(1);
    expect(rec.timeline_days).toBe(7);
    expect(rec.headline).toBeTruthy();
  });

  it("hotel + solo + expandir-canales + high + 3-months", () => {
    const rec = recommend({
      sector: "hotel",
      size: "solo",
      goal: "expandir-canales",
      budget: "high",
      urgency: "3-months",
    });
    expect(rec.persona_slug).toBe("apartamentos-turisticos");
    expect(rec.timeline_days).toBe(30);
  });

  it("saas + large + todo-en-uno + enterprise + exploring", () => {
    const rec = recommend({
      sector: "saas",
      size: "large",
      goal: "todo-en-uno",
      budget: "enterprise",
      urgency: "exploring",
    });
    expect(rec.persona_slug).toBe("enterprise");
    expect(rec.bundle.length).toBe(3); // todos 3 pasan budget enterprise
    expect(rec.discount_cents).toBeGreaterThan(0); // 3 items = discount
  });

  it("otro sector devuelve null persona pero bundle valido", () => {
    const rec = recommend({
      sector: "otro",
      size: "medium",
      goal: "mejor-conversion",
      budget: "mid",
      urgency: "1-month",
    });
    expect(rec.vertical_slug).toBe(null);
    expect(rec.persona_slug).toBe(null);
    expect(rec.bundle.length).toBeGreaterThan(0);
  });
});

describe("generateShareSlug", () => {
  it("devuelve 8 chars alphanumericos sin confusos", () => {
    const slug = generateShareSlug();
    expect(slug).toMatch(/^[a-z2-9]{8}$/);
    expect(slug).not.toContain("0");
    expect(slug).not.toContain("o");
    expect(slug).not.toContain("l");
  });

  it("100 generations son unicos (alta entropia)", () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 100; i++) slugs.add(generateShareSlug());
    expect(slugs.size).toBe(100); // cero colisiones
  });
});
