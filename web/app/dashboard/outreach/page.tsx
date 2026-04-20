"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  Mail,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Loader2,
} from "lucide-react";

interface Summary {
  total_leads: number;
  total_campaigns: number;
  by_status: Record<string, number>;
  active_campaigns: number;
}
interface Campaign {
  id: string;
  niche_slug: string;
  niche_label: string;
  status: string;
  target_count: number;
  scraped_count: number;
  enriched_count: number;
  sent_count: number;
  replied_count: number;
  converted_count: number;
  dry_run: boolean;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
}
interface Lead {
  id: string;
  business_name: string;
  email: string | null;
  niche_slug: string;
  status: string;
  last_touched_at: string | null;
  touch_count: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  discovered: "text-white/50 bg-white/5",
  enriched: "text-blue-400 bg-blue-400/10",
  emailed: "text-yellow-400 bg-yellow-400/10",
  replied: "text-cyan-400 bg-cyan-400/10",
  interested: "text-green-400 bg-green-400/10",
  converted: "text-emerald-400 bg-emerald-400/10",
  unsubscribed: "text-orange-400 bg-orange-400/10",
  bounced: "text-red-400 bg-red-400/10",
  blacklisted: "text-red-400 bg-red-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  scraping: "text-blue-400 bg-blue-400/10",
  enriching: "text-blue-400 bg-blue-400/10",
  sending: "text-cyan-400 bg-cyan-400/10",
  completed: "text-green-400 bg-green-400/10",
  failed: "text-red-400 bg-red-400/10",
  canceled: "text-white/40 bg-white/5",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OutreachDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [nicheStats, setNicheStats] = useState<Record<string, { total: number; emailed: number; replied: number; converted: number }>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dashboard/outreach", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setSummary(d.summary);
      setCampaigns(d.campaigns || []);
      setRecentLeads(d.recent_leads || []);
      setNicheStats(d.niche_stats || {});
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function triggerRun() {
    setRunning(true);
    setRunMessage("Arrancando campaña del dia…");
    try {
      const res = await fetch("/api/marketplace/outreach-cron?count=5", { cache: "no-store" });
      const d = await res.json();
      if (res.ok) {
        setRunMessage(
          `Niche ${d.niche}: scrapeados ${d.scraped}, enriquecidos ${d.enriched}, enviados ${d.sent}`
        );
      } else {
        setRunMessage(`Error: ${d.error || "unknown"}`);
      }
      await load();
    } catch {
      setRunMessage("Error de red");
    }
    setRunning(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-7 h-7 text-accent-gold" />
            Outreach autonomo
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Cron diario scrapea nicho rotativo, envia cold emails + follow-ups dia 3 y 7. GDPR compliant.
          </p>
        </div>
        <button
          onClick={triggerRun}
          disabled={running}
          className="inline-flex items-center gap-2 bg-accent-gold text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-gold/90 disabled:opacity-50 transition"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Ejecutando…" : "Ejecutar ahora"}
        </button>
      </div>

      {runMessage && (
        <div className="mb-6 rounded-xl p-3 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-sm font-body">
          {runMessage}
        </div>
      )}

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Kpi label="Leads totales" value={String(summary.total_leads)} icon={<Users className="w-4 h-4" />} />
          <Kpi label="Campanas" value={String(summary.total_campaigns)} icon={<Target className="w-4 h-4" />} />
          <Kpi label="En marcha" value={String(summary.active_campaigns)} icon={<Clock className="w-4 h-4 text-blue-400" />} />
          <Kpi label="Emails enviados" value={String(summary.by_status.emailed || 0)} icon={<Mail className="w-4 h-4 text-yellow-400" />} />
          <Kpi label="Convertidos" value={String(summary.by_status.converted || 0)} icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} />
        </div>
      )}

      {/* Pipeline */}
      {summary && summary.by_status && Object.keys(summary.by_status).length > 0 && (
        <div className="mb-8 rounded-2xl p-5 bg-white/[0.03] border border-ink/[0.06]">
          <h2 className="font-heading font-semibold text-lg mb-3">Pipeline por estado</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.by_status)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-body ${
                    statusColors[status] || "text-white/60 bg-white/5"
                  }`}
                >
                  {status}
                  <span className="font-bold">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Niche breakdown */}
      {Object.keys(nicheStats).length > 0 && (
        <div className="mb-8 rounded-2xl p-5 bg-white/[0.03] border border-ink/[0.06]">
          <h2 className="font-heading font-semibold text-lg mb-4">Por nicho</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(nicheStats)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([niche, s]) => {
                const replyRate = s.emailed > 0 ? Math.round((s.replied / s.emailed) * 100) : 0;
                return (
                  <div key={niche} className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
                    <div className="font-mono text-[11px] text-white/40 mb-1">{niche}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {s.total} leads · {s.emailed} email
                      </span>
                      <span
                        className={
                          replyRate >= 10
                            ? "text-green-400 font-semibold"
                            : replyRate > 0
                              ? "text-yellow-400"
                              : "text-white/40"
                        }
                      >
                        {replyRate}% reply
                      </span>
                    </div>
                    {s.converted > 0 && (
                      <div className="mt-1 text-xs text-emerald-400">
                        {s.converted} convertido(s) ✓
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent campaigns table */}
      <h2 className="font-heading font-semibold text-lg mb-3">Campanas recientes</h2>
      {loading ? (
        <p className="text-white/50">Cargando…</p>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white/[0.03] border border-ink/[0.06] text-center text-white/60">
          Aun no hay campanas. Click <strong>Ejecutar ahora</strong> para arrancar.
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/[0.06] overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-white/50">
              <tr>
                <th className="text-left p-3">Nicho</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Scraped</th>
                <th className="text-right p-3">Enriched</th>
                <th className="text-right p-3">Sent</th>
                <th className="text-right p-3">Replied</th>
                <th className="text-left p-3">Dry</th>
                <th className="text-left p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="text-white font-medium">{c.niche_label}</div>
                    <div className="text-xs font-mono text-white/40">{c.niche_slug}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex text-xs px-2 py-1 rounded-full ${
                        statusColors[c.status] || "text-white/60 bg-white/5"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-white/70">{c.scraped_count}</td>
                  <td className="p-3 text-right text-white/70">{c.enriched_count}</td>
                  <td className="p-3 text-right text-yellow-400 font-semibold">{c.sent_count}</td>
                  <td className="p-3 text-right text-cyan-400 font-semibold">{c.replied_count}</td>
                  <td className="p-3">
                    {c.dry_run ? (
                      <span className="text-xs text-orange-400">DRY</span>
                    ) : (
                      <span className="text-xs text-green-400">LIVE</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-white/50">{fmtDate(c.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent leads */}
      <h2 className="font-heading font-semibold text-lg mb-3">Leads recientes</h2>
      <div className="rounded-2xl border border-ink/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase text-white/50">
            <tr>
              <th className="text-left p-3">Negocio</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Nicho</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-right p-3">Touches</th>
              <th className="text-left p-3">Ultimo</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.slice(0, 30).map((l) => (
              <tr key={l.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                <td className="p-3 text-white">{l.business_name}</td>
                <td className="p-3 text-xs text-white/70">{l.email || "—"}</td>
                <td className="p-3 text-xs font-mono text-white/50">{l.niche_slug}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex text-xs px-2 py-1 rounded-full ${
                      statusColors[l.status] || "text-white/60 bg-white/5"
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="p-3 text-right text-white/60">{l.touch_count}</td>
                <td className="p-3 text-xs text-white/50">{fmtDate(l.last_touched_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/[0.03] border border-ink/[0.06]">
      <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="font-bold text-2xl text-white">{value}</div>
    </div>
  );
}
