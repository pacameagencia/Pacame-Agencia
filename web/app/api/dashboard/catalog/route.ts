import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole, hasPermission } from "@/lib/security/rbac";
import { auditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/catalog — list all products (incl. drafts).
 * POST /api/dashboard/catalog — create new product.
 *
 * RBAC: admin requerido + permission catalog.manage para mutaciones.
 */
export async function GET(request: NextRequest) {
  const sessionOrResp = await requireRole(request, ["admin", "staff"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("service_catalog")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(request: NextRequest) {
  const sessionOrResp = await requireRole(request, ["admin"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;

  // Permiso fino sobre el catalogo.
  if (!(await hasPermission(sessionOrResp, "catalog.manage"))) {
    return NextResponse.json(
      { error: "Forbidden", permission_required: "catalog.manage" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const supabase = createServerSupabase();

  // Minimal validation
  const required = ["slug", "name", "price_cents", "agent_id", "delivery_sla_hours", "deliverable_kind"];
  const missing = required.filter((k) => body[k] === undefined || body[k] === null || body[k] === "");
  if (missing.length > 0) {
    return NextResponse.json({ error: `Faltan: ${missing.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("service_catalog")
    .insert({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline || null,
      description: body.description || null,
      price_cents: body.price_cents,
      currency: body.currency || "eur",
      agent_id: body.agent_id,
      delivery_sla_hours: body.delivery_sla_hours,
      deliverable_kind: body.deliverable_kind,
      revisions_included: body.revisions_included ?? 2,
      inputs_schema: body.inputs_schema || { type: "object", properties: {} },
      features: body.features || [],
      faq: body.faq || [],
      category: body.category || null,
      tags: body.tags || [],
      runner_type: body.runner_type || "custom",
      runner_config: body.runner_config || {},
      product_type: body.product_type || "one_off",
      is_active: body.is_active ?? false,
      sort_order: body.sort_order ?? 100,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auditar creacion — no bloqueamos la respuesta.
  void auditLog({
    actor: { type: sessionOrResp.role, id: sessionOrResp.user_id },
    action: "catalog.create",
    resource: { type: "service_catalog", id: data?.id as string | null },
    metadata: { slug: body.slug, name: body.name, price_cents: body.price_cents },
    request,
  });

  return NextResponse.json({ product: data });
}
