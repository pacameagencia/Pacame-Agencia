import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

const ASSET_TYPES = ["banner", "post", "email", "video", "script", "copy", "template", "other"] as const;

/**
 * Admin CRUD over aff_content_assets.
 *
 *   GET    ?type=&category=&active=1
 *   POST   { type, category?, title, description?, body?, preview_url?, download_url?, mime_type?, bytes?, tags?, active? }
 *   PATCH  { id, ...partial }
 *   DELETE { id }   (hard delete; use PATCH active=false for soft delete)
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const sp = request.nextUrl.searchParams;

  let q = supabase
    .from("aff_content_assets")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .order("created_at", { ascending: false });

  const type = sp.get("type");
  const category = sp.get("category");
  const activeStr = sp.get("active");

  if (type) q = q.eq("type", type);
  if (category) q = q.eq("category", category);
  if (activeStr !== null) q = q.eq("active", activeStr === "1" || activeStr === "true");

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const type = String(body.type || "");
  const title = String(body.title || "").trim();
  if (!ASSET_TYPES.includes(type as (typeof ASSET_TYPES)[number])) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data, error } = await supabase
    .from("aff_content_assets")
    .insert({
      tenant_id: config.tenantId,
      type,
      title,
      category: body.category ?? null,
      description: body.description ?? null,
      body: body.body ?? null,
      preview_url: body.preview_url ?? null,
      download_url: body.download_url ?? null,
      mime_type: body.mime_type ?? null,
      bytes: body.bytes ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      active: body.active === false ? false : true,
      created_by: body.created_by ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}

export async function PATCH(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const allowed = [
    "type", "category", "title", "description", "body",
    "preview_url", "download_url", "mime_type", "bytes", "tags", "active",
  ] as const;
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await supabase
    .from("aff_content_assets")
    .update(update)
    .eq("tenant_id", config.tenantId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ asset: data });
}

export async function DELETE(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { error } = await supabase
    .from("aff_content_assets")
    .delete()
    .eq("tenant_id", config.tenantId)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
