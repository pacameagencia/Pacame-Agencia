/**
 * POST /api/products/promptforge/enhance
 *
 * Mejora un prompt en bruto y devuelve N variantes profesionales con
 * análisis. Persiste en promptforge_prompts para historial.
 *
 * Comprueba cuota: prompts_per_month según tier de la subscription.
 * Comprueba video access: tier starter no tiene video_targets.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { getActiveSubscription, isSubscriptionActive } from "@/lib/products/subscriptions";
import { getProduct, findTier } from "@/lib/products/registry";
import { createServerSupabase } from "@/lib/supabase/server";
import { enhancePrompt, type Modality, type Target } from "@/lib/products/promptforge/enhancer";

export const runtime = "nodejs";
export const maxDuration = 60;

interface EnhanceBody {
  raw_input: string;
  modality: Modality;
  target: Target;
  use_case?: string;
  variants_count?: number;
  context_notes?: string;
  language?: string;
}

const VIDEO_TARGETS: Target[] = ["sora", "veo", "runway", "kling", "luma", "pika"];

export async function POST(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 1. Validar suscripción activa
  const subscription = await getActiveSubscription(user.id, "promptforge");
  if (!subscription || !isSubscriptionActive(subscription)) {
    return NextResponse.json(
      { error: "subscription_inactive", redirect: "/p/promptforge?reactivate=1" },
      { status: 402 }
    );
  }

  // 2. Cargar tier limits
  const product = await getProduct("promptforge");
  if (!product) return NextResponse.json({ error: "product not found" }, { status: 500 });
  const tier = findTier(product, subscription.tier);
  if (!tier) return NextResponse.json({ error: "tier mismatch" }, { status: 500 });

  // 3. Parsear body
  let body: EnhanceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.raw_input || !body.modality || !body.target) {
    return NextResponse.json({ error: "raw_input + modality + target requeridos" }, { status: 400 });
  }

  // 4. Check tier permite video
  const isVideo = body.modality === "video" || VIDEO_TARGETS.includes(body.target);
  if (isVideo && !tier.limits.video_targets) {
    return NextResponse.json(
      {
        error: "video_targets_blocked",
        message: `Los targets de video requieren plan Pro o Studio. Tu plan actual: ${tier.tier}.`,
        upgrade_to: "pro",
      },
      { status: 403 }
    );
  }

  // 5. Check cuota mensual
  const supabase = createServerSupabase();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyLimit = (tier.limits.prompts_per_month as number) ?? 50;
  if (monthlyLimit !== -1) {
    const { count } = await supabase
      .from("promptforge_prompts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());

    if ((count ?? 0) >= monthlyLimit) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: `Has agotado tus ${monthlyLimit} prompts del mes en plan ${tier.tier}. Actualiza a un tier superior o espera al próximo mes.`,
          used: count,
          limit: monthlyLimit,
          upgrade_to: tier.tier === "starter" ? "pro" : "studio",
        },
        { status: 429 }
      );
    }
  }

  // 6. Limitar variants_count según tier
  const tierMaxVariants = (tier.limits.variants_per_prompt as number) ?? 2;
  const variantsCount = Math.min(body.variants_count ?? 3, tierMaxVariants);

  // 7. Llamar al enhancer
  let result;
  try {
    result = await enhancePrompt({
      raw_input: body.raw_input,
      modality: body.modality,
      target: body.target,
      use_case: body.use_case,
      variants_count: variantsCount,
      context_notes: body.context_notes,
      language: body.language,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // 8. Persistir en historial
  const { data: saved, error: saveError } = await supabase
    .from("promptforge_prompts")
    .insert({
      user_id: user.id,
      modality: body.modality,
      target: body.target,
      use_case: body.use_case ?? null,
      raw_input: body.raw_input,
      context_notes: body.context_notes ?? null,
      enhanced_prompts: result.variants,
      analysis: result.analysis,
      llm_provider: result.llm_provider,
      llm_model: result.llm_model,
      tokens_used: result.tokens_used,
    })
    .select("id, created_at")
    .single();

  if (saveError) {
    // No bloquear el response si falla el save (el user igual recibe el output)
    console.error("[promptforge] save error:", saveError.message);
  }

  return NextResponse.json({
    ok: true,
    id: saved?.id ?? null,
    created_at: saved?.created_at ?? null,
    variants: result.variants,
    analysis: result.analysis,
    meta: {
      provider: result.llm_provider,
      model: result.llm_model,
      tokens: result.tokens_used,
      tier: tier.tier,
      variants_max: tierMaxVariants,
    },
  });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const url = new URL(request.url);
  const onlyStarred = url.searchParams.get("starred") === "1";
  const folder = url.searchParams.get("folder");

  let query = supabase
    .from("promptforge_prompts")
    .select("id, modality, target, use_case, raw_input, enhanced_prompts, analysis, starred, folder, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (onlyStarred) query = query.eq("starred", true);
  if (folder) query = query.eq("folder", folder);

  const { data } = await query;
  return NextResponse.json({ prompts: data ?? [] });
}
