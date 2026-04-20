/**
 * POST /api/neural/fire
 * Dispara una sinapsis hebbiana entre dos agentes.
 * Body: { from: string, to: string, type?: SynapseType, success?: boolean }
 */
import { NextResponse } from "next/server";
import { fireSynapse } from "@/lib/neural";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.from || !body?.to) {
      return NextResponse.json(
        { error: "from y to requeridos" },
        { status: 400 }
      );
    }
    const weight = await fireSynapse(
      body.from,
      body.to,
      body.type || "collaborates_with",
      body.success !== false
    );
    return NextResponse.json({ ok: true, weight });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
