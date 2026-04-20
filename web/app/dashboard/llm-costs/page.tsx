"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  TrendingUp,
  Zap,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Activity,
} from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface BudgetRow {
  tier: string;
  spent_eur: number;
  spent_usd: number;
  cap_eur: number;
  usage_pct: number | null;
  calls: number;
  errors: number;
  fallbacks: number;
  avg_latency_ms: number;
}

interface DailySpendRow {
  day: string;
  tier: string;
  provider: string;
  model: string;
  calls: number;
  cost_usd: number;
  tokens_in: number;
  tokens_out: number;
  tokens_thinking: number;
  avg_latency_ms: number;
  fallback_pct: number;
}

interface CallSiteRow {
  call_site: string;
  tier: string;
  calls: number;
  cost_usd: number;
  tokens: number;
  errors: number;
  fallbacks: number;
}

interface RecentCall {
  id: string;
  call_site: string;
  tier: string;
  strategy: string | null;
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  tokens_thinking: number;
  cost_usd: number;
  latency_ms: number;
  fallback_used: boolean;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface Data {
  budgets: BudgetRow[];
  daily_spend_30d: DailySpendRow[];
  top_call_sites: CallSiteRow[];
  recent_calls: RecentCall[];
}

const TIER_COLOR: Record<string, string> = {
  reasoning: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  titan: "text-olympus-gold border-olympus-gold/30 bg-olympus-gold/10",
  premium: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  standard: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  economy: "text-pacame-white/60 border-white/10 bg-white/[0.04]",
};

function eur(v: number): string {
  return `${v.toLocaleString("es-ES", { maximumFractionDigits: 2 })}€`;
}
function usd(v: number): string {
  return `$${v.toLocaleString("es-ES", { maximumFractionDigits: 3 })}`;
}
function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function LlmCostsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/llm-costs", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as Data;
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
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-pacame-white/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando LLM costs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5 text-red-400 text-sm">
        Error: {error}
      </div>
    );
  }

  const totalSpentEur =
    data?.budgets.reduce((s, b) => s + b.spent_eur, 0) || 0;
  const totalCapEur = data?.budgets.reduce((s, b) => s + b.cap_eur, 0) || 0;
  const totalCalls = data?.budgets.reduce((s, b) => s + b.calls, 0) || 0;
  const totalErrors = data?.budgets.reduce((s, b) => s + b.errors, 0) || 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-olympus-gold" /> LLM Costs
          </h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            Spend diario por tier · Top call sites · Ultimas 50 calls · Budget caps
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-pacame-white/60 hover:text-pacame-white text-xs transition border border-white/[0.08]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Totals hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 md:col-span-2">
          <div className="text-xs uppercase tracking-wider text-pacame-white/40 font-mono mb-1">
            Gastado hoy
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-heading font-bold text-4xl text-olympus-gold">
              <AnimatedNumber value={totalSpentEur} format={(n) => eur(n)} />
            </div>
            <div className="text-sm text-pacame-white/50">
              / {eur(totalCapEur)} cap
            </div>
          </div>
          {/* Barra de progreso total */}
          <div className="mt-4 h-2 rounded-full overflow-hidden bg-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-olympus-gold to-amber-400 transition-all duration-700"
              style={{
                width: `${totalCapEur > 0 ? Math.min(100, (totalSpentEur / totalCapEur) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="text-xs text-pacame-white/50 mt-2">
            {totalCapEur > 0
              ? `${Math.round((totalSpentEur / totalCapEur) * 100)}% del cap diario combinado`
              : "Sin cap configurado"}
          </div>
        </div>

        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
          <Activity className="w-5 h-5 text-electric-violet mb-2" />
          <div className="font-heading font-bold text-3xl text-pacame-white">
            <AnimatedNumber value={totalCalls} />
          </div>
          <div className="text-xs text-pacame-white/40 font-body mt-1">Calls hoy</div>
        </div>

        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
          <AlertTriangle
            className={`w-5 h-5 mb-2 ${totalErrors > 0 ? "text-red-400" : "text-pacame-white/30"}`}
          />
          <div
            className={`font-heading font-bold text-3xl ${
              totalErrors > 0 ? "text-red-400" : "text-pacame-white/60"
            }`}
          >
            <AnimatedNumber value={totalErrors} />
          </div>
          <div className="text-xs text-pacame-white/40 font-body mt-1">Errores hoy</div>
        </div>
      </div>

      {/* Budgets por tier */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-olympus-gold" /> Budget por tier (hoy)
        </h2>
        <div className="space-y-3">
          {data?.budgets.map((b) => {
            const pct = b.usage_pct ?? 0;
            const isOver = pct >= 100;
            const isWarn = pct >= 80 && !isOver;
            const barColor = isOver
              ? "from-red-500 to-red-400"
              : isWarn
              ? "from-amber-500 to-amber-400"
              : "from-olympus-gold to-amber-400";
            return (
              <div
                key={b.tier}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border ${
                        TIER_COLOR[b.tier] || "text-pacame-white/60 border-white/10"
                      }`}
                    >
                      {b.tier}
                    </span>
                    <span className="text-sm text-pacame-white">
                      {b.calls} calls · {b.avg_latency_ms}ms avg
                    </span>
                    {b.errors > 0 && (
                      <span className="text-[11px] text-red-400">
                        {b.errors} errores
                      </span>
                    )}
                    {b.fallbacks > 0 && (
                      <span className="text-[11px] text-amber-400">
                        {b.fallbacks} fallbacks
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-mono">
                    <span
                      className={
                        isOver
                          ? "text-red-400"
                          : isWarn
                          ? "text-amber-400"
                          : "text-pacame-white"
                      }
                    >
                      {eur(b.spent_eur)}
                    </span>
                    <span className="text-pacame-white/40"> / {eur(b.cap_eur)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                  <div
                    className={`h-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                {isWarn && !isOver && (
                  <div className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 80%+ del cap — alerta enviada
                  </div>
                )}
                {isOver && (
                  <div className="text-[11px] text-red-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Cap alcanzado — calls degradan a tier inferior
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top call sites */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5">
          Top 15 call sites (7 dias)
        </h2>
        {!data?.top_call_sites.length ? (
          <p className="text-sm text-pacame-white/30 font-body text-center py-6">
            Sin calls registradas en los ultimos 7 dias.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-pacame-white/40 font-mono border-b border-white/[0.04]">
                  <th className="py-2">Call site</th>
                  <th className="py-2">Tier</th>
                  <th className="py-2 text-right">Calls</th>
                  <th className="py-2 text-right">Cost</th>
                  <th className="py-2 text-right">Errores</th>
                  <th className="py-2 text-right">Fallbacks</th>
                </tr>
              </thead>
              <tbody>
                {data.top_call_sites.map((s) => (
                  <tr
                    key={s.call_site}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                  >
                    <td className="py-2 font-mono text-pacame-white/80">
                      {s.call_site}
                    </td>
                    <td className="py-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border ${
                          TIER_COLOR[s.tier] || "text-pacame-white/60 border-white/10"
                        }`}
                      >
                        {s.tier}
                      </span>
                    </td>
                    <td className="py-2 text-right text-pacame-white">{s.calls}</td>
                    <td className="py-2 text-right text-olympus-gold font-semibold">
                      {usd(s.cost_usd)}
                    </td>
                    <td className="py-2 text-right">
                      {s.errors > 0 ? (
                        <span className="text-red-400">{s.errors}</span>
                      ) : (
                        <span className="text-pacame-white/30">0</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {s.fallbacks > 0 ? (
                        <span className="text-amber-400">{s.fallbacks}</span>
                      ) : (
                        <span className="text-pacame-white/30">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent calls */}
      <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5 flex items-center gap-2">
          <Zap className="w-5 h-5 text-electric-violet" /> Ultimas 50 calls
        </h2>
        {!data?.recent_calls.length ? (
          <p className="text-sm text-pacame-white/30 font-body text-center py-6">
            Ninguna call registrada todavia. El primer call aparecera aqui en segundos.
          </p>
        ) : (
          <div className="space-y-1">
            {data.recent_calls.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-2 rounded-lg text-xs ${
                  c.success ? "hover:bg-white/[0.02]" : "bg-red-500/5 hover:bg-red-500/10"
                } transition`}
              >
                <span className="text-pacame-white/30 font-mono w-12 flex-shrink-0">
                  {timeAgo(c.created_at)}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${
                    TIER_COLOR[c.tier] || "text-pacame-white/60 border-white/10"
                  }`}
                >
                  {c.tier}
                </span>
                <span className="font-mono text-pacame-white/80 truncate max-w-[200px]">
                  {c.call_site}
                </span>
                <span className="text-pacame-white/50 truncate max-w-[220px]">
                  {c.provider}/{c.model}
                </span>
                {c.fallback_used && (
                  <span className="text-amber-400 text-[10px]">fallback</span>
                )}
                {!c.success && (
                  <span className="text-red-400 text-[10px]">error</span>
                )}
                <div className="flex-1" />
                <span className="text-pacame-white/50 font-mono">
                  {c.tokens_in}↑ {c.tokens_out}↓
                  {c.tokens_thinking > 0 && (
                    <span className="text-violet-400"> +{c.tokens_thinking}💭</span>
                  )}
                </span>
                <span className="text-pacame-white/40 font-mono">{c.latency_ms}ms</span>
                <span className="text-olympus-gold font-mono font-semibold w-16 text-right">
                  {usd(c.cost_usd)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
