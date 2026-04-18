import { describe, it, expect } from "vitest";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { withValidation } from "@/lib/api/with-validation";

function mkRequest(body: unknown, query?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/test");
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("withValidation", () => {
  it("parsea body valido y llama al handler", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const handler = withValidation({ body: schema }, async ({ body }) => {
      return NextResponse.json({ ok: true, got: body });
    });
    const res = await handler(mkRequest({ name: "Pablo", age: 30 }));
    const data = (await res.json()) as { ok: boolean; got: { name: string; age: number } };
    expect(data.ok).toBe(true);
    expect(data.got.name).toBe("Pablo");
  });

  it("rechaza body invalido con 400 + issues", async () => {
    const schema = z.object({ name: z.string().min(3) });
    const handler = withValidation({ body: schema }, async () => {
      return NextResponse.json({ shouldnt: "get here" });
    });
    const res = await handler(mkRequest({ name: "x" }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; issues: unknown[] };
    expect(data.error).toMatch(/[vV]alidation/);
    expect(Array.isArray(data.issues)).toBe(true);
  });

  it("rechaza JSON malformado con 400", async () => {
    const schema = z.object({ x: z.string() });
    const handler = withValidation({ body: schema }, async () => NextResponse.json({}));
    const req = new NextRequest(new URL("http://localhost/t"), {
      method: "POST",
      body: "not-json-{",
      headers: { "content-type": "application/json" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("valida query params", async () => {
    const querySchema = z.object({ page: z.coerce.number().int().min(1) });
    type Q = z.infer<typeof querySchema>;
    const handler = withValidation<unknown, Q>({ query: querySchema }, async ({ query }) => {
      return NextResponse.json({ page: query.page });
    });
    const res = await handler(mkRequest({}, { page: "5" }));
    const data = (await res.json()) as { page: number };
    expect(data.page).toBe(5);
  });

  it("sin schemas, passthrough", async () => {
    const handler = withValidation({}, async () => NextResponse.json({ ok: true }));
    const res = await handler(mkRequest({}));
    expect(res.status).toBe(200);
  });
});
