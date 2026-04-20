"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Brain, DollarSign, Zap, AlertTriangle, Clock } from "lucide-react";

interface Totals {
  calls: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  avg_latency_ms: number;
  fallbacks: number;
}

interface AgentRow {
  agent_id: string;
  calls: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

interface ProviderRow {
  provider: string;
  calls: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

interface DailyRow {
  day: string;
  agent_id: string;
  provider: string;
  model: string;
  calls: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  avg_latency_ms: number;
  fallbacks: number;
}

interface RecentCall {
  agent_id: string;
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  latency_ms: number;
  source: string | null;
  created_at: string;
}

interface ObservabilityResponse {
  ok: boolean;
  period: { days: number; since: string };
  totals: Totals;
  by_agent: AgentRow[];
  by_provider: ProviderRow[];
  daily: DailyRow[];
  recent: RecentCall[];
}

const AGENT_COLORS: Record<string, string> = {
  dios: "#FFFFFF",
  sage: "#60A5FA",
  atlas: "#34D399",
  nexus: "#FB923C",
  pixel: "#A78BFA",
  core: "#F472B6",
  pulse: "#FBBF24",
  nova: "#E879F9",
  copy: "#2DD4BF",
  lens: "#F87171",
};

const PROVIDER_COLORS: Record<string, string> = {
  claude: "#C67B5C",
  nebius: "#3B82F6",
  gemma: "#10B981",
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function fmtCost(n: number): string {
  if (n < 0.01) return "$" + n.toFixed(4);
  if (n < 1) return "$" + n.toFixed(3);
  return "$" + n.toFixed(2);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ObservabilityPage() {
  const [data, setData] = useState<ObservabilityResponse | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/observability?days=${days}`, { cache: "no-store" });
      const j = (await r.json()) as ObservabilityResponse;
      setData(j);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loading && !data) {
    return <div className="p-8 text-neutral-400">Cargando observabilidad…</div>;
  }
  if (!data) {
    return <div className="p-8 text-red-400">No se pudo cargar el panel.</div>;
  }

  const maxAgentCost = Math.max(...data.by_agent.map((a) => a.cost_usd), 0.0001);
  const maxProviderCalls = Math.max(...data.by_provider.map((p) => p.calls), 1);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Observabilidad LLM</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Tokens, coste USD y latencia de cada llamada a LLM · ultimos {data.period.days} dias
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  days === d
                    ? "bg-white text-black"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-6">
          <StatCard icon={<Activity className="h-4 w-4" />} label="Llamadas" value={fmtNum(data.totals.calls)} />
          <StatCard icon={<Brain className="h-4 w-4" />} label="Tokens in" value={fmtNum(data.totals.tokens_in)} />
          <StatCard icon={<Zap className="h-4 w-4" />} label="Tokens out" value={fmtNum(data.totals.tokens_out)} />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Coste USD" value={fmtCost(data.totals.cost_usd)} highlight />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Latencia media" value={`${data.totals.avg_latency_ms}ms`} />
          <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Fallbacks" value={fmtNum(data.totals.fallbacks)} warn={data.totals.fallbacks > 0} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Por agente */}
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Coste por agente
            </h2>
            <div className="space-y-3">
              {data.by_agent.length === 0 && (
                <p className="text-sm text-neutral-500">Sin datos en el periodo.</p>
              )}
              {data.by_agent.map((a) => (
                <div key={a.agent_id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium uppercase" style={{ color: AGENT_COLORS[a.agent_id] || "#fff" }}>
                      {a.agent_id}
                    </span>
                    <span className="tabular-nums text-neutral-400">
                      {a.calls} calls · {fmtNum(a.tokens_in + a.tokens_out)} tok · {fmtCost(a.cost_usd)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(a.cost_usd / maxAgentCost) * 100}%`,
                        backgroundColor: AGENT_COLORS[a.agent_id] || "#fff",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Por provider */}
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Por provider
            </h2>
            <div className="space-y-3">
              {data.by_provider.length === 0 && (
                <p className="text-sm text-neutral-500">Sin datos en el periodo.</p>
              )}
              {data.by_provider.map((p) => (
                <div key={p.provider}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium" style={{ color: PROVIDER_COLORS[p.provider] || "#fff" }}>
                      {p.provider}
                    </span>
                    <span className="tabular-nums text-neutral-400">
                      {p.calls} calls · {fmtNum(p.tokens_in + p.tokens_out)} tok · {fmtCost(p.cost_usd)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(p.calls / maxProviderCalls) * 100}%`,
                        backgroundColor: PROVIDER_COLORS[p.provider] || "#fff",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recientes */}
        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Ultimas 20 llamadas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-500">
                  <th className="pb-2 font-medium">Cuando</th>
                  <th className="pb-2 font-medium">Agente</th>
                  <th className="pb-2 font-medium">Provider</th>
                  <th className="pb-2 font-medium">Modelo</th>
                  <th className="pb-2 font-medium">Fuente</th>
                  <th className="pb-2 text-right font-medium">Tok in</th>
                  <th className="pb-2 text-right font-medium">Tok out</th>
                  <th className="pb-2 text-right font-medium">Coste</th>
                  <th className="pb-2 text-right font-medium">ms</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i} className="border-t border-neutral-800/50">
                    <td className="py-2 text-neutral-500">{timeAgo(r.created_at)}</td>
                    <td className="py-2 uppercase" style={{ color: AGENT_COLORS[r.agent_id] || "#fff" }}>
                      {r.agent_id}
                    </td>
                    <td className="py-2" style={{ color: PROVIDER_COLORS[r.provider] || "#fff" }}>
                      {r.provider}
                    </td>
                    <td className="py-2 text-neutral-400">{r.model.split("/").pop()}</td>
                    <td className="py-2 text-neutral-500">{r.source || "-"}</td>
                    <td className="py-2 text-right tabular-nums text-neutral-400">{fmtNum(r.tokens_in)}</td>
                    <td className="py-2 text-right tabular-nums text-neutral-400">{fmtNum(r.tokens_out)}</td>
                    <td className="py-2 text-right tabular-nums text-emerald-400">{fmtCost(r.cost_usd)}</td>
                    <td className="py-2 text-right tabular-nums text-neutral-400">{r.latency_ms}</td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-neutral-500">
                      Sin llamadas registradas aun.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-emerald-500/30 bg-emerald-500/5"
          : warn
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-neutral-800 bg-neutral-900/50"
      }`}
    >
      <div className="flex items-center gap-2 text-neutral-400">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${highlight ? "text-emerald-300" : warn ? "text-amber-300" : "text-neutral-100"}`}>
        {value}
      </div>
    </div>
  );
}
