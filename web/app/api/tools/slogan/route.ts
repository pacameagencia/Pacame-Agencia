import { NextRequest, NextResponse } from "next/server";
import { llmChat, extractJSON } from "@/lib/llm";

export async function POST(req: NextRequest) {
  let body: { sector?: string; tone?: string; keywords?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sector = String(body.sector || "").slice(0, 120).trim();
  const tone = String(body.tone || "premium").slice(0, 40);
  const keywords = String(body.keywords || "").slice(0, 200);

  if (!sector) {
    return NextResponse.json({ error: "sector es obligatorio" }, { status: 400 });
  }

  const systemPrompt = `Eres un director creativo senior de una agencia de publicidad espanola nivel Ogilvy/Wieden+Kennedy. Creas slogans memorables tier-1 que venden negocios reales.

Reglas estrictas:
- Espanol natural (peninsular, sin anglicismos innecesarios).
- Cada slogan max 8 palabras.
- Mix de tonos dentro del rango pedido: algunos declarativos, algunos preguntas, algunos con ritmo ternario.
- Cero clichés ("innovador", "soluciones", "tu partner", "pasion por X").
- Evita rima forzada. Evita exclamaciones. Evita emojis.
- Output SOLO array JSON de 10 strings, sin texto adicional.`;

  const userPrompt = `Sector: ${sector}
Tono: ${tone}
Keywords (opcional, integrar naturalmente): ${keywords || "(ninguna)"}

Devuelve exactamente 10 slogans en formato JSON:
{"slogans":["slogan 1","slogan 2",...,"slogan 10"]}`;

  try {
    const result = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        tier: "standard",
        maxTokens: 600,
        temperature: 0.85,
        callSite: "tools/slogan",
      }
    );

    const parsed = extractJSON<{ slogans?: string[] }>(result.content);
    const slogans = Array.isArray(parsed?.slogans)
      ? parsed!.slogans.filter((s): s is string => typeof s === "string").slice(0, 10)
      : [];

    if (slogans.length === 0) {
      return NextResponse.json(
        { error: "La IA no devolvio slogans. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      slogans,
      provider: result.provider,
      model: result.model,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error LLM";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
