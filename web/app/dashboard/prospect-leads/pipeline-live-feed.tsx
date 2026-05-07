"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface PipelineRun {
  id: string;
  lead_slug: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_city: string | null;
  step: string;
  vercel_url: string | null;
  resend_message_id: string | null;
  error: string | null;
  worker_id: string | null;
  started_at: string;
  generate_started_at: string | null;
  generate_completed_at: string | null;
  deploy_started_at: string | null;
  deploy_completed_at: string | null;
  send_started_at: string | null;
  send_completed_at: string | null;
  completed_at: string | null;
}

interface Heartbeat {
  worker_id: string;
  status: string;
  current_lead: string | null;
  next_run_at: string | null;
  total_processed: number;
  errors: number;
  last_seen_at: string;
}

const STEP_COLORS: Record<string, string> = {
  queued: "bg-zinc-700/40 text-zinc-300",
  generating: "bg-blue-500/30 text-blue-200 animate-pulse",
  deploying: "bg-amber-500/30 text-amber-200 animate-pulse",
  sending: "bg-emerald-500/30 text-emerald-200 animate-pulse",
  syncing: "bg-fuchsia-500/30 text-fuchsia-200",
  completed: "bg-emerald-700/30 text-emerald-300",
  failed: "bg-rose-700/40 text-rose-200",
};

const STEP_LABELS: Record<string, string> = {
  queued: "En cola",
  generating: "Generando HTML",
  deploying: "Deploy Vercel",
  sending: "Enviando email",
  syncing: "Sync DB",
  completed: "Listo",
  failed: "Error",
};

function fmtTime(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtSince(s: string) {
  const ms = Date.now() - new Date(s).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  return `${Math.floor(ms / 3_600_000)}h`;
}

export function PipelineLiveFeed() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);

  const refresh = async () => {
    const [{ data: runsData }, { data: hbData }] = await Promise.all([
      supabase.from("pipeline_runs").select("*").order("started_at", { ascending: false }).limit(20),
      supabase.from("worker_heartbeat").select("*").order("last_seen_at", { ascending: false }),
    ]);
    if (runsData) setRuns(runsData);
    if (hbData) setHeartbeats(hbData);
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("pipeline-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "pipeline_runs" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_heartbeat" }, refresh)
      .subscribe();
    const interval = setInterval(refresh, 5_000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const liveRun = runs.find((r) => !r.completed_at && r.step !== "failed");
  const recentRuns = runs.filter((r) => r.id !== liveRun?.id).slice(0, 8);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Worker status */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Worker</h2>
          {heartbeats.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Inactivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Activo
            </span>
          )}
        </div>
        {heartbeats.length === 0 ? (
          <div className="text-sm text-zinc-500">
            No hay worker corriendo. Lanza:
            <code className="block mt-2 text-xs bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300">
              node scripts/worker.mjs --rate=4
            </code>
          </div>
        ) : (
          heartbeats.slice(0, 1).map((hb) => (
            <div key={hb.worker_id} className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-xs">Estado</span>
                <span className="font-bold capitalize">{hb.status}</span>
              </div>
              {hb.current_lead && (
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-xs">Procesando</span>
                  <span className="font-mono text-xs text-amber-300 truncate max-w-[140px]">{hb.current_lead}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400 text-xs">Procesados</span>
                <span className="font-bold tabular-nums">{hb.total_processed}</span>
              </div>
              {hb.errors > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-xs">Errores</span>
                  <span className="font-bold tabular-nums text-rose-300">{hb.errors}</span>
                </div>
              )}
              {hb.next_run_at && (
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-xs">Próximo</span>
                  <span className="text-xs tabular-nums">{fmtTime(hb.next_run_at)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
                <span className="text-zinc-500 text-[10px]">Last seen</span>
                <span className="text-[10px] text-zinc-500">hace {fmtSince(hb.last_seen_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live run */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Construyendo ahora</h2>
        {liveRun ? (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-bold text-zinc-100">{liveRun.lead_name || liveRun.lead_slug}</div>
              <div className="text-xs text-zinc-500">{liveRun.lead_city || "—"} · {liveRun.lead_email}</div>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${STEP_COLORS[liveRun.step] || "bg-zinc-800"}`}>
                {STEP_LABELS[liveRun.step] || liveRun.step}
              </span>
            </div>
            {/* Step progress */}
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[
                { key: "generate", label: "Gen", t1: liveRun.generate_started_at, t2: liveRun.generate_completed_at },
                { key: "deploy", label: "Deploy", t1: liveRun.deploy_started_at, t2: liveRun.deploy_completed_at },
                { key: "send", label: "Email", t1: liveRun.send_started_at, t2: liveRun.send_completed_at },
                { key: "done", label: "Done", t1: liveRun.completed_at, t2: liveRun.completed_at },
              ].map((s) => (
                <div key={s.key} className={`p-1.5 rounded text-center ${s.t2 ? "bg-emerald-700/30 text-emerald-200" : s.t1 ? "bg-amber-500/30 text-amber-200 animate-pulse" : "bg-zinc-800 text-zinc-500"}`}>
                  {s.label}
                </div>
              ))}
            </div>
            {liveRun.vercel_url && (
              <a href={liveRun.vercel_url} target="_blank" rel="noopener" className="block text-xs text-blue-400 hover:text-blue-300 truncate">
                {liveRun.vercel_url} ↗
              </a>
            )}
            <div className="text-[10px] text-zinc-600">
              Iniciado a las {fmtTime(liveRun.started_at)} ({fmtSince(liveRun.started_at)} ago)
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500 py-4 text-center">No hay nada construyéndose ahora.</div>
        )}
      </div>

      {/* Recent runs */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Últimas {recentRuns.length} webs creadas</h2>
        <ol className="space-y-1.5 text-xs max-h-72 overflow-y-auto">
          {recentRuns.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-1 border-b border-zinc-800/50 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-zinc-200 truncate font-medium">{r.lead_name || r.lead_slug}</div>
                <div className="text-zinc-600 text-[10px]">{r.lead_city || "—"} · {fmtTime(r.completed_at || r.started_at)}</div>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${STEP_COLORS[r.step] || "bg-zinc-800"}`}>
                {STEP_LABELS[r.step] || r.step}
              </span>
              {r.vercel_url && (
                <a href={r.vercel_url} target="_blank" rel="noopener" className="shrink-0 text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>↗</a>
              )}
            </li>
          ))}
          {recentRuns.length === 0 && (
            <div className="text-zinc-500 py-4 text-center">Sin runs recientes</div>
          )}
        </ol>
      </div>
    </div>
  );
}
