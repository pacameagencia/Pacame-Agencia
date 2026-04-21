import { describe, it, expect } from "vitest";
import {
  formatAmount,
  formatOrderRef,
  formatDeliveryEta,
  firstName,
} from "@/lib/checkout/format";

describe("formatAmount", () => {
  it("formatea cents a string con currency uppercase", () => {
    expect(formatAmount(2500, "eur")).toContain("25");
    expect(formatAmount(2500, "eur")).toContain("EUR");
  });

  it("maneja cantidades con decimales correctamente", () => {
    // 25.5 formateado en cualquier locale (25.5 o 25,5)
    expect(formatAmount(2550, "EUR")).toMatch(/25[.,]5/);
    expect(formatAmount(2550, "EUR")).toContain("EUR");
  });

  it("formatea miles con separador segun locale ICU", () => {
    // Puede ser "1.500" (ES full ICU) o "1500" (Node minimal ICU) — ambos OK
    expect(formatAmount(150000, "EUR")).toMatch(/1[.,]?500/);
    expect(formatAmount(150000, "EUR")).toContain("EUR");
  });

  it("null retorna empty string (no crashea)", () => {
    expect(formatAmount(null, "EUR")).toBe("");
  });

  it("undefined retorna empty string", () => {
    expect(formatAmount(undefined, "EUR")).toBe("");
  });

  it("NaN retorna empty string", () => {
    expect(formatAmount(NaN, "EUR")).toBe("");
  });

  it("Infinity retorna empty string", () => {
    expect(formatAmount(Infinity, "EUR")).toBe("");
  });
});

describe("formatOrderRef", () => {
  it("genera PACAME- + ultimos 8 chars uppercase", () => {
    expect(formatOrderRef("cs_live_a1b2c3d4e5f6g7h8")).toBe("PACAME-E5F6G7H8");
  });

  it("session id corto (< 8 chars) fallback a PEND", () => {
    expect(formatOrderRef("cs_123")).toBe("PACAME-PEND");
  });

  it("null fallback a PEND", () => {
    expect(formatOrderRef(null)).toBe("PACAME-PEND");
  });

  it("undefined fallback a PEND", () => {
    expect(formatOrderRef(undefined)).toBe("PACAME-PEND");
  });

  it("empty string fallback a PEND", () => {
    expect(formatOrderRef("")).toBe("PACAME-PEND");
  });
});

describe("formatDeliveryEta", () => {
  it("horas <=24 muestra horas", () => {
    expect(formatDeliveryEta(4)).toBe("4 horas");
    expect(formatDeliveryEta(24)).toBe("24 horas");
  });

  it("horas > 24 convierte a dias laborables", () => {
    expect(formatDeliveryEta(48)).toBe("2 dias laborables");
    expect(formatDeliveryEta(168)).toBe("7 dias laborables");
  });

  it("redondea dias correctamente", () => {
    expect(formatDeliveryEta(36)).toBe("2 dias laborables");
    expect(formatDeliveryEta(72)).toBe("3 dias laborables");
  });

  it("null fallback conservador 7-14 dias", () => {
    expect(formatDeliveryEta(null)).toBe("7-14 dias laborables");
  });

  it("undefined fallback 7-14 dias", () => {
    expect(formatDeliveryEta(undefined)).toBe("7-14 dias laborables");
  });

  it("0 horas fallback 7-14 dias (no '0 horas')", () => {
    expect(formatDeliveryEta(0)).toBe("7-14 dias laborables");
  });

  it("negativos fallback a 7-14 dias", () => {
    expect(formatDeliveryEta(-5)).toBe("7-14 dias laborables");
  });
});

describe("firstName", () => {
  it("extrae primer nombre de full name", () => {
    expect(firstName("Pablo Calleja Gomez")).toBe("Pablo");
  });

  it("nombre unico lo retorna entero", () => {
    expect(firstName("Pablo")).toBe("Pablo");
  });

  it("null retorna null", () => {
    expect(firstName(null)).toBeNull();
  });

  it("undefined retorna null", () => {
    expect(firstName(undefined)).toBeNull();
  });

  it("empty string retorna null", () => {
    expect(firstName("")).toBeNull();
  });

  it("solo espacios retorna null", () => {
    expect(firstName("   ")).toBeNull();
  });

  it("trim espacios al inicio", () => {
    expect(firstName("  Ana Martinez")).toBe("Ana");
  });

  it("maneja multiples espacios entre palabras", () => {
    expect(firstName("Ana    Martinez")).toBe("Ana");
  });
});
