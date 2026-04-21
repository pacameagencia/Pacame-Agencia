import { NextRequest, NextResponse } from "next/server";
import { generateViral, type ViralFormat } from "@/lib/viral-generate";

export const runtime = "nodejs";
export const maxDuration = 300;

const VALID_FORMATS: ViralFormat[] = [
  "feed-1:1",
  "feed-4:5",
  "story-9:16",
  "reel-9:16",
  "thumbnail-16:9",
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      niche?: string;
      message?: string;
      format?: ViralFormat;
      client_id?: string;
      brand?: { palette?: string[]; fonts?: string[]; voice?: string };
      override_brief_id?: string;
    };

    if (!body.niche || !body.message || !body.format) {
      return NextResponse.json(
        { error: "niche, message y format son obligatorios" },
        { status: 400 }
      );
    }
    if (!VALID_FORMATS.includes(body.format)) {
      return NextResponse.json(
        { error: `format inválido. Usa: ${VALID_FORMATS.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await generateViral({
      niche: body.niche,
      message: body.message,
      format: body.format,
      client_id: body.client_id,
      brand: body.brand,
      override_brief_id: body.override_brief_id,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
