"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Download, Shuffle } from "lucide-react";

// Predefined palettes by aesthetic direction (mood → colores + fuentes)
// Deterministic, no LLM needed — mejor control editorial.
const AESTHETICS = {
  editorial: {
    label: "Editorial / Magazine",
    desc: "Serif display + grid suizo · The Economist, Monocle, Wallpaper",
    colors: ["#0F1B2E", "#F4F6F8", "#2872A1", "#F1E194", "#5B0E14"],
    font_display: "Playfair Display",
    font_body: "Inter",
    vibe: ["sofisticado", "elegante", "confiable", "premium"],
  },
  tech: {
    label: "Tech / SaaS",
    desc: "Sans geometrico + fondos oscuros · Linear, Stripe, Vercel",
    colors: ["#0A0A0A", "#F5F5F7", "#7C3AED", "#06B6D4", "#00A19B"],
    font_display: "Space Grotesk",
    font_body: "Inter",
    vibe: ["innovador", "tecnologico", "moderno", "escalable"],
  },
  warm: {
    label: "Warm / Hospitality",
    desc: "Paleta terrosa + serif humanista · Aman Resorts, Soho House",
    colors: ["#2D1F1A", "#F5EBD8", "#C9A36A", "#8B3A3A", "#5C8B7F"],
    font_display: "Libre Caslon Text",
    font_body: "Source Sans Pro",
    vibe: ["acogedor", "artesano", "autentico", "natural"],
  },
  minimal: {
    label: "Minimal / Clean",
    desc: "Mono-tonal + sans neutro · Apple, Muji",
    colors: ["#FFFFFF", "#0A0A0A", "#8E8E93", "#E5E5EA", "#007AFF"],
    font_display: "Geist Sans",
    font_body: "Geist Sans",
    vibe: ["minimalista", "limpio", "esencial", "claro"],
  },
  playful: {
    label: "Playful / Lifestyle",
    desc: "Paleta vibrante + sans curvos · Mailchimp, Notion",
    colors: ["#FFE66D", "#FF6B9D", "#4ECDC4", "#1A1A2E", "#FEF9EF"],
    font_display: "Fraunces",
    font_body: "DM Sans",
    vibe: ["divertido", "creativo", "joven", "accessible"],
  },
  wellness: {
    label: "Wellness / Organic",
    desc: "Verdes + cremas · Aesop, Wholefoods",
    colors: ["#3A4A3E", "#EAE4D7", "#A5B68D", "#D4A76A", "#7B8B6F"],
    font_display: "DM Serif Display",
    font_body: "Work Sans",
    vibe: ["saludable", "natural", "sereno", "organico"],
  },
  luxe: {
    label: "Luxe / Premium",
    desc: "Oscuro + metalicos · Dior, Louis Vuitton",
    colors: ["#0A0A0A", "#D4AF37", "#F5F5F5", "#1A1A1A", "#8B0000"],
    font_display: "Didot",
    font_body: "Nunito Sans",
    vibe: ["lujoso", "exclusivo", "premium", "sofisticado"],
  },
  bold: {
    label: "Bold / Editorial",
    desc: "Contrastes fuertes + sans display · Off-White, Nike",
    colors: ["#FF2E2E", "#000000", "#FFFFFF", "#FFD700", "#1E90FF"],
    font_display: "Bebas Neue",
    font_body: "Helvetica Neue",
    vibe: ["impactante", "provocador", "disruptivo", "joven"],
  },
} as const;

type AestheticKey = keyof typeof AESTHETICS;

// Match adjective keywords to aesthetic
function matchAesthetic(adjectives: string[]): AestheticKey {
  const text = adjectives.join(" ").toLowerCase();
  const scores: Record<AestheticKey, number> = {
    editorial: 0, tech: 0, warm: 0, minimal: 0, playful: 0, wellness: 0, luxe: 0, bold: 0,
  };

  const KEYWORDS: Record<AestheticKey, string[]> = {
    editorial: ["editorial", "magazine", "premium", "sofisticado", "elegante", "clasico", "refinado", "confiable"],
    tech: ["tech", "innovador", "moderno", "digital", "escalable", "saas", "tecnologico", "futuro"],
    warm: ["acogedor", "calido", "artesano", "autentico", "local", "natural", "rustico", "familiar"],
    minimal: ["minimalista", "limpio", "simple", "esencial", "claro", "blanco", "zen", "monocromo"],
    playful: ["divertido", "creativo", "joven", "fresco", "colorido", "energico", "vibrante", "friendly"],
    wellness: ["saludable", "wellness", "organico", "verde", "eco", "sereno", "balance", "holistic"],
    luxe: ["lujo", "luxe", "exclusivo", "premium", "dorado", "sofisticado", "alto", "boutique"],
    bold: ["impactante", "bold", "disruptivo", "provocador", "fuerte", "atrevido", "radical", "edgy"],
  };

  for (const [key, words] of Object.entries(KEYWORDS)) {
    for (const word of words) {
      if (text.includes(word)) scores[key as AestheticKey] += 1;
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return (best[1] > 0 ? best[0] : "editorial") as AestheticKey;
}

export default function PaletteClient() {
  const [adj1, setAdj1] = useState("elegante");
  const [adj2, setAdj2] = useState("confiable");
  const [adj3, setAdj3] = useState("moderno");
  const [copied, setCopied] = useState<string | null>(null);

  const aesthetic = useMemo(
    () => matchAesthetic([adj1, adj2, adj3]),
    [adj1, adj2, adj3]
  );
  const palette = AESTHETICS[aesthetic];

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  }

  function downloadCss() {
    const css = `/* PACAME brand palette — ${palette.label} */
:root {
${palette.colors.map((c, i) => `  --brand-${i}: ${c};`).join("\n")}
  --font-display: "${palette.font_display}", serif;
  --font-body: "${palette.font_body}", sans-serif;
}`;
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brand-palette.css";
    a.click();
    URL.revokeObjectURL(url);
  }

  function shuffle() {
    const keys = Object.keys(AESTHETICS) as AestheticKey[];
    const random = keys[Math.floor(Math.random() * keys.length)];
    setAdj1(AESTHETICS[random].vibe[0]);
    setAdj2(AESTHETICS[random].vibe[1]);
    setAdj3(AESTHETICS[random].vibe[2]);
  }

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="p-6 rounded-3xl bg-ink/[0.03] border border-ink/[0.08]">
        <div className="flex items-baseline justify-between mb-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-accent-gold">
            3 ADJETIVOS QUE DESCRIBEN TU MARCA
          </div>
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-wider text-ink/50 hover:text-accent-gold transition"
          >
            <Shuffle className="w-3 h-3" /> Inspirame
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: adj1, set: setAdj1, placeholder: "Ej: elegante" },
            { value: adj2, set: setAdj2, placeholder: "Ej: confiable" },
            { value: adj3, set: setAdj3, placeholder: "Ej: moderno" },
          ].map((f, i) => (
            <input
              key={i}
              type="text"
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-heading text-lg outline-none focus:border-accent-gold/40 transition"
            />
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="p-8 md:p-10 rounded-3xl border border-ink/10 bg-paper-soft/20">
        <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-ink/10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-1">
              PALETA RECOMENDADA · {aesthetic.toUpperCase()}
            </div>
            <h3 className="font-heading font-bold text-2xl text-ink">{palette.label}</h3>
            <p className="text-[13px] text-ink/60 font-body mt-1">{palette.desc}</p>
          </div>
          <button
            type="button"
            onClick={downloadCss}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-paper text-[13px] font-heading font-semibold hover:brightness-110 transition"
          >
            <Download className="w-3.5 h-3.5" /> CSS
          </button>
        </div>

        {/* Color swatches */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {palette.colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => copyHex(color)}
              className="group relative aspect-square rounded-2xl border border-ink/10 overflow-hidden"
              style={{ backgroundColor: color }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {copied === color ? (
                  <Check className="w-5 h-5 text-paper opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Copy className="w-5 h-5 text-paper opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-sm">
                <div className="text-[10px] font-mono text-white/90 text-center tabular-nums">
                  {color}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Fonts */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-paper border border-ink/10">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
              DISPLAY FONT
            </div>
            <div
              className="text-4xl text-ink mb-2"
              style={{ fontFamily: `"${palette.font_display}", serif` }}
            >
              {palette.font_display}
            </div>
            <p
              className="text-[15px] text-ink/70"
              style={{ fontFamily: `"${palette.font_display}", serif` }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-paper border border-ink/10">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
              BODY FONT
            </div>
            <div
              className="text-2xl text-ink mb-2"
              style={{ fontFamily: `"${palette.font_body}", sans-serif` }}
            >
              {palette.font_body}
            </div>
            <p
              className="text-[14px] text-ink/70"
              style={{ fontFamily: `"${palette.font_body}", sans-serif` }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
        </div>
      </div>

      {/* Vibe chips */}
      <div className="p-6 rounded-3xl border border-ink/[0.08]">
        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45 mb-3">
          Tu marca proyecta
        </div>
        <div className="flex flex-wrap gap-2">
          {palette.vibe.map((v) => (
            <span
              key={v}
              className="px-3 py-1.5 rounded-full text-[12px] font-body text-ink/80 bg-accent-gold/10 border border-accent-gold/30"
            >
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
