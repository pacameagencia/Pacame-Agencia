/**
 * pacame-viral-visuals — Generación con brief viral + brand del cliente.
 *
 * Fusiona el viral_brief del nicho con brand del cliente y lanza Freepik Mystic.
 * Para reels, encadena image-to-video Kling.
 */

import { createServerSupabase } from "./supabase/server";
import { generateImageAndWait, type AspectRatio, type MysticModel } from "./freepik";

export type ViralFormat =
  | "feed-1:1"
  | "feed-4:5"
  | "story-9:16"
  | "reel-9:16"
  | "thumbnail-16:9";

const FORMAT_TO_ASPECT: Record<ViralFormat, AspectRatio> = {
  "feed-1:1": "square_1_1",
  "feed-4:5": "classic_3_4",
  "story-9:16": "social_story_9_16",
  "reel-9:16": "social_story_9_16",
  "thumbnail-16:9": "widescreen_16_9",
};

export interface GenerateInput {
  niche: string;
  message: string;
  format: ViralFormat;
  client_id?: string;
  brand?: { palette?: string[]; fonts?: string[]; voice?: string };
  override_brief_id?: string;
}

export interface GenerateResult {
  generation_id: string;
  status: "completed" | "failed";
  images: string[];
  prompt_used: string;
  brief_id: string | null;
}

function buildPrompt(brief: Record<string, unknown>, input: GenerateInput): string {
  const b = brief as {
    palette_winner?: string[];
    composition_winner?: string;
    grading_winner?: string;
    lighting_winner?: string;
    typography_winner?: string[];
  };
  const palette = (b.palette_winner || []).slice(0, 5).join(", ");
  const brandPalette = input.brand?.palette?.join(", ") || "";
  const typo = (b.typography_winner || [])[0] || "editorial serif bold";

  return [
    `Editorial Instagram 2026 post for niche "${input.niche}".`,
    `Composition: ${b.composition_winner || "asymmetric, bleed"}.`,
    `Lighting: ${b.lighting_winner || "natural soft"}.`,
    `Color grading: ${b.grading_winner || "warm, high contrast"}.`,
    palette ? `Reference palette: ${palette}.` : "",
    brandPalette ? `Respect brand colors when possible: ${brandPalette}.` : "",
    `Typography overlay: ${typo} reading "${input.message}". Text overlay ≤ 20% of area.`,
    `No stock-photo feel. High contrast, subtle grain, human and real.`,
    `Style reference: premium agency Instagram feed, 2026 editorial.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateViral(input: GenerateInput): Promise<GenerateResult> {
  const supabase = createServerSupabase();

  // 1) Obtener brief activo del nicho (o el override)
  let brief: Record<string, unknown> | null = null;
  let briefId: string | null = null;

  if (input.override_brief_id) {
    const { data } = await supabase
      .from("viral_briefs")
      .select("id, brief")
      .eq("id", input.override_brief_id)
      .single();
    brief = (data?.brief as Record<string, unknown>) || null;
    briefId = data?.id || null;
  } else {
    const { data } = await supabase
      .from("viral_briefs")
      .select("id, brief")
      .eq("niche", input.niche)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    brief = (data?.brief as Record<string, unknown>) || null;
    briefId = data?.id || null;
  }

  if (!brief) {
    throw new Error(
      `No active viral brief for niche "${input.niche}". Ejecuta /api/viral/research y /api/viral/analyze primero.`
    );
  }

  // 2) Prompt fusionado
  const prompt = buildPrompt(brief, input);
  const aspect = FORMAT_TO_ASPECT[input.format];
  const model: MysticModel = "realism";

  // 3) Insertar registro pending
  const { data: gen, error: insErr } = await supabase
    .from("viral_generations")
    .insert({
      niche: input.niche,
      brief_id: briefId,
      client_id: input.client_id || null,
      format: input.format,
      message: input.message,
      prompt_used: prompt,
      model_used: `freepik-mystic-${model}`,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !gen) throw new Error(`Insert generation failed: ${insErr?.message}`);
  const generationId = gen.id as string;

  // 4) Generar con Freepik
  try {
    const images = await generateImageAndWait(prompt, {
      model,
      resolution: "2k",
      aspect_ratio: aspect,
      adherence: 70,
      hdr: 40,
      creative_detailing: 45,
    });

    await supabase
      .from("viral_generations")
      .update({ status: "completed", output_urls: images, output_url: images[0] || null })
      .eq("id", generationId);

    return { generation_id: generationId, status: "completed", images, prompt_used: prompt, brief_id: briefId };
  } catch (e) {
    await supabase.from("viral_generations").update({ status: "failed" }).eq("id", generationId);
    throw e;
  }
}
