import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import OrderTracker from "@/components/order/OrderTracker";

async function getClient() {
  const token = (await cookies()).get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle();
  return data;
}

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient();
  if (!client) redirect(`/portal?redirect=/portal/orders/${id}`);

  const supabase = createServerSupabase();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, client_id, service_slug, status, progress_pct, progress_message, assigned_agent, delivered_at, escalated_to_pablo, rating, customer_email"
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();
  if (order.client_id !== client.id) redirect("/portal/orders");

  // Redirect to form if inputs still pending
  if (order.status === "paid" || order.status === "inputs_pending") {
    redirect(`/portal/orders/${id}/form`);
  }

  const [{ data: catalog }, { data: deliverables }, { data: events }, { count: revisionsCount }] =
    await Promise.all([
      supabase
        .from("service_catalog")
        .select("name, tagline, revisions_included")
        .eq("slug", order.service_slug)
        .maybeSingle(),
      supabase
        .from("deliverables")
        .select("id, version, kind, title, file_url, preview_url, payload, meta, created_at")
        .eq("order_id", id)
        .eq("is_current", true)
        .order("version", { ascending: false }),
      supabase
        .from("order_events")
        .select("id, event_type, title, message, created_at")
        .eq("order_id", id)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("delivery_revisions")
        .select("id", { count: "exact", head: true })
        .eq("order_id", id),
    ]);

  const revisionsIncluded = (catalog?.revisions_included as number) ?? 2;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/portal/orders"
        className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink/80 font-body mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis pedidos
      </Link>

      <h1 className="font-heading font-bold text-3xl text-ink mb-1">
        {catalog?.name || order.service_slug}
      </h1>
      {catalog?.tagline && (
        <p className="text-ink/60 font-body mb-6">{catalog.tagline}</p>
      )}

      <OrderTracker
        orderId={id}
        initialOrder={{
          id: order.id as string,
          order_number: (order.order_number as string) || "",
          service_slug: order.service_slug as string,
          status: order.status as string,
          progress_pct: (order.progress_pct as number | null) ?? 0,
          progress_message: (order.progress_message as string | null) ?? null,
          assigned_agent: (order.assigned_agent as string | null) ?? null,
          delivered_at: (order.delivered_at as string | null) ?? null,
          escalated_to_pablo: !!order.escalated_to_pablo,
          rating: (order.rating as number | null) ?? null,
          customer_email: (order.customer_email as string | null) ?? null,
        }}
        initialDeliverables={(deliverables as unknown as {
          id: string; version: number; kind: string; title: string | null;
          file_url: string | null; preview_url: string | null;
          payload: unknown; meta: Record<string, unknown> | null; created_at: string;
        }[]) || []}
        initialEvents={(events as unknown as {
          id: string; event_type: string; title: string | null;
          message: string | null; created_at: string;
        }[]) || []}
        revisionsIncluded={revisionsIncluded}
        revisionsUsed={revisionsCount || 0}
      />
    </div>
  );
}
