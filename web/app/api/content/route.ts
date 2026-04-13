import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { verifyInternalAuth } from "@/lib/api-auth";

const supabase = createServerSupabase();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Generate weekly content calendar ---
  if (action === "generate_calendar") {
    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: "CLAUDE_API_KEY not configured" }, { status: 500 });
    }

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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      let calendar: Array<Record<string, string | string[]>> = [];
      if (jsonStart >= 0) {
        try { calendar = JSON.parse(text.slice(jsonStart, jsonEnd)); } catch { /* AI devolvio JSON invalido */ }
      }

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
        description: `${calendar.length} posts para ${platform || "instagram"}. Pendientes de revision.`,
        metadata: { platform, posts_count: calendar.length, tokens: data.usage?.output_tokens },
      });

      return NextResponse.json({
        calendar,
        tokens: data.usage?.output_tokens || 0,
        posts_saved: calendar.length,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- Generate individual post ---
  if (action === "generate_post") {
    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: "CLAUDE_API_KEY not configured" }, { status: 500 });
    }

    const { platform, content_type, topic, brand_context } = body;

    const prompt = `Eres Copy, el copywriter de PACAME.

Crea un ${content_type || "post"} para ${platform || "instagram"} sobre: ${topic}

CONTEXTO DE MARCA: ${brand_context || "PACAME — agencia digital IA para PYMEs"}

Responde SOLO JSON: {"title": "...", "copy": "...", "hook": "...", "cta": "...", "hashtags": ["..."], "image_prompt": "descripcion de imagen ideal para este post"}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      let post: Record<string, unknown> | null = null;
      if (jsonStart >= 0) {
        try { post = JSON.parse(text.slice(jsonStart, jsonEnd)); } catch { /* AI devolvio JSON invalido */ }
      }

      return NextResponse.json({ post, tokens: data.usage?.output_tokens || 0 });
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

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
