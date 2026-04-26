/**
 * GET /api/products/asesor-pro/invoices/:id/audio
 *
 * Devuelve un MP3 con resumen hablado de la factura. Stream directo
 * para que el navegador lo reproduzca sin guardarlo.
 *
 * Acceso: el cliente-final dueño de la factura, o el asesor padre.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { textToSpeech, buildInvoiceSummary } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireProductUser("/p/asesor-pro");
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: invoice } = await supabase
    .from("asesorpro_invoices")
    .select("id, asesor_user_id, asesor_client_id, number, series, issue_date, customer_fiscal_name, total_cents, iva_cents, subtotal_cents")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Acceso: asesor dueño o cliente-final
  let allowed = invoice.asesor_user_id === user.id;
  if (!allowed) {
    const { data: client } = await supabase
      .from("asesorpro_clients")
      .select("client_user_id")
      .eq("id", invoice.asesor_client_id)
      .single();
    if (client?.client_user_id === user.id) allowed = true;
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const summary = buildInvoiceSummary({
    number: invoice.number ?? "",
    series: invoice.series ?? null,
    customer: invoice.customer_fiscal_name ?? "el cliente",
    total_eur: invoice.total_cents / 100,
    iva_eur: invoice.iva_cents / 100,
    base_eur: invoice.subtotal_cents / 100,
    issue_date: invoice.issue_date,
  });

  const tts = await textToSpeech(summary);
  if (!tts.ok) {
    return NextResponse.json({ error: "tts_failed", detail: tts.error }, { status: tts.status });
  }

  return new NextResponse(tts.audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(tts.bytes),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
