"use client";

/**
 * EditorialMarquee — full-bleed scrolling band like a newsroom ticker.
 * Replaces generic "logo wall" with editorial manifesto strip.
 *
 * Design: text-only, monumental type, asterisk separators, burgundy accent on
 * key phrases. Infinite scroll at slow pace — creates rhythm between hero
 * (editorial static) and next section (product lines).
 */

import { motion, useReducedMotion } from "framer-motion";

const MANIFESTO_LINE = [
  "Sin agencia",
  "sin humo",
  "sin permanencia",
  "sin comisiones",
  "sin reuniones eternas",
  "sin briefings de 40 paginas",
  "sin Word",
  "sin Excel",
  "sin excusas",
];

export default function EditorialMarquee() {
  const prefersReduced = useReducedMotion();

  // Duplicamos el array para loop continuo sin gap
  const doubled = [...MANIFESTO_LINE, ...MANIFESTO_LINE];

  return (
    <section
      className="relative bg-paper py-10 md:py-14 overflow-hidden border-y border-ink/10"
      aria-label="Manifesto PACAME"
    >
      {/* Chrono footer left/right */}
      <div className="absolute top-3 left-5 md:left-10 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.22em] text-ink/35 z-10">
        § 003 — Manifesto
      </div>
      <div className="absolute top-3 right-5 md:right-10 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold/70 z-10">
        Leer en voz alta
      </div>

      <motion.div
        animate={prefersReduced ? {} : { x: ["0%", "-50%"] }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : { duration: 42, ease: "linear", repeat: Infinity }
        }
        className="flex items-center gap-12 md:gap-20 whitespace-nowrap will-change-transform"
      >
        {doubled.map((line, i) => (
          <span
            key={`${line}-${i}`}
            className="inline-flex items-center gap-12 md:gap-20 font-heading font-bold text-[36px] md:text-[72px] lg:text-[92px] leading-none tracking-[-0.04em]"
          >
            <span className={i === 0 || i % 3 === 0 ? "text-ink" : "text-ink/30"}>
              {line}
            </span>
            <span className="text-accent-burgundy/80 font-accent italic font-normal text-[44px] md:text-[90px] lg:text-[110px]">
              *
            </span>
          </span>
        ))}
      </motion.div>

      {/* Fades en los edges para efecto "out of frame" */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-paper to-transparent pointer-events-none z-10"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-paper to-transparent pointer-events-none z-10"
      />
    </section>
  );
}
