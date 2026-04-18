import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

/**
 * GET /api/marketplace/apps
 * Lista las apps productizadas del catalogo (pacame-contact, pacame-crm, etc.).
 * Cached con revalidate=60.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("apps_catalog")
      .select(
        "id, slug, name, tagline, description, icon_url, cover_image_url, price_monthly_cents, price_yearly_cents, features, integrations, category, tags, is_featured, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      getLogger().error({ err: error }, "[marketplace/apps] error");
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ apps: data || [] });
  } catch (err) {
    getLogger().error({ err }, "[marketplace/apps] exception");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
