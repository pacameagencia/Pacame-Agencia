"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Loader2, Copy, Check, AlertCircle, Sparkles, Lock, ChevronDown, ChevronUp, Tag, Eye } from "lucide-react";
import { TARGETS_BY_MODALITY, type Modality, type Target } from "@/lib/products/promptforge/enhancer";

interface Variant {
  title: string;
  prompt: string;
  why_it_works: string;
  technique_tags: string[];
}

interface Analysis {
  strengths_original: string[];
  gaps_detected: string[];
  suggestions: string[];
  detected_language: string;
  detected_intent: string;
}

interface EnhanceResponse {
  ok: boolean;
  id?: string;
  variants?: Variant[];
  analysis?: Analysis;
  meta?: { provider: string; model: string; tokens: number; tier: string };
  error?: string;
  message?: string;
  upgrade_to?: string;
  used?: number;
  limit?: number;
}

const MODALITIES: { id: Modality; label: string; helper: string }[] = [
  { id: "text", label: "Texto", helper: "Para Claude, GPT, Gemini, etc." },
  { id: "image", label: "Imagen", helper: "Midjourney, DALL·E, Flux, SDXL..." },
  { id: "video", label: "Vídeo", helper: "Sora, Veo, Runway, Kling..." },
  { id: "audio", label: "Audio", helper: "Suno (música), ElevenLabs (voz)" },
];

const USE_CASES: { id: string; label: string }[] = [
  { id: "marketing", label: "Marketing" },
  { id: "ads", label: "Ads / Performance" },
  { id: "branding", label: "Branding" },
  { id: "code", label: "Código / Técnico" },
  { id: "narrative", label: "Narrativa / Storytelling" },
  { id: "photo", label: "Foto / Producto" },
  { id: "education", label: "Educación" },
  { id: "research", label: "Research / Análisis" },
];

interface Props {
  tierKey: string;
  videoEnabled: boolean;
  maxVariants: number;
}

export default function ForgeClient({ tierKey, videoEnabled, maxVariants }: Props) {
  const [modality, setModality] = useState<Modality>("text");
  const [target, setTarget] = useState<Target>("claude");
  const [useCase, setUseCase] = useState<string>("marketing");
  const [rawInput, setRawInput] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [variantsCount, setVariantsCount] = useState(Math.min(3, maxVariants));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const availableTargets = TARGETS_BY_MODALITY[modality];
  const isVideoLocked = !videoEnabled && modality === "video";

  function changeModality(m: Modality) {
    setModality(m);
    const first = TARGETS_BY_MODALITY[m][0];
    setTarget(first.id);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !rawInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/products/promptforge/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_input: rawInput.trim(),
          modality,
          target,
          use_case: useCase,
          variants_count: variantsCount,
          context_notes: contextNotes.trim() || undefined,
        }),
      });
      const json: EnhanceResponse = await res.json();
      if (!res.ok) {
        setError(json.message ?? json.error ?? "Algo falló");
        setResult(json);
        return;
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyVariant(idx: number) {
    if (!result?.variants?.[idx]) return;
    await navigator.clipboard.writeText(result.variants[idx].prompt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const heroSub = useMemo(() => {
    const examples = [
      "foto producto bote aceite premium en mesa de madera",
      "carrusel sobre cómo escribir hooks que paren scroll",
      "spot 30s lanzando una academia de fotografía móvil",
      "refactor este código para que cumpla SOLID",
      "voz cálida narrando el manifiesto de mi marca",
    ];
    return examples[Math.floor(Math.random() * examples.length)];
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          PromptForge · Forge
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          Tu idea cruda <span style={{ color: "#283B70" }}>→</span> {variantsCount} variantes pro.
        </h1>
        <p className="font-sans text-ink-soft text-[15px] mt-2">
          Plan {tierKey} · {maxVariants} variantes máx · {videoEnabled ? "video activo" : "video bloqueado (upgrade Pro)"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="bg-paper border-2 border-ink p-6 space-y-5" style={{ boxShadow: "5px 5px 0 #283B70" }}>
        {/* Modality selector */}
        <div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Modalidad</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MODALITIES.map((m) => {
              const isActive = m.id === modality;
              const locked = m.id === "video" && !videoEnabled;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => !locked && changeModality(m.id)}
                  disabled={locked}
                  className={`p-3 border-2 text-left transition-all ${
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : locked
                      ? "border-ink/15 opacity-50 cursor-not-allowed"
                      : "border-ink/20 hover:border-ink"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-medium text-base">{m.label}</span>
                    {locked && <Lock className="w-3 h-3" />}
                  </div>
                  <span className={`font-mono text-[10px] tracking-[0.05em] block ${isActive ? "text-paper/70" : "text-ink-mute"}`}>
                    {m.helper}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target selector */}
        <div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Modelo destino</span>
          <div className="flex flex-wrap gap-2">
            {availableTargets.map((t) => {
              const isActive = target === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTarget(t.id)}
                  className={`px-3 py-1.5 border text-[13px] font-mono transition-colors ${
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/30 text-ink hover:border-ink"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Raw input */}
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
            Tu idea en bruto
          </span>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Ej: ${heroSub}`}
            rows={4}
            maxLength={4000}
            required
            className="w-full px-4 py-3 bg-paper border-2 border-ink text-ink text-[15px] focus:outline-none focus:bg-sand-50 resize-none placeholder:text-ink-mute/50"
          />
          <span className="block text-right font-mono text-[10px] text-ink-mute mt-1">
            {rawInput.length} / 4000
          </span>
        </label>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute hover:text-ink"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Opciones avanzadas
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden"
            >
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Use case</span>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[13px] focus:outline-none focus:border-ink"
                >
                  {USE_CASES.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Variantes</span>
                <select
                  value={variantsCount}
                  onChange={(e) => setVariantsCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[13px] focus:outline-none focus:border-ink"
                >
                  {Array.from({ length: maxVariants - 1 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>{n} variantes</option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-3">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
                  Contexto adicional (opcional)
                </span>
                <textarea
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="Audiencia, tono, restricciones, referencias..."
                  rows={2}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[13px] focus:outline-none focus:border-ink resize-none"
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              {result?.upgrade_to && (
                <a
                  href={`/app/promptforge/plan?upgrade=${result.upgrade_to}`}
                  className="underline mt-1 inline-block"
                >
                  Subir a plan {result.upgrade_to} →
                </a>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !rawInput.trim() || isVideoLocked}
          className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 bg-ink text-paper font-sans font-medium text-[15px] tracking-wide transition-all disabled:opacity-50 hover:bg-terracotta-500"
          style={{ boxShadow: "5px 5px 0 #B54E30" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Forjando {variantsCount} variantes...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Mejorar prompt
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {result?.ok && result.variants && result.variants.length > 0 && (
        <div className="space-y-4">
          {/* Analysis */}
          {result.analysis && (
            <section className="bg-sand-100 border-2 border-ink/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-ink-mute" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                  Análisis · {result.analysis.detected_language} · "{result.analysis.detected_intent}"
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.analysis.strengths_original.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-olive-600 block mb-2">✓ Fuerzas</span>
                    <ul className="space-y-1 text-[12px] font-sans text-ink-soft">
                      {result.analysis.strengths_original.map((s, i) => <li key={i}>· {s}</li>)}
                    </ul>
                  </div>
                )}
                {result.analysis.gaps_detected.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rose-alert block mb-2">⚠ Faltaba</span>
                    <ul className="space-y-1 text-[12px] font-sans text-ink-soft">
                      {result.analysis.gaps_detected.map((s, i) => <li key={i}>· {s}</li>)}
                    </ul>
                  </div>
                )}
                {result.analysis.suggestions.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-mustard-700 block mb-2">→ Para iterar</span>
                    <ul className="space-y-1 text-[12px] font-sans text-ink-soft">
                      {result.analysis.suggestions.map((s, i) => <li key={i}>· {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Variants */}
          {result.variants.map((v, idx) => (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-paper border-2 border-ink"
              style={{ boxShadow: "5px 5px 0 #1A1813" }}
            >
              <header className="px-5 py-4 border-b-2 border-ink bg-ink text-paper flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/60 block">
                    Variante {String.fromCharCode(65 + idx)}
                  </span>
                  <h3 className="font-display text-paper text-lg mt-1" style={{ fontWeight: 500 }}>
                    {v.title.replace(/^Variante [A-Z][· ]?\s*/, "")}
                  </h3>
                </div>
                <button
                  onClick={() => copyVariant(idx)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-mustard-500 text-ink text-[12px] font-mono uppercase tracking-[0.1em] hover:bg-mustard-400 transition-colors"
                >
                  {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedIdx === idx ? "copiado" : "copiar"}
                </button>
              </header>

              <div className="p-5 space-y-3">
                <pre className="bg-sand-100 border border-ink/15 p-4 text-[13px] font-mono text-ink whitespace-pre-wrap break-words leading-relaxed">
                  {v.prompt}
                </pre>

                {v.why_it_works && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-mustard-700 flex-shrink-0 mt-0.5" />
                    <p className="font-sans text-[13px] text-ink-soft leading-snug">
                      <span className="font-medium text-ink">Por qué funciona:</span> {v.why_it_works}
                    </p>
                  </div>
                )}

                {v.technique_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {v.technique_tags.map((tag, ti) => (
                      <span
                        key={ti}
                        className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] px-2 py-0.5 bg-indigo-600/10 text-indigo-600"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          ))}

          {result.meta && (
            <p className="text-center font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute pt-2">
              Generado vía {result.meta.provider} · {result.meta.model} · {result.meta.tokens} tokens
            </p>
          )}
        </div>
      )}
    </div>
  );
}
