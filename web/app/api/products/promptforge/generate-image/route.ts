/**
 * POST /api/products/promptforge/generate-image
 *
 * Genera imagen real con Freepik Mystic. Devuelve generation_id (para polling)
 * y task_id de Freepik. Cobra cuota según tier (futuro).
 *
 * Body:
 *   { prompt: string, prompt_id?: string, model?: MysticModel, aspect_ratio?: AspectRatio, resolution?: '1k'|'2k'|'4k' }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireProductUser } from "@/lib/products/session";
import { getActiveSubscription } from "@/lib/products/subscriptions";
import { generateMystic, type AspectRatio, type MysticModel } from "@/lib/freepik";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  prompt: string;
  prompt_id?: string;
  model?: MysticModel;
  aspect_ratio?: AspectRatio;
  resolution?: "1k" | "2k" | "4k";
}

export async function POST(request: NextRequest) {
  const user = await requireProductUser("/p/promptforge");
  const subscription = await getActiveSubscription(user.id, "promptforge");
  if (!subscription) {
    return NextResponse.json({ error: "subscription_required" }, { status: 402 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt || prompt.length < 5) {
    return NextResponse.json({ error: "prompt_too_short" }, { status: 400 });
  }
  if (prompt.length > 1500) {
    return NextResponse.json({ error: "prompt_too_long" }, { status: 400 });
  }

  // Quota: starter 5 imágenes/mes (suave), pro 50, studio ilimitado.
  // Implementación simple: contamos generaciones del mes actual en BD.
  const supabase = createServerSupabase();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const tier = subscription.tier;
  const limits: Record<string, number> = { starter: 5, pro: 50, studio: -1 };
  const monthlyLimit = limits[tier] ?? 5;
  if (monthlyLimit !== -1) {
    const { count } = await supabase
      .from("promptforge_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("modality", "image")
      .gte("created_at", monthStart.toISOString());
    if ((count ?? 0) >= monthlyLimit) {
      return NextResponse.json(
        { error: "monthly_limit_reached", limit: monthlyLimit, used: count },
        { status: 429 }
      );
    }
  }

  let task;
  try {
    task = await generateMystic(prompt, {
      model: body.model ?? "realism",
      aspect_ratio: body.aspect_ratio ?? "square_1_1",
      resolution: body.resolution ?? "1k",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "freepik_failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }

  const { data: gen, error } = await supabase
    .from("promptforge_generations")
    .insert({
      user_id: user.id,
      prompt_id: body.prompt_id ?? null,
      modality: "image",
      provider: "freepik-mystic",
      provider_task_id: task.task_id,
      status: "processing",
      prompt_text: prompt,
      params: {
        model: body.model ?? "realism",
        aspect_ratio: body.aspect_ratio ?? "square_1_1",
        resolution: body.resolution ?? "1k",
      },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "db_insert_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, generation_id: gen.id, task_id: task.task_id, status: "processing" });
}
