/**
 * pacame-viral-visuals — Pattern extraction con Gemini Vision
 *
 * Por cada viral_reference sin analizar, Gemini 2.5 Pro devuelve JSON
 * con el ADN visual. Luego consolidamos un viral_brief del nicho.
 */

import { createServerSupabase } from "./supabase/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = "gemini-2.5-pro";

export interface VisualPattern {
  ratio: "1:1" | "4:5" | "9:16" | "16:9" | string;
  palette: string[];
  typography: { primary: string; weight: string; tracking: string };
  composition: string;
  grading: string;
  lighting: string;
  text_in_image: { amount: string; position: string; hierarchy: string };
  hook_type: string;
  cta: string | null;
  style_reference: string;
}

const PATTERN_PROMPT = `Analiza esta imagen de Instagram viral y devuelve SOLO JSON válido con esta forma EXACTA (sin markdown, sin prosa):
{
  "ratio": "1:1|4:5|9:16|16:9",
  "palette": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "typography": { "primary": "serif|sans|display|handwritten + estilo concreto", "weight": "light|regular|bold|black", "tracking": "tight|normal|wide" },
  "composition": "centered|asymmetric|diagonal|grid|bleed",
  "grading": "warm|cool|neutral|duotone (contraste 1-10)",
  "lighting": "natural-soft|harsh|studio-flash|golden-hour",
  "text_in_image": { "amount": "none|short|heavy", "position": "top|center|overlay|bottom", "hierarchy": "single|dual|triple" },
  "hook_type": "question|number|contrarian|before-after|face|product",
  "cta": "texto exacto del CTA si existe o null",
  "style_reference": "descripción en 10 palabras max"
}`;

async function fetchImageBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch image ${url} failed: ${res.status}`);
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mimeType };
}

/**
 * Extrae patrón visual de una imagen usando Gemini Vision.
 */
export async function extractPattern(imageUrl: string): Promise<VisualPattern> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not configured");
  const { data, mimeType } = await fetchImageBase64(imageUrl);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PATTERN_PROMPT },
              { inline_data: { mime_type: mimeType, data } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini vision failed (${res.status}): ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini response empty");
  return JSON.parse(text) as VisualPattern;
}

export interface AnalyzeResult {
  niche: string;
  analyzed: number;
  brief_id: string | null;
  brief: unknown;
}

/**
 * Analiza todas las refs no-analizadas del nicho, construye el brief consolidado.
 */
export async function analyzeNiche(niche: string, maxBatch = 20): Promise<AnalyzeResult> {
  const supabase = createServerSupabase();

  const { data: pending, error: selErr } = await supabase
    .from("viral_references")
    .select("id, image_url")
    .eq("niche", niche)
    .eq("analyzed", false)
    .not("image_url", "is", null)
    .limit(maxBatch);
  if (selErr) throw new Error(`Select refs failed: ${selErr.message}`);

  const patterns: VisualPattern[] = [];
  const analyzedIds: string[] = [];

  for (const ref of pending || []) {
    try {
      const p = await extractPattern(ref.image_url as string);
      await supabase
        .from("viral_references")
        .update({ pattern: p, analyzed: true })
        .eq("id", ref.id);
      patterns.push(p);
      analyzedIds.push(ref.id as string);
    } catch (e) {
      await supabase.from("viral_references").update({ analyzed: true }).eq("id", ref.id);
      console.warn("analyze skipped", ref.id, (e as Error).message);
    }
  }

  const { data: allRefs } = await supabase
    .from("viral_references")
    .select("id, pattern")
    .eq("niche", niche)
    .eq("analyzed", true)
    .not("pattern", "is", null)
    .order("captured_at", { ascending: false })
    .limit(50);

  const allPatterns = (allRefs || []).map((r) => r.pattern as VisualPattern);
  if (allPatterns.length < 5) {
    return { niche, analyzed: patterns.length, brief_id: null, brief: null };
  }

  const brief = consolidateBrief(allPatterns);
  const { data: briefRow, error: briefErr } = await supabase
    .from("viral_briefs")
    .insert({
      niche,
      brief,
      reference_ids: (allRefs || []).map((r) => r.id),
      sample_size: allPatterns.length,
    })
    .select("id")
    .single();
  if (briefErr) throw new Error(`Insert brief failed: ${briefErr.message}`);

  return { niche, analyzed: patterns.length, brief_id: briefRow.id as string, brief };
}

function topK<T>(arr: T[], k: number): T[] {
  const counts = new Map<string, number>();
  for (const v of arr) {
    const key = JSON.stringify(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([k]) => JSON.parse(k) as T);
}

function consolidateBrief(patterns: VisualPattern[]) {
  const allColors = patterns.flatMap((p) => p.palette || []);
  const ratios = patterns.map((p) => p.ratio).filter(Boolean);
  const compositions = patterns.map((p) => p.composition).filter(Boolean);
  const hooks = patterns.map((p) => p.hook_type).filter(Boolean);
  const typographies = patterns.map((p) => p.typography?.primary).filter(Boolean);
  const gradings = patterns.map((p) => p.grading).filter(Boolean);
  const lightings = patterns.map((p) => p.lighting).filter(Boolean);

  return {
    sample_size: patterns.length,
    ratio_winner: topK(ratios, 1)[0] || "4:5",
    palette_winner: topK(allColors, 5),
    composition_winner: topK(compositions, 1)[0] || "asymmetric",
    hook_winner: topK(hooks, 1)[0] || "question",
    typography_winner: topK(typographies, 2),
    grading_winner: topK(gradings, 1)[0] || "warm, high contrast",
    lighting_winner: topK(lightings, 1)[0] || "natural-soft",
    generated_at: new Date().toISOString(),
  };
}
