import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole, hasPermission } from "@/lib/security/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/orders?filter=all|processing|delivered|escalated|inputs_pending
 * Returns orders + aggregated KPIs.
 *
 * RBAC: admin o staff con permiso orders.view_all.
 */
export async function GET(request: NextRequest) {
  const sessionOrResp = await requireRole(request, ["admin", "staff"]);
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  if (!(await hasPermission(sessionOrResp, "orders.view_all"))) {
    return NextResponse.json(
      { error: "Forbidden", permission_required: "orders.view_all" },
      { status: 403 }
    );
  }

  const filter = request.nextUrl.searchParams.get("filter") || "all";
  const supabase = createServerSupabase();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, client_id, service_slug, amount_cents, status, progress_pct, escalated_to_pablo, delivered_at, rating, cost_usd, pacame_margin_cents, customer_email, customer_name, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "processing") {
    query = query.in("status", ["processing", "revision_requested"]);
  } else if (filter === "delivered") {
    query = query.eq("status", "delivered");
  } else if (filter === "escalated") {
    query = query.eq("escalated_to_pablo", true);
  } else if (filter === "inputs_pending") {
    query = query.in("status", ["paid", "inputs_pending"]);
  }

  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregated summary
  const { data: allOrders } = await supabase
    .from("orders")
    .select("status, amount_cents, pacame_margin_cents, cost_usd, escalated_to_pablo");

  const list = allOrders || [];
  const summary = {
    total: list.length,
    delivered: list.filter((o) => o.status === "delivered").length,
    processing: list.filter((o) => ["processing", "revision_requested"].includes(o.status as string)).length,
    escalated: list.filter((o) => o.escalated_to_pablo).length,
    revenue_cents: list
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + (o.amount_cents || 0), 0),
    margin_cents: list
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + (o.pacame_margin_cents || 0), 0),
    cost_usd: list.reduce((s, o) => s + Number(o.cost_usd || 0), 0),
  };

  return NextResponse.json({ orders: orders || [], summary });
}
