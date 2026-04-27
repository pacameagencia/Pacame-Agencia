import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadReferralConfig } from "@/lib/modules/referrals";

/**
 * Endpoint PÚBLICO: lista las brands activas + sus productos visibles.
 *
 *   GET /api/referrals/public/brands
 *
 * Pensado para que la landing /afiliados y el formulario de registro
 * pinten dinámicamente las marcas con sus productos y comisiones reales,
 * sin tener que hardcodear nada.
 */
export async function GET(_: NextRequest) {
  const supabase = createServerSupabase();
  const config = loadReferralConfig();

  const { data: brands } = await supabase
    .from("aff_brands")
    .select("id, slug, name, domain, description, display_order")
    .eq("tenant_id", config.tenantId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (!brands?.length) return NextResponse.json({ brands: [] });

  const ids = brands.map((b) => b.id);
  const { data: products } = await supabase
    .from("aff_brand_products")
    .select("brand_id, product_key, product_name, price_cents, is_recurring, standard_flat_commission_cents, vip_recurring_flat_cents, vip_recurring_months, display_order")
    .in("brand_id", ids)
    .eq("active", true)
    .order("display_order", { ascending: true });

  const productsByBrand = new Map<string, unknown[]>();
  for (const p of products ?? []) {
    const arr = productsByBrand.get(p.brand_id) ?? [];
    arr.push(p);
    productsByBrand.set(p.brand_id, arr);
  }

  return NextResponse.json({
    brands: brands.map((b) => ({
      ...b,
      products: productsByBrand.get(b.id) ?? [],
    })),
  });
}
