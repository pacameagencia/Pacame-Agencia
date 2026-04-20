/**
 * GET /api/neural/decay
 * Ejecuta el decay hebbiano inverso (olvido). Llamar vía cron semanal.
 * Query params: ?factor=0.02&days=14
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const factor = parseFloat(searchParams.get("factor") || "0.02");
    const days = parseInt(searchParams.get("days") || "14", 10);
    const supabase = createServerSupabase();
    const { data, error } = await supabase.rpc("decay_synapses", {
      decay_factor: factor,
      stale_days: days,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, affected: data, factor, days });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
