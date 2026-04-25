/**
 * GET /api/products/asesor-pro/invoices/[id]/pdf
 *
 * Devuelve la factura como HTML imprimible (Print to PDF en el navegador).
 * Cumple normativa española: NIF emisor + receptor, número correlativo,
 * fecha emisión, base, IVA desglosado por tipo, total.
 *
 * Para PDF binario real usar servicio como Browserless o pdfkit; v1 usa
 * print stylesheet del navegador (suficiente y no requiere deps).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price_cents: number;
  iva_pct: number;
}

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: inv, error } = await supabase
    .from("asesorpro_invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !inv) {
    return NextResponse.json({ error: "factura no encontrada" }, { status: 404 });
  }

  // Multi-tenant: cliente o asesor pueden verla
  if (user.role === "client_of") {
    const { data: clientRow } = await supabase
      .from("asesorpro_clients")
      .select("id")
      .eq("client_user_id", user.id)
      .single();
    if (!clientRow || clientRow.id !== inv.asesor_client_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else if (inv.asesor_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: client } = await supabase
    .from("asesorpro_clients")
    .select("fiscal_name, nif, address, postal_code, city")
    .eq("id", inv.asesor_client_id)
    .single();

  const lines = (inv.lines as InvoiceLine[]) ?? [];
  const ivaByPct = new Map<number, { base: number; iva: number }>();
  for (const line of lines) {
    const lineSub = Math.round(line.quantity * line.unit_price_cents);
    const lineIva = Math.round((lineSub * line.iva_pct) / 100);
    const acc = ivaByPct.get(line.iva_pct) ?? { base: 0, iva: 0 };
    ivaByPct.set(line.iva_pct, { base: acc.base + lineSub, iva: acc.iva + lineIva });
  }

  const issueDate = new Date(inv.issue_date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const numberFull = `${inv.series ? inv.series + "-" : ""}${inv.number}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura ${numberFull}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1813; font-size: 12pt; line-height: 1.5; margin: 0; padding: 32px; max-width: 210mm; }
  @media screen { body { background: #f4efe3; } .sheet { background: white; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); margin: 24px auto; max-width: 800px; } }
  @media print { body { padding: 0; background: white; } .sheet { padding: 0; box-shadow: none; max-width: 100%; } .no-print { display: none; } }
  h1 { font-size: 28pt; font-weight: 500; margin: 0 0 4px; letter-spacing: -0.02em; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #1A1813; margin-bottom: 24px; }
  .meta { text-align: right; font-size: 10pt; }
  .label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.15em; color: #6E6858; margin-bottom: 4px; display: block; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .party { padding: 16px; background: #F4EFE3; border-left: 3px solid #283B70; }
  .party.issuer { border-left-color: #B54E30; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.15em; color: #6E6858; padding: 8px; border-bottom: 2px solid #1A1813; font-weight: normal; }
  th.right, td.right { text-align: right; }
  td { padding: 10px 8px; border-bottom: 1px solid rgba(26,24,19,0.1); font-size: 11pt; }
  .totals { margin-left: auto; max-width: 320px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11pt; }
  .totals .total { border-top: 2px solid #1A1813; padding-top: 12px; margin-top: 8px; font-size: 14pt; font-weight: 500; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid rgba(26,24,19,0.15); font-size: 10pt; color: #6E6858; }
  .print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 20px; background: #1A1813; color: white; border: none; cursor: pointer; font-size: 11pt; font-family: inherit; box-shadow: 4px 4px 0 #B54E30; }
  .print-btn:hover { background: #B54E30; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
<div class="sheet">
  <div class="header">
    <div>
      <h1>Factura</h1>
      <span class="label">Nº ${escapeHtml(numberFull)}</span>
    </div>
    <div class="meta">
      <span class="label">Fecha emisión</span>
      <strong>${escapeHtml(issueDate)}</strong>
    </div>
  </div>

  <div class="parties">
    <div class="party issuer">
      <span class="label">Emisor</span>
      <strong style="font-size: 13pt;">${escapeHtml(client?.fiscal_name ?? "")}</strong><br>
      NIF: ${escapeHtml(client?.nif ?? "")}<br>
      ${client?.address ? `${escapeHtml(client.address)}<br>` : ""}
      ${client?.postal_code || client?.city ? escapeHtml([client.postal_code, client.city].filter(Boolean).join(" ")) : ""}
    </div>
    <div class="party">
      <span class="label">Cliente</span>
      <strong style="font-size: 13pt;">${escapeHtml(inv.customer_fiscal_name)}</strong><br>
      NIF: ${escapeHtml(inv.customer_nif)}<br>
      ${inv.customer_address ? `${escapeHtml(inv.customer_address)}<br>` : ""}
      ${inv.customer_email ? escapeHtml(inv.customer_email) : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th class="right">Cant.</th>
        <th class="right">Precio</th>
        <th class="right">IVA %</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map((l) => {
        const lineSub = Math.round(l.quantity * l.unit_price_cents);
        return `
        <tr>
          <td>${escapeHtml(l.description)}</td>
          <td class="right">${l.quantity}</td>
          <td class="right">${eur(l.unit_price_cents)}</td>
          <td class="right">${l.iva_pct}%</td>
          <td class="right">${eur(lineSub)}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Base imponible</span>
      <span>${eur(inv.subtotal_cents)}</span>
    </div>
    ${[...ivaByPct.entries()].map(([pct, { base, iva }]) => `
    <div class="row" style="font-size: 10pt; color: #6E6858;">
      <span>IVA ${pct}% sobre ${eur(base)}</span>
      <span>${eur(iva)}</span>
    </div>`).join("")}
    <div class="row total">
      <span>TOTAL</span>
      <span>${eur(inv.total_cents)}</span>
    </div>
  </div>

  ${inv.notes ? `<div class="footer"><span class="label">Notas</span><br>${escapeHtml(inv.notes)}</div>` : ""}

  <div class="footer">
    Factura emitida vía AsesorPro · PACAME · ${new Date().toLocaleDateString("es-ES")}<br>
    <span style="font-size: 9pt;">Numeración correlativa según RD 1619/2012. Conserve esta factura durante 4 años fiscales.</span>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="factura-${numberFull}.html"`,
    },
  });
}
