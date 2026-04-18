import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/catalog — list all products (incl. drafts).
 * POST /api/dashboard/catalog — create new product.
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("service_catalog")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

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
  return NextResponse.json({ product: data });
}
