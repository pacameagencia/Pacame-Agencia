"use client";

/**
 * PACAME Studio (Sprint 28)
 *
 * Bloque interactivo: usuario escribe brief → IA genera mockup vivo.
 * Streaming SSE → ve aparecer secciones + imágenes una a una.
 * Cierra con dos CTAs:
 *   - "Comprar ahora" (self-service Stripe)
 *   - "Llamar con Pablo" (cal.com / contacto)
 *
 * Modos: full (página /studio) o embed (mini en home).
 */

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Sparkles,
  Loader2,
  Phone,
  CreditCard,
  RefreshCw,
  Wand2,
  Check,
  Clock,
} from "lucide-react";
import MagneticBox from "@/components/effects/MagneticBox";
import { EASE_APPLE, EASE_LUSION } from "@/lib/animations/easings";

interface StudioBrand {
  name: string;
  tagline: string;
  palette: { primary: string; secondary: string; accent: string };
  tone: string;
}

interface StudioSection {
  type: string;
  title: string;
  subtitle?: string;
  cta?: string;
  imagePrompt?: string;
  imageUrl?: string;
}

interface StudioEstimate {
  plan: "starter" | "growth" | "enterprise";
  setupPrice: number;
  monthlyPrice: number;
  deliveryDays: number;
  rationale: string;
}

interface StudioMockup {
  brief: string;
  brand: StudioBrand;
  sections: StudioSection[];
  estimate: StudioEstimate;
}

interface StudioProps {
  /** Modo embed (mini en home) o full (página) */
  variant?: "embed" | "full";
  /** Sugerencias clickables debajo del input */
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Web para clínica dental en Madrid",
  "Tienda online de ropa sostenible",
  "Restaurante con reservas y carta digital",
  "Landing page para curso de idiomas",
];

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

export default function Studio({
  variant = "full",
  suggestions = DEFAULT_SUGGESTIONS,
}: StudioProps) {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<
    "idle" | "thinking" | "structure" | "images" | "done" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [mockup, setMockup] = useState<StudioMockup | null>(null);
  const [imageProgress, setImageProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < 6) {
        setError("Escribe al menos 1 frase corta sobre tu negocio");
        return;
      }
      if (status === "thinking" || status === "structure" || status === "images") return;

      setError(null);
      setMockup(null);
      setImageProgress(null);
      setStatus("thinking");
      setStatusMessage("Pensando en tu negocio...");

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          if (res.status === 429) {
            setError(
              errBody.message ||
                "Has usado tus 3 generaciones del día. Vuelve mañana o agenda llamada.",
            );
          } else {
            setError(errBody.message || `Error ${res.status}`);
          }
          setStatus("error");
          return;
        }

        if (!res.body) throw new Error("No response body");

        // Parse SSE stream
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse "event: X\ndata: Y\n\n" blocks
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || ""; // keep incomplete block

          for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split("\n");
            const evtLine = lines.find((l) => l.startsWith("event:"));
            const dataLine = lines.find((l) => l.startsWith("data:"));
            if (!evtLine || !dataLine) continue;
            const evt = evtLine.slice(6).trim();
            const data = JSON.parse(dataLine.slice(5).trim());

            if (evt === "intent") {
              setStatusMessage(data.message || "Pensando...");
            } else if (evt === "structure") {
              setMockup(data as StudioMockup);
              setStatus("structure");
              setStatusMessage("Estructura lista. Generando imágenes...");
            } else if (evt === "images-start") {
              setImageProgress({ done: 0, total: data.total });
              setStatus("images");
            } else if (evt === "image") {
              setMockup((prev) => {
                if (!prev) return prev;
                const next = { ...prev, sections: [...prev.sections] };
                if (next.sections[data.sectionIndex]) {
                  next.sections[data.sectionIndex] = {
                    ...next.sections[data.sectionIndex],
                    imageUrl: data.imageUrl,
                  };
                }
                return next;
              });
              setImageProgress((prev) =>
                prev ? { ...prev, done: prev.done + 1 } : prev,
              );
            } else if (evt === "done") {
              setMockup(data as StudioMockup);
              setStatus("done");
              setStatusMessage("");
            } else if (evt === "error") {
              setError(data.message || "Error generando");
              setStatus("error");
            }
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Error inesperado");
        setStatus("error");
      }
    },
    [status],
  );

  const reset = () => {
    abortRef.current?.abort();
    setMockup(null);
    setStatus("idle");
    setStatusMessage("");
    setImageProgress(null);
    setError(null);
  };

  const isLoading = status === "thinking" || status === "structure" || status === "images";
  const showResult = mockup !== null;

  return (
    <section
      id="studio"
      className={`relative bg-tech-bg text-tech-text ${
        variant === "full" ? "py-20 md:py-32" : "py-16 md:py-24"
      }`}
    >
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Header */}
        {variant === "full" && (
          <div className="mb-12 max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tech-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tech-accent" />
              </span>
              Studio · IA en vivo · 3 gratis al día
            </span>
            <h1
              className="font-sans font-semibold tracking-tight text-tech-text"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                lineHeight: "0.98",
                letterSpacing: "-0.04em",
              }}
            >
              <span className="block">Tu web, ahora.</span>
              <span
                className="block font-light"
                style={{
                  background:
                    "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                No en 6 meses.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-tech-text-soft md:text-[18px]">
              Cuéntame qué tipo de web quieres para tu negocio. En 30 segundos
              te enseño un mockup real generado con las mismas IAs que usaríamos
              para construirla. Si te gusta, en menos de 48&nbsp;h la tienes
              entregada.
            </p>
          </div>
        )}

        {/* Prompt input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(prompt);
          }}
          className="relative"
        >
          <div className="relative rounded-2xl border border-tech-border bg-tech-surface/80 backdrop-blur-md transition-all duration-300 focus-within:border-tech-accent/60 focus-within:shadow-tech-glow">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(prompt);
                }
              }}
              placeholder="Ej: Web para mi clínica dental en Madrid, con sistema de reservas y blog"
              rows={variant === "embed" ? 2 : 3}
              maxLength={500}
              disabled={isLoading}
              aria-label="Describe tu negocio para generar un mockup web"
              className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-[16px] text-tech-text placeholder:text-tech-text-mute focus:outline-none disabled:opacity-50"
            />

            <div className="flex items-center justify-between gap-3 border-t border-tech-border-soft px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                {prompt.length}/500
              </span>
              <MagneticBox strength={0.12}>
                <button
                  type="submit"
                  disabled={isLoading || prompt.trim().length < 6}
                  data-cursor="hover"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-tech-accent px-5 py-2.5 text-[14px] font-semibold text-tech-bg transition-all duration-300 hover:bg-tech-accent-soft hover:shadow-tech-glow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-tech-accent-glow disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" strokeWidth={2.2} />
                      Generar mi web
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                    </>
                  )}
                </button>
              </MagneticBox>
            </div>
          </div>

          {/* Suggestions chips */}
          {!isLoading && !showResult && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPrompt(s);
                    submit(s);
                  }}
                  data-cursor="hover"
                  className="rounded-full border border-tech-border bg-tech-bg px-3 py-1.5 text-[12px] text-tech-text-soft transition-all hover:border-tech-accent hover:text-tech-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Status / progress */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-tech-border bg-tech-surface/60 px-4 py-2 backdrop-blur-md"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-tech-accent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-tech-text-soft">
                {statusMessage}
                {imageProgress && ` · ${imageProgress.done}/${imageProgress.total} imágenes`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-xl border border-tech-danger/40 bg-tech-danger/10 px-4 py-3 text-[14px] text-tech-danger"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result mockup */}
        <AnimatePresence>
          {showResult && mockup && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE_APPLE }}
              className="mt-12 overflow-hidden rounded-3xl border border-tech-border bg-tech-elevated"
            >
              {/* Brand header */}
              <div className="flex items-center justify-between gap-4 border-b border-tech-border bg-tech-surface px-6 py-4">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                    Mockup generado
                  </div>
                  <div
                    className="mt-1 truncate font-sans text-[20px] font-semibold tracking-tight text-tech-text md:text-[24px]"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {mockup.brand.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Color palette dots */}
                  <span className="h-5 w-5 rounded-full ring-1 ring-tech-border" style={{ background: mockup.brand.palette.primary }} />
                  <span className="h-5 w-5 rounded-full ring-1 ring-tech-border" style={{ background: mockup.brand.palette.secondary }} />
                  <span className="h-5 w-5 rounded-full ring-1 ring-tech-border" style={{ background: mockup.brand.palette.accent }} />
                </div>
              </div>

              {/* Tagline */}
              <div className="border-b border-tech-border-soft px-6 py-5">
                <p
                  className="font-display italic text-[18px] text-tech-text-soft md:text-[22px]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  &ldquo;{mockup.brand.tagline}&rdquo;
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                  Tono · {mockup.brand.tone}
                </p>
              </div>

              {/* Sections preview */}
              <ul className="divide-y divide-tech-border-soft">
                {mockup.sections.map((section, idx) => (
                  <SectionPreview key={`${section.type}-${idx}`} section={section} index={idx} />
                ))}
              </ul>

              {/* Estimate + CTAs */}
              <div className="grid grid-cols-1 gap-6 border-t border-tech-border bg-tech-surface p-6 md:grid-cols-[1fr_auto] md:p-8">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                    Plan recomendado · Plan {PLAN_LABELS[mockup.estimate.plan] || mockup.estimate.plan}
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className="font-sans text-4xl font-semibold tabular-nums tracking-tight text-tech-text md:text-5xl"
                      style={{ letterSpacing: "-0.03em" }}
                    >
                      {mockup.estimate.setupPrice.toLocaleString("es-ES")}&nbsp;€
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-tech-text-mute">
                      setup
                    </span>
                    <span className="text-tech-text-mute">·</span>
                    <span className="font-sans text-2xl font-medium tabular-nums text-tech-text-soft">
                      +{mockup.estimate.monthlyPrice.toLocaleString("es-ES")} €/mes
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-tech-success/30 bg-tech-success/5 px-3 py-1">
                    <Clock className="h-3 w-3 text-tech-success" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-success">
                      Entrega en {mockup.estimate.deliveryDays} días
                    </span>
                  </div>
                  <p className="mt-4 max-w-md text-[13px] leading-relaxed text-tech-text-soft">
                    {mockup.estimate.rationale}
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 md:items-end">
                  <MagneticBox strength={0.15}>
                    <Link
                      href={`/contacto?source=studio&plan=${mockup.estimate.plan}&brief=${encodeURIComponent(mockup.brief)}`}
                      data-cursor="hover"
                      className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-tech-accent px-6 py-3 text-[14px] font-semibold text-tech-bg transition-all duration-300 hover:bg-tech-accent-soft hover:shadow-tech-glow active:scale-[0.98]"
                    >
                      <CreditCard className="h-4 w-4" strokeWidth={2.2} />
                      Comprar ahora
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                    </Link>
                  </MagneticBox>
                  <Link
                    href="/contacto?source=studio&type=call"
                    data-cursor="hover"
                    className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-tech-border bg-tech-bg px-6 py-3 text-[14px] font-medium text-tech-text transition-all duration-300 hover:border-tech-accent hover:text-tech-accent"
                  >
                    <Phone className="h-4 w-4" strokeWidth={1.8} />
                    Hablar con Pablo · 30 min
                  </Link>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[12px] text-tech-text-mute transition-colors hover:text-tech-text-soft"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Probar otro
                  </button>
                </div>
              </div>

              {/* Footer disclaimer */}
              <div className="border-t border-tech-border-soft bg-tech-bg/50 px-6 py-3">
                <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                  Mockup generado en vivo con Claude + Flux Schnell · Aproximación, no diseño final
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cost trust line */}
        {!showResult && !isLoading && variant === "full" && (
          <div className="mt-8 flex flex-wrap items-center justify-start gap-3 text-tech-text-mute">
            <div className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-tech-accent" strokeWidth={2.2} />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Claude</span>
            </div>
            <span>+</span>
            <div className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-tech-accent-2" strokeWidth={2.2} />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Flux Schnell</span>
            </div>
            <span>·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">3 gratis al día por IP</span>
          </div>
        )}
      </div>
    </section>
  );
}

function SectionPreview({ section, index }: { section: StudioSection; index: number }) {
  const hasImage = !!section.imageUrl;

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: EASE_LUSION }}
      className="group flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center"
    >
      {/* Section index */}
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute md:w-12">
        0{index + 1}
      </div>

      {/* Image preview */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-tech-border-soft bg-tech-bg md:aspect-square md:h-24 md:w-24 md:flex-shrink-0">
        {hasImage ? (
          <Image
            src={section.imageUrl!}
            alt={section.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 96px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-tech-text-mute" />
          </div>
        )}
      </div>

      {/* Copy */}
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
          {section.type}
        </div>
        <div
          className="mt-1 font-sans text-[18px] font-semibold leading-tight tracking-tight text-tech-text md:text-[20px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {section.title}
        </div>
        {section.subtitle && (
          <div className="mt-1 line-clamp-2 text-[13px] text-tech-text-soft">
            {section.subtitle}
          </div>
        )}
      </div>

      {section.cta && (
        <div className="hidden md:block">
          <span className="inline-flex items-center gap-1 rounded-full border border-tech-border-soft bg-tech-bg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-soft">
            <Check className="h-3 w-3 text-tech-accent" />
            {section.cta}
          </span>
        </div>
      )}
    </motion.li>
  );
}
