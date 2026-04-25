/**
 * Queries del PANEL DEL CLIENTE-FINAL (no del asesor).
 *
 * El cliente-final logueado tiene rol="client_of" y parent_user_id apuntando
 * al asesor. Sus datos están en asesorpro_clients.client_user_id = user.id.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import type { ProductUser } from "@/lib/products/auth";

export interface ClientContext {
  asesor_client_id: string;
  asesor_user_id: string;
  fiscal_name: string;
  nif: string;
  invoice_prefix: string;
  invoice_next_number: number;
  iva_regime: string;
}

export async function getClientContext(user: ProductUser): Promise<ClientContext | null> {
  if (user.role !== "client_of") return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_clients")
    .select("id, asesor_user_id, fiscal_name, nif, invoice_prefix, invoice_next_number, iva_regime")
    .eq("client_user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    asesor_client_id: data.id,
    asesor_user_id: data.asesor_user_id,
    fiscal_name: data.fiscal_name,
    nif: data.nif,
    invoice_prefix: data.invoice_prefix ?? "",
    invoice_next_number: data.invoice_next_number ?? 1,
    iva_regime: data.iva_regime,
  };
}

export interface ClientInvoice {
  id: string;
  number: string;
  series: string;
  issue_date: string;
  customer_fiscal_name: string;
  customer_nif: string;
  subtotal_cents: number;
  iva_cents: number;
  total_cents: number;
  status: string;
  pdf_url: string | null;
}

export async function listClientInvoices(asesorClientId: string): Promise<ClientInvoice[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_invoices")
    .select("id, number, series, issue_date, customer_fiscal_name, customer_nif, subtotal_cents, iva_cents, total_cents, status, pdf_url")
    .eq("asesor_client_id", asesorClientId)
    .order("issue_date", { ascending: false })
    .limit(100);
  return (data ?? []) as ClientInvoice[];
}

export interface QuarterSummary {
  quarter: string;
  year: number;
  invoices_count: number;
  iva_repercutido_cents: number;
  base_repercutido_cents: number;
  expenses_count: number;
  iva_soportado_cents: number;
  base_soportado_cents: number;
  iva_diff_cents: number; // a pagar (positivo) o a compensar (negativo)
}

export async function getQuarterSummary(asesorClientId: string, year: number, quarter: 1 | 2 | 3 | 4): Promise<QuarterSummary> {
  const supabase = createServerSupabase();
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0); // último día del último mes
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const [invoices, expenses] = await Promise.all([
    supabase
      .from("asesorpro_invoices")
      .select("subtotal_cents, iva_cents")
      .eq("asesor_client_id", asesorClientId)
      .gte("issue_date", startStr)
      .lte("issue_date", endStr)
      .neq("status", "cancelled"),
    supabase
      .from("asesorpro_expenses")
      .select("base_cents, iva_cents")
      .eq("asesor_client_id", asesorClientId)
      .gte("expense_date", startStr)
      .lte("expense_date", endStr)
      .neq("status", "rejected"),
  ]);

  const invList = invoices.data ?? [];
  const expList = expenses.data ?? [];

  const baseRep = invList.reduce((acc, r) => acc + ((r.subtotal_cents as number) ?? 0), 0);
  const ivaRep = invList.reduce((acc, r) => acc + ((r.iva_cents as number) ?? 0), 0);
  const baseSop = expList.reduce((acc, r) => acc + ((r.base_cents as number) ?? 0), 0);
  const ivaSop = expList.reduce((acc, r) => acc + ((r.iva_cents as number) ?? 0), 0);

  return {
    quarter: `Q${quarter}`,
    year,
    invoices_count: invList.length,
    iva_repercutido_cents: ivaRep,
    base_repercutido_cents: baseRep,
    expenses_count: expList.length,
    iva_soportado_cents: ivaSop,
    base_soportado_cents: baseSop,
    iva_diff_cents: ivaRep - ivaSop,
  };
}

export function currentQuarter(date = new Date()): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const month = date.getMonth();
  return {
    year: date.getFullYear(),
    quarter: (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4,
  };
}
