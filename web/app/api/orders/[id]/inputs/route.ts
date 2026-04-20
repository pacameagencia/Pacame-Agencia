import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";
import { ordersLimiter, getClientIp } from "@/lib/security/rate-limit";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

const InputsSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
  email: z.string().email().optional(),
});

/**
 * POST /api/orders/[id]/inputs
 * Guarda el brief del cliente y dispara /api/deliveries/start (fire-and-forget).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit: 60/min por IP+orderId
  const ip = getClientIp(request);
  const rl = await ordersLimiter.limit(`${ip}:${id}`);
  if (!rl.success) {
    const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests", retry_after: retrySec },
      { status: 429, headers: { "Retry-After": String(retrySec) } }
    );
  }

  const supabase = createServerSupabase();

  const raw = await request.json().catch(() => null);
  const parsed = InputsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { inputs, email: fallbackEmail } = parsed.data;

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

  fetch(`${origin}/api/deliveries/start`, {
    method: "POST",
    headers,
    body: JSON.stringify({ order_id: id }),
  }).catch((err) => {
    getLogger().error({ err }, "[orders/inputs] fire-and-forget dispatch failed");
  });

  return NextResponse.json({ ok: true, order_id: id });
}
