/**
 * GET  /api/products/asesor-pro/invoices             listar facturas del cliente
 * POST /api/products/asesor-pro/invoices             crear factura
 *
 * Multi-tenant via:
 *   - cliente final: asesor_client_id derivado de su user
 *   - asesor: query con filtro asesor_user_id (caso lectura todas sus facturas)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createServerSupabase();

  if (user.role === "client_of") {
    const ctx = await getClientContext(user);
    if (!ctx) return NextResponse.json({ error: "client context not found" }, { status: 403 });
    const { data } = await supabase
      .from("asesorpro_invoices")
      .select("id, number, series, issue_date, customer_fiscal_name, customer_nif, subtotal_cents, iva_cents, total_cents, status, pdf_url, lines")
      .eq("asesor_client_id", ctx.asesor_client_id)
      .order("issue_date", { ascending: false })
      .limit(200);
    return NextResponse.json({ invoices: data ?? [] });
  }

  // Asesor: ve TODAS las facturas de sus clientes
  const { data } = await supabase
    .from("asesorpro_invoices")
    .select("id, asesor_client_id, number, series, issue_date, customer_fiscal_name, customer_nif, subtotal_cents, iva_cents, total_cents, status, reviewed_by_asesor_at")
    .eq("asesor_user_id", user.id)
    .order("issue_date", { ascending: false })
    .limit(200);
  return NextResponse.json({ invoices: data ?? [] });
}

interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price_cents: number;
  iva_pct: number;
}

interface CreateInvoiceBody {
  customer_fiscal_name: string;
  customer_nif: string;
  customer_address?: string;
  customer_email?: string;
  issue_date?: string;
  due_date?: string;
  series?: string;
  lines: InvoiceLine[];
  notes?: string;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") {
    return NextResponse.json({ error: "solo clientes-finales pueden crear facturas" }, { status: 403 });
  }
  const ctx = await getClientContext(user);
  if (!ctx) return NextResponse.json({ error: "client context not found" }, { status: 403 });

  let body: CreateInvoiceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.customer_fiscal_name || !body.customer_nif) {
    return NextResponse.json({ error: "customer_fiscal_name y customer_nif requeridos" }, { status: 400 });
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: "al menos 1 línea de factura" }, { status: 400 });
  }
  for (const line of body.lines) {
    if (!line.description || typeof line.unit_price_cents !== "number" || line.unit_price_cents < 0) {
      return NextResponse.json({ error: "líneas inválidas: description + unit_price_cents (positivo) requeridos" }, { status: 400 });
    }
    if (typeof line.quantity !== "number" || line.quantity <= 0) {
      return NextResponse.json({ error: "quantity debe ser positivo" }, { status: 400 });
    }
  }

  const supabase = createServerSupabase();

  // Numeración correlativa: leer next_number con FOR UPDATE para evitar race
  // (en production con concurrencia alta, usar SELECT...FOR UPDATE en transacción).
  // Por simplicidad ahora hacemos read-modify-write (factible para v1 con poca concurrencia).
  const { data: clientRow, error: getErr } = await supabase
    .from("asesorpro_clients")
    .select("invoice_prefix, invoice_next_number")
    .eq("id", ctx.asesor_client_id)
    .single();

  if (getErr || !clientRow) {
    return NextResponse.json({ error: "no client row" }, { status: 500 });
  }

  const number = `${clientRow.invoice_prefix ?? ""}${String(clientRow.invoice_next_number).padStart(4, "0")}`;
  const series = body.series ?? "";

  const { data, error } = await supabase
    .from("asesorpro_invoices")
    .insert({
      asesor_client_id: ctx.asesor_client_id,
      asesor_user_id: ctx.asesor_user_id,
      number,
      series,
      issue_date: body.issue_date ?? new Date().toISOString().slice(0, 10),
      due_date: body.due_date ?? null,
      customer_fiscal_name: body.customer_fiscal_name.trim(),
      customer_nif: body.customer_nif.trim().toUpperCase(),
      customer_address: body.customer_address ?? null,
      customer_email: body.customer_email?.trim().toLowerCase() ?? null,
      lines: body.lines,
      status: "issued",
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Avanzar contador
  await supabase
    .from("asesorpro_clients")
    .update({ invoice_next_number: clientRow.invoice_next_number + 1 })
    .eq("id", ctx.asesor_client_id);

  // Crear alerta para el asesor (factura pendiente revisar)
  await supabase.from("asesorpro_alerts").insert({
    asesor_user_id: ctx.asesor_user_id,
    asesor_client_id: ctx.asesor_client_id,
    type: "invoice_created",
    severity: "info",
    title: `Nueva factura ${number} de ${ctx.fiscal_name}`,
    message: `${body.customer_fiscal_name} · ${(data.total_cents / 100).toFixed(2)} €`,
    action_url: `/app/asesor-pro/facturas?id=${data.id}`,
  });

  return NextResponse.json({ invoice: data });
}
