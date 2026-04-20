import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { verifyInternalAuth } from "@/lib/api-auth";
import { generateContentImage } from "@/lib/image-generation";
import { llmChat, extractJSON } from "@/lib/llm";

const supabase = createServerSupabase();

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Generate weekly content calendar ---
  if (action === "generate_calendar") {
    const { client_id, platform, week_start, brand_context } = body;

    const prompt = `Eres Pulse, Head of Social Media de PACAME.

Genera un calendario editorial para 1 semana.

PLATAFORMA: ${platform || "instagram"}
SEMANA: ${week_start || "proxima semana"}
MARCA: ${brand_context || "PACAME — agencia digital con agentes IA para PYMEs en Espana"}

FORMATO por cada dia:
- Tipo de contenido (reel, carrusel, post, story)
- Tema/titulo
- Hook (primeras 3 palabras que enganchan)
- Copy completo (< 150 palabras)
- CTA
- Hashtags (10 relevantes)
- Mejor hora de publicacion

REGLAS:
- 80% valor (tips, educacion), 20% promocion
- Lunes a viernes, 1 post/dia
- Alternar formatos: 2 reels, 1 carrusel, 1 post estatico, 1 story interactiva
- Tono: cercano, directo, espanol de Espana, tutea
- CTAs variados: guardar, compartir, comentar, link en bio

Responde SOLO JSON valido:
[{"day": "lunes", "type": "reel", "title": "...", "hook": "...", "copy": "...", "cta": "...", "hashtags": ["..."], "best_time": "10:00"}]`;

    try {
      const res = await llmChat(
        [{ role: "user", content: prompt }],
        { tier: "standard", maxTokens: 3000, agentId: "pulse", source: "content-calendar" }
      );

      let calendar: Array<Record<string, string | string[]>> = extractJSON(res.content) || [];

      // Save to content table
      if (calendar.length > 0 && client_id) {
        const batchId = `cal_${Date.now()}`;
        for (const post of calendar) {
          await supabase.from("content").insert({
            client_id: client_id || null,
            platform: platform || "instagram",
            content_type: post.type,
            title: post.title,
            body: post.copy,
            hashtags: Array.isArray(post.hashtags) ? post.hashtags.join(" ") : String(post.hashtags || ""),
            cta: post.cta,
            status: "pending_review",
            batch_id: batchId,
            subagents_used: ["pulse.strategy", "pulse.instagram"],
          });
        }
      }

      logAgentActivity({
        agentId: "pulse",
        type: "delivery",
        title: `Calendario semanal generado`,
        description: `${calendar.length} posts para ${platform || "instagram"}. Via ${res.provider}/${res.model}.`,
        metadata: { platform, posts_count: calendar.length, tokens: res.tokensOut, provider: res.provider, fallback: res.fallback },
      });

      return NextResponse.json({
        calendar,
        tokens: res.tokensOut,
        posts_saved: calendar.length,
        provider: res.provider,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- Generate individual post ---
  if (action === "generate_post") {
    const { platform, content_type, topic, brand_context } = body;

    const prompt = `Eres Copy, el copywriter de PACAME.

Crea un ${content_type || "post"} para ${platform || "instagram"} sobre: ${topic}

CONTEXTO DE MARCA: ${brand_context || "PACAME — agencia digital IA para PYMEs"}

Responde SOLO JSON: {"title": "...", "copy": "...", "hook": "...", "cta": "...", "hashtags": ["..."], "image_prompt": "descripcion de imagen ideal para este post"}`;

    try {
      const res = await llmChat(
        [{ role: "user", content: prompt }],
        { tier: "standard", maxTokens: 800, agentId: "copy", source: "content-post" }
      );

      const post = extractJSON(res.content);
      return NextResponse.json({ post, tokens: res.tokensOut, provider: res.provider });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- Approve/reject content ---
  if (action === "review") {
    const { content_id, decision, feedback } = body;
    if (!content_id || !decision) {
      return NextResponse.json({ error: "content_id and decision required" }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      status: decision === "approve" ? "approved" : "rejected",
    };
    if (decision === "reject" && feedback) {
      update.rejection_reason = feedback;
    }
    if (decision === "approve") {
      update.published_at = new Date().toISOString();
    }

    const { error } = await supabase.from("content").update(update).eq("id", content_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  // --- Generate image for content ---
  if (action === "generate_image") {
    const { content_id } = body;
    if (!content_id) return NextResponse.json({ error: "content_id required" }, { status: 400 });

    const { data: content } = await supabase
      .from("content")
      .select("id, image_prompt, platform")
      .eq("id", content_id)
      .single();

    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });
    if (!content.image_prompt) return NextResponse.json({ error: "No image_prompt set" }, { status: 400 });

    const imageUrl = await generateContentImage(content.image_prompt, content.platform);
    if (!imageUrl) return NextResponse.json({ error: "Image generation failed" }, { status: 500 });

    await supabase.from("content").update({ image_url: imageUrl }).eq("id", content_id);

    logAgentActivity({
      agentId: "pulse",
      type: "delivery",
      title: "Imagen generada para post",
      description: `Imagen IA creada para contenido de ${content.platform}.`,
      metadata: { content_id },
    });

    return NextResponse.json({ ok: true, image_url: imageUrl });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
