"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Lock,
  Globe,
  Filter,
} from "lucide-react";

interface EnvVar {
  name: string;
  isSet: boolean;
  length: number;
  valuePreview?: string;
  category: string;
  description: string;
  provider: string;
  generate_url?: string;
  required_in_prod: boolean;
  required_in_dev: boolean;
  public: boolean;
  status: "ok" | "missing-required" | "missing-optional";
}

interface EnvResponse {
  current_env: string;
  checked_at: string;
  totals: {
    total: number;
    set: number;
    missing_required: number;
    missing_optional: number;
    by_category: Record<string, { total: number; set: number; missing: number }>;
  };
  vars: EnvVar[];
}

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM / AI Models",
  database: "Database",
  payments: "Payments",
  auth: "Auth & Admin",
  messaging: "Messaging",
  social: "Social Media",
  content: "Content & Design",
  infrastructure: "Infrastructure",
  analytics: "Analytics",
  cron: "Cron",
};

const CATEGORY_COLORS: Record<string, string> = {
  llm: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  database: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  payments: "text-accent-gold bg-accent-gold/10 border-accent-gold/30",
  auth: "text-red-400 bg-red-500/10 border-red-500/30",
  messaging: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  social: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  content: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  infrastructure: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  analytics: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  cron: "text-ink/60 bg-white/[0.04] border-white/10",
};

export default function EnvDashboardPage() {
  const [data, setData] = useState<EnvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "missing" | "missing-required">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/env-check", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as EnvResponse;
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
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const filteredVars = useMemo(() => {
    if (!data) return [];
    let rows = data.vars;
    if (filter === "missing") rows = rows.filter((v) => !v.isSet);
    if (filter === "missing-required")
      rows = rows.filter((v) => v.status === "missing-required");
    if (categoryFilter !== "all")
      rows = rows.filter((v) => v.category === categoryFilter);
    return rows;
  }, [data, filter, categoryFilter]);

  const categories = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.totals.by_category).sort((a, b) => b[1].total - a[1].total);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-ink/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando env status...
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

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-gold" /> Env Registry
          </h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            {data?.vars.length} vars gestionadas · Environment:{" "}
            <span className="font-mono text-accent-gold">{data?.current_env}</span>
            {data && ` · Verificado ${new Date(data.checked_at).toLocaleTimeString("es-ES")}`}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-ink/60 hover:text-ink text-xs transition border border-ink/[0.08]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Hero KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
            <div className="text-xs uppercase tracking-wider text-ink/40 font-mono mb-1">
              Total vars
            </div>
            <div className="font-heading font-bold text-3xl text-ink">
              {data.totals.total}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/30 p-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="font-heading font-bold text-3xl text-emerald-400">
              {data.totals.set}
            </div>
            <div className="text-xs text-ink/40 font-body mt-1">
              Configuradas
            </div>
          </div>
          <div
            className={`rounded-2xl p-5 border ${
              data.totals.missing_required > 0
                ? "bg-red-500/10 border-red-500/40 animate-pulse"
                : "bg-paper-deep border-ink/[0.06]"
            }`}
          >
            <XCircle
              className={`w-5 h-5 mb-2 ${
                data.totals.missing_required > 0 ? "text-red-400" : "text-ink/30"
              }`}
            />
            <div
              className={`font-heading font-bold text-3xl ${
                data.totals.missing_required > 0 ? "text-red-400" : "text-ink/60"
              }`}
            >
              {data.totals.missing_required}
            </div>
            <div className="text-xs text-ink/40 font-body mt-1">
              Required missing
            </div>
          </div>
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/30 p-5">
            <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
            <div className="font-heading font-bold text-3xl text-amber-400">
              {data.totals.missing_optional}
            </div>
            <div className="text-xs text-ink/40 font-body mt-1">
              Optional missing
            </div>
          </div>
        </div>
      )}

      {/* Categorías */}
      {data && (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
          <h2 className="font-heading font-semibold text-lg text-ink mb-4">
            Por categoria
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map(([cat, counts]) => (
              <button
                key={cat}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? "all" : cat)
                }
                className={`p-3 rounded-xl border transition text-left ${
                  categoryFilter === cat
                    ? "bg-accent-gold/10 border-accent-gold/40"
                    : "bg-white/[0.02] border-white/[0.04] hover:border-ink/[0.1]"
                }`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider font-mono mb-1 ${CATEGORY_COLORS[
                    cat
                  ] || ""}`}
                  style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4 }}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </div>
                <div className="font-heading font-bold text-xl text-ink mt-1">
                  {counts.set}/{counts.total}
                </div>
                {counts.missing > 0 && (
                  <div className="text-[11px] text-amber-400 mt-0.5">
                    {counts.missing} missing
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-ink/40" />
        {(["all", "missing", "missing-required"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
              filter === f
                ? "bg-accent-gold text-ink"
                : "bg-white/[0.04] text-ink/60 hover:text-ink border border-ink/[0.08]"
            }`}
          >
            {f === "all" && "Todas"}
            {f === "missing" && "Missing"}
            {f === "missing-required" && "Required missing"}
          </button>
        ))}
        {categoryFilter !== "all" && (
          <button
            onClick={() => setCategoryFilter("all")}
            className="px-3 py-1.5 rounded-lg text-xs text-ink/60 bg-white/[0.04] border border-ink/[0.08]"
          >
            × {CATEGORY_LABELS[categoryFilter]}
          </button>
        )}
      </div>

      {/* Vars matrix */}
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02]">
            <tr className="text-left text-[10px] uppercase tracking-wider text-ink/40 font-mono">
              <th className="p-3 pl-5">Status</th>
              <th className="p-3">Variable</th>
              <th className="p-3">Category</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Descripcion</th>
              <th className="p-3 text-right pr-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVars.map((v) => (
              <tr
                key={v.name}
                className="border-t border-white/[0.03] hover:bg-white/[0.02] transition"
              >
                <td className="p-3 pl-5">
                  {v.status === "ok" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {v.status === "missing-required" && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  {v.status === "missing-optional" && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </td>
                <td className="p-3 font-mono text-ink/90">
                  <div className="flex items-center gap-2">
                    {v.public ? (
                      <Globe className="w-3 h-3 text-blue-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-ink/30" />
                    )}
                    {v.name}
                  </div>
                  {v.isSet && v.valuePreview && (
                    <div className="text-[10px] text-ink/40 mt-0.5 font-mono">
                      {v.valuePreview}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[
                      v.category
                    ] || "text-ink/60 border-white/10"}`}
                  >
                    {v.category}
                  </span>
                </td>
                <td className="p-3 text-ink/60 text-xs">{v.provider}</td>
                <td className="p-3 text-ink/70 text-xs max-w-[300px]">
                  {v.description}
                </td>
                <td className="p-3 text-right pr-5">
                  {!v.isSet && v.generate_url && (
                    <a
                      href={v.generate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-[11px] hover:bg-accent-gold/20 transition"
                    >
                      Generate <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredVars.length === 0 && (
          <div className="p-8 text-center text-ink/40 text-sm">
            Sin vars en este filtro
          </div>
        )}
      </div>

      {/* Footer help */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-xs text-ink/50 font-body">
        <p>
          <strong className="text-ink/70">Como añadir una nueva env var:</strong>{" "}
          Edita <code className="text-accent-gold font-mono">web/lib/env/registry.ts</code>,
          sube el valor via <code className="font-mono">vercel env add</code>, y corre{" "}
          <code className="font-mono">node scripts/generate-env-example.mjs</code> para
          regenerar el example. Aparece aqui en la proxima revalidacion.
        </p>
      </div>
    </div>
  );
}
