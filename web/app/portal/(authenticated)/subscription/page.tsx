import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Crown, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import SubscriptionActions from "@/components/portal/SubscriptionActions";

async function getClient() {
  const token = (await cookies()).get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id, email")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle();
  return data;
}

function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(0)}€`;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

const statusBadge: Record<string, { label: string; color: string }> = {
  active: { label: "Activa", color: "bg-green-400/10 text-green-400 border-green-400/30" },
  trialing: { label: "En prueba", color: "bg-blue-400/10 text-blue-400 border-blue-400/30" },
  past_due: { label: "Pago pendiente", color: "bg-orange-400/10 text-orange-400 border-orange-400/30" },
  canceled: { label: "Cancelada", color: "bg-pacame-white/10 text-pacame-white/60 border-white/10" },
  unpaid: { label: "Impago", color: "bg-red-400/10 text-red-400 border-red-400/30" },
};

interface PlanRow {
  id: string;
  slug: string;
  tier: string;
  name: string;
  tagline: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number | null;
  features: string[] | null;
  quotas: Record<string, number | string> | null;
  included_services: string[] | null;
  included_apps: string[] | null;
}

export default async function SubscriptionPage() {
  const client = await getClient();
  if (!client) redirect("/portal");

  const supabase = createServerSupabase();
  const { data: subRaw } = await supabase
    .from("subscriptions")
    .select(
      "id, status, billing_interval, current_period_start, current_period_end, started_at, cancel_at_period_end, amount_cents, quota_usage, plan:plan_id (id, slug, tier, name, tagline, price_monthly_cents, price_yearly_cents, features, quotas, included_services, included_apps)"
    )
    .eq("client_id", client.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  interface SubRow {
    id: string;
    status: string;
    billing_interval: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    started_at: string | null;
    cancel_at_period_end: boolean | null;
    amount_cents: number | null;
    quota_usage: Record<string, number> | null;
    plan: PlanRow | PlanRow[] | null;
  }

  const sub = subRaw as SubRow | null;
  const plan: PlanRow | null = sub
    ? Array.isArray(sub.plan)
      ? (sub.plan[0] as PlanRow | undefined) ?? null
      : sub.plan
    : null;

  // No subscription — CTA to browse plans
  if (!sub || !plan) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-pacame-white mb-1 flex items-center gap-3">
            <Crown className="w-7 h-7 text-olympus-gold" />
            Suscripcion
          </h1>
          <p className="text-pacame-white/60 font-body text-sm">
            Todavia no tienes una suscripcion activa.
          </p>
        </div>

        <div className="rounded-2xl p-10 bg-dark-card border border-white/[0.06] text-center">
          <Crown className="w-14 h-14 text-olympus-gold/60 mx-auto mb-4" />
          <h2 className="font-heading font-semibold text-2xl text-pacame-white mb-2">
            Activa tu equipo digital completo
          </h2>
          <p className="text-pacame-white/60 font-body text-sm mb-8 max-w-md mx-auto">
            Desde 29€/mes. Web + RRSS + SEO + Ads gestionado por IA supervisada
            por Pablo. Cancela cuando quieras.
          </p>
          <Link
            href="/planes"
            className="inline-flex items-center gap-2 bg-olympus-gold hover:bg-olympus-gold/90 text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl transition"
          >
            Ver planes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const badge = statusBadge[sub.status] || { label: sub.status, color: "bg-white/5 text-pacame-white/60 border-white/10" };
  const priceCents =
    sub.billing_interval === "year"
      ? plan.price_yearly_cents ?? plan.price_monthly_cents * 12
      : plan.price_monthly_cents;
  const intervalLabel = sub.billing_interval === "year" ? "ano" : "mes";

  const quotas = (plan.quotas || {}) as Record<string, number | string>;
  const usage = (sub.quota_usage || {}) as Record<string, number>;
  const quotaEntries = Object.entries(quotas).filter(
    ([, limit]) => typeof limit === "number" && limit > 0
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-1 flex items-center gap-3">
          <Crown className="w-7 h-7 text-olympus-gold" />
          Suscripcion
        </h1>
        <p className="text-pacame-white/60 font-body text-sm">
          Gestiona tu plan, tus quotas y lo que tienes incluido.
        </p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-olympus-gold/[0.08] to-transparent border border-olympus-gold/20 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center text-[11px] font-body font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
              >
                {badge.label}
              </span>
              {sub.cancel_at_period_end && (
                <span className="inline-flex items-center text-[11px] font-body font-medium px-2 py-0.5 rounded-full border bg-orange-400/10 text-orange-400 border-orange-400/30">
                  Cancelara al final del periodo
                </span>
              )}
            </div>
            <h2 className="font-heading font-bold text-2xl text-pacame-white">
              {plan.name}
            </h2>
            {plan.tagline && (
              <p className="text-pacame-white/60 font-body text-sm mt-1">
                {plan.tagline}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="font-heading font-bold text-3xl text-olympus-gold">
              {formatEuros(priceCents)}
              <span className="text-pacame-white/50 text-base font-body">/{intervalLabel}</span>
            </div>
            <div className="text-pacame-white/50 text-xs font-body mt-1">
              Proxima factura: {formatDate(sub.current_period_end as string | null)}
            </div>
          </div>
        </div>

        <SubscriptionActions customerEmail={client.email as string} />
      </div>

      {/* Quotas */}
      {quotaEntries.length > 0 && (
        <div className="rounded-2xl p-6 bg-dark-card border border-white/[0.06] mb-6">
          <h3 className="font-heading font-semibold text-pacame-white text-lg mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-olympus-gold" />
            Tu uso este periodo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quotaEntries.map(([key, rawLimit]) => {
              const limit = rawLimit as number;
              const used = usage[key] ?? 0;
              const pct = Math.min(100, Math.round((used / limit) * 100));
              const label = key.replace(/_/g, " ");
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm font-body mb-1">
                    <span className="text-pacame-white/70 capitalize">{label}</span>
                    <span className="text-pacame-white/50">
                      {used}/{limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-olympus-gold transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Features / included */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-dark-card border border-white/[0.06]">
          <h3 className="font-heading font-semibold text-pacame-white text-lg mb-4">
            Todo lo que incluye
          </h3>
          <ul className="space-y-2">
            {(plan.features || []).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-body text-pacame-white/70">
                <CheckCircle2 className="w-4 h-4 text-olympus-gold mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl p-6 bg-dark-card border border-white/[0.06]">
          <h3 className="font-heading font-semibold text-pacame-white text-lg mb-4">
            Apps activadas
          </h3>
          {(plan.included_apps || []).length === 0 ? (
            <p className="text-sm font-body text-pacame-white/50">
              Ninguna app incluida en este plan. Puedes comprar apps sueltas desde{" "}
              <Link href="/apps" className="text-olympus-gold hover:underline">
                /apps
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {(plan.included_apps || []).map((slug, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-body text-pacame-white/70">{slug}</span>
                  <Link
                    href={`/portal/apps`}
                    className="text-xs font-body text-olympus-gold hover:underline"
                  >
                    Configurar →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
