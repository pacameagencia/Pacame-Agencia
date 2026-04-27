"use client";

/**
 * PACAME — ToolsCarousel (Sprint 25)
 *
 * Marquee de logos oficiales de herramientas que usamos.
 * IMPORTANTE (decisión Pablo Sprint 25): NO inventar SVGs. Solo logos
 * oficiales cuando los tengamos descargados con derecho de uso.
 *
 * Mientras tanto: placeholder discreto con nombres en monospace.
 * Cuando Pablo confirme cuáles podemos usar (Stripe, OpenAI, Anthropic,
 * Google, Meta, Vercel, Supabase) → reemplazar con los SVG reales.
 */

import { motion } from "framer-motion";

interface Tool {
  name: string;
  category: string;
}

const TOOLS: Tool[] = [
  { name: "OpenAI", category: "AI" },
  { name: "Anthropic", category: "AI" },
  { name: "Google AI", category: "AI" },
  { name: "Stripe", category: "Pagos" },
  { name: "Vercel", category: "Infra" },
  { name: "Supabase", category: "DB" },
  { name: "Next.js", category: "Framework" },
  { name: "Meta", category: "Ads" },
  { name: "Google Ads", category: "Ads" },
  { name: "Resend", category: "Email" },
  { name: "Sentry", category: "Monitor" },
  { name: "PostHog", category: "Analytics" },
];

export default function ToolsCarousel() {
  return (
    <section
      aria-label="Herramientas que usamos"
      className="relative overflow-hidden border-y border-tech-border bg-tech-bg py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-6 mb-6">
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-tech-border" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            Stack 2026 · Herramientas oficiales
          </span>
          <span className="h-px w-8 bg-tech-border" />
        </div>
      </div>

      {/* Marquee infinite */}
      <div className="relative">
        {/* Gradient masks edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-tech-bg to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-tech-bg to-transparent" />

        <motion.div
          className="flex gap-12 md:gap-16"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ width: "fit-content" }}
        >
          {[...TOOLS, ...TOOLS].map((tool, i) => (
            <div
              key={`${tool.name}-${i}`}
              className="group flex flex-shrink-0 items-baseline gap-2 transition-opacity duration-300 hover:opacity-100"
            >
              <span
                className="font-sans text-[20px] font-medium tracking-tight text-tech-text-soft transition-colors duration-300 group-hover:text-tech-text md:text-[24px]"
                style={{ letterSpacing: "-0.02em" }}
              >
                {tool.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-tech-text-mute">
                {tool.category}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
