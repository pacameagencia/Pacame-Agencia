import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/by-session/[session_id]
 * Resuelve un Stripe session_id → order_id.
 * Usado por la pagina /portal/order-redirect para polling post-checkout
 * hasta que el webhook Stripe cree el row en orders.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const { session_id } = await params;
  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, customer_email, service_slug")
    .eq("stripe_session_id", session_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    // Not yet created — webhook may still be processing
    return NextResponse.json({ order: null, pending: true }, { status: 202 });
  }

  return NextResponse.json({ order: data });
}
