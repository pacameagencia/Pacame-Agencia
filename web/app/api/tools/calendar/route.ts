import { NextRequest, NextResponse } from "next/server";
import { llmChat, extractJSON } from "@/lib/llm";

interface Idea {
  date: string;
  day_number: number;
  platform: string;
  format: string;
  hook: string;
  body_draft: string;
  cta: string;
  hashtags?: string;
}

const FREQ_MAP: Record<string, number> = {
  daily: 30,
  "3week": 13,
  "2week": 9,
  weekly: 4,
};

export async function POST(req: NextRequest) {
  let body: { sector?: string; platforms?: string[]; frequency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sector = String(body.sector || "").slice(0, 200).trim();
  const platforms = Array.isArray(body.platforms)
    ? body.platforms.filter((p): p is string => typeof p === "string").slice(0, 4)
    : [];
  const frequency = String(body.frequency || "3week");
  const count = FREQ_MAP[frequency] ?? 13;

  if (!sector) return NextResponse.json({ error: "sector obligatorio" }, { status: 400 });
  if (platforms.length === 0)
    return NextResponse.json({ error: "platforms obligatorio" }, { status: 400 });

  const systemPrompt = `Eres un content strategist senior espanol con 10 anos diseñando calendarios editoriales para PYMEs. Creas hooks que convierten, no frases genericas.

Reglas:
- Hooks especificos NO genericos ("lunes motivacional", "feliz sabado" prohibidos).
- Cada post con formato CLARO (video, carrusel, foto, reel, texto).
- CTA concreta y medible (comenta X, link bio, DM "info").
- Rotar formatos para evitar fatiga visual.
- Espanol natural peninsular, sin cliches del sector.
- Output SOLO JSON valido, sin texto adicional.`;

  // Start date = proximo lunes
  const today = new Date();
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const start = new Date(today.getTime() + daysUntilMonday * 86400000);

  const userPrompt = `Negocio: ${sector}
Plataformas: ${platforms.join(", ")}
Frecuencia: ${count} posts en 30 dias (distribuye segun plataforma)
Fecha inicio: ${start.toISOString().slice(0, 10)} (lunes)

Devuelve JSON con ${count} ideas especificas:
{
  "ideas": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "platform": "instagram|linkedin|tiktok|blog",
      "format": "reel|carrusel|foto|video|articulo|historia",
      "hook": "1 linea gancho <70 chars",
      "body_draft": "2-3 lineas del cuerpo del post",
      "cta": "llamada accion 1 linea",
      "hashtags": "opcional, 5-8 hashtags sector"
    }
  ]
}

Distribuye fechas equiespaciadas dentro de 30 dias. Rotar plataformas segun cuales eligio. Variedad de formatos.`;

  try {
    const result = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        tier: "premium",
        maxTokens: 4000,
        temperature: 0.9,
        callSite: "tools/calendar",
      }
    );

    const parsed = extractJSON<{ ideas?: Idea[] }>(result.content);
    const ideas = Array.isArray(parsed?.ideas)
      ? (parsed!.ideas as Idea[]).filter((i) => i && i.hook && i.body_draft).slice(0, count)
      : [];

    if (ideas.length === 0) {
      return NextResponse.json(
        { error: "No se generaron ideas validas. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ideas, provider: result.provider });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error LLM" },
      { status: 500 }
    );
  }
}
