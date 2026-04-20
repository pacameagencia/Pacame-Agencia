import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

// Cache 10 min — los badges cambian con poca frecuencia (campanas)
export const revalidate = 600;

/**
 * GET /api/public/badges
 * Devuelve los marketplace_badges activos por service_slug.
 * Response: { badges: { [service_slug]: [{label, color, priority}] } }
 */
export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("marketplace_badges")
      .select("service_slug, label, color, priority, expires_at")
      .order("priority", { ascending: false });

    if (error) {
      getLogger().error({ err: error }, "[public/badges] error");
      return NextResponse.json({ badges: {} });
    }

    // Filtrar expirados a nivel app tambien (RLS ya filtra, esto es belt-and-suspenders)
    const now = Date.now();
    const activeRows = (data || []).filter(
      (r) => !r.expires_at || new Date(r.expires_at as string).getTime() > now
    );

    // Agrupar por slug
    const grouped: Record<
      string,
      { label: string; color: string; priority: number }[]
    > = {};
    for (const r of activeRows) {
      const slug = r.service_slug as string;
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push({
        label: r.label as string,
        color: (r.color as string) || "gold",
        priority: (r.priority as number) || 50,
      });
    }

    return NextResponse.json({ badges: grouped });
  } catch (err) {
    getLogger().error({ err }, "[public/badges] exception");
    return NextResponse.json({ badges: {} });
  }
}
