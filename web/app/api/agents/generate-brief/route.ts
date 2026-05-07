/**
 * GET /api/agents/generate-brief
 *
 * Cron diario · 05:30 UTC (07:30 ES) · disparado por master-cron.
 *
 * Lee drafts de hoy en `content_queue` y genera un brief estructurado
 * por cada uno usando Claude Opus 4.7. El brief se guarda en `daily_briefs`
 * con tier validado (cine/noticia/trend/cotidiano/humor).
 *
 * Reglas memoria respetadas:
 *   - feedback_research_first_escalado_por_tier.md → cada brief lleva bloque
 *     research según tier. Si Claude no encuentra source verificable → status=skipped.
 *   - feedback_audiencia_real_darkroomcreative.md → tono LATAM-friendly, sin emojis,
 *     pricing 24,90€/349€ Lifetime cuando aplica fase.
 *   - feedback_calidad_top_no_pilotos.md → si brief no llega a calidad mínima
 *     (Claude detecta humo) → skip y log.
 *
 * Coste estimado: 9 piezas/día × ~3000 tokens output × $15/Mtok = ~$0.40/día.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const CLAUDE_MODEL = "claude-opus-4-7";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

interface DraftRow {
  id: string;
  scheduled_at: string;
  format: "carousel" | "story" | "reel" | "post";
  slot: string | null;
  content_type: string | null;
  pilar: number | null;
  phase: "educar" | "introducir" | "drop_lifetime" | null;
  concept_id_planned: string | null;
}

interface TrendRow {
  id: string;
  hashtag: string;
  top_post_url: string | null;
  top_post_engagement: number | null;
  trend_summary: string | null;
}

// ─── tier mapping según content_type ──────────────────────────────

function tierForContentType(contentType: string | null, format: string): string {
  if (format === "reel" && contentType === "dark_frames_storytime") return "cine";
  if (contentType === "story_general") return "trend";
  if (contentType === "tendencia_hot") return "noticia";
  if (contentType === "ia_cotidiana") return "cotidiano";
  if (contentType === "humor_meme") return "humor";
  if (contentType === "storytime_emocional") return "opinion";
  // Tipos restantes (idea_negocio, caso_real, prompt_workflow, lista_top, comparativa, recap_semana, tutorial_60s)
  return "noticia";
}

// ─── prompts Claude por tier ──────────────────────────────────────

function buildSystemPrompt(tier: string): string {
  return `Eres COPY de @darkroomcreative.cloud · cuenta IG con audiencia 80% LATAM hombres 35-54.
Audiencia OBJETIVO: creators IA + emprendedores digitales hispanohablantes.

Reglas duras:
- Español neutro LATAM-friendly. CERO "joder/tío/chaval" expresiones España.
- CERO emojis en captions. CERO superlativos vacíos ("increíble", "revolucionario").
- Cifras concretas. Datos verificables. Tono Hormozi: realismo brutal, valor primero.
- Si dato necesita fuente y no la tienes, NO lo inventes. Salta la pieza.
- Pricing canónico Dark Room: 24,90€/mes Pro · 349€ Lifetime · trial 14 días sin tarjeta.

Tier de la pieza: ${tier}

Devuelves SOLO un JSON válido (NADA más, ni markdown ni texto extra) con esta estructura:
{
  "title": "<título corto · max 60 chars · Anton ALL CAPS lo recibirá>",
  "hook": "<frase gancho slide 1 cover · max 80 chars>",
  "slides": [
    { "n": 1, "type": "cover", "headline": "...", "subline": "...", "visual_hint": "..." },
    ...
    { "n": 10, "type": "cta", "headline": "...", "subline": "...", "visual_hint": "..." }
  ],
  "caption": "<texto IG <200 palabras · sin emojis · LATAM-friendly>",
  "hashtags": "<5-8 hashtags relevantes separados por espacio>",
  "research_tier": "${tier}",
  "source": {
    "source_url": "<URL verificable o null si tier=cotidiano/humor/opinion>",
    "source_quote": "<cita verbatim si aplica>",
    "source_date": "<YYYY-MM-DD>",
    "verification_check": "<cómo se verificó>"
  },
  "cited_data": [
    { "value": "<dato>", "source": "<URL o referencia>" }
  ],
  "skip_reason": null
}

Si NO puedes generar contenido de calidad TOP (faltan datos, no hay source verificable, tema débil),
devuelve: {"skip_reason": "<motivo concreto>", "title": null, ...todo null...}.`;
}

function buildUserPrompt(draft: DraftRow, trends: TrendRow[]): string {
  const trendsBlock = trends.length > 0
    ? trends.map((t) => `- ${t.hashtag} (eng=${t.top_post_engagement}) · ${t.top_post_url || ""}\n  resumen: ${(t.trend_summary || "").slice(0, 150)}`).join("\n")
    : "(sin trends scrapeados hoy · proceder con tu propio research si tier=noticia/idea_negocio/etc)";

  return `Genera el brief para esta pieza:
- format: ${draft.format}
- content_type: ${draft.content_type}
- pilar (1-6): ${draft.pilar || "(stories sin pilar)"}
- phase: ${draft.phase} (${draft.phase === "educar" ? "0% pitch directo" : draft.phase === "introducir" ? "15% pitch suave" : "25% pitch · drop Lifetime activo"})
- scheduled: ${draft.scheduled_at}

Trends frescos disponibles del scrape Apify de hoy (úsalos si encajan con el content_type):
${trendsBlock}

Si el content_type es:
- idea_negocio: idea concreta de negocio con IA + cifra MRR realista verificable + cómo arrancar HOY
- caso_real: caso real con cifras reales (testimonio Dark Room o caso público verificable)
- prompt_workflow: prompt copiable + 3 ejemplos de output + variación pro
- lista_top: ranking concreto · cada item con qué hace + por qué + caso uso
- comparativa: 2-3 herramientas con pros/contras honestos · sin "el mejor" sin contexto
- ia_cotidiana: USAR IA PARA TAREA COTIDIANA real (lista compra · viaje · disfraz · etc) · screenshots imaginables
- humor_meme: caso real (o muy creíble) de IA fallando cómicamente · saves+shares por humor
- tutorial_60s: workflow paso 1-2-3 grabable en 60s reel
- storytime_emocional: confesión personal con números · transformación real
- recap_semana: 5 anuncios IA importantes semana + 2 que ignoré + por qué
- tendencia_hot: noticia IA fresca <24h · source verificable obligatorio
- dark_frames_storytime: BTS proceso research-first del reel cinemático del día

Genera SOLO el JSON. Sin markdown wrappers. Sin texto antes ni después.`;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<{ json: Record<string, unknown> | null; tokensUsed: number; error?: string }> {
  try {
    const r = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!r.ok) {
      return { json: null, tokensUsed: 0, error: `Claude HTTP ${r.status}` };
    }
    const data = await r.json();
    const text: string = data.content?.[0]?.text || "";
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    // Extraer JSON (Claude puede prefacarlo con markdown a pesar del prompt)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { json: null, tokensUsed: tokens, error: "no JSON in Claude response" };
    }
    try {
      return { json: JSON.parse(match[0]), tokensUsed: tokens };
    } catch (e) {
      return {
        json: null,
        tokensUsed: tokens,
        error: `JSON parse fail: ${e instanceof Error ? e.message : "unknown"}`,
      };
    }
  } catch (e) {
    return { json: null, tokensUsed: 0, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) {
    return NextResponse.json({ ok: false, error: "CLAUDE_API_KEY missing" }, { status: 500 });
  }

  const supabase = createServerSupabase();
  const startedAt = Date.now();

  // 1. Lee drafts de HOY (UTC) en content_queue · status=draft
  const today = new Date();
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();
  const tomorrowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)).toISOString();

  const { data: drafts, error: dErr } = await supabase
    .from("content_queue")
    .select("id, scheduled_at, format, slot, content_type, pilar, phase, concept_id_planned")
    .eq("status", "draft")
    .eq("brand", "darkroom")
    .gte("scheduled_at", todayStart)
    .lt("scheduled_at", tomorrowStart)
    .order("scheduled_at");

  if (dErr) {
    return NextResponse.json({ ok: false, error: dErr.message }, { status: 500 });
  }

  const todayDrafts = (drafts as DraftRow[]) || [];

  // Filtrar reels (los DARK_FRAMES no se generan via Claude · van por render-piece manual)
  const draftsToProcess = todayDrafts.filter((d) => d.format !== "reel");

  if (draftsToProcess.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "no drafts to process today",
      total_drafts_today: todayDrafts.length,
      reels_skipped: todayDrafts.length,
    });
  }

  // 2. Lee trends frescos (<24h · used=false)
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: trendRows } = await supabase
    .from("daily_trends")
    .select("id, hashtag, top_post_url, top_post_engagement, trend_summary")
    .gte("scraped_at", dayAgo)
    .eq("used", false)
    .order("top_post_engagement", { ascending: false })
    .limit(10);

  const trends = (trendRows as TrendRow[]) || [];

  // 3. Para cada draft, generar brief (en serie para no rate-limit Claude)
  const results: Array<{ draftId: string; status: string; error?: string; tier?: string; tokens?: number }> = [];

  for (const draft of draftsToProcess) {
    // Skip si ya hay brief para este draft (idempotencia)
    const { data: existing } = await supabase
      .from("daily_briefs")
      .select("id")
      .eq("content_queue_id", draft.id)
      .limit(1);

    if (existing && existing.length > 0) {
      results.push({ draftId: draft.id, status: "skipped_already_exists" });
      continue;
    }

    const tier = tierForContentType(draft.content_type, draft.format);
    const systemPrompt = buildSystemPrompt(tier);
    const userPrompt = buildUserPrompt(draft, trends);

    const t0 = Date.now();
    const { json: brief, tokensUsed, error } = await callClaude(systemPrompt, userPrompt, claudeKey);
    const generationMs = Date.now() - t0;

    if (!brief || error) {
      await supabase.from("daily_briefs").insert({
        date: today.toISOString().slice(0, 10),
        content_queue_id: draft.id,
        content_type: draft.content_type || "unknown",
        research_tier: tier,
        brief: { error: error || "no brief generated" },
        status: "failed",
        error: error || "no brief generated",
        generated_by_model: CLAUDE_MODEL,
        tokens_used: tokensUsed,
        generation_ms: generationMs,
      });
      results.push({ draftId: draft.id, status: "failed", error: error || "no brief", tier, tokens: tokensUsed });
      continue;
    }

    // Si Claude reportó skip_reason, marca skipped (no inventa contenido débil)
    if (brief.skip_reason) {
      await supabase.from("daily_briefs").insert({
        date: today.toISOString().slice(0, 10),
        content_queue_id: draft.id,
        content_type: draft.content_type || "unknown",
        research_tier: tier,
        brief,
        status: "skipped",
        error: String(brief.skip_reason).slice(0, 500),
        generated_by_model: CLAUDE_MODEL,
        tokens_used: tokensUsed,
        generation_ms: generationMs,
      });

      // Marcar el draft como skipped también
      await supabase
        .from("content_queue")
        .update({ status: "skipped", error: `brief skipped: ${String(brief.skip_reason).slice(0, 200)}` })
        .eq("id", draft.id);

      results.push({ draftId: draft.id, status: "skipped_by_claude", error: String(brief.skip_reason).slice(0, 100), tier, tokens: tokensUsed });
      continue;
    }

    // Guardar brief generado
    await supabase.from("daily_briefs").insert({
      date: today.toISOString().slice(0, 10),
      content_queue_id: draft.id,
      content_type: draft.content_type || "unknown",
      research_tier: tier,
      brief,
      status: "generated",
      generated_by_model: CLAUDE_MODEL,
      tokens_used: tokensUsed,
      generation_ms: generationMs,
      trends_used: trends.map((t) => t.id),
    });

    results.push({ draftId: draft.id, status: "generated", tier, tokens: tokensUsed });
  }

  const summary = {
    generated: results.filter((r) => r.status === "generated").length,
    skipped_existing: results.filter((r) => r.status === "skipped_already_exists").length,
    skipped_by_claude: results.filter((r) => r.status === "skipped_by_claude").length,
    failed: results.filter((r) => r.status === "failed").length,
    total_tokens: results.reduce((s, r) => s + (r.tokens || 0), 0),
  };

  await logAgentActivity({
    agentId: "core",
    type: "update",
    title: `Generate-brief · ${summary.generated} OK · ${summary.failed} fail · ${summary.skipped_by_claude} skip`,
    description: `Tokens: ${summary.total_tokens} · Drafts hoy: ${todayDrafts.length} (${draftsToProcess.length} no-reel procesados)`,
    metadata: {
      source: "generate-brief-cron",
      summary,
      results,
      total_ms: Date.now() - startedAt,
    },
  });

  return NextResponse.json({
    ok: summary.failed === 0,
    drafts_processed: draftsToProcess.length,
    results: summary,
    elapsed_ms: Date.now() - startedAt,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
