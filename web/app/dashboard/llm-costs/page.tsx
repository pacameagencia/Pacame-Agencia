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
import MiniSparkline from "@/components/ui/MiniSparkline";

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
  trend_7d_eur: number[];
}

const TIER_HEX: Record<string, string> = {
  reasoning: "#a78bfa",
  titan: "#D4A574",
  premium: "#22d3ee",
  standard: "#34d399",
  economy: "#9ca3af",
};

const TIER_DESC: Record<string, string> = {
  reasoning: "Claude Opus + extended thinking — DIOS, audits, decisiones criticas",
  titan: "Claude Opus — tareas high-stakes sin pensamiento visible",
  premium: "Claude Sonnet — client-facing (cold emails, chat, contact form, delivery)",
  standard: "Nebius Qwen-80B — QA scoring, tareas internas con cierto rigor",
  economy: "Gemma VPS gratis / Nebius Qwen-30B — DMs cortas, subject lines",
};

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
  titan: "text-accent-gold border-accent-gold/30 bg-accent-gold/10",
  premium: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  standard: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  economy: "text-ink/60 border-white/10 bg-white/[0.04]",
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
      <div className="flex items-center justify-center py-20 text-ink/40">
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
  const has7dData =
    !!data?.budgets.some((b) => b.trend_7d_eur.some((v) => v > 0));
  const hasAnyCalls = !!data?.recent_calls.length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink flex items-center gap-2">
            <Banknote className="w-6 h-6 text-accent-gold" /> LLM Costs
          </h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            Spend diario por tier · Top call sites · Ultimas 50 calls · Budget caps
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-ink/60 hover:text-ink text-xs transition border border-ink/[0.08]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* First-run banner: ningun call registrado aun */}
      {!hasAnyCalls && data && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-primary/10 via-accent-gold/5 to-transparent border border-brand-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-ink mb-1">
                Tracking LLM recien activado
              </h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                Esta vista registra cada llamada a modelos IA (Opus, Sonnet, Kimi,
                DeepSeek, Qwen, Gemma). Aun no hay datos — los primeros calls
                apareceran aqui en segundos cuando el sistema genere algo:
                outreach, chat, audit, delivery, DIOS...
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-ink/[0.06]">
                  <div className="text-[11px] uppercase tracking-wider text-ink/40 font-mono mb-1">
                    1. Strategy
                  </div>
                  <div className="text-xs text-ink/80">
                    <code className="text-accent-gold font-mono">LLM_STRATEGY=quality-first</code>{" "}
                    prioriza Opus/Sonnet. Alternativa:{" "}
                    <code className="text-ink/60 font-mono">cost-first</code>.
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-ink/[0.06]">
                  <div className="text-[11px] uppercase tracking-wider text-ink/40 font-mono mb-1">
                    2. Budgets
                  </div>
                  <div className="text-xs text-ink/80">
                    Caps EUR/dia por tier. Al 80% aviso; al 100% auto-degrade al
                    tier inferior (no corta servicio).
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-ink/[0.06]">
                  <div className="text-[11px] uppercase tracking-wider text-ink/40 font-mono mb-1">
                    3. Override
                  </div>
                  <div className="text-xs text-ink/80">
                    <code className="text-accent-gold font-mono">LLM_BUDGET_OVERRIDE=true</code>{" "}
                    salta cap en emergencia. Defaults en{" "}
                    <code className="text-ink/60 font-mono">.env.local.example</code>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Totals hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 md:col-span-2">
          <div className="text-xs uppercase tracking-wider text-ink/40 font-mono mb-1">
            Gastado hoy
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-heading font-bold text-4xl text-accent-gold">
              <AnimatedNumber value={totalSpentEur} format={(n) => eur(n)} />
            </div>
            <div className="text-sm text-ink/50">
              / {eur(totalCapEur)} cap
            </div>
          </div>
          {/* Barra de progreso total */}
          <div className="mt-4 h-2 rounded-full overflow-hidden bg-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-accent-gold to-amber-400 transition-all duration-700"
              style={{
                width: `${totalCapEur > 0 ? Math.min(100, (totalSpentEur / totalCapEur) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="text-xs text-ink/50 mt-2">
            {totalCapEur > 0
              ? `${Math.round((totalSpentEur / totalCapEur) * 100)}% del cap diario combinado`
              : "Sin cap configurado"}
          </div>
        </div>

        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
          <Activity className="w-5 h-5 text-brand-primary mb-2" />
          <div className="font-heading font-bold text-3xl text-ink">
            <AnimatedNumber value={totalCalls} />
          </div>
          <div className="text-xs text-ink/40 font-body mt-1">Calls hoy</div>
        </div>

        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
          <AlertTriangle
            className={`w-5 h-5 mb-2 ${totalErrors > 0 ? "text-red-400" : "text-ink/30"}`}
          />
          <div
            className={`font-heading font-bold text-3xl ${
              totalErrors > 0 ? "text-red-400" : "text-ink/60"
            }`}
          >
            <AnimatedNumber value={totalErrors} />
          </div>
          <div className="text-xs text-ink/40 font-body mt-1">Errores hoy</div>
        </div>
      </div>

      {/* Budgets por tier */}
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-ink mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-gold" /> Budget por tier (hoy)
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
              : "from-accent-gold to-amber-400";
            const tierHex = TIER_HEX[b.tier] || "#D4A574";
            const max7d = Math.max(...b.trend_7d_eur, b.cap_eur * 0.1);
            return (
              <div
                key={b.tier}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border ${
                          TIER_COLOR[b.tier] || "text-ink/60 border-white/10"
                        }`}
                      >
                        {b.tier}
                      </span>
                      <span className="text-sm text-ink">
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
                    <div className="text-[11px] text-ink/40 font-body">
                      {TIER_DESC[b.tier]}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Trend 7d sparkline (solo si hay algun dato en 7d) */}
                    {has7dData ? (
                      <div className="flex flex-col items-end">
                        <MiniSparkline
                          values={b.trend_7d_eur}
                          width={100}
                          height={26}
                          color={tierHex}
                          maxY={max7d}
                          minY={0}
                        />
                        <div className="text-[9px] text-ink/30 font-mono mt-0.5">
                          7d trend
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center w-[100px] h-[26px] text-[10px] text-ink/20 font-mono justify-end">
                        —
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-sm font-mono">
                        <span
                          className={
                            isOver
                              ? "text-red-400"
                              : isWarn
                              ? "text-amber-400"
                              : "text-ink"
                          }
                        >
                          {eur(b.spent_eur)}
                        </span>
                        <span className="text-ink/40"> / {eur(b.cap_eur)}</span>
                      </div>
                      <div className="text-[10px] text-ink/40 font-mono">
                        hoy
                      </div>
                    </div>
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
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-ink mb-5">
          Top 15 call sites (7 dias)
        </h2>
        {!data?.top_call_sites.length ? (
          <div className="text-center py-8 text-ink/40 text-sm">
            <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Sin calls registradas en los ultimos 7 dias.
            <p className="text-[11px] mt-1 text-ink/30">
              Aqui veras los call_sites ordenados por coste — util para detectar
              tareas que consumen mas de lo esperado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-ink/40 font-mono border-b border-white/[0.04]">
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
                    <td className="py-2 font-mono text-ink/80">
                      {s.call_site}
                    </td>
                    <td className="py-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border ${
                          TIER_COLOR[s.tier] || "text-ink/60 border-white/10"
                        }`}
                      >
                        {s.tier}
                      </span>
                    </td>
                    <td className="py-2 text-right text-ink">{s.calls}</td>
                    <td className="py-2 text-right text-accent-gold font-semibold">
                      {usd(s.cost_usd)}
                    </td>
                    <td className="py-2 text-right">
                      {s.errors > 0 ? (
                        <span className="text-red-400">{s.errors}</span>
                      ) : (
                        <span className="text-ink/30">0</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {s.fallbacks > 0 ? (
                        <span className="text-amber-400">{s.fallbacks}</span>
                      ) : (
                        <span className="text-ink/30">0</span>
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
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-ink mb-5 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-primary" /> Ultimas 50 calls
        </h2>
        {!data?.recent_calls.length ? (
          <div className="text-center py-8 text-ink/40 text-sm">
            <Zap className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Sin calls registradas todavia.
            <p className="text-[11px] mt-1 text-ink/30">
              Cada llamada a llmChat() aparecera aqui con provider, modelo,
              tokens, latency, coste y badge de fallback/error.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.recent_calls.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-2 rounded-lg text-xs ${
                  c.success ? "hover:bg-white/[0.02]" : "bg-red-500/5 hover:bg-red-500/10"
                } transition`}
              >
                <span className="text-ink/30 font-mono w-12 flex-shrink-0">
                  {timeAgo(c.created_at)}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${
                    TIER_COLOR[c.tier] || "text-ink/60 border-white/10"
                  }`}
                >
                  {c.tier}
                </span>
                <span className="font-mono text-ink/80 truncate max-w-[200px]">
                  {c.call_site}
                </span>
                <span className="text-ink/50 truncate max-w-[220px]">
                  {c.provider}/{c.model}
                </span>
                {c.fallback_used && (
                  <span className="text-amber-400 text-[10px]">fallback</span>
                )}
                {!c.success && (
                  <span className="text-red-400 text-[10px]">error</span>
                )}
                <div className="flex-1" />
                <span className="text-ink/50 font-mono">
                  {c.tokens_in}↑ {c.tokens_out}↓
                  {c.tokens_thinking > 0 && (
                    <span className="text-violet-400"> +{c.tokens_thinking}💭</span>
                  )}
                </span>
                <span className="text-ink/40 font-mono">{c.latency_ms}ms</span>
                <span className="text-accent-gold font-mono font-semibold w-16 text-right">
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
