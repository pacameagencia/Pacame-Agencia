"use client";

/**
 * PACAME — ToolsCarousel (Sprint 25 + Sprint 26: logos oficiales)
 *
 * Marquee de logos OFICIALES de las herramientas que usamos.
 * Fuente: simple-icons.org (licencia CC0). Los SVGs viven en
 * `web/public/logos/brands/{slug}.svg`. Ver scripts/download-brand-logos.sh.
 *
 * Render: SVG monochrome inyectado como mask para que tome el color
 * del theme (claro en dark mode, oscuro en light mode) automáticamente.
 *
 * Para añadir/quitar logos, edita TOOLS abajo.
 */

import { motion } from "framer-motion";

interface Tool {
  /** slug del archivo SVG en /public/logos/brands/{slug}.svg */
  slug: string;
  /** nombre visible (accesibilidad + tooltip) */
  name: string;
  /** categoría corta (kicker mono) */
  category: string;
  /** width opcional en px (algunos logos son más anchos) */
  width?: number;
}

const TOOLS: Tool[] = [
  { slug: "openai", name: "OpenAI", category: "AI" },
  { slug: "anthropic", name: "Anthropic", category: "AI" },
  { slug: "google", name: "Google", category: "Search" },
  { slug: "googleads", name: "Google Ads", category: "Ads", width: 32 },
  { slug: "meta", name: "Meta", category: "Ads" },
  { slug: "stripe", name: "Stripe", category: "Pagos" },
  { slug: "vercel", name: "Vercel", category: "Deploy" },
  { slug: "supabase", name: "Supabase", category: "DB" },
  { slug: "nextdotjs", name: "Next.js", category: "Framework" },
  { slug: "react", name: "React", category: "UI" },
  { slug: "typescript", name: "TypeScript", category: "Lang" },
  { slug: "tailwindcss", name: "Tailwind", category: "CSS" },
  { slug: "resend", name: "Resend", category: "Email" },
  { slug: "sentry", name: "Sentry", category: "Errors" },
  { slug: "posthog", name: "PostHog", category: "Analytics" },
  { slug: "figma", name: "Figma", category: "Design" },
];

export default function ToolsCarousel() {
  return (
    <section
      aria-label="Herramientas oficiales que usamos"
      className="relative overflow-hidden border-y border-tech-border bg-tech-bg py-14 md:py-20"
    >
      <div className="mx-auto mb-8 max-w-7xl px-6 md:mb-10">
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-tech-border" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            Stack 2026 · 16 herramientas oficiales
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
          className="flex items-center gap-12 md:gap-16"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ width: "fit-content" }}
        >
          {[...TOOLS, ...TOOLS].map((tool, i) => (
            <ToolItem key={`${tool.slug}-${i}`} tool={tool} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ToolItem({ tool }: { tool: Tool }) {
  const width = tool.width ?? 28;

  return (
    <div
      className="group flex flex-shrink-0 items-center gap-3 transition-opacity duration-300"
      title={`${tool.name} · ${tool.category}`}
    >
      {/* SVG logo via CSS mask — se tinta con currentColor del tema */}
      <span
        aria-hidden="true"
        className="block flex-shrink-0 bg-tech-text-mute transition-colors duration-500 group-hover:bg-tech-text"
        style={{
          width: `${width}px`,
          height: `${width}px`,
          WebkitMaskImage: `url(/logos/brands/${tool.slug}.svg)`,
          maskImage: `url(/logos/brands/${tool.slug}.svg)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <div className="hidden md:flex flex-col">
        <span className="font-sans text-[15px] font-medium leading-none text-tech-text-soft transition-colors duration-300 group-hover:text-tech-text">
          {tool.name}
        </span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-tech-text-mute">
          {tool.category}
        </span>
      </div>
    </div>
  );
}
