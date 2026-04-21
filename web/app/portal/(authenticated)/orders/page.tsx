import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
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

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  paid: { label: "Esperando brief", color: "text-yellow-400", icon: Clock },
  inputs_pending: { label: "Esperando brief", color: "text-yellow-400", icon: Clock },
  processing: { label: "En proceso", color: "text-blue-400", icon: Loader2 },
  delivered: { label: "Entregado", color: "text-green-400", icon: CheckCircle2 },
  revision_requested: { label: "En revision", color: "text-blue-400", icon: Loader2 },
  escalated: { label: "En atencion de Pablo", color: "text-orange-400", icon: AlertCircle },
  refunded: { label: "Reembolsado", color: "text-ink/40", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "text-ink/40", icon: AlertCircle },
  failed: { label: "Fallo", color: "text-red-400", icon: AlertCircle },
};

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export default async function OrdersListPage() {
  const client = await getClient();
  if (!client) redirect("/portal");

  const supabase = createServerSupabase();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, service_slug, amount_cents, currency, status, progress_pct, progress_message, delivered_at, created_at"
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = orders || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-ink mb-1 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-accent-gold" />
            Mis pedidos
          </h1>
          <p className="text-ink/60 font-body text-sm">
            Seguimiento en tiempo real de todos tus entregables
          </p>
        </div>
        <Link
          href="/servicios"
          className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-ink font-heading font-semibold px-5 py-2.5 rounded-xl transition"
        >
          Comprar otro servicio
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl p-12 bg-paper-deep border border-ink/[0.06] text-center">
          <ShoppingBag className="w-12 h-12 text-ink/30 mx-auto mb-4" />
          <h2 className="font-heading font-semibold text-xl text-ink mb-2">
            Aun no tienes pedidos
          </h2>
          <p className="text-ink/60 font-body text-sm mb-6">
            Explora nuestro catalogo de servicios y compra con un clic.
          </p>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-ink font-heading font-semibold px-6 py-3 rounded-xl transition"
          >
            Ver catalogo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((o) => {
            const statusInfo = statusLabels[o.status] || {
              label: o.status,
              color: "text-ink/60",
              icon: Clock,
            };
            const Icon = statusInfo.icon;
            const pct = o.progress_pct ?? 0;

            return (
              <Link
                key={o.id}
                href={`/portal/orders/${o.id}`}
                className="group block rounded-2xl p-5 bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/30 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-ink/40">
                        {o.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-body font-medium ${statusInfo.color}`}
                      >
                        <Icon className={`w-3 h-3 ${o.status === "processing" || o.status === "revision_requested" ? "animate-spin" : ""}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-ink text-lg truncate">
                      {o.service_slug}
                    </h3>
                    <div className="text-ink/50 font-body text-sm">
                      {(o.amount_cents / 100).toFixed(0)}€ ·{" "}
                      {formatDate(o.created_at as string)}
                    </div>

                    {(o.status === "processing" ||
                      o.status === "revision_requested") &&
                      pct > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-ink/50 font-body mb-1">
                            <span>{o.progress_message || "En proceso"}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-gold transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-ink/30 group-hover:text-accent-gold transition flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
