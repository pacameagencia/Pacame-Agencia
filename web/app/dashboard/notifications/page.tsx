"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import { Bell, Check, AlertTriangle, Info, Zap, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  sent_via: string;
  sent: boolean;
  read_by_pablo: boolean;
  sent_at: string | null;
  created_at: string;
}

const priorityConfig: Record<string, { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; label: string }> = {
  critical: { icon: AlertTriangle, color: "#EF4444", label: "Critica" },
  high: { icon: Zap, color: "#EA580C", label: "Alta" },
  normal: { icon: Info, color: "#2563EB", label: "Normal" },
  low: { icon: Info, color: "#6B7280", label: "Baja" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await dbCall({ table: "notifications", op: "update", data: { read_by_pablo: true }, filter: { column: "id", value: id } });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_by_pablo: true } : n)));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read_by_pablo).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await dbCall({ table: "notifications", op: "update", data: { read_by_pablo: true }, filterIn: { column: "id", values: unreadIds } });
    setNotifications((prev) => prev.map((n) => ({ ...n, read_by_pablo: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read_by_pablo).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read_by_pablo) : notifications;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink">Notificaciones</h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            {loading ? "Cargando..." : `${unreadCount} sin leer de ${notifications.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
              <CheckCheck className="w-3.5 h-3.5" />Marcar todo leido
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-body transition-colors ${
              filter === f ? "bg-brand-primary/20 text-brand-primary" : "text-ink/40 hover:text-ink/60"
            }`}
          >
            {f === "all" ? "Todas" : `Sin leer (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
            <Bell className="w-8 h-8 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40 font-body">
              {filter === "unread" ? "Todo leido" : "Sin notificaciones"}
            </p>
          </div>
        )}

        {filtered.map((notif) => {
          const pConfig = priorityConfig[notif.priority] || priorityConfig.normal;
          const PriorityIcon = pConfig.icon;

          return (
            <div
              key={notif.id}
              className={`rounded-xl border p-4 transition-all cursor-pointer ${
                notif.read_by_pablo
                  ? "bg-paper-deep border-white/[0.04] opacity-60"
                  : "bg-paper-deep border-ink/[0.08] hover:border-ink/[0.12]"
              }`}
              onClick={() => !notif.read_by_pablo && markAsRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${pConfig.color}15` }}>
                  <PriorityIcon className="w-4 h-4" style={{ color: pConfig.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-heading font-medium text-ink">{notif.title}</h3>
                    {!notif.read_by_pablo && (
                      <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-body ml-auto flex-shrink-0"
                      style={{ backgroundColor: `${pConfig.color}15`, color: pConfig.color }}
                    >
                      {pConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-ink/50 font-body leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-ink/30 font-body">{timeAgo(notif.created_at)}</span>
                    <span className="text-[10px] text-ink/20 font-body">{notif.type}</span>
                    {notif.sent && (
                      <span className="flex items-center gap-1 text-[10px] text-ink/20 font-body">
                        <Check className="w-2.5 h-2.5" />Enviado via {notif.sent_via}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
