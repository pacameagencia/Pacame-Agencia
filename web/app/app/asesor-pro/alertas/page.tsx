import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { listUnreadAlerts, markAlertRead } from "@/lib/products/asesor-pro/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, ArrowRight, AlertTriangle, Info, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const SEVERITY: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-indigo-600" },
  warning: { icon: AlertTriangle, color: "text-mustard-700" },
  urgent: { icon: AlertCircle, color: "text-rose-alert" },
};

interface SP { ver?: string }

export default async function AlertasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireOwnerOrAdmin();
  const sp = await searchParams;

  const supabase = createServerSupabase();
  const showAll = sp.ver === "todas";
  const query = supabase
    .from("asesorpro_alerts")
    .select("*")
    .eq("asesor_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!showAll) query.is("read_at", null);
  const { data: alerts } = await query;
  const unreadCount = (await listUnreadAlerts(user.id, 1)).length;

  async function markRead(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (typeof id !== "string") return;
    const me = await requireOwnerOrAdmin();
    await markAlertRead(me.id, id);
    revalidatePath("/app/asesor-pro/alertas");
  }

  async function markAllRead() {
    "use server";
    const me = await requireOwnerOrAdmin();
    const supa = createServerSupabase();
    await supa
      .from("asesorpro_alerts")
      .update({ read_at: new Date().toISOString() })
      .eq("asesor_user_id", me.id)
      .is("read_at", null);
    revalidatePath("/app/asesor-pro/alertas");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            AsesorPro · Alertas
          </span>
          <h1
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            {unreadCount} sin leer
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <Link
            href={showAll ? "/app/asesor-pro/alertas" : "/app/asesor-pro/alertas?ver=todas"}
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-mute hover:text-ink"
          >
            {showAll ? "Solo no leídas" : "Ver todas"}
          </Link>
          {unreadCount > 0 && (
            <form action={markAllRead}>
              <button
                type="submit"
                className="px-3 py-1.5 bg-ink text-paper text-xs font-sans hover:bg-terracotta-500 transition-colors"
              >
                Marcar todas leídas
              </button>
            </form>
          )}
        </div>
      </header>

      {!alerts || alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Todo al día"
          description="No tienes alertas pendientes. Aquí aparecerán avisos sobre clientes inactivos, cierres de IVA, facturas pendientes de revisión y notificaciones de Vapi."
          cta={{ label: "Ver pipeline", href: "/app/asesor-pro/pipeline", icon: ArrowRight }}
        />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a: { id: string; type: string; severity: string; title: string; message: string | null; action_url: string | null; created_at: string; read_at: string | null }) => {
            const sev = SEVERITY[a.severity] ?? SEVERITY.info;
            const Icon = sev.icon;
            return (
              <li
                key={a.id}
                className={`bg-paper border-2 ${a.read_at ? "border-ink/10 opacity-70" : "border-ink/25"} p-4 flex items-start gap-3`}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${sev.color}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-ink text-base" style={{ fontWeight: 500 }}>
                      {a.title}
                    </h3>
                    <span className="font-mono text-[10px] text-ink-mute whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {a.message && <p className="font-sans text-sm text-ink-mute mt-1">{a.message}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {a.action_url && (
                      <Link
                        href={a.action_url}
                        className="font-mono text-[11px] uppercase tracking-[0.15em] text-terracotta-500 hover:text-terracotta-600"
                      >
                        Abrir →
                      </Link>
                    )}
                    {!a.read_at && (
                      <form action={markRead}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-mute hover:text-ink"
                        >
                          Marcar leída
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
