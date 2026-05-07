"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Metrics {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  won: number;
  lost: number;
  open_rate_pct: number;
  click_through_rate_pct: number;
  reply_rate_pct: number;
  bounce_rate_pct: number;
}

export function MetricsBar({ initial }: { initial: Metrics | null }) {
  const [m, setM] = useState<Metrics | null>(initial);

  useEffect(() => {
    const refresh = async () => {
      const { data } = await supabase.from("prospect_leads_metrics").select("*").limit(1);
      if (data?.[0]) setM(data[0] as Metrics);
    };
    const channel = supabase
      .channel("prospect-leads-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "prospect_leads" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "email_events" }, refresh)
      .subscribe();
    const interval = setInterval(refresh, 30_000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (!m) return null;

  const cards: Array<{ label: string; value: string | number; sub?: string; color?: string }> = [
    { label: "Total leads", value: m.total, color: "text-zinc-100" },
    { label: "Enviados", value: m.sent, sub: m.delivered + " entregados", color: "text-blue-400" },
    {
      label: "Abiertos",
      value: m.opened,
      sub: m.open_rate_pct + "% open rate",
      color: "text-amber-400",
    },
    {
      label: "Clicaron",
      value: m.clicked,
      sub: m.click_through_rate_pct + "% CTR",
      color: "text-emerald-400",
    },
    {
      label: "Respondieron",
      value: m.replied,
      sub: m.reply_rate_pct + "% reply rate",
      color: "text-fuchsia-400",
    },
    {
      label: "Bounces",
      value: m.bounced,
      sub: m.bounce_rate_pct + "% bounce",
      color: "text-rose-400",
    },
    { label: "Cerrados (won)", value: m.won, sub: m.lost + " lost", color: "text-yellow-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors"
        >
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{c.label}</div>
          <div className={`text-3xl font-black tabular-nums mt-1 ${c.color || "text-zinc-100"}`}>
            {c.value}
          </div>
          {c.sub && <div className="text-xs text-zinc-500 mt-1">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
