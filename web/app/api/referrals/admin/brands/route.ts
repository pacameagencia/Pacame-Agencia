import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * GET    /api/referrals/admin/brands       → lista brands + sus productos
 * POST   /api/referrals/admin/brands       → crea brand (slug, name, domain)
 * PATCH  /api/referrals/admin/brands       → edita brand (id + campos)
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: brands } = await supabase
    .from("aff_brands")
    .select("*")
    .eq("tenant_id", config.tenantId)
    .order("display_order", { ascending: true });

  const ids = (brands ?? []).map((b) => b.id);
  const { data: products } = ids.length
    ? await supabase
        .from("aff_brand_products")
        .select("*")
        .in("brand_id", ids)
        .order("display_order", { ascending: true })
    : { data: [] };

  const productsByBrand = new Map<string, unknown[]>();
  for (const p of products ?? []) {
    const arr = productsByBrand.get(p.brand_id) ?? [];
    arr.push(p);
    productsByBrand.set(p.brand_id, arr);
  }

  return NextResponse.json({
    brands: (brands ?? []).map((b) => ({ ...b, products: productsByBrand.get(b.id) ?? [] })),
  });
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const slug = String(body.slug || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  if (!/^[a-z0-9-]{2,32}$/.test(slug)) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const { data, error } = await supabase
    .from("aff_brands")
    .insert({
      tenant_id: config.tenantId, slug, name,
      domain: body.domain || null,
      description: body.description || null,
      active: body.active !== false,
      display_order: typeof body.display_order === "number" ? body.display_order : 99,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brand: data });
}

export async function PATCH(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  for (const k of ["name", "domain", "description", "active", "display_order"]) {
    if (k in body) update[k] = body[k];
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "no_changes" }, { status: 400 });

  const supabase = createServerSupabase();
  const config = loadReferralConfig();
  const { data, error } = await supabase
    .from("aff_brands")
    .update(update)
    .eq("tenant_id", config.tenantId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ brand: data });
}
