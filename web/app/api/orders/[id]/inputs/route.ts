import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/inputs
 * Guarda el brief del cliente y dispara /api/deliveries/start (fire-and-forget).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body requerido" }, { status: 400 });
  }
  const inputs = body.inputs as Record<string, unknown> | undefined;
  if (!inputs || typeof inputs !== "object") {
    return NextResponse.json({ error: "inputs requerido" }, { status: 400 });
  }

  // Load order + validate ownership
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, client_id, customer_email, status, service_slug")
    .eq("id", id)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const client = await getAuthedClient(request);
  const authedByClient = client && order.client_id === client.id;
  const fallbackEmail = (body.email as string | undefined) || null;
  const authedByEmail =
    fallbackEmail &&
    order.customer_email &&
    fallbackEmail.toLowerCase() === order.customer_email.toLowerCase();

  if (!authedByClient && !authedByEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (order.status !== "inputs_pending" && order.status !== "paid") {
    return NextResponse.json(
      { error: `Order ya esta en estado ${order.status}` },
      { status: 400 }
    );
  }

  // Load inputs_schema for light validation (required fields present)
  const { data: catalog } = await supabase
    .from("service_catalog")
    .select("inputs_schema")
    .eq("slug", order.service_slug)
    .maybeSingle();

  const schema = catalog?.inputs_schema as { required?: string[] } | undefined;
  const required = Array.isArray(schema?.required) ? schema.required : [];
  const missing = required.filter((k) => {
    const v = (inputs as Record<string, unknown>)[k];
    return v === undefined || v === null || v === "";
  });
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Faltan campos obligatorios: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Save inputs + mark processing
  await supabase
    .from("orders")
    .update({
      inputs,
      status: "processing",
      progress_pct: 5,
      progress_message: "Brief recibido, arrancando agente...",
    })
    .eq("id", id);

  await supabase.from("order_events").insert({
    order_id: id,
    event_type: "inputs_collected",
    title: "Brief recibido",
    message: "Arrancando agente IA.",
    payload: { fields_count: Object.keys(inputs).length },
  });

  // Fire-and-forget delivery start
  const origin = request.nextUrl.origin;
  const cronSecret = process.env.CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cronSecret) headers.Authorization = `Bearer ${cronSecret}`;

  // Do NOT await — we want to return 200 immediately so the client UI unblocks.
  fetch(`${origin}/api/deliveries/start`, {
    method: "POST",
    headers,
    body: JSON.stringify({ order_id: id }),
  }).catch((err) => {
    console.error("[orders/inputs] fire-and-forget dispatch failed:", err);
  });

  return NextResponse.json({ ok: true, order_id: id });
}
