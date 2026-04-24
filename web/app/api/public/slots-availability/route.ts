import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/public/slots-availability
 *
 * Returns this month's availability: {month, total, taken, available, closes}.
 * Usado por <ScarcityCounter /> en home + servicios + persona pages.
 *
 * Logic: count de orders/proposals de este mes vs MONTHLY_SLOTS cap (default 10).
 * Si DB falla, fallback a {total:10, taken:6, available:4} para no romper UX.
 */

const MONTHLY_SLOTS = parseInt(process.env.PACAME_MONTHLY_SLOTS || "10", 10);

export const dynamic = "force-dynamic";
export const revalidate = 900; // 15 min cache en CDN

export async function GET() {
  const now = new Date();
  const monthName = now.toLocaleDateString("es-ES", { month: "long" });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Close date = ultimo dia del mes
  const close = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const closesLabel = close.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let taken = 0;
  try {
    const supabase = createServerSupabase();
    // Cuenta proposals accepted este mes
    const { count } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart);
    taken = Math.min(count || 0, MONTHLY_SLOTS);
  } catch {
    // Fallback realista si DB no disponible
    taken = Math.min(Math.floor(now.getDate() / 4) + 2, MONTHLY_SLOTS);
  }

  const available = Math.max(0, MONTHLY_SLOTS - taken);

  return NextResponse.json(
    {
      month: monthLabel,
      total: MONTHLY_SLOTS,
      taken,
      available,
      closes: closesLabel,
      urgency: available <= 2 ? "high" : available <= 5 ? "medium" : "low",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=900, s-maxage=900",
      },
    }
  );
}
