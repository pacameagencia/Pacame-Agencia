"use client";

/**
 * HomeHeroCinematic — Editorial catalog tier-1 hero.
 *
 * Design direction (frontend-design skill):
 *  - EDITORIAL MAGAZINE (The Economist / Monocle / Stripe print edition)
 *  - Swiss-grid precision, NOT centered-flow AI slop
 *  - Playfair Display italic on ONE brand word = editorial drama
 *  - Chrono-labels ("N°24 — 2026 — MADRID") like magazine masthead
 *  - Numbered sub-brand index ("N°01 — Restaurante") replaces generic pills
 *  - BLEED typography: huge "PACAME" extends off bottom edge
 *  - Gold + burgundy used SPARSELY (1-2 words each), mint as live pulse
 *  - Depth via scroll-linked parallax on 3 layers, NOT gradient mesh
 *  - Rule lines 1px ink/10 as structural grid
 *  - SVG grain overlay instead of particle constellation
 *
 * Epic-design skill applied: scrub timeline via useScroll, pinned sticky.
 * 3d-scroll-website: sticky canvas pattern w/ 60vh drive, layered parallax.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";

// Lazy to avoid SSR hydration mismatch + blocking first paint
const FlowFieldCanvas = dynamic(
  () => import("@/components/effects/FlowFieldCanvas"),
  { ssr: false }
);

// ═══════════════════════════════════════════════════════════════════════════
// DATA — numbered editorial index of 8 sub-marcas verticales
// ═══════════════════════════════════════════════════════════════════════════

const VERTICAL_INDEX = [
  { n: "01", brand: "Restaurante", cat: "Hosteleria", href: "/portafolio/restaurante" },
  { n: "02", brand: "Hotel",       cat: "Turismo",    href: "/portafolio/hotel" },
  { n: "03", brand: "Clinica",     cat: "Salud",      href: "/portafolio/clinica" },
  { n: "04", brand: "Gym",         cat: "Fitness",    href: "/portafolio/gym" },
  { n: "05", brand: "Inmo",        cat: "Bienes raices", href: "/portafolio/inmobiliaria" },
  { n: "06", brand: "Shop",        cat: "Ecommerce",  href: "/portafolio/ecommerce" },
  { n: "07", brand: "Academy",     cat: "Formacion",  href: "/portafolio/formacion" },
  { n: "08", brand: "Core",        cat: "SaaS",       href: "/portafolio/saas" },
];

const CHRONO_LABEL_LEFT  = "N°24 — 2026";
const CHRONO_LABEL_MID   = "MADRID · ESPANA";
const CHRONO_LABEL_RIGHT = "EDICION OCEAN";

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTS — staggered editorial entrance, NOT page-load firework
// ═══════════════════════════════════════════════════════════════════════════

const STAGGER = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const LINE_REVEAL = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const ITEM_REVEAL = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HomeHeroCinematic() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  // Scroll progress 0 → 1 during hero section scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax (disabled if prefers-reduced-motion)
  const bleedY   = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "-28%"]);
  const bleedScale = useTransform(scrollYProgress, [0, 1], [1, prefersReduced ? 1 : 1.08]);
  const indexX   = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "4%"]);
  const ruleW    = useTransform(scrollYProgress, [0, 0.5], ["0%", "100%"]);
  const headOpac = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0.2]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] md:min-h-[112vh] bg-paper text-ink overflow-hidden isolate"
      aria-label="PACAME Agencia Digital — Hero"
    >
      {/* ─────────────────────────────────────────────────────────
          BG-0a — algorithmic flow field (Organic Turbulence)
          Perlin noise vector field, Ocean -> Violet -> Gold por velocity
          ───────────────────────────────────────────────────────── */}
      <FlowFieldCanvas
        seed={2872}
        count={850}
        scale={0.0035}
        speed={0.5}
        opacity={0.55}
        className="z-0"
      />

      {/* ─────────────────────────────────────────────────────────
          BG-0b — editorial paper with subtle SVG grain overlay
          ───────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      {/* Very subtle Ocean glow top-right only (not centered mesh) */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-[620px] h-[620px] rounded-full opacity-[0.14] pointer-events-none z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #2872A1 0%, transparent 70%)",
        }}
      />

      {/* ─────────────────────────────────────────────────────────
          MASTHEAD — chrono-labels (replaces eyebrow badge)
          ───────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative z-20 pt-24 md:pt-28 px-5 md:px-10 lg:px-14"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50">
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
            </span>
            <span>{CHRONO_LABEL_LEFT}</span>
          </span>
          <span className="hidden md:inline">{CHRONO_LABEL_MID}</span>
          <span className="text-accent-gold/80">{CHRONO_LABEL_RIGHT}</span>
        </div>
      </motion.header>

      {/* ─────────────────────────────────────────────────────────
          GRID — asymmetric 60/40, editorial composition
          ───────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-20 px-5 md:px-10 lg:px-14 pt-10 md:pt-16 pb-48 md:pb-64"
        variants={STAGGER}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* ─────── LEFT 7/12 — editorial headline + sub + CTAs ─────── */}
          <motion.div
            className="lg:col-span-7 relative"
            style={prefersReduced ? undefined : { opacity: headOpac }}
          >
            {/* Section label like a magazine department */}
            <motion.div
              variants={ITEM_REVEAL}
              className="mb-8 md:mb-10 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45"
            >
              <span className="text-accent-gold">§ 001</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>Agencia digital · IA supervisada</span>
            </motion.div>

            {/* Headline — mixed display: Space Grotesk + Playfair italic */}
            <h1 className="font-heading font-bold text-[13vw] sm:text-[11vw] lg:text-[7.4vw] leading-[0.88] tracking-[-0.035em] text-ink">
              <motion.span variants={LINE_REVEAL} className="block">
                Tu equipo
              </motion.span>
              <motion.span variants={LINE_REVEAL} className="block">
                digital,
              </motion.span>
              <motion.span variants={LINE_REVEAL} className="block mt-1">
                <span className="font-accent italic font-normal text-accent-gold">
                  sin contratarlo
                </span>
                <span className="text-accent-burgundy">.</span>
              </motion.span>
            </h1>

            {/* Sub — deliberate narrow column, leading-relaxed */}
            <motion.p
              variants={ITEM_REVEAL}
              className="mt-8 md:mt-10 max-w-[44ch] text-[17px] md:text-[19px] font-body text-ink/65 leading-[1.55] tracking-[-0.005em]"
            >
              24 productos, 4 planes mensuales y 2 apps productizadas para PYMEs espanolas.
              Entrega en horas, garantia 30 dias,{" "}
              <span className="text-ink font-medium">codigo 100% tuyo</span>.
              Sin agencia, sin intermediarios, sin humo.
            </motion.p>

            {/* Rule line between sub and CTAs — editorial separator */}
            <motion.div
              variants={ITEM_REVEAL}
              className="mt-10 mb-8 h-px bg-ink/10 max-w-[420px]"
              style={prefersReduced ? undefined : { width: ruleW }}
            />

            {/* CTAs — asymmetric, NOT symmetrical button pair */}
            <motion.div
              variants={ITEM_REVEAL}
              className="flex flex-wrap items-center gap-x-10 gap-y-5"
            >
              {/* Primary — gold outline with ArrowUpRight (editorial) */}
              <Link
                href="/portafolio"
                className="group inline-flex items-center gap-3 border-b-2 border-accent-gold pb-1 font-heading font-semibold text-[15px] text-ink hover:text-accent-gold transition-colors"
              >
                <span>Ver el catalogo completo</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-400 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              {/* Secondary — pure text link (ghost), like a magazine byline */}
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors"
              >
                <span>o escribir a Pablo</span>
                <span aria-hidden>→</span>
              </Link>
            </motion.div>

            {/* Micro-stats inline, chrono-labeled — NOT in a box */}
            <motion.dl
              variants={ITEM_REVEAL}
              className="mt-14 md:mt-20 grid grid-cols-3 gap-6 md:gap-10 max-w-[520px]"
            >
              {[
                { k: "Entregas / mes", v: "42", unit: "+" },
                { k: "Rating medio",   v: "4.9", unit: "★" },
                { k: "Uptime SLA",     v: "99.9", unit: "%" },
              ].map((s, i) => (
                <div key={s.k} className="relative">
                  {i > 0 && (
                    <div className="absolute -left-3 md:-left-5 top-0 bottom-0 w-px bg-ink/10" />
                  )}
                  <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink/40 mb-2">
                    {s.k}
                  </dt>
                  <dd className="flex items-baseline gap-1 font-heading font-bold text-[32px] md:text-[40px] text-ink leading-none tabular-nums">
                    {s.v}
                    <span className="text-[16px] md:text-[20px] text-accent-gold ml-0.5">
                      {s.unit}
                    </span>
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* ─────── RIGHT 5/12 — numbered editorial index ─────── */}
          <motion.aside
            className="lg:col-span-5 relative"
            style={prefersReduced ? undefined : { x: indexX }}
          >
            <motion.div
              variants={ITEM_REVEAL}
              className="lg:sticky lg:top-24 pt-0 lg:pt-6"
            >
              {/* Department label */}
              <div className="flex items-center justify-between border-b border-ink/15 pb-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/45">
                  § 002 — Indice editorial
                </span>
                <span className="text-[10px] font-mono text-accent-gold tracking-[0.22em]">
                  8 sub-marcas
                </span>
              </div>

              {/* Numbered index list */}
              <ol className="divide-y divide-ink/10">
                {VERTICAL_INDEX.map((v, i) => (
                  <motion.li
                    key={v.n}
                    variants={ITEM_REVEAL}
                    custom={i}
                  >
                    <Link
                      href={v.href}
                      className="group flex items-baseline justify-between gap-4 py-3 md:py-[14px] hover:bg-ink/[0.03] -mx-2 px-2 rounded transition-colors"
                    >
                      <span className="flex items-baseline gap-4 md:gap-5 min-w-0">
                        <span className="text-[11px] font-mono text-ink/40 tabular-nums">
                          N°{v.n}
                        </span>
                        <span className="font-heading font-semibold text-[16px] md:text-[18px] text-ink tracking-[-0.01em] truncate">
                          PACAME{" "}
                          <span className="font-accent italic font-normal text-ink group-hover:text-accent-gold transition-colors">
                            {v.brand}
                          </span>
                        </span>
                      </span>
                      <span className="flex-shrink-0 flex items-baseline gap-3">
                        <span className="hidden md:inline text-[11px] font-mono text-ink/35 tracking-wider uppercase">
                          {v.cat}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-ink/30 group-hover:text-accent-gold group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ol>

              {/* Footer link */}
              <Link
                href="/portafolio"
                className="mt-4 inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.2em] text-ink/45 hover:text-accent-gold transition-colors"
              >
                <span aria-hidden>↗</span>
                <span>Ver fichas completas</span>
              </Link>
            </motion.div>
          </motion.aside>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────
          BLEED TYPE — "PACAME" extending off bottom edge
          32vw extremely large, scales subtly with scroll
          ───────────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 inset-x-0 pointer-events-none z-10 overflow-hidden"
        style={
          prefersReduced
            ? undefined
            : { y: bleedY, scale: bleedScale, transformOrigin: "50% 100%" }
        }
      >
        <div
          className="font-heading font-black text-center leading-[0.76] tracking-[-0.07em] select-none"
          style={{
            fontSize: "clamp(140px, 32vw, 520px)",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(245,245,247,0.14)",
            // Fade bottom-out blend
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 95%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 95%)",
          }}
        >
          PACAME
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────
          BOTTOM RULE + CHRONO FOOTER
          ───────────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 inset-x-0 z-30 px-5 md:px-10 lg:px-14 pointer-events-none">
        <div className="flex items-baseline justify-between border-t border-ink/10 pt-3 text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 pointer-events-auto">
          <span>Pag. 01 / 08</span>
          <span className="hidden md:inline">
            Ocean · Gold · Burgundy · Mint · Violet
          </span>
          <span className="inline-flex items-center gap-2">
            <span>Desplaza</span>
            <span className="block w-6 h-[1px] bg-ink/30 animate-pulse" />
          </span>
        </div>
      </div>
    </section>
  );
}
