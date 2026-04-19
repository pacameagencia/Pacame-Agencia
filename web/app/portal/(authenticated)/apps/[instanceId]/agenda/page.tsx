import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import AgendaDashboard from "@/components/apps/agenda/AgendaDashboard";

async function getClient() {
  const token = (await cookies()).get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id, name, email, business_name")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle();
  return data;
}

export default async function AgendaInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  const client = await getClient();
  if (!client) redirect("/portal");

  const supabase = createServerSupabase();

  // Verify ownership
  const { data: instance } = await supabase
    .from("app_instances")
    .select("id, app_slug, status, config")
    .eq("id", instanceId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (!instance || instance.app_slug !== "pacame-agenda") notFound();

  // Load upcoming bookings (next 30 days)
  const { data: upcoming } = await supabase
    .from("appointments")
    .select(
      "id, booking_number, customer_name, customer_email, customer_phone, scheduled_at, duration_min, status, service_id, agenda_services(name)"
    )
    .eq("instance_id", instanceId)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(100);

  // Load services
  const { data: services } = await supabase
    .from("agenda_services")
    .select("*")
    .eq("instance_id", instanceId)
    .order("sort_order", { ascending: true });

  // Load hours
  const { data: hours } = await supabase
    .from("agenda_hours")
    .select("*")
    .eq("instance_id", instanceId)
    .order("weekday", { ascending: true });

  // Stats 30d
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: statsData } = await supabase
    .from("appointments")
    .select("status")
    .eq("instance_id", instanceId)
    .gte("created_at", thirtyDaysAgo);

  const stats = {
    total_30d: statsData?.length || 0,
    confirmed: (statsData || []).filter((a) => a.status === "confirmed").length,
    completed: (statsData || []).filter((a) => a.status === "completed").length,
    canceled: (statsData || []).filter((a) => a.status === "canceled").length,
    no_show: (statsData || []).filter((a) => a.status === "no_show").length,
  };

  const instanceConfig = (instance.config as Record<string, unknown>) || {};

  return (
    <AgendaDashboard
      instanceId={instanceId}
      businessName={(instanceConfig.business_name as string) || client.business_name || client.name}
      timezone={(instanceConfig.timezone as string) || "Europe/Madrid"}
      confirmationMode={(instanceConfig.booking_confirmation_mode as string) || "manual"}
      bookings={(upcoming || []) as unknown as Parameters<typeof AgendaDashboard>[0]["bookings"]}
      services={(services || []) as Parameters<typeof AgendaDashboard>[0]["services"]}
      hours={(hours || []) as Parameters<typeof AgendaDashboard>[0]["hours"]}
      stats={stats}
    />
  );
}
