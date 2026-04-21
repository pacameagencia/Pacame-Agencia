import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { recommend, generateShareSlug } from "@/lib/finder/recommend";
import type { QuizAnswers } from "@/lib/finder/rules";

/**
 * POST /api/finder/save
 * Recibe respuestas del quiz + opcional email/phone del lead, guarda en DB,
 * devuelve slug para share link + recommendation.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as {
    answers?: QuizAnswers;
    lead_email?: string;
    lead_phone?: string;
    lead_name?: string;
  };

  if (!payload.answers || !payload.answers.sector) {
    return NextResponse.json(
      { error: "Missing answers.sector" },
      { status: 400 }
    );
  }

  const rec = recommend(payload.answers);

  // Try insert with generated slug, retry 1x if collision
  const supabase = createServerSupabase();
  let slug = generateShareSlug();
  let saved: { slug: string } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("quiz_results")
      .insert({
        slug,
        sector: payload.answers.sector,
        business_size: payload.answers.size,
        goal: payload.answers.goal,
        budget: payload.answers.budget,
        urgency: payload.answers.urgency,
        persona_slug: rec.persona_slug,
        recommended_bundle: rec.bundle,
        total_cents: rec.total_cents,
        timeline_days: rec.timeline_days,
        lead_email: payload.lead_email || null,
        lead_phone: payload.lead_phone || null,
        lead_name: payload.lead_name || null,
      })
      .select("slug")
      .single();

    if (data) {
      saved = data as { slug: string };
      break;
    }
    // Colision: regenerar slug y reintentar
    if (error?.code === "23505") {
      slug = generateShareSlug();
      continue;
    }
    // Otro error: fallar
    return NextResponse.json(
      { error: error?.message || "Database error" },
      { status: 500 }
    );
  }

  if (!saved) {
    return NextResponse.json(
      { error: "Could not generate unique slug after retries" },
      { status: 500 }
    );
  }

  // Si hay email, tambien persistir como lead
  if (payload.lead_email) {
    try {
      await supabase
        .from("leads")
        .upsert(
          {
            email: payload.lead_email,
            name: payload.lead_name || null,
            phone: payload.lead_phone || null,
            source: "quiz",
            service_interested: rec.persona_slug || payload.answers.sector,
            status: "quiz_completed",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
    } catch {
      // Non-critical — quiz ya guardado
    }
  }

  return NextResponse.json({
    slug: saved.slug,
    recommendation: rec,
  });
}
