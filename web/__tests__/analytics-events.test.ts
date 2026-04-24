import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackEvent,
  trackCta,
  trackFormStart,
  trackFormSubmit,
  trackToolUsed,
  trackVariantAssigned,
} from "@/lib/analytics/events";

describe("analytics events", () => {
  beforeEach(() => {
    // Simular window.gtag
    (global as unknown as { window: Window }).window = {
      gtag: vi.fn(),
    } as unknown as Window;
  });

  it("trackEvent llama gtag con parametros sanitizados", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackEvent("test_event", { foo: "bar", count: 42 });
    expect(spy).toHaveBeenCalledWith("event", "test_event", {
      foo: "bar",
      count: 42,
    });
  });

  it("trackEvent ignora null y undefined", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackEvent("test", { good: "x", bad: null, also_bad: undefined });
    expect(spy).toHaveBeenCalledWith("event", "test", { good: "x" });
  });

  it("trackEvent trunca strings largos a 500 chars", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    const longStr = "a".repeat(1000);
    trackEvent("test", { long: longStr });
    expect(spy).toHaveBeenCalledWith("event", "test", {
      long: "a".repeat(500),
    });
  });

  it("trackCta formatea params correctamente", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackCta("reservar_slot", "hero_home");
    expect(spy).toHaveBeenCalledWith("event", "cta_click", {
      cta_label: "reservar_slot",
      cta_location: "hero_home",
    });
  });

  it("trackFormStart emite form_start event", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackFormStart("checkout");
    expect(spy).toHaveBeenCalledWith("event", "form_start", {
      form_name: "checkout",
    });
  });

  it("trackFormSubmit diferencia success vs error", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackFormSubmit("contact", true);
    trackFormSubmit("contact", false);
    expect(spy).toHaveBeenNthCalledWith(1, "event", "form_submit_success", {
      form_name: "contact",
    });
    expect(spy).toHaveBeenNthCalledWith(2, "event", "form_submit_error", {
      form_name: "contact",
    });
  });

  it("trackToolUsed formatea params", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackToolUsed("slogan-generator", true);
    expect(spy).toHaveBeenCalledWith("event", "tool_used", {
      tool_slug: "slogan-generator",
      success: true,
    });
  });

  it("trackVariantAssigned formatea params AB test", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: typeof spy }).gtag = spy;
    trackVariantAssigned("hero-headline", "variant-a");
    expect(spy).toHaveBeenCalledWith("event", "ab_variant_assigned", {
      test_name: "hero-headline",
      variant: "variant-a",
    });
  });

  it("trackEvent no crashea si gtag no esta disponible", () => {
    (window as unknown as { gtag: undefined }).gtag = undefined;
    expect(() => trackEvent("test", { foo: "bar" })).not.toThrow();
  });
});
