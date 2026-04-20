import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { getAdminSession } from "@/lib/security/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/[id]
 * Returns order detail + current deliverable + recent events.
 * Auth: cliente logueado (cookie pacame_client_auth) OR customer_email match.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, client_id, service_slug, service_catalog_id, amount_cents, currency, status, inputs, progress_pct, progress_message, assigned_agent, delivered_at, escalated_to_pablo, escalation_reason, rating, review_text, customer_email, customer_name, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Auth check: tres vias validas
  //  1. Cliente autenticado Y dueno del pedido (client_id coincide).
  //  2. Email en query-string coincide con customer_email (fallback magico).
  //  3. Admin/staff autenticado via cookie dashboard.
  // Cliente A intentando leer pedidos de cliente B => 403 (no 401, nos permite
  // distinguir "no auth" de "auth pero sin permiso").
  const client = await getAuthedClient(request);
  const admin = await getAdminSession(request);
  const authedByClient = client && order.client_id === client.id;
  const fallbackEmail = request.nextUrl.searchParams.get("email");
  const authedByEmail =
    fallbackEmail && order.customer_email && fallbackEmail.toLowerCase() === order.customer_email.toLowerCase();

  if (!authedByClient && !authedByEmail && !admin) {
    // Si hay cliente autenticado pero NO es dueno del pedido => ownership fail.
    if (client && order.client_id && order.client_id !== client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load catalog meta
  const { data: catalog } = await supabase
    .from("service_catalog")
    .select("slug, name, tagline, delivery_sla_hours, deliverable_kind, revisions_included, inputs_schema, features, faq")
    .eq("slug", order.service_slug)
    .maybeSingle();

  // Current deliverable(s)
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id, version, kind, title, file_url, preview_url, payload, meta, is_current, created_at")
    .eq("order_id", id)
    .eq("is_current", true)
    .order("version", { ascending: false });

  // Recent events (last 50)
  const { data: events } = await supabase
    .from("order_events")
    .select("id, event_type, title, message, payload, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true })
    .limit(50);

  // Revisions
  const { data: revisions } = await supabase
    .from("delivery_revisions")
    .select("id, revision_number, feedback, feedback_sentiment, status, created_at, completed_at")
    .eq("order_id", id)
    .order("revision_number", { ascending: true });

  return NextResponse.json({
    order,
    catalog,
    deliverables: deliverables || [],
    events: events || [],
    revisions: revisions || [],
  });
}
