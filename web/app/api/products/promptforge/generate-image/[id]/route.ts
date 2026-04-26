/**
 * GET /api/products/promptforge/generate-image/:id
 *
 * Polling de la generación. Pregunta a Freepik por el task_id, actualiza
 * status + urls en BD y devuelve estado al cliente.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireProductUser } from "@/lib/products/session";
import { getGenerationTask } from "@/lib/freepik";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireProductUser("/p/promptforge");
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: gen } = await supabase
    .from("promptforge_generations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!gen) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Si ya está terminada, no consultamos Freepik
  if (gen.status === "completed" || gen.status === "failed") {
    return NextResponse.json({
      ok: true,
      generation_id: gen.id,
      status: gen.status,
      urls: gen.urls,
      error: gen.error_message,
    });
  }

  if (!gen.provider_task_id) {
    return NextResponse.json({ ok: true, generation_id: gen.id, status: gen.status });
  }

  let task;
  try {
    task = await getGenerationTask(gen.provider_task_id);
  } catch (err) {
    return NextResponse.json(
      { ok: true, generation_id: gen.id, status: "processing", warning: err instanceof Error ? err.message : String(err) }
    );
  }

  if (task.status === "COMPLETED") {
    const urls = task.generated ?? [];
    await supabase
      .from("promptforge_generations")
      .update({ status: "completed", urls })
      .eq("id", gen.id);
    return NextResponse.json({ ok: true, generation_id: gen.id, status: "completed", urls });
  }
  if (task.status === "FAILED") {
    await supabase
      .from("promptforge_generations")
      .update({ status: "failed", error_message: "Freepik task failed" })
      .eq("id", gen.id);
    return NextResponse.json({ ok: true, generation_id: gen.id, status: "failed", error: "Freepik task failed" });
  }

  return NextResponse.json({ ok: true, generation_id: gen.id, status: "processing" });
}
