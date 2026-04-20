import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole, hasPermission } from "@/lib/security/rbac";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/** GET/PATCH/DELETE a single product by id */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResp = await requireRole(request, ["admin", "staff"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;

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
  const sessionOrResp = await requireRole(request, ["admin"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  if (!(await hasPermission(sessionOrResp, "catalog.manage"))) {
    return NextResponse.json(
      { error: "Forbidden", permission_required: "catalog.manage" },
      { status: 403 }
    );
  }

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

  // Auditar update (solo campos tocados para no loguear defaults).
  void auditLog({
    actor: { type: sessionOrResp.role, id: sessionOrResp.user_id },
    action: "catalog.update",
    resource: { type: "service_catalog", id },
    metadata: { fields: Object.keys(update).filter((k) => k !== "updated_at") },
    request,
  });

  return NextResponse.json({ product: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResp = await requireRole(request, ["admin"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  if (!(await hasPermission(sessionOrResp, "catalog.manage"))) {
    return NextResponse.json(
      { error: "Forbidden", permission_required: "catalog.manage" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("service_catalog")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auditar delete (soft-delete).
  void auditLog({
    actor: { type: sessionOrResp.role, id: sessionOrResp.user_id },
    action: "catalog.delete",
    resource: { type: "service_catalog", id },
    request,
  });

  return NextResponse.json({ ok: true });
}
