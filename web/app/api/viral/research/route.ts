import { NextRequest, NextResponse } from "next/server";
import { scrapeHashtags, resolveHashtags } from "@/lib/viral-research";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      niche?: string;
      hashtags?: string[];
      resultsPerHashtag?: number;
    };
    if (!body.niche) {
      return NextResponse.json({ error: "niche is required" }, { status: 400 });
    }

    const hashtags = resolveHashtags(body.niche, body.hashtags);
    const result = await scrapeHashtags({
      niche: body.niche,
      hashtags,
      resultsPerHashtag: body.resultsPerHashtag ?? 30,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
