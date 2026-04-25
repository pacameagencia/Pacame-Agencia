"use client";

import { useEffect, useState } from "react";
import { Package, Sparkles, CheckCircle2, Clock, Tag, Users, RefreshCw, Play } from "lucide-react";

interface PackagedProduct {
  name: string;
  tier: "starter" | "stack" | "ready";
  price_from: number;
  price_to: number;
  monthly_subscription: number | null;
  agents: string[];
  skills_count: number;
  deliverables: string[];
  timeline_days: { min: number; max: number };
  target_sector: string;
  hook_copy: string;
  pricing_rationale: string;
}

interface PackagedItem {
  discovery_id: string;
  discovery_title: string;
  discovery_type: string;
  discovery_agent: string | null;
  impact: string | null;
  confidence: number | null;
  created_at: string;
  packaged_at: string;
  product: PackagedProduct | null;
  provider: string | null;
}

interface ProductsResponse {
  count: number;
  products: PackagedItem[];
  timestamp: string;
}

const TIER_STYLE: Record<string, { color: string; label: string }> = {
  starter: { color: "#B54E30", label: "Starter" },
  stack: { color: "#E8B730", label: "Stack" },
  ready: { color: "#283B70", label: "Ready" },
};

export default function FactoriaProductosPage() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/neural/factoria-products");
    setData(await res.json());
    setLoading(false);
  }

  async function runPipeline() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/neural/factoria-package");
      const json = await res.json();
      setRunResult(`Run completado · ${json.packaged ?? 0} empaquetados · ${json.failed ?? 0} fallos`);
      await load();
    } catch (err) {
      setRunResult("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-pacame-white/40 font-body">Cargando productos empaquetados…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-electric-violet" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-pacame-white/50">
              Pipeline auto-empaquetado · SAGE
            </span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-pacame-white mb-2">
            Productos candidatos
          </h1>
          <p className="text-pacame-white/50 font-body text-sm max-w-2xl">
            Discoveries empaquetados como productos por SAGE vía cron diario 4 am UTC. Revisa cada candidato y aprueba para añadirlo al catálogo público.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runPipeline}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-electric-violet text-white font-body text-sm font-medium hover:bg-electric-violet/90 transition-colors disabled:opacity-50 rounded-sm"
          >
            <Play className={`w-4 h-4 ${running ? "animate-pulse" : ""}`} />
            {running ? "Empaquetando…" : "Ejecutar ahora"}
          </button>
          <button
            onClick={load}
            className="p-2.5 border border-white/10 hover:border-electric-violet/40 transition-colors"
            aria-label="Refrescar lista"
          >
            <RefreshCw className="w-4 h-4 text-pacame-white/60" />
          </button>
        </div>
      </div>

      {runResult && (
        <div className="px-4 py-3 border border-lime-pulse/30 bg-lime-pulse/5 text-lime-pulse font-mono text-sm">
          {runResult}
        </div>
      )}

      {data.products.length === 0 ? (
        <div className="bg-dark-card border border-white/[0.06] p-12 text-center">
          <Sparkles className="w-12 h-12 text-pacame-white/20 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-pacame-white mb-2">
            Aún no hay productos empaquetados
          </h2>
          <p className="text-pacame-white/50 text-sm max-w-md mx-auto">
            El cron de empaquetado se ejecuta cada día a las 4 am UTC. Pulsa "Ejecutar ahora" para correrlo manualmente y empaquetar los discoveries actuales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.products.map((item) => (
            <ProductCard key={item.discovery_id} item={item} />
          ))}
        </div>
      )}

      <div className="text-[11px] font-mono text-pacame-white/40 pt-4 border-t border-white/[0.06]">
        {data.count} producto{data.count === 1 ? "" : "s"} · Actualizado{" "}
        {new Date(data.timestamp).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
      </div>
    </div>
  );
}

function ProductCard({ item }: { item: PackagedItem }) {
  const product = item.product;
  if (!product) {
    return (
      <div className="bg-dark-card border border-rose-alert/30 p-6">
        <span className="text-rose-alert text-sm font-mono">JSON inválido en metadata</span>
        <p className="text-pacame-white/60 text-sm mt-2">{item.discovery_title}</p>
      </div>
    );
  }

  const tierStyle = TIER_STYLE[product.tier];

  return (
    <article className="bg-dark-card border border-white/[0.06] hover:border-electric-violet/30 transition-colors flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className="font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-1"
            style={{
              backgroundColor: tierStyle.color + "20",
              color: tierStyle.color,
            }}
          >
            {tierStyle.label}
          </span>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-pacame-white/40">
            {product.target_sector}
          </span>
        </div>

        <h3 className="font-heading font-bold text-xl text-pacame-white mb-2 leading-tight">
          {product.name}
        </h3>

        <p className="font-body text-pacame-white/70 text-sm italic">
          "{product.hook_copy}"
        </p>
      </div>

      {/* Pricing */}
      <div className="p-5 border-b border-white/[0.06] grid grid-cols-3 gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/40 block mb-1">
            Rango
          </span>
          <span className="font-heading font-bold text-pacame-white tabular-nums">
            {product.price_from.toLocaleString("es-ES")}–{product.price_to.toLocaleString("es-ES")}
            <span className="text-electric-violet"> €</span>
          </span>
        </div>
        <div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/40 block mb-1">
            Mensualidad
          </span>
          <span className="font-heading font-bold text-pacame-white tabular-nums">
            {product.monthly_subscription
              ? `${product.monthly_subscription} €/mes`
              : "—"}
          </span>
        </div>
        <div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/40 block mb-1">
            Entrega
          </span>
          <span className="font-heading font-bold text-pacame-white tabular-nums">
            {product.timeline_days.min}–{product.timeline_days.max} d
          </span>
        </div>
      </div>

      {/* Agentes + Skills */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Agentes
          </span>
          <span className="font-mono text-[10px] text-pacame-white/40">
            {product.skills_count} skills
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {product.agents.map((a) => (
            <span
              key={a}
              className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border border-white/15 text-pacame-white/80"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Deliverables */}
      <div className="p-5 flex-1">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/50 flex items-center gap-1.5 mb-3">
          <CheckCircle2 className="w-3 h-3" /> Deliverables
        </span>
        <ul className="space-y-2">
          {product.deliverables.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-body text-pacame-white/80 leading-snug">
              <span className="text-electric-violet mt-1 flex-shrink-0">·</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer rationale */}
      <div className="p-5 border-t border-white/[0.06] bg-white/[0.01]">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pacame-white/40 flex items-center gap-1.5 mb-2">
          <Tag className="w-3 h-3" /> Pricing rationale
        </span>
        <p className="text-[12px] text-pacame-white/55 leading-relaxed">
          {product.pricing_rationale}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04] text-[10px] font-mono text-pacame-white/30">
          <span className="flex items-center gap-1.5">
            <Clock className="w-2.5 h-2.5" />
            Empaquetado {new Date(item.packaged_at).toLocaleDateString("es-ES")}
          </span>
          <span>via {item.provider ?? "—"} · {item.discovery_agent?.toUpperCase() ?? "—"}</span>
        </div>
      </div>
    </article>
  );
}
