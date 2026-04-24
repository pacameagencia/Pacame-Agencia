"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Target, AlertTriangle, Check, TrendingUp, TrendingDown } from "lucide-react";

interface SiteAnalysis {
  url: string;
  title: string | null;
  meta_description: string | null;
  h1_count: number;
  has_cta: boolean;
  has_og_image: boolean;
  has_favicon: boolean;
  has_ssl: boolean;
  word_count: number;
  links_count: number;
  images_count: number;
  images_with_alt: number;
  response_time_ms: number;
  score: number;
  issues: string[];
}

interface ComparisonResult {
  you: SiteAnalysis | null;
  competitor: SiteAnalysis | null;
  winner: "you" | "competitor" | "tie";
}

export default function CompetitorClient() {
  const [youUrl, setYouUrl] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!youUrl.trim() || !compUrl.trim()) {
      setError("Rellena ambas URLs");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/competitor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ you: youUrl.trim(), competitor: compUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-3xl bg-ink/[0.03] border border-ink/[0.08] space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-2">
              TU WEB
            </label>
            <input
              type="url"
              value={youUrl}
              onChange={(e) => setYouUrl(e.target.value)}
              placeholder="https://miweb.com"
              className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-body text-[15px] outline-none focus:border-accent-gold/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-accent-burgundy mb-2">
              COMPETIDOR
            </label>
            <input
              type="url"
              value={compUrl}
              onChange={(e) => setCompUrl(e.target.value)}
              placeholder="https://competencia.com"
              className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-body text-[15px] outline-none focus:border-accent-burgundy/40"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !youUrl.trim() || !compUrl.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analizando ambas webs...
            </>
          ) : (
            <>
              <Target className="w-4 h-4" /> Comparar webs
            </>
          )}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-accent-burgundy/10 border border-accent-burgundy/30 text-accent-burgundy text-[13px]" role="alert">
            {error}
          </div>
        )}
      </div>

      {result?.you && result?.competitor && (
        <>
          {/* Winner banner */}
          <div
            className={`p-6 rounded-3xl border-2 text-center ${
              result.winner === "you"
                ? "border-mint/40 bg-mint/10"
                : result.winner === "competitor"
                ? "border-accent-burgundy/40 bg-accent-burgundy/10"
                : "border-ink/10 bg-ink/[0.03]"
            }`}
          >
            {result.winner === "you" ? (
              <>
                <TrendingUp className="w-6 h-6 text-mint mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-ink mb-1">
                  Ganas tu ({result.you.score} vs {result.competitor.score})
                </div>
                <p className="text-[13px] text-ink/60 font-body">
                  Mantén la ventaja. Asegurate de no dormirte.
                </p>
              </>
            ) : result.winner === "competitor" ? (
              <>
                <TrendingDown className="w-6 h-6 text-accent-burgundy mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-ink mb-1">
                  Ganan ellos ({result.competitor.score} vs {result.you.score})
                </div>
                <p className="text-[13px] text-ink/60 font-body">
                  Tenemos oportunidad clara. Revisa los issues abajo.
                </p>
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-ink/60 mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-ink mb-1">
                  Empate tecnico ({result.you.score} = {result.competitor.score})
                </div>
                <p className="text-[13px] text-ink/60 font-body">
                  Cualquiera puede ganar. Ejecucion + CRO deciden.
                </p>
              </>
            )}
          </div>

          {/* Side-by-side comparison */}
          <div className="grid md:grid-cols-2 gap-5">
            <SiteCard site={result.you} label="TU WEB" accent="#F1E194" />
            <SiteCard
              site={result.competitor}
              label="COMPETIDOR"
              accent="#5B0E14"
            />
          </div>

          <p className="text-[11px] text-ink/40 font-mono flex items-start gap-2 max-w-3xl">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Analisis basado en HTML publico + tiempos de respuesta. No incluye Core
            Web Vitals profundos ni ranking SEO real (requiere herramientas pro).
            Para auditoria completa, usa{" "}
            <Link href="/auditoria" className="underline text-ink/70 hover:text-accent-gold">
              /auditoria
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

function SiteCard({
  site,
  label,
  accent,
}: {
  site: SiteAnalysis;
  label: string;
  accent: string;
}) {
  return (
    <div
      className="p-6 rounded-3xl bg-paper border"
      style={{ borderColor: `${accent}40`, background: `linear-gradient(135deg, ${accent}08 0%, transparent 50%)` }}
    >
      <div className="flex items-baseline justify-between pb-3 border-b border-ink/10 mb-4">
        <div
          className="text-[10px] font-mono uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          {label}
        </div>
        <div className="font-heading font-bold text-3xl text-ink tabular-nums">
          {site.score}
          <span className="text-[14px] text-ink/40">/100</span>
        </div>
      </div>
      <div className="text-[13px] text-ink/60 font-mono truncate mb-4">{site.url}</div>

      <dl className="space-y-2 text-[13px] font-body mb-4">
        <Row label="Titulo">{site.title?.slice(0, 50) || "—"}</Row>
        <Row label="Meta descripcion">
          {site.meta_description ? `${site.meta_description.slice(0, 60)}...` : "Falta"}
        </Row>
        <Row label="H1 tags">{site.h1_count}</Row>
        <Row label="Palabras">{site.word_count.toLocaleString("es-ES")}</Row>
        <Row label="Imagenes con alt">
          {site.images_with_alt}/{site.images_count}
        </Row>
        <Row label="CTAs visibles">{site.has_cta ? <Check className="w-3.5 h-3.5 inline text-mint" /> : "No detectado"}</Row>
        <Row label="OG image">{site.has_og_image ? <Check className="w-3.5 h-3.5 inline text-mint" /> : "Falta"}</Row>
        <Row label="SSL">{site.has_ssl ? <Check className="w-3.5 h-3.5 inline text-mint" /> : "Sin HTTPS"}</Row>
        <Row label="Response time">
          <span className={site.response_time_ms < 1000 ? "text-mint" : site.response_time_ms < 3000 ? "text-accent-gold" : "text-accent-burgundy"}>
            {site.response_time_ms}ms
          </span>
        </Row>
      </dl>

      {site.issues.length > 0 && (
        <div className="pt-4 border-t border-ink/10">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent-burgundy mb-2">
            ISSUES
          </div>
          <ul className="space-y-1.5">
            {site.issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-ink/70">
                <span className="w-1 h-1 rounded-full bg-accent-burgundy mt-1.5 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-ink text-right font-medium truncate max-w-[60%]">{children}</dd>
    </div>
  );
}
