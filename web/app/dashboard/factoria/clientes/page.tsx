"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Download,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  Code2,
  Database,
  Mic,
  Workflow,
  Rocket,
  Globe,
  Phone,
  GitBranch,
  XCircle,
  AlertCircle,
  PauseCircle,
} from "lucide-react";

interface MaterializedFile {
  path: string;
  signed_url: string;
  bytes: number;
  content_type: string;
}

interface DeployLogEntry {
  ts: string;
  target: string;
  action: string;
  status: string;
  detail?: string | Record<string, unknown>;
}

interface DeploymentRow {
  id: string;
  slug: string;
  template_id: string;
  business_name: string;
  city: string;
  status: string;
  materialized_at: string | null;
  materialized_files: MaterializedFile[];
  zip_url: string | null;
  missing_vars: string[] | null;
  warnings: string[] | null;
  created_at: string;
  deploy_state?: string | null;
  deploy_log?: DeployLogEntry[] | null;
  vercel_url?: string | null;
  vercel_project_id?: string | null;
  vercel_deployed_at?: string | null;
  vapi_assistant_id?: string | null;
  vapi_deployed_at?: string | null;
  n8n_workflow_ids?: string[] | null;
  n8n_deployed_at?: string | null;
}

interface DeployResult {
  ok?: boolean;
  skipped_reason?: string;
  error?: string;
  project_id?: string;
  project_url?: string;
  assistant_id?: string;
  workflow_count?: number;
  workflow_ids?: string[];
}

interface DeployResponse {
  ok: boolean;
  deployment_id: string;
  results: { vercel?: DeployResult; vapi?: DeployResult; n8n?: DeployResult };
  summary: { ok: number; skipped: number; failed: number };
  deploy_state: string;
}

interface DeploymentsResponse {
  count: number;
  deployments: DeploymentRow[];
}

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ".env.example": Code2,
  "business-config.ts": Code2,
  "assistant-config.json": Mic,
  "system-prompt.md": Mic,
  "01-confirmar-reserva.json": Workflow,
  "seed-tenant.sql": Database,
  "README-DESPLIEGUE.md": FileText,
};

function fileIcon(path: string) {
  for (const [match, Icon] of Object.entries(FILE_ICONS)) {
    if (path.endsWith(match)) return Icon;
  }
  return FileText;
}

function bytesHuman(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export default function FactoriaClientesPage() {
  const [data, setData] = useState<DeploymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResponse | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/factoria/materialize");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DeploymentsResponse;
      setData(json);
      if (!activeId && json.deployments.length > 0) {
        setActiveId(json.deployments[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function generateZip(id: string) {
    setZipLoading(id);
    try {
      const res = await fetch(`/api/factoria/materialize/${id}/zip`);
      const json = await res.json();
      if (json.zip_url) {
        window.open(json.zip_url, "_blank");
      } else {
        setError(json.error ?? "no zip url returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setZipLoading(null);
    }
  }

  async function deployToProduction(id: string, targets: ("vercel" | "vapi" | "n8n")[] = ["vercel", "vapi", "n8n"]) {
    setDeploying(id);
    setDeployResult(null);
    try {
      const res = await fetch("/api/factoria/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deployment_id: id, targets }),
      });
      const json = (await res.json()) as DeployResponse;
      setDeployResult(json);
      // Reload deployments para refrescar estado
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeploying(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-electric-violet animate-spin" />
      </div>
    );
  }

  const active = data?.deployments.find((d) => d.id === activeId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-electric-violet" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/50">
              Factoría · Despliegues materializados
            </span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-pacame-white mb-2">
            Clientes desplegados
          </h1>
          <p className="text-pacame-white/50 font-body text-sm max-w-2xl">
            Cada fila es un cliente con su plantilla materializada en archivos físicos: env, configs, workflows, prompts y SQL. Descarga el ZIP para desplegar a producción.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 border border-white/10 hover:border-electric-violet/40 transition-colors"
          aria-label="Refrescar"
        >
          <RefreshCw className="w-4 h-4 text-pacame-white/60" />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 border border-rose-alert/30 bg-rose-alert/5 text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-alert flex-shrink-0 mt-0.5" />
          <span className="text-pacame-white/85">{error}</span>
        </div>
      )}

      {(!data || data.deployments.length === 0) && (
        <div className="bg-dark-card border border-white/[0.06] p-12 text-center">
          <Building2 className="w-12 h-12 text-pacame-white/20 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-pacame-white mb-2">
            Aún no hay clientes desplegados
          </h2>
          <p className="text-pacame-white/50 text-sm max-w-md mx-auto">
            Ve a <span className="text-electric-violet">/dashboard/factoria/templates</span>, ejecuta un plan SAGE para un cliente, y luego materialízalo desde aquí.
          </p>
        </div>
      )}

      {data && data.deployments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Lista de clientes */}
          <aside className="lg:col-span-4 bg-dark-card border border-white/[0.06] divide-y divide-white/[0.04]">
            {data.deployments.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className={`w-full text-left p-4 transition-colors ${
                  activeId === d.id ? "bg-electric-violet/10 border-l-2 border-electric-violet" : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-heading font-bold text-pacame-white text-sm leading-tight">
                    {d.business_name}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-pacame-white/40">
                  <span>{d.city}</span>
                  <span>{d.template_id}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-pacame-white/40">
                  <span>
                    {d.materialized_files?.length ?? 0} archivos
                  </span>
                  <span>
                    {d.materialized_at
                      ? new Date(d.materialized_at).toLocaleDateString("es-ES")
                      : "no materializado"}
                  </span>
                </div>
              </button>
            ))}
          </aside>

          {/* Detalle */}
          <main className="lg:col-span-8 space-y-4">
            {active ? (
              <>
                <DeploymentDetail
                  deployment={active}
                  onGenerateZip={() => generateZip(active.id)}
                  zipGenerating={zipLoading === active.id}
                />
                <DeployPanel
                  deployment={active}
                  onDeploy={(targets) => deployToProduction(active.id, targets)}
                  deploying={deploying === active.id}
                  result={deployResult?.deployment_id === active.id ? deployResult : null}
                />
              </>
            ) : (
              <div className="bg-dark-card border border-white/[0.06] p-8 text-center text-pacame-white/40">
                Selecciona un cliente
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planned: "bg-amber-signal/20 text-amber-signal",
    approved: "bg-cyan-400/20 text-cyan-400",
    in_progress: "bg-electric-violet/20 text-electric-violet",
    shipped: "bg-lime-pulse/20 text-lime-pulse",
    cancelled: "bg-rose-alert/20 text-rose-alert",
  };
  return (
    <span className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${colors[status] ?? "bg-white/10 text-pacame-white/60"}`}>
      {status}
    </span>
  );
}

function DeploymentDetail({
  deployment,
  onGenerateZip,
  zipGenerating,
}: {
  deployment: DeploymentRow;
  onGenerateZip: () => void;
  zipGenerating: boolean;
}) {
  const filesByDir = groupByDir(deployment.materialized_files ?? []);

  return (
    <article className="bg-dark-card border border-white/[0.06] divide-y divide-white/[0.04]">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-electric-violet">
                {deployment.template_id}
              </span>
              <StatusBadge status={deployment.status} />
            </div>
            <h2 className="font-heading font-bold text-2xl text-pacame-white mb-1">
              {deployment.business_name}
            </h2>
            <div className="text-pacame-white/50 text-sm font-mono">
              {deployment.city} · slug <span className="text-pacame-white/80">{deployment.slug}</span>
            </div>
          </div>
          <button
            onClick={onGenerateZip}
            disabled={zipGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-electric-violet text-white font-body text-sm font-medium hover:bg-electric-violet/90 transition-colors disabled:opacity-50 rounded-sm"
          >
            {zipGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {zipGenerating ? "Empaquetando..." : "Descargar ZIP"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <Stat label="Archivos" value={String(deployment.materialized_files?.length ?? 0)} />
          <Stat
            label="Tamaño total"
            value={bytesHuman(
              (deployment.materialized_files ?? []).reduce((acc, f) => acc + (f.bytes ?? 0), 0)
            )}
          />
          <Stat
            label="Materializado"
            value={
              deployment.materialized_at
                ? new Date(deployment.materialized_at).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
          />
        </div>
      </header>

      {/* Warnings */}
      {(deployment.missing_vars?.length || deployment.warnings?.length) ? (
        <section className="p-6">
          {deployment.missing_vars && deployment.missing_vars.length > 0 && (
            <div className="mb-4">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-signal flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3 h-3" />
                Variables sin valor ({deployment.missing_vars.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {deployment.missing_vars.map((v) => (
                  <span
                    key={v}
                    className="font-mono text-[10px] tracking-[0.1em] px-2 py-0.5 border border-amber-signal/30 text-amber-signal/90"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          {deployment.warnings && deployment.warnings.length > 0 && (
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rose-alert flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3 h-3" />
                Warnings
              </span>
              <ul className="text-[12px] text-pacame-white/70 space-y-1">
                {deployment.warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="p-6">
          <div className="flex items-center gap-2 text-lime-pulse text-sm font-mono">
            <CheckCircle2 className="w-4 h-4" />
            Materializado sin warnings
          </div>
        </section>
      )}

      {/* Archivos por carpeta */}
      <section className="p-6">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-4">
          Archivos generados
        </span>
        <div className="space-y-4">
          {Object.entries(filesByDir).map(([dir, files]) => (
            <div key={dir}>
              <div className="font-mono text-[11px] tracking-[0.1em] text-electric-violet mb-2">
                {dir || "/ (root)"}
              </div>
              <ul className="divide-y divide-white/[0.04] border border-white/[0.04]">
                {files.map((f) => {
                  const Icon = fileIcon(f.path);
                  const fileName = f.path.split("/").pop() ?? f.path;
                  return (
                    <li key={f.path} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/[0.02]">
                      <Icon className="w-3.5 h-3.5 text-pacame-white/40 flex-shrink-0" />
                      <span className="font-mono text-[12px] text-pacame-white/85 flex-1 truncate">{fileName}</span>
                      <span className="font-mono text-[10px] text-pacame-white/40">{bytesHuman(f.bytes)}</span>
                      <a
                        href={f.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pacame-white/40 hover:text-electric-violet transition-colors"
                        title="Abrir"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="p-4 text-[10px] font-mono text-pacame-white/30 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Clock className="w-2.5 h-2.5" />
          ID {deployment.id.slice(0, 8)}
        </span>
        <span>
          Creado {new Date(deployment.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </footer>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-pacame-white/40 block mb-1">
        {label}
      </span>
      <span className="font-heading font-bold text-pacame-white text-sm">{value}</span>
    </div>
  );
}

function groupByDir(files: MaterializedFile[]): Record<string, MaterializedFile[]> {
  const groups: Record<string, MaterializedFile[]> = {};
  for (const file of files) {
    // Saltar el slug raíz para mostrar paths relativos
    const parts = file.path.split("/");
    parts.shift(); // remove slug prefix
    const dir = parts.slice(0, -1).join("/");
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(file);
  }
  return groups;
}

// ──────────────────────────────────────────────────────────────────
// Deploy panel — botón "Desplegar a producción" + estado por destino
// ──────────────────────────────────────────────────────────────────

const DEPLOY_TARGETS: { id: "vercel" | "vapi" | "n8n"; label: string; icon: React.ComponentType<{ className?: string }>; envVar: string }[] = [
  { id: "vercel", label: "Vercel", icon: Globe, envVar: "VERCEL_TOKEN" },
  { id: "vapi", label: "Vapi (recepcionista IA)", icon: Phone, envVar: "VAPI_API_KEY" },
  { id: "n8n", label: "n8n (workflows)", icon: GitBranch, envVar: "N8N_API_KEY" },
];

function DeployPanel({
  deployment,
  onDeploy,
  deploying,
  result,
}: {
  deployment: DeploymentRow;
  onDeploy: (targets: ("vercel" | "vapi" | "n8n")[]) => void;
  deploying: boolean;
  result: DeployResponse | null;
}) {
  const log = deployment.deploy_log ?? [];
  const recentLog = log.slice(-15).reverse();

  return (
    <article className="bg-dark-card border border-electric-violet/30 divide-y divide-white/[0.04]">
      <header className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-electric-violet" />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-electric-violet">
                Deploy a producción
              </span>
              <DeployStateBadge state={deployment.deploy_state ?? "not_started"} />
            </div>
            <p className="text-pacame-white/60 text-sm font-body max-w-xl">
              Crea el proyecto en Vercel · sube assistant a Vapi · importa workflows a n8n. Los destinos sin API key configurada se saltan automáticamente.
            </p>
          </div>
          <button
            onClick={() => onDeploy(["vercel", "vapi", "n8n"])}
            disabled={deploying || !deployment.materialized_at}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric-violet text-white font-body text-sm font-medium hover:bg-electric-violet/90 transition-colors disabled:opacity-50 rounded-sm"
          >
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {deploying ? "Desplegando..." : "Desplegar a producción"}
          </button>
        </div>
      </header>

      {/* Estado por destino */}
      <section className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEPLOY_TARGETS.map((t) => (
          <TargetStateCard
            key={t.id}
            target={t}
            deployment={deployment}
            result={result?.results?.[t.id]}
            onDeployOne={() => onDeploy([t.id])}
            disabled={deploying}
          />
        ))}
      </section>

      {/* Resumen último run */}
      {result && (
        <section className="p-6 bg-white/[0.02]">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-3">
            Último run · {new Date().toLocaleTimeString("es-ES")}
          </span>
          <div className="flex items-center gap-4 text-sm font-mono">
            <span className="text-lime-pulse">✓ {result.summary.ok} OK</span>
            <span className="text-amber-signal">⊘ {result.summary.skipped} saltados</span>
            <span className="text-rose-alert">✗ {result.summary.failed} fallos</span>
            <span className="ml-auto text-electric-violet">deploy_state: {result.deploy_state}</span>
          </div>
        </section>
      )}

      {/* Log */}
      {recentLog.length > 0 && (
        <section className="p-6">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 block mb-3">
            Deploy log (últimos {recentLog.length})
          </span>
          <ul className="space-y-1 max-h-72 overflow-auto">
            {recentLog.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function DeployStateBadge({ state }: { state: string }) {
  const map: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    not_started: { color: "bg-white/10 text-pacame-white/50", icon: PauseCircle, label: "no iniciado" },
    partial: { color: "bg-amber-signal/20 text-amber-signal", icon: AlertCircle, label: "parcial" },
    shipped: { color: "bg-lime-pulse/20 text-lime-pulse", icon: CheckCircle2, label: "shipped" },
    error: { color: "bg-rose-alert/20 text-rose-alert", icon: XCircle, label: "error" },
  };
  const cfg = map[state] ?? map.not_started;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function TargetStateCard({
  target,
  deployment,
  result,
  onDeployOne,
  disabled,
}: {
  target: { id: "vercel" | "vapi" | "n8n"; label: string; icon: React.ComponentType<{ className?: string }>; envVar: string };
  deployment: DeploymentRow;
  result?: DeployResult;
  onDeployOne: () => void;
  disabled: boolean;
}) {
  const Icon = target.icon;

  // Determinar estado actual del target
  let state: "ok" | "skipped" | "error" | "not_started" = "not_started";
  let detail: React.ReactNode = "Listo para desplegar";
  let externalLink: string | null = null;

  if (target.id === "vercel" && deployment.vercel_project_id) {
    state = "ok";
    detail = `Project: ${deployment.vercel_project_id.slice(0, 12)}`;
    externalLink = deployment.vercel_url ?? null;
  } else if (target.id === "vapi" && deployment.vapi_assistant_id) {
    state = "ok";
    detail = `Assistant: ${deployment.vapi_assistant_id.slice(0, 12)}`;
    externalLink = `https://dashboard.vapi.ai/assistants/${deployment.vapi_assistant_id}`;
  } else if (target.id === "n8n" && deployment.n8n_workflow_ids && deployment.n8n_workflow_ids.length > 0) {
    state = "ok";
    detail = `${deployment.n8n_workflow_ids.length} workflows importados`;
  }

  // Override con resultado del último run
  if (result?.skipped_reason) {
    state = "skipped";
    detail = result.skipped_reason;
  } else if (result?.error) {
    state = "error";
    detail = result.error.slice(0, 80);
  } else if (result?.ok) {
    state = "ok";
  }

  const stateColors: Record<typeof state, { border: string; icon: string }> = {
    ok: { border: "border-lime-pulse/30", icon: "text-lime-pulse" },
    error: { border: "border-rose-alert/40", icon: "text-rose-alert" },
    skipped: { border: "border-amber-signal/30", icon: "text-amber-signal" },
    not_started: { border: "border-white/[0.06]", icon: "text-pacame-white/40" },
  };

  const stateIconMap = {
    ok: <CheckCircle2 className={`w-4 h-4 ${stateColors[state].icon}`} />,
    error: <XCircle className={`w-4 h-4 ${stateColors[state].icon}`} />,
    skipped: <PauseCircle className={`w-4 h-4 ${stateColors[state].icon}`} />,
    not_started: <Clock className={`w-4 h-4 ${stateColors[state].icon}`} />,
  };

  return (
    <div className={`p-4 border ${stateColors[state].border} bg-white/[0.01]`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-pacame-white/60" />
          <span className="font-heading font-bold text-pacame-white text-sm">{target.label}</span>
        </div>
        {stateIconMap[state]}
      </div>
      <p className="text-pacame-white/65 text-[12px] font-mono leading-relaxed mb-3 break-words">{detail}</p>
      {state === "skipped" && (
        <p className="text-amber-signal/80 text-[10px] font-mono mb-3">
          Configura {target.envVar} en .env.local para activar
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onDeployOne}
          disabled={disabled}
          className="text-[11px] font-mono text-electric-violet hover:text-electric-violet/80 disabled:opacity-50 transition-colors"
        >
          {state === "ok" ? "Re-desplegar" : "Desplegar solo este"}
        </button>
        {externalLink && (
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pacame-white/40 hover:text-electric-violet transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function LogEntry({ entry }: { entry: DeployLogEntry }) {
  const statusColors: Record<string, string> = {
    ok: "text-lime-pulse",
    error: "text-rose-alert",
    skipped: "text-amber-signal",
    in_progress: "text-electric-violet",
  };
  const ts = new Date(entry.ts).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <li className="flex items-start gap-3 text-[11px] font-mono leading-relaxed">
      <span className="text-pacame-white/30 flex-shrink-0">{ts}</span>
      <span className="text-pacame-white/50 uppercase tracking-[0.1em] w-12 flex-shrink-0">{entry.target}</span>
      <span className="text-pacame-white/70 flex-1 truncate">{entry.action}</span>
      <span className={`uppercase font-bold flex-shrink-0 ${statusColors[entry.status] ?? "text-pacame-white/50"}`}>
        {entry.status}
      </span>
    </li>
  );
}
