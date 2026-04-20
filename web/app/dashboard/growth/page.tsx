"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TrendingUp,
  Mail,
  Heart,
  AlertTriangle,
  Award,
  RefreshCw,
  ExternalLink,
  Loader2,
  Users,
  Copy,
  CheckCircle2,
} from "lucide-react";

interface LifecycleRow {
  email_type: string;
  sent_count: number;
  unique_clients: number;
  opened: number;
  clicked: number;
  oldest_sent: string;
  newest_sent: string;
}

interface NpsSnapshot {
  responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  avg_score: number | null;
  nps_score: number | null;
}

interface NpsRecord {
  id: string;
  score: number | null;
  category: string | null;
  feedback: string | null;
  submitted_at: string;
  client_email_snapshot: string | null;
  client_id: string | null;
  followup_sent?: boolean;
}

interface ReferralRow {
  client_id: string;
  name: string | null;
  email: string | null;
  code: string;
  total_uses: number;
  total_revenue_cents: number;
  total_commission_cents: number;
}

interface GrowthData {
  lifecycle_funnel: LifecycleRow[];
  nps: NpsSnapshot | null;
  nps_recent: NpsRecord[];
  referrals_top: ReferralRow[];
  detractors_unaddressed: NpsRecord[];
  updated_at: string;
}

const LIFECYCLE_LABEL: Record<string, string> = {
  welcome_d0: "Bienvenida (D0)",
  tips_d2: "Tips (D+2)",
  nps_d7: "NPS (D+7)",
  upsell_d14: "Upsell (D+14)",
  review_d30: "Review (D+30)",
};

function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

function eur(cents: number): string {
  return `${(cents / 100).toLocaleString("es-ES")}€`;
}

function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Ahora";
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

export default function GrowthPage() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/growth", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as GrowthData;
      setData(json);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-pacame-white/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando growth data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5 text-red-400 text-sm">
        Error cargando growth: {error}
      </div>
    );
  }

  const nps = data?.nps;
  const npsColor =
    !nps?.nps_score ? "text-pacame-white/40" :
    nps.nps_score >= 50 ? "text-lime-pulse" :
    nps.nps_score >= 20 ? "text-amber-signal" :
    "text-red-400";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-olympus-gold" />
            Growth Loop
          </h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            Lifecycle funnel · NPS live · Referrals · Detractores activos
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-pacame-white/60 hover:text-pacame-white text-xs transition border border-white/[0.08]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPI hero: NPS score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 md:col-span-2">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-pacame-white/40 font-mono mb-1">
                NPS Score (30d)
              </div>
              <div className={`font-heading font-bold text-5xl ${npsColor}`}>
                {nps?.nps_score !== null && nps?.nps_score !== undefined
                  ? nps.nps_score.toString()
                  : "—"}
              </div>
              <div className="text-xs text-pacame-white/40 mt-2">
                Basado en {nps?.responses || 0} respuestas · media {nps?.avg_score?.toFixed(1) || "—"}/10
              </div>
            </div>
            <Heart className="w-6 h-6 text-pacame-white/20" />
          </div>
          {/* Breakdown bar */}
          {nps && nps.responses > 0 && (
            <div>
              <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
                <div
                  className="bg-lime-pulse"
                  style={{ width: `${(nps.promoters / nps.responses) * 100}%` }}
                  title={`${nps.promoters} promoters`}
                />
                <div
                  className="bg-amber-signal"
                  style={{ width: `${(nps.passives / nps.responses) * 100}%` }}
                  title={`${nps.passives} passives`}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(nps.detractors / nps.responses) * 100}%` }}
                  title={`${nps.detractors} detractors`}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-pacame-white/50 font-body">
                <span className="text-lime-pulse">● {nps.promoters} Promoters</span>
                <span className="text-amber-signal">● {nps.passives} Passives</span>
                <span className="text-red-400">● {nps.detractors} Detractors</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
          <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
          <div className="font-heading font-bold text-3xl text-red-400">
            {data?.detractors_unaddressed.length || 0}
          </div>
          <div className="text-xs text-pacame-white/40 font-body mt-1">
            Detractores sin contacto
          </div>
          {(data?.detractors_unaddressed.length || 0) > 0 && (
            <div className="text-[11px] text-red-400/80 mt-2">
              Llama en &lt;24h o se van
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
          <Award className="w-5 h-5 text-olympus-gold mb-2" />
          <div className="font-heading font-bold text-3xl text-olympus-gold">
            {data?.referrals_top.length || 0}
          </div>
          <div className="text-xs text-pacame-white/40 font-body mt-1">
            Referrers activos
          </div>
          {data && data.referrals_top.length > 0 && (
            <div className="text-[11px] text-olympus-gold/80 mt-2">
              {eur(
                data.referrals_top.reduce((s, r) => s + r.total_revenue_cents, 0)
              )}{" "}
              revenue referido
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle funnel */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Mail className="w-5 h-5 text-electric-violet" />
          <h2 className="font-heading font-semibold text-lg text-pacame-white">
            Lifecycle funnel (ultimos 30d)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(["welcome_d0", "tips_d2", "nps_d7", "upsell_d14", "review_d30"] as const).map((type) => {
            const row = data?.lifecycle_funnel.find((r) => r.email_type === type);
            const sent = row?.sent_count || 0;
            const opened = row?.opened || 0;
            const clicked = row?.clicked || 0;
            return (
              <div
                key={type}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="text-[11px] uppercase tracking-wider text-pacame-white/40 font-mono mb-2">
                  {LIFECYCLE_LABEL[type]}
                </div>
                <div className="font-heading font-bold text-2xl text-pacame-white">
                  {sent}
                </div>
                <div className="text-xs text-pacame-white/50 font-body mt-0.5">enviados</div>
                <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.04] text-[11px] font-body">
                  <div>
                    <div className="text-electric-violet font-semibold">{pct(opened, sent)}</div>
                    <div className="text-pacame-white/30">open</div>
                  </div>
                  <div>
                    <div className="text-olympus-gold font-semibold">{pct(clicked, sent)}</div>
                    <div className="text-pacame-white/30">click</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detractores unaddressed */}
      {data && data.detractors_unaddressed.length > 0 && (
        <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="font-heading font-semibold text-lg text-red-400">
              Detractores sin contacto — llama ahora
            </h2>
          </div>
          <div className="space-y-3">
            {data.detractors_unaddressed.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-dark-card border border-red-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-red-400">
                      {d.score}/10
                    </span>
                    <span className="text-sm text-pacame-white">
                      {d.client_email_snapshot || d.client_id}
                    </span>
                  </div>
                  <span className="text-[11px] text-pacame-white/40 font-body">
                    {timeAgo(d.submitted_at)}
                  </span>
                </div>
                {d.feedback && (
                  <div className="text-sm text-pacame-white/70 italic border-l-2 border-red-500/40 pl-3 mt-2">
                    &quot;{d.feedback}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NPS recent feedback */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          Ultimos feedback NPS
        </h2>
        {!data?.nps_recent.length ? (
          <p className="text-sm text-pacame-white/30 font-body text-center py-6">
            Sin respuestas aun. Los emails NPS D+7 se envian via lifecycle-cron diario.
          </p>
        ) : (
          <div className="space-y-3">
            {data.nps_recent.map((r) => {
              const color =
                r.category === "promoter"
                  ? "text-lime-pulse border-lime-pulse/20 bg-lime-pulse/5"
                  : r.category === "passive"
                  ? "text-amber-signal border-amber-signal/20 bg-amber-signal/5"
                  : "text-red-400 border-red-500/20 bg-red-500/5";
              return (
                <div key={r.id} className={`p-4 rounded-xl border ${color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold">{r.score}/10</span>
                      <span className="text-[10px] uppercase tracking-wider font-mono">
                        {r.category}
                      </span>
                      <span className="text-sm text-pacame-white/70">
                        {r.client_email_snapshot || "—"}
                      </span>
                    </div>
                    <span className="text-[11px] text-pacame-white/40 font-body">
                      {timeAgo(r.submitted_at)}
                    </span>
                  </div>
                  {r.feedback && (
                    <div className="text-sm text-pacame-white/70 italic mt-2 pl-1">
                      &quot;{r.feedback}&quot;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top referrers */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-lg text-pacame-white flex items-center gap-2">
            <Users className="w-5 h-5 text-olympus-gold" />
            Top referrers (clientes)
          </h2>
          <a
            href="/refiere"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-olympus-gold hover:underline font-body flex items-center gap-1"
          >
            Landing referral <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        {!data?.referrals_top.length ? (
          <p className="text-sm text-pacame-white/30 font-body text-center py-6">
            Aun no hay referidos convertidos. Los clientes con orders &gt;= 1 pueden generar su codigo en /refiere.
          </p>
        ) : (
          <div className="space-y-2">
            {data.referrals_top.map((r) => (
              <div
                key={r.client_id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-olympus-gold/10 text-olympus-gold flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-sm text-pacame-white">
                      {r.name || r.email || r.code}
                    </div>
                    <div className="text-[11px] text-pacame-white/40 font-body">
                      {r.total_uses} referidos · {eur(r.total_commission_cents)} comision
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-heading font-bold text-sm text-olympus-gold">
                    {eur(r.total_revenue_cents)}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://pacameagencia.com?ref=${r.code}`
                      );
                      setCopied(r.code);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-pacame-white/40 hover:text-pacame-white transition"
                  >
                    {copied === r.code ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-pulse" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
