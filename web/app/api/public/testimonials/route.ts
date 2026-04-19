import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

// Cache 10 min — testimonials cambian con muy poca frecuencia
export const revalidate = 600;

/**
 * GET /api/public/testimonials
 * Devuelve testimonios publicos para home + paginas de landing.
 * Ordenado: featured primero, sort_order asc, maximo 12.
 */
export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("testimonials")
      .select(
        "id, author_name, author_role, author_company, author_photo_url, author_city, quote, rating, service_slug, featured, sort_order"
      )
      .eq("is_active", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(12);

    if (error) {
      getLogger().error({ err: error }, "[public/testimonials] query error");
      return NextResponse.json({ testimonials: [] });
    }

    return NextResponse.json({ testimonials: data || [] });
  } catch (err) {
    getLogger().error({ err }, "[public/testimonials] exception");
    return NextResponse.json({ testimonials: [] });
  }
}
