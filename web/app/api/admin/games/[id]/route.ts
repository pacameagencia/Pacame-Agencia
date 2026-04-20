import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/games/[id] — edit game (toggle active, featured, update urls)
 * DELETE /api/admin/games/[id] — soft-delete (marca is_active=false, no borra el storage)
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyInternalAuth(request);
  if (auth) return auth;

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Solo permitir columnas editables
  const allowed = [
    "title",
    "description",
    "engine",
    "build_url",
    "loader_url",
    "data_url",
    "framework_url",
    "wasm_url",
    "thumbnail_url",
    "cover_image_url",
    "aspect_ratio",
    "memory_size_mb",
    "compression",
    "is_active",
    "is_featured",
    "tags",
  ];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("games_catalog")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyInternalAuth(request);
  if (auth) return auth;

  const { id } = await params;
  const supabase = createServerSupabase();
  // Soft delete
  const { error } = await supabase
    .from("games_catalog")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
