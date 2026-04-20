"use client";

/**
 * Dashboard Cerebro — control panel del brain/router multi-canal.
 * Polling cada 30s. Estetica consistente con el resto del dashboard (negro + gold + tailwind).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Loader2,
  FlaskConical,
  Target,
  Activity,
  Clock,
  SkipForward,
} from "lucide-react";

interface AgentProposal {
  id: string;
  agent_slug?: string | null;
  hypothesis: string;
  confidence: number | null;
  priority: number | null;
  status: string;
  rationale?: string | null;
  expected_impact?: string | null;
  created_at: string;
}

interface GrowthExperiment {
  id: string;
  name: string;
  hypothesis?: string | null;
  variant_a?: string | null;
  variant_b?: string | null;
  metric_a?: number | null;
  metric_b?: number | null;
  winner?: string | null;
  status: string;
  started_at?: string | null;
}

interface LinkedInQueueItem {
  id: string;
  target_name: string;
  linkedin_url: string;
  message_body: string;
  status: string;
  created_at: string;
  touch_number: number | null;
}

interface ChannelStat {
  sent: number;
  replied: number;
  converted: number;
  reply_rate: number;
}

interface TodayPlan {
  plan_date: string;
  summary?: string | null;
  kpi_targets?: Record<string, number> | null;
  kpi_actual?: Record<string, number> | null;
  focus_niches?: string[] | null;
  focus_channels?: string[] | null;
  cost_usd?: number | null;
}

interface BrainPayload {
  proposals_pending: AgentProposal[];
  proposals_recent: AgentProposal[];
  experiments_running: GrowthExperiment[];
  channel_stats: {
    by_channel: Record<string, ChannelStat>;
    by_niche_channel: Record<string, ChannelStat>;
  };
  linkedin_queue_pending: LinkedInQueueItem[];
  today_plan: TodayPlan | null;
  summary: {
    proposals_today: number;
    proposals_pending_count: number;
    experiments_active: number;
    linkedin_queue_count: number;
    total_channel_sends_7d: number;
  };
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function BrainDashboard() {
  const [data, setData] = useState<BrainPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/brain", { cache: "no-store" });
      if (res.ok) {
        const payload = (await res.json()) as BrainPayload;
        setData(payload);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const onProposalAction = useCallback(
    async (id: string, action: "approve" | "reject") => {
      setActingOn(id);
      let reason: string | undefined;
      if (action === "reject") {
        const r = window.prompt("Motivo del rechazo (opcional):");
        if (r === null) {
          setActingOn(null);
          return;
        }
        reason = r || undefined;
      }
      try {
        await fetch(`/api/dashboard/brain/proposals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });
        await load();
      } finally {
        setActingOn(null);
      }
    },
    [load]
  );

  const onLinkedinAction = useCallback(
    async (id: string, status: "sent" | "skipped") => {
      setActingOn(id);
      try {
        await fetch(`/api/dashboard/brain/linkedin/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        await load();
      } finally {
        setActingOn(null);
      }
    },
    [load]
  );

  const copy = useCallback((id: string, text: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    });
  }, []);

  const channelRows = useMemo(() => {
    const rows: Array<{ key: string; niche: string; channel: string; stat: ChannelStat }> = [];
    if (!data) return rows;
    for (const [key, stat] of Object.entries(data.channel_stats.by_niche_channel)) {
      const [niche, channel] = key.split("__");
      rows.push({ key, niche: niche || "—", channel: channel || "—", stat });
    }
    rows.sort((a, b) => b.stat.sent - a.stat.sent);
    return rows.slice(0, 30);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-pacame-white/40">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const plan = data?.today_plan;
  const kpiTargets = plan?.kpi_targets || {};
  const kpiActuals = plan?.kpi_actual || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-electric-violet/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-electric-violet" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-pacame-white">Cerebro</h1>
          <p className="text-sm text-pacame-white/50 font-body">
            Router multi-canal, experimentos y propuestas del agente autonomo.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard
          icon={<Target className="w-4 h-4" />}
          label="Propuestas hoy"
          value={data?.summary.proposals_today ?? 0}
        />
        <SummaryCard
          icon={<Clock className="w-4 h-4" />}
          label="Pendientes"
          value={data?.summary.proposals_pending_count ?? 0}
          accent
        />
        <SummaryCard
          icon={<FlaskConical className="w-4 h-4" />}
          label="Experimentos activos"
          value={data?.summary.experiments_active ?? 0}
        />
        <SummaryCard
          icon={<ExternalLink className="w-4 h-4" />}
          label="LinkedIn cola"
          value={data?.summary.linkedin_queue_count ?? 0}
        />
        <SummaryCard
          icon={<Activity className="w-4 h-4" />}
          label="Sends 7d"
          value={data?.summary.total_channel_sends_7d ?? 0}
        />
      </div>

      {/* 1. Plan del dia */}
      <section className="bg-dark-elevated border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-sm font-heading font-semibold text-pacame-white mb-3">
          Plan del dia {plan ? `· ${plan.plan_date}` : ""}
        </h2>
        {!plan ? (
          <p className="text-sm text-pacame-white/40 font-body">
            Sin plan generado hoy. El strategist lo creara en el proximo cron.
          </p>
        ) : (
          <div className="space-y-3">
            {plan.summary && (
              <p className="text-sm text-pacame-white/70 font-body">{plan.summary}</p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.keys(kpiTargets).map((key) => {
                const target = kpiTargets[key] || 0;
                const actual = kpiActuals[key] || 0;
                const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
                return (
                  <div key={key} className="bg-pacame-black/50 rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-[11px] uppercase tracking-wide text-pacame-white/40 font-body">
                      {key}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-heading font-bold text-pacame-white">{actual}</span>
                      <span className="text-xs text-pacame-white/40">/ {target}</span>
                    </div>
                    <div className="h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-electric-violet"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {plan.focus_niches && plan.focus_niches.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-pacame-white/40 font-body">
                  Focus del dia
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.focus_niches.map((n, i) => (
                    <span key={`n-${i}`} className="text-xs px-2 py-1 rounded-full bg-olympus-gold/10 text-olympus-gold font-mono">
                      {n}
                    </span>
                  ))}
                  {plan.focus_channels?.map((c, i) => (
                    <span key={`c-${i}`} className="text-xs px-2 py-1 rounded-full bg-electric-violet/10 text-electric-violet font-mono">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Propuestas pendientes */}
      <section>
        <h2 className="text-sm font-heading font-semibold text-pacame-white mb-3">
          Propuestas pendientes
        </h2>
        {!data || data.proposals_pending.length === 0 ? (
          <p className="text-sm text-pacame-white/40 font-body">Sin propuestas pendientes.</p>
        ) : (
          <div className="grid gap-3">
            {data.proposals_pending.map((p) => (
              <div
                key={p.id}
                className="bg-dark-elevated border border-white/[0.06] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-start gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.agent_slug && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-white/[0.05] text-pacame-white/60 font-body">
                        {p.agent_slug}
                      </span>
                    )}
                    {p.priority != null && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 font-body">
                        prio {p.priority}
                      </span>
                    )}
                    <span className="text-[10px] text-pacame-white/30 font-body">
                      {fmtDate(p.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-pacame-white font-body">{p.hypothesis}</p>
                  {p.rationale && (
                    <p className="text-xs text-pacame-white/50 font-body">{p.rationale}</p>
                  )}
                  {p.expected_impact && (
                    <p className="text-xs text-emerald-300/80 font-body">
                      Impacto esperado: {p.expected_impact}
                    </p>
                  )}
                  {/* Confidence bar */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-pacame-white/40 font-body w-16">
                      confidence
                    </span>
                    <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${Math.min(100, (p.confidence || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-pacame-white/50 font-body">
                      {fmtPct(p.confidence || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 lg:flex-col">
                  <button
                    onClick={() => onProposalAction(p.id, "approve")}
                    disabled={actingOn === p.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs font-body font-medium transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => onProposalAction(p.id, "reject")}
                    disabled={actingOn === p.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-body font-medium transition disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Experimentos activos */}
      <section>
        <h2 className="text-sm font-heading font-semibold text-pacame-white mb-3">
          Experimentos activos
        </h2>
        {!data || data.experiments_running.length === 0 ? (
          <p className="text-sm text-pacame-white/40 font-body">Sin experimentos en curso.</p>
        ) : (
          <div className="bg-dark-elevated border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-body">
              <thead className="bg-white/[0.03] text-pacame-white/40 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2">Variante A</th>
                  <th className="text-right px-3 py-2">Metric A</th>
                  <th className="text-left px-3 py-2">Variante B</th>
                  <th className="text-right px-3 py-2">Metric B</th>
                  <th className="text-left px-3 py-2">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.experiments_running.map((e) => (
                  <tr key={e.id} className="text-pacame-white/70">
                    <td className="px-3 py-2">
                      <div className="font-medium text-pacame-white">{e.name}</div>
                      {e.hypothesis && (
                        <div className="text-pacame-white/40 text-[11px]">{e.hypothesis}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{e.variant_a || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {e.metric_a ?? "—"}
                    </td>
                    <td className="px-3 py-2">{e.variant_b || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {e.metric_b ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {e.winner ? (
                        <span className="text-emerald-300">{e.winner}</span>
                      ) : (
                        <span className="text-pacame-white/30">pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. LinkedIn queue */}
      <section>
        <h2 className="text-sm font-heading font-semibold text-pacame-white mb-3">
          LinkedIn — cola manual
        </h2>
        {!data || data.linkedin_queue_pending.length === 0 ? (
          <p className="text-sm text-pacame-white/40 font-body">Sin mensajes pendientes.</p>
        ) : (
          <div className="bg-dark-elevated border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-body">
              <thead className="bg-white/[0.03] text-pacame-white/40 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2">Target</th>
                  <th className="text-left px-3 py-2">Mensaje</th>
                  <th className="text-right px-3 py-2 w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.linkedin_queue_pending.map((it) => (
                  <tr key={it.id} className="text-pacame-white/70 align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium text-pacame-white">{it.target_name}</div>
                      <a
                        href={it.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-electric-violet hover:underline text-[11px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Perfil
                      </a>
                      {it.touch_number != null && (
                        <div className="text-[10px] text-pacame-white/30 mt-1">
                          touch #{it.touch_number}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <pre className="text-[11px] text-pacame-white/70 whitespace-pre-wrap max-w-[500px] font-body">
                        {it.message_body}
                      </pre>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1.5 items-end">
                        <button
                          onClick={() => copy(it.id, it.message_body)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-pacame-white/70 text-[11px] transition"
                        >
                          <Copy className="w-3 h-3" />
                          {copied === it.id ? "Copiado" : "Copiar"}
                        </button>
                        <button
                          onClick={() => onLinkedinAction(it.id, "sent")}
                          disabled={actingOn === it.id}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Enviado
                        </button>
                        <button
                          onClick={() => onLinkedinAction(it.id, "skipped")}
                          disabled={actingOn === it.id}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-pacame-white/60 text-[11px] transition disabled:opacity-50"
                        >
                          <SkipForward className="w-3 h-3" />
                          Skip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Channel stats 7d */}
      <section>
        <h2 className="text-sm font-heading font-semibold text-pacame-white mb-3">
          Channel stats 7d (niche x channel)
        </h2>
        {channelRows.length === 0 ? (
          <p className="text-sm text-pacame-white/40 font-body">Sin datos.</p>
        ) : (
          <div className="bg-dark-elevated border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-body">
              <thead className="bg-white/[0.03] text-pacame-white/40 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2">Niche</th>
                  <th className="text-left px-3 py-2">Channel</th>
                  <th className="text-right px-3 py-2">Sent</th>
                  <th className="text-right px-3 py-2">Replied</th>
                  <th className="text-right px-3 py-2">Converted</th>
                  <th className="text-right px-3 py-2">Reply rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {channelRows.map((r) => (
                  <tr key={r.key} className="text-pacame-white/70">
                    <td className="px-3 py-2">{r.niche}</td>
                    <td className="px-3 py-2 capitalize">{r.channel}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.stat.sent}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.stat.replied}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.stat.converted}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtPct(r.stat.reply_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 border ${
        accent
          ? "bg-electric-violet/10 border-electric-violet/30"
          : "bg-dark-elevated border-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-2 text-pacame-white/50 text-[11px] uppercase tracking-wide font-body">
        {icon}
        {label}
      </div>
      <div className="text-xl font-heading font-bold text-pacame-white mt-1">{value}</div>
    </div>
  );
}
