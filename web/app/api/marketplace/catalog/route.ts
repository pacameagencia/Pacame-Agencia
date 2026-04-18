import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

/**
 * GET /api/marketplace/catalog
 * Lista los productos activos del marketplace (entry-tier).
 * Cached con revalidate=60 para reducir hits a DB.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("service_catalog")
      .select(
        "id, slug, name, tagline, description, price_cents, currency, agent_id, delivery_sla_hours, deliverable_kind, revisions_included, features, cover_image_url, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      getLogger().error({ err: error }, "[marketplace/catalog] error");
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch (err) {
    getLogger().error({ err }, "[marketplace/catalog] exception");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
