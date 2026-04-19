import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  MessageSquare,
  Users,
  Bot,
  TrendingUp,
  ArrowLeft,
  Settings,
  CheckCircle2,
  Clock,
} from "lucide-react";

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

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

interface Params {
  instanceId: string;
}

export default async function AppDashboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const client = await getClient();
  if (!client) redirect("/portal");

  const { instanceId } = await params;

  const supabase = createServerSupabase();
  const { data: instance } = await supabase
    .from("app_instances")
    .select(
      "id, client_id, app_slug, app_id, status, config, provisioned_at, last_activity_at, app:app_id (name, tagline)"
    )
    .eq("id", instanceId)
    .maybeSingle();

  if (!instance || instance.client_id !== client.id) {
    redirect("/portal/apps");
  }

  const appInfo = instance.app as unknown as { name: string; tagline: string | null } | null;

  // If provisioning, redirect to setup
  if (instance.status === "provisioning") {
    redirect(`/portal/apps/${instanceId}/setup`);
  }

  // PACAME Agenda has dedicated dashboard — redirect
  if (instance.app_slug === "pacame-agenda") {
    redirect(`/portal/apps/${instanceId}/agenda`);
  }

  // KPIs
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { count: totalMonth },
    { count: totalToday },
    { count: aiSent },
    { count: leadsCount },
  ] = await Promise.all([
    supabase
      .from("app_messages")
      .select("*", { count: "exact", head: true })
      .eq("instance_id", instanceId)
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("app_messages")
      .select("*", { count: "exact", head: true })
      .eq("instance_id", instanceId)
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("app_messages")
      .select("*", { count: "exact", head: true })
      .eq("instance_id", instanceId)
      .eq("direction", "outbound")
      .eq("ai_generated", true)
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("app_leads")
      .select("*", { count: "exact", head: true })
      .eq("instance_id", instanceId),
  ]);

  // Recent conversations (grouped by contact_phone — take latest message per phone)
  const { data: recentMessages } = await supabase
    .from("app_messages")
    .select("contact_phone, contact_name, message_text, direction, created_at")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: false })
    .limit(80);

  const byPhone = new Map<
    string,
    {
      contact_phone: string;
      contact_name: string | null;
      last_message: string;
      direction: string;
      created_at: string;
    }
  >();
  for (const m of recentMessages || []) {
    const phone = m.contact_phone as string | null;
    if (!phone) continue;
    if (!byPhone.has(phone)) {
      byPhone.set(phone, {
        contact_phone: phone,
        contact_name: m.contact_name as string | null,
        last_message: m.message_text as string,
        direction: m.direction as string,
        created_at: m.created_at as string,
      });
    }
  }
  const conversations = Array.from(byPhone.values()).slice(0, 20);

  // Leads
  const { data: leads } = await supabase
    .from("app_leads")
    .select("id, name, phone, email, status, tags, last_interaction_at, created_at")
    .eq("instance_id", instanceId)
    .order("last_interaction_at", { ascending: false, nullsFirst: false })
    .limit(30);

  const isActive = instance.status === "active";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/portal/apps"
          className="inline-flex items-center gap-1.5 text-sm font-body text-pacame-white/50 hover:text-pacame-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Mis apps
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading font-bold text-3xl text-pacame-white mb-1">
              {appInfo?.name || instance.app_slug}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 text-xs font-body font-semibold px-2 py-0.5 rounded-full border ${
                  isActive
                    ? "bg-green-400/10 text-green-400 border-green-400/30"
                    : "bg-white/5 text-pacame-white/60 border-white/10"
                }`}
              >
                {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isActive ? "Activa" : instance.status}
              </span>
              {instance.last_activity_at && (
                <span className="text-xs text-pacame-white/40">
                  Ultima actividad: {formatDate(instance.last_activity_at)}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/portal/apps/${instanceId}/setup`}
            className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-pacame-white font-body font-medium px-4 py-2 rounded-xl transition text-sm"
          >
            <Settings className="w-4 h-4" />
            Editar configuracion
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi
          icon={MessageSquare}
          label="Conversaciones hoy"
          value={totalToday ?? 0}
        />
        <Kpi
          icon={TrendingUp}
          label="Mensajes este mes"
          value={totalMonth ?? 0}
        />
        <Kpi
          icon={Bot}
          label="Respuestas IA"
          value={aiSent ?? 0}
        />
        <Kpi icon={Users} label="Leads totales" value={leadsCount ?? 0} />
      </div>

      {/* Conversations + Leads side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl p-5 bg-dark-card border border-white/[0.06]">
          <h2 className="font-heading font-semibold text-pacame-white text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-olympus-gold" />
            Conversaciones recientes
          </h2>
          {conversations.length === 0 ? (
            <p className="text-sm font-body text-pacame-white/50">
              Todavia no hay conversaciones.
            </p>
          ) : (
            <ul className="space-y-3">
              {conversations.map((c) => (
                <li
                  key={c.contact_phone}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-heading font-semibold text-pacame-white text-sm truncate">
                      {c.contact_name || c.contact_phone}
                    </span>
                    <span className="text-[11px] text-pacame-white/40 font-body">
                      {formatDate(c.created_at)}
                    </span>
                  </div>
                  <p className="text-xs font-body text-pacame-white/60 line-clamp-2">
                    <span className="text-olympus-gold">
                      {c.direction === "outbound" ? "IA: " : ""}
                    </span>
                    {c.last_message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl p-5 bg-dark-card border border-white/[0.06]">
          <h2 className="font-heading font-semibold text-pacame-white text-lg mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-olympus-gold" />
            Leads
          </h2>
          {(!leads || leads.length === 0) ? (
            <p className="text-sm font-body text-pacame-white/50">
              Todavia no has captado leads.
            </p>
          ) : (
            <ul className="space-y-2">
              {leads.map((l) => (
                <li
                  key={l.id}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-body font-medium text-sm text-pacame-white truncate">
                      {l.name || l.phone || "Lead"}
                    </div>
                    <div className="text-[11px] font-body text-pacame-white/40">
                      {l.phone} · {l.status || "new"}
                      {Array.isArray(l.tags) && l.tags.length > 0 && (
                        <span> · {l.tags.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-pacame-white/40 font-body flex-shrink-0">
                    {formatDate(l.last_interaction_at as string | null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl p-5 bg-dark-card border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-body text-pacame-white/50 uppercase tracking-wider">
          {label}
        </span>
        <Icon className="w-4 h-4 text-olympus-gold" />
      </div>
      <div className="font-heading font-bold text-3xl text-pacame-white">
        {value}
      </div>
    </div>
  );
}
