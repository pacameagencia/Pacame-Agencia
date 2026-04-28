"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, RefreshCw, AlertCircle, Check } from "lucide-react";

interface BrandBrief {
  schema_version: 1;
  url: string;
  url_normalized: string;
  business_name: string;
  sector_guess: "hosteleria" | "retail" | "servicios" | "salud" | "educacion" | "otros";
  primary_color: string | null;
  accent_color: string | null;
  fonts: string[];
  logo_url: string | null;
  copy_samples: { headlines: string[]; body: string[]; ctas: string[] };
  contact: { phone?: string; email?: string; address?: string };
  confidence: number;
  fetched_at: string;
}

interface IntakeResponse {
  ok: boolean;
  brief_id: string | null;
  brief: BrandBrief;
  cached: boolean;
  ttl_remaining_hours: number;
  cache_error?: string;
  error?: string;
}

const PROGRESS_PHRASES = [
  "Scrapeando tu web…",
  "Detectando colores dominantes…",
  "Extrayendo tipografía…",
  "Buscando tu logo…",
  "Clasificando sector…",
  "Muestreando copy…",
  "Casi…",
];

const SECTOR_LABELS: Record<BrandBrief["sector_guess"], string> = {
  hosteleria: "Hostelería",
  retail: "Retail / E-commerce",
  servicios: "Servicios profesionales",
  salud: "Salud",
  educacion: "Educación",
  otros: "Otros",
};

export default function IntakeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResponse | null>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setProgressIdx((i) => (i + 1) % PROGRESS_PHRASES.length), 2200);
    return () => clearInterval(t);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    setProgressIdx(0);

    try {
      const r = await fetch("/api/factoria/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json: IntakeResponse = await r.json();
      if (!r.ok || !json.ok) {
        setError(json.error || `Error ${r.status}`);
      } else {
        setResult(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setError(null);
    setLoading(true);
    setProgressIdx(0);
    try {
      const r = await fetch("/api/factoria/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, force_refresh: true, refine_with_llm: true }),
      });
      const json: IntakeResponse = await r.json();
      if (!r.ok || !json.ok) setError(json.error || `Error ${r.status}`);
      else setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleLaunch() {
    if (!result?.brief_id) return;
    router.push(`/factoria?brief=${result.brief_id}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tu-web.com"
          className="flex-1 px-6 py-5 text-lg md:text-xl font-mono bg-paper border-2 border-ink text-ink placeholder:text-ink-mute focus:outline-none focus:border-terracotta-500 transition-colors"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="px-8 py-5 bg-ink text-paper font-mono text-sm uppercase tracking-[0.2em] hover:bg-terracotta-500 transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          Analizar
        </button>
      </form>

      {loading && (
        <div className="mt-6 flex items-center gap-3 text-ink-mute font-mono text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{PROGRESS_PHRASES[progressIdx]}</span>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 border-2 border-terracotta-500 bg-terracotta-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-sm text-terracotta-500 uppercase tracking-wider">Error</p>
            <p className="text-sm text-ink mt-1">{error}</p>
          </div>
        </div>
      )}

      {result?.brief && <BriefPreview brief={result.brief} cached={result.cached} ttlHours={result.ttl_remaining_hours} onRefresh={handleRefresh} onLaunch={handleLaunch} canLaunch={!!result.brief_id} />}
    </div>
  );
}

function BriefPreview({
  brief,
  cached,
  ttlHours,
  onRefresh,
  onLaunch,
  canLaunch,
}: {
  brief: BrandBrief;
  cached: boolean;
  ttlHours: number;
  onRefresh: () => void;
  onLaunch: () => void;
  canLaunch: boolean;
}) {
  const lowConfidence = brief.confidence < 0.6;
  return (
    <div className="mt-8 border-2 border-ink p-6 md:p-10 bg-paper">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-mute/30">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-2 w-2`}>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${lowConfidence ? "bg-terracotta-500" : "bg-ink"}`} />
          </span>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">
            Brief · {Math.round(brief.confidence * 100)}% confianza
          </span>
        </div>
        <div className="flex items-center gap-3">
          {cached && (
            <span className="font-mono text-[10px] tracking-wider uppercase text-ink-mute">
              cache · {ttlHours}h
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="font-mono text-[11px] tracking-wider uppercase text-ink-mute hover:text-ink flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Re-scrapear
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[auto,1fr] gap-8 mb-8">
        {brief.logo_url && (
          <div className="w-32 h-32 border border-ink-mute/30 bg-paper flex items-center justify-center p-3 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brief.logo_url} alt={`Logo ${brief.business_name}`} className="max-w-full max-h-full object-contain" />
          </div>
        )}
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-ink mb-2">{brief.business_name}</h2>
          <p className="font-mono text-xs tracking-wider uppercase text-ink-mute mb-4">
            {SECTOR_LABELS[brief.sector_guess]}
          </p>

          <div className="flex flex-wrap gap-3">
            {brief.primary_color && (
              <ColorSwatch hex={brief.primary_color} label="Primario" />
            )}
            {brief.accent_color && (
              <ColorSwatch hex={brief.accent_color} label="Acento" />
            )}
            {brief.fonts.length > 0 && (
              <div className="px-4 py-2 border border-ink-mute/30 font-mono text-xs">
                <span className="text-ink-mute">Fonts:</span>{" "}
                <span className="text-ink">{brief.fonts.slice(0, 2).join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {brief.copy_samples.headlines.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute mb-3">
            Titulares detectados
          </p>
          <ul className="space-y-2">
            {brief.copy_samples.headlines.slice(0, 3).map((h, i) => (
              <li key={i} className="text-ink border-l-2 border-terracotta-500 pl-3">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.copy_samples.ctas.length > 0 && (
        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute mb-3">
            CTAs detectados
          </p>
          <div className="flex flex-wrap gap-2">
            {brief.copy_samples.ctas.slice(0, 4).map((c, i) => (
              <span key={i} className="px-3 py-1 border border-ink/40 font-mono text-xs text-ink">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {lowConfidence && (
        <div className="mb-6 p-4 border-2 border-terracotta-500/40 bg-terracotta-500/5">
          <p className="font-mono text-xs uppercase tracking-wider text-terracotta-500 mb-1">
            Confianza baja
          </p>
          <p className="text-sm text-ink">
            Hemos extraído lo que hemos podido pero algunas señales están débiles. Pulsa
            <span className="font-mono"> Re-scrapear</span> con refine_with_llm para usar
            IA, o revisa estos datos antes de lanzar la factoría.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onLaunch}
        disabled={!canLaunch}
        className="w-full md:w-auto px-10 py-5 bg-terracotta-500 text-paper font-mono text-sm uppercase tracking-[0.2em] hover:bg-ink transition-colors disabled:opacity-50 flex items-center gap-3 justify-center"
      >
        <Check className="w-5 h-5" />
        Lanzar mi factoría con esta info
      </button>
      {!canLaunch && (
        <p className="mt-2 text-xs text-ink-mute font-mono">
          (cache no disponible — la migración SQL puede no estar aplicada todavía)
        </p>
      )}
    </div>
  );
}

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-ink-mute/30">
      <div className="w-6 h-6 border border-ink-mute/40" style={{ backgroundColor: hex }} />
      <div className="font-mono text-xs">
        <div className="text-ink-mute uppercase tracking-wider text-[10px]">{label}</div>
        <div className="text-ink">{hex}</div>
      </div>
    </div>
  );
}
