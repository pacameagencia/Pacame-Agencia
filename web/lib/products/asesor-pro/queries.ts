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
    .select("id, fiscal_name, trade_name, nif, email, phone, city, iva_regime, status, invite_accepted_at, created_at, updated_at")
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
