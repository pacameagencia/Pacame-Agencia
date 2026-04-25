/**
 * GET    /api/products/asesor-pro/pipeline              listar tarjetas
 * POST   /api/products/asesor-pro/pipeline              crear tarjeta
 * PATCH  /api/products/asesor-pro/pipeline?id=xxx       mover/editar tarjeta
 * DELETE /api/products/asesor-pro/pipeline?id=xxx       borrar tarjeta
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { listPipelineCards } from "@/lib/products/asesor-pro/queries";

export const runtime = "nodejs";

const VALID_STATUS = ["pendiente", "revisado", "presentado", "cerrado"];

async function requireOwner() {
  const user = await getCurrentProductUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (user.role !== "owner" && user.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const { user, error } = await requireOwner();
  if (error) return error;
  const cards = await listPipelineCards(user.id);
  return NextResponse.json({ cards });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireOwner();
  if (error) return error;

  let body: {
    title: string;
    description?: string;
    asesor_client_id?: string;
    status?: string;
    priority?: string;
    due_date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const status = body.status && VALID_STATUS.includes(body.status) ? body.status : "pendiente";

  const supabase = createServerSupabase();
  const { data: maxRow } = await supabase
    .from("asesorpro_pipeline_cards")
    .select("position")
    .eq("asesor_user_id", user.id)
    .eq("status", status)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow?.position as number | undefined) ?? 0) + 1;

  const { data, error: insertError } = await supabase
    .from("asesorpro_pipeline_cards")
    .insert({
      asesor_user_id: user.id,
      asesor_client_id: body.asesor_client_id ?? null,
      title: body.title.trim(),
      description: body.description ?? null,
      status,
      priority: body.priority ?? "normal",
      due_date: body.due_date ?? null,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ card: data });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let body: { status?: string; priority?: string; title?: string; description?: string; due_date?: string | null; position?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status && VALID_STATUS.includes(body.status)) update.status = body.status;
  if (body.priority) update.priority = body.priority;
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.due_date !== undefined) update.due_date = body.due_date;
  if (body.position !== undefined) update.position = body.position;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error: updateError } = await supabase
    .from("asesorpro_pipeline_cards")
    .update(update)
    .eq("id", id)
    .eq("asesor_user_id", user.id)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ card: data });
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireOwner();
  if (error) return error;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createServerSupabase();
  const { error: delError } = await supabase
    .from("asesorpro_pipeline_cards")
    .delete()
    .eq("id", id)
    .eq("asesor_user_id", user.id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
