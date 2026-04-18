import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/marketplace/plans
 * Lista los planes de suscripcion publicos (PACAME Start, Pro, Growth, Scale).
 * Cached con revalidate=60.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("subscription_plans")
      .select(
        "id, slug, tier, name, tagline, description, price_monthly_cents, price_yearly_cents, currency, features, quotas, included_services, included_apps, trial_days, is_featured, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[marketplace/plans] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: data || [] });
  } catch (err) {
    console.error("[marketplace/plans] exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
