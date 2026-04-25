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
} from "lucide-react";

interface MaterializedFile {
  path: string;
  signed_url: string;
  bytes: number;
  content_type: string;
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
          <main className="lg:col-span-8">
            {active ? (
              <DeploymentDetail
                deployment={active}
                onGenerateZip={() => generateZip(active.id)}
                zipGenerating={zipLoading === active.id}
              />
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
