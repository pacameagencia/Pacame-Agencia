"use client";

/**
 * BriefBanner.tsx — Banner que aparece al principio de /factoria cuando el URL
 * trae ?brief=<uuid>. Lee el BrandBrief de /api/factoria/intake/[id] y muestra
 * un preview compacto: "Hola [business_name] — tu factoría con tu marca cargada".
 *
 * Si no hay ?brief= en el URL, no renderiza nada (return null).
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";

interface BrandBrief {
  business_name: string;
  sector_guess: "hosteleria" | "retail" | "servicios" | "salud" | "educacion" | "otros";
  primary_color: string | null;
  accent_color: string | null;
  fonts: string[];
  logo_url: string | null;
  copy_samples: { headlines: string[]; body: string[]; ctas: string[] };
  contact: { phone?: string; email?: string };
  confidence: number;
}

const SECTOR_LABELS: Record<BrandBrief["sector_guess"], string> = {
  hosteleria: "Hostelería",
  retail: "Retail / E-commerce",
  servicios: "Servicios profesionales",
  salud: "Salud",
  educacion: "Educación",
  otros: "Otros sectores",
};

export default function BriefBanner() {
  const searchParams = useSearchParams();
  const briefId = searchParams.get("brief");
  const [brief, setBrief] = useState<BrandBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!briefId) return;
    let cancelled = false;
    fetch(`/api/factoria/intake/${briefId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`brief no encontrado (${r.status})`);
        return r.json();
      })
      .then((j) => {
        if (cancelled) return;
        setBrief(j.brief);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [briefId]);

  if (!briefId || dismissed) return null;
  if (error) {
    return (
      <div className="bg-paper border-b-2 border-terracotta-500/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <span className="text-ink-mute">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase mr-2">brief</span>
            No pude cargar tu brief: {error}
          </span>
          <button onClick={() => setDismissed(true)} aria-label="cerrar" className="text-ink-mute hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
  if (!brief) {
    return (
      <div className="bg-paper border-b border-ink-mute/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm text-ink-mute">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase">cargando tu brief…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper border-b-2 border-ink px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          {brief.logo_url && (
            <div className="w-14 h-14 border border-ink-mute/30 bg-paper flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brief.logo_url} alt={`Logo ${brief.business_name}`} className="max-w-full max-h-full object-contain" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
                Tu factoría · personalizada
              </span>
            </div>
            <p className="text-base md:text-lg text-ink truncate">
              <span className="font-semibold">{brief.business_name}</span>{" "}
              <span className="text-ink-mute">·</span>{" "}
              <span className="text-ink-mute">{SECTOR_LABELS[brief.sector_guess]}</span>
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-auto pr-4">
            {brief.primary_color && (
              <div
                className="w-7 h-7 border border-ink-mute/40"
                style={{ backgroundColor: brief.primary_color }}
                title={`Color primario: ${brief.primary_color}`}
              />
            )}
            {brief.accent_color && (
              <div
                className="w-7 h-7 border border-ink-mute/40"
                style={{ backgroundColor: brief.accent_color }}
                title={`Color acento: ${brief.accent_color}`}
              />
            )}
            {brief.fonts.length > 0 && (
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-mute pl-3 border-l border-ink-mute/30">
                {brief.fonts.slice(0, 1).join(", ")}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="cerrar banner"
          className="text-ink-mute hover:text-ink flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
