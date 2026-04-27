import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

/**
 * GET    /api/referrals/admin/brand-products?brand_id=X → lista
 * POST   create product (brand_id + product_key + amounts)
 * PATCH  edit one (id + fields)
 * DELETE ?id=X
 */

const numField = (v: unknown, max = 10_000_000): number | null => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n);
};

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  const brandId = request.nextUrl.searchParams.get("brand_id");
  if (!brandId) return NextResponse.json({ error: "brand_id_required" }, { status: 400 });
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("aff_brand_products")
    .select("*")
    .eq("brand_id", brandId)
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const brandId = String(body.brand_id || "");
  const productKey = String(body.product_key || "").trim().toLowerCase();
  const productName = String(body.product_name || "").trim();
  if (!brandId) return NextResponse.json({ error: "brand_id_required" }, { status: 400 });
  if (!/^[a-z0-9_]{2,40}$/.test(productKey))
    return NextResponse.json({ error: "invalid_product_key" }, { status: 400 });
  if (!productName) return NextResponse.json({ error: "product_name_required" }, { status: 400 });

  const priceCents = numField(body.price_cents);
  const stdCents   = numField(body.standard_flat_commission_cents);
  if (priceCents === null) return NextResponse.json({ error: "invalid_price_cents" }, { status: 400 });
  if (stdCents   === null) return NextResponse.json({ error: "invalid_standard_flat_commission_cents" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("aff_brand_products").insert({
    brand_id: brandId,
    product_key: productKey,
    product_name: productName,
    price_cents: priceCents,
    is_recurring: !!body.is_recurring,
    standard_flat_commission_cents: stdCents,
    vip_first_flat_commission_cents: numField(body.vip_first_flat_commission_cents) ?? stdCents,
    vip_recurring_flat_cents: numField(body.vip_recurring_flat_cents) ?? 0,
    vip_recurring_months: numField(body.vip_recurring_months, 120) ?? 0,
    active: body.active !== false,
    display_order: numField(body.display_order, 999) ?? 99,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function PATCH(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  for (const k of ["product_name", "is_recurring", "active", "display_order"]) {
    if (k in body) update[k] = body[k];
  }
  for (const k of [
    "price_cents", "standard_flat_commission_cents",
    "vip_first_flat_commission_cents", "vip_recurring_flat_cents", "vip_recurring_months",
  ]) {
    if (k in body) {
      const v = numField(body[k], 10_000_000);
      if (v === null) return NextResponse.json({ error: `invalid_${k}` }, { status: 400 });
      update[k] = v;
    }
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "no_changes" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("aff_brand_products")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function DELETE(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  const supabase = createServerSupabase();
  const { error } = await supabase.from("aff_brand_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
