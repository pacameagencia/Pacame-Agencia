import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** GET/PATCH/DELETE a single product by id */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("service_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const supabase = createServerSupabase();

  // Allowed fields for PATCH
  const allowed = [
    "name", "tagline", "description", "price_cents", "currency",
    "agent_id", "delivery_sla_hours", "deliverable_kind", "revisions_included",
    "inputs_schema", "features", "faq", "category", "tags",
    "runner_type", "runner_config", "product_type", "is_active",
    "is_featured", "sort_order", "cover_image_url", "qa_enabled", "qa_threshold",
  ];

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await supabase
    .from("service_catalog")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("service_catalog")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
