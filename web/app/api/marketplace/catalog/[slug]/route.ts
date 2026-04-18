import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/marketplace/catalog/[slug]
 * Detalle de un producto del catalogo marketplace.
 */
export const revalidate = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[marketplace/catalog/:slug] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    console.error("[marketplace/catalog/:slug] exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
