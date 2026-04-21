import { NextRequest, NextResponse } from "next/server";
import { analyzeNiche } from "@/lib/viral-analyze";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { niche?: string; maxBatch?: number };
    if (!body.niche) {
      return NextResponse.json({ error: "niche is required" }, { status: 400 });
    }
    const result = await analyzeNiche(body.niche, body.maxBatch ?? 20);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
