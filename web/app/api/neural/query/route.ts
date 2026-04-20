/**
 * POST /api/neural/query
 * Busqueda semantica pura en el cerebro.
 * Body: { query: string, type?: 'skill'|'agent'|'memory'|'discovery', count?: number, agent?: string }
 */
import { NextResponse } from "next/server";
import { semanticSearchNodes, semanticSearchMemories } from "@/lib/neural";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.query || typeof body.query !== "string") {
      return NextResponse.json({ error: "query requerido" }, { status: 400 });
    }
    const count = typeof body.count === "number" ? Math.min(20, body.count) : 8;

    if (body.type === "memory") {
      const hits = await semanticSearchMemories(body.query, {
        matchCount: count,
        agentId: body.agent,
      });
      return NextResponse.json({ ok: true, type: "memory", hits });
    }

    const hits = await semanticSearchNodes(body.query, {
      matchCount: count,
      type: body.type,
    });
    return NextResponse.json({ ok: true, type: body.type || "all", hits });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
