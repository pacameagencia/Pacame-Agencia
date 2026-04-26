/**
 * Queries de datos para el panel del asesor (multi-tenant via asesor_user_id).
 * Centraliza las lecturas que usan varias páginas del dashboard.
 */

import { createServerSupabase } from "@/lib/supabase/server";

export interface AsesorClient {
  id: string;
  fiscal_name: string;
  trade_name: string | null;
  nif: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  iva_regime: string;
  status: "invited" | "active" | "paused" | "archived";
  invite_accepted_at: string | null;
  client_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineCard {
  id: string;
  asesor_client_id: string | null;
  title: string;
  description: string | null;
  status: "pendiente" | "revisado" | "presentado" | "cerrado";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AsesorAlert {
  id: string;
  asesor_client_id: string | null;
  type: string;
  severity: "info" | "warning" | "urgent";
  title: string;
  message: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  clients_total: number;
  clients_active: number;
  clients_invited: number;
  invoices_this_month: number;
  invoices_pending_review: number;
  expenses_pending_review: number;
  pipeline_open: number;
  alerts_unread: number;
  total_billed_cents_month: number;
}

export async function listAsesorClients(asesorUserId: string): Promise<AsesorClient[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_clients")
    .select("id, fiscal_name, trade_name, nif, email, phone, city, iva_regime, status, invite_accepted_at, client_user_id, created_at, updated_at")
    .eq("asesor_user_id", asesorUserId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  return (data ?? []) as AsesorClient[];
}

export async function getAsesorClient(asesorUserId: string, clientId: string): Promise<AsesorClient | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_clients")
    .select("*")
    .eq("asesor_user_id", asesorUserId)
    .eq("id", clientId)
    .single();
  return (data as AsesorClient) ?? null;
}

export async function listPipelineCards(asesorUserId: string): Promise<PipelineCard[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_pipeline_cards")
    .select("*")
    .eq("asesor_user_id", asesorUserId)
    .order("status")
    .order("position");
  return (data ?? []) as PipelineCard[];
}

export async function listUnreadAlerts(asesorUserId: string, limit = 20): Promise<AsesorAlert[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_alerts")
    .select("*")
    .eq("asesor_user_id", asesorUserId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AsesorAlert[];
}

export interface AsesorInvoiceListItem {
  id: string;
  asesor_client_id: string;
  client_fiscal_name: string;
  number: string | null;
  series: string | null;
  issue_date: string;
  customer_fiscal_name: string | null;
  total_cents: number;
  iva_cents: number;
  subtotal_cents: number;
  status: string;
  reviewed_by_asesor_at: string | null;
  pdf_url: string | null;
}

export async function listAllInvoices(
  asesorUserId: string,
  filters?: { client_id?: string | null; quarter?: 1 | 2 | 3 | 4 | null; year?: number | null; only_pending?: boolean }
): Promise<AsesorInvoiceListItem[]> {
  const supabase = createServerSupabase();

  let query = supabase
    .from("asesorpro_invoices")
    .select(
      "id, asesor_client_id, number, series, issue_date, customer_fiscal_name, total_cents, iva_cents, subtotal_cents, status, reviewed_by_asesor_at, pdf_url, asesorpro_clients!inner(fiscal_name)"
    )
    .eq("asesor_user_id", asesorUserId)
    .order("issue_date", { ascending: false })
    .limit(200);

  if (filters?.client_id) query = query.eq("asesor_client_id", filters.client_id);
  if (filters?.only_pending) query = query.is("reviewed_by_asesor_at", null);

  if (filters?.quarter && filters?.year) {
    const startMonth = (filters.quarter - 1) * 3;
    const start = new Date(filters.year, startMonth, 1).toISOString().slice(0, 10);
    const end = new Date(filters.year, startMonth + 3, 0).toISOString().slice(0, 10);
    query = query.gte("issue_date", start).lte("issue_date", end);
  }

  const { data } = await query;
  return ((data ?? []) as unknown as Array<AsesorInvoiceListItem & { asesorpro_clients: { fiscal_name: string } }>).map(
    (r) => ({
      id: r.id,
      asesor_client_id: r.asesor_client_id,
      client_fiscal_name: r.asesorpro_clients?.fiscal_name ?? "—",
      number: r.number,
      series: r.series,
      issue_date: r.issue_date,
      customer_fiscal_name: r.customer_fiscal_name,
      total_cents: r.total_cents,
      iva_cents: r.iva_cents,
      subtotal_cents: r.subtotal_cents,
      status: r.status,
      reviewed_by_asesor_at: r.reviewed_by_asesor_at,
      pdf_url: r.pdf_url,
    })
  );
}

export interface AsesorExpenseListItem {
  id: string;
  asesor_client_id: string;
  client_fiscal_name: string;
  expense_date: string;
  vendor_name: string | null;
  vendor_nif: string | null;
  category: string | null;
  base_cents: number;
  iva_cents: number;
  total_cents: number;
  status: string;
  photo_url: string | null;
}

export async function listAllExpenses(
  asesorUserId: string,
  filters?: { client_id?: string | null; status?: string | null }
): Promise<AsesorExpenseListItem[]> {
  const supabase = createServerSupabase();
  let query = supabase
    .from("asesorpro_expenses")
    .select(
      "id, asesor_client_id, expense_date, vendor_name, vendor_nif, category, base_cents, iva_cents, total_cents, status, photo_url, asesorpro_clients!inner(fiscal_name)"
    )
    .eq("asesor_user_id", asesorUserId)
    .order("expense_date", { ascending: false })
    .limit(200);
  if (filters?.client_id) query = query.eq("asesor_client_id", filters.client_id);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data } = await query;
  return ((data ?? []) as unknown as Array<AsesorExpenseListItem & { asesorpro_clients: { fiscal_name: string } }>).map(
    (r) => ({
      id: r.id,
      asesor_client_id: r.asesor_client_id,
      client_fiscal_name: r.asesorpro_clients?.fiscal_name ?? "—",
      expense_date: r.expense_date,
      vendor_name: r.vendor_name,
      vendor_nif: r.vendor_nif,
      category: r.category,
      base_cents: r.base_cents,
      iva_cents: r.iva_cents,
      total_cents: r.total_cents,
      status: r.status,
      photo_url: r.photo_url,
    })
  );
}

export async function markAlertRead(asesorUserId: string, alertId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("asesorpro_alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("asesor_user_id", asesorUserId);
  return !error;
}

export async function getDashboardStats(asesorUserId: string): Promise<DashboardStats> {
  const supabase = createServerSupabase();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartISO = monthStart.toISOString();

  const [
    clientsTotal,
    clientsActive,
    clientsInvited,
    invoicesMonth,
    invoicesPending,
    expensesPending,
    pipelineOpen,
    alertsUnread,
    billedSum,
  ] = await Promise.all([
    supabase.from("asesorpro_clients").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).neq("status", "archived"),
    supabase.from("asesorpro_clients").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).eq("status", "active"),
    supabase.from("asesorpro_clients").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).eq("status", "invited"),
    supabase.from("asesorpro_invoices").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).gte("issue_date", monthStartISO.slice(0, 10)),
    supabase.from("asesorpro_invoices").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).eq("status", "issued").is("reviewed_by_asesor_at", null),
    supabase.from("asesorpro_expenses").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).eq("status", "pending"),
    supabase.from("asesorpro_pipeline_cards").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).neq("status", "cerrado"),
    supabase.from("asesorpro_alerts").select("*", { count: "exact", head: true }).eq("asesor_user_id", asesorUserId).is("read_at", null),
    supabase.from("asesorpro_invoices").select("total_cents").eq("asesor_user_id", asesorUserId).gte("issue_date", monthStartISO.slice(0, 10)),
  ]);

  const totalBilled = (billedSum.data ?? []).reduce((acc, r) => acc + ((r as { total_cents?: number }).total_cents ?? 0), 0);

  return {
    clients_total: clientsTotal.count ?? 0,
    clients_active: clientsActive.count ?? 0,
    clients_invited: clientsInvited.count ?? 0,
    invoices_this_month: invoicesMonth.count ?? 0,
    invoices_pending_review: invoicesPending.count ?? 0,
    expenses_pending_review: expensesPending.count ?? 0,
    pipeline_open: pipelineOpen.count ?? 0,
    alerts_unread: alertsUnread.count ?? 0,
    total_billed_cents_month: totalBilled,
  };
}
