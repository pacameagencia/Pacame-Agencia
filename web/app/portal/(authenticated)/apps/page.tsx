import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Boxes, ArrowRight, Settings, CheckCircle2, Clock } from "lucide-react";

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

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  provisioning: { label: "Pendiente configuracion", color: "text-orange-400", icon: Clock },
  active: { label: "Activa", color: "text-green-400", icon: CheckCircle2 },
  past_due: { label: "Pago pendiente", color: "text-orange-400", icon: Clock },
  canceled: { label: "Cancelada", color: "text-pacame-white/40", icon: Clock },
  suspended: { label: "Suspendida", color: "text-rose-400", icon: Clock },
};

export default async function AppsListPage() {
  const client = await getClient();
  if (!client) redirect("/portal");

  const supabase = createServerSupabase();
  const { data: rows } = await supabase
    .from("app_instances")
    .select(
      "id, app_slug, app_id, status, provisioned_at, last_activity_at, created_at, app:app_id (slug, name, tagline, icon_url)"
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const instances = (rows || []) as unknown as Array<{
    id: string;
    app_slug: string;
    status: string;
    provisioned_at: string | null;
    last_activity_at: string | null;
    created_at: string;
    app: { slug: string; name: string; tagline: string | null; icon_url: string | null } | null;
  }>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-pacame-white mb-1 flex items-center gap-3">
            <Boxes className="w-7 h-7 text-olympus-gold" />
            Mis apps
          </h1>
          <p className="text-pacame-white/60 font-body text-sm">
            Apps activadas para tu negocio.
          </p>
        </div>
        <Link
          href="/apps"
          className="inline-flex items-center gap-2 bg-olympus-gold hover:bg-olympus-gold/90 text-pacame-black font-heading font-semibold px-5 py-2.5 rounded-xl transition"
        >
          Descubrir mas apps
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {instances.length === 0 ? (
        <div className="rounded-2xl p-12 bg-dark-card border border-white/[0.06] text-center">
          <Boxes className="w-12 h-12 text-pacame-white/30 mx-auto mb-4" />
          <h2 className="font-heading font-semibold text-xl text-pacame-white mb-2">
            Aun no tienes apps
          </h2>
          <p className="text-pacame-white/60 font-body text-sm mb-6">
            Las apps productizadas PACAME funcionan solas. Activa la primera en 1 clic.
          </p>
          <Link
            href="/planes"
            className="inline-flex items-center gap-2 bg-olympus-gold hover:bg-olympus-gold/90 text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl transition"
          >
            Ver planes y apps
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instances.map((inst) => {
            const info = statusLabels[inst.status] || {
              label: inst.status,
              color: "text-pacame-white/60",
              icon: Clock,
            };
            const Icon = info.icon;
            const needsSetup = inst.status === "provisioning";
            const href = needsSetup
              ? `/portal/apps/${inst.id}/setup`
              : `/portal/apps/${inst.id}`;
            return (
              <Link
                key={inst.id}
                href={href}
                className="group block rounded-2xl p-5 bg-dark-card border border-white/[0.06] hover:border-olympus-gold/30 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-pacame-white text-lg">
                      {inst.app?.name || inst.app_slug}
                    </h3>
                    {inst.app?.tagline && (
                      <p className="text-sm font-body text-pacame-white/50 mt-0.5">
                        {inst.app.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-body ${info.color}`}>
                        <Icon className="w-3 h-3" />
                        {info.label}
                      </span>
                      {needsSetup && (
                        <span className="text-xs font-body text-olympus-gold">
                          · Completa el setup
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.04] text-pacame-white/40 group-hover:text-olympus-gold transition">
                    {needsSetup ? <Settings className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
