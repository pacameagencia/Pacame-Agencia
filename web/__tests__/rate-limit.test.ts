import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Fallback in-memory mode: no Upstash env
beforeAll(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

function mkReq(ip: string): NextRequest {
  return new NextRequest(new URL("http://localhost/x"), {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("rate-limit fallback LRU", () => {
  it("getClientIp lee x-forwarded-for, x-real-ip, fallback unknown", async () => {
    const { getClientIp } = await import("@/lib/security/rate-limit");
    expect(getClientIp(mkReq("1.2.3.4"))).toBe("1.2.3.4");
    const req2 = new NextRequest(new URL("http://localhost/y"), {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(req2)).toBe("9.9.9.9");
    const req3 = new NextRequest(new URL("http://localhost/z"));
    expect(getClientIp(req3)).toBe("unknown");
  });

  it("limiter permite primeras N req y bloquea las siguientes", async () => {
    const { authLimiter } = await import("@/lib/security/rate-limit");
    // authLimiter es 5/min/IP. Ejecutamos 7.
    const key = `test-ip-${Date.now()}`;
    const results = [] as boolean[];
    for (let i = 0; i < 7; i++) {
      const res = await authLimiter.limit(key);
      results.push(res.success);
    }
    // Primeras 5 OK, las otras 2 bloqueadas
    expect(results.slice(0, 5).every((x) => x)).toBe(true);
    expect(results.slice(5).some((x) => !x)).toBe(true);
  });

  it("keys diferentes no se afectan entre si", async () => {
    const { checkoutLimiter } = await import("@/lib/security/rate-limit");
    const r1 = await checkoutLimiter.limit(`isolated-a-${Date.now()}`);
    const r2 = await checkoutLimiter.limit(`isolated-b-${Date.now()}`);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

describe("isTrustedWebhookSource", () => {
  it("acepta Meta x-hub-signature-256 con formato valido (64 hex)", async () => {
    const { isTrustedWebhookSource } = await import("@/lib/security/rate-limit");
    const req = new NextRequest(new URL("http://localhost/wh"), {
      headers: { "x-hub-signature-256": "sha256=" + "a".repeat(64) },
    });
    expect(isTrustedWebhookSource(req)).toBe(true);
  });

  it("rechaza x-hub-signature-256 con formato invalido", async () => {
    const { isTrustedWebhookSource } = await import("@/lib/security/rate-limit");
    const req = new NextRequest(new URL("http://localhost/wh"), {
      headers: { "x-hub-signature-256": "sha256=deadbeef" }, // solo 8 hex — invalido
    });
    expect(isTrustedWebhookSource(req)).toBe(false);
  });

  it("rechaza sin headers conocidos", async () => {
    const { isTrustedWebhookSource } = await import("@/lib/security/rate-limit");
    const req = new NextRequest(new URL("http://localhost/wh"), {
      headers: {},
    });
    expect(isTrustedWebhookSource(req)).toBe(false);
  });
});
