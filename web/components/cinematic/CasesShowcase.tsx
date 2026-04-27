"use client";

/**
 * PACAME — CasesShowcase (Sprint 25)
 *
 * Casos de éxito con image reveal scroll-driven (clip-path).
 * Estilo Lusion: títulos grandes, mockups generados, métricas big numbers.
 */

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import KineticHeading from "./KineticHeading";
import { EASE_LUSION } from "@/lib/animations/easings";

interface CaseStudyCard {
  slug: string;
  client: string;
  sector: string;
  metric: string;
  metricLabel: string;
  summary: string;
  image: string;
}

const CASES: CaseStudyCard[] = [
  {
    slug: "casa-marisol",
    client: "Casa Marisol",
    sector: "Restaurante · Cádiz",
    metric: "+38%",
    metricLabel: "Reservas mes 1",
    summary:
      "Web nueva, Google Maps optimizado y reservas online. Pasaron de mesas vacías a llena entre semana.",
    image: "/generated/optimized/cases/case-1.webp",
  },
  {
    slug: "bahia-boutique",
    client: "Bahía Boutique",
    sector: "Hotel · Málaga",
    metric: "−42%",
    metricLabel: "Comisión Booking",
    summary:
      "Web optimizada con motor de reservas directas. Redujeron dependencia de OTAs en 6 meses.",
    image: "/generated/optimized/cases/case-2.webp",
  },
  {
    slug: "clinica-sonrisa",
    client: "Clínica Sonrisa",
    sector: "Clínica dental · Madrid",
    metric: "60d",
    metricLabel: "Agenda llena",
    summary:
      "SEO local + ads + reseñas. Su agenda dejó de tener huecos en 60 días.",
    image: "/generated/optimized/cases/case-3.webp",
  },
];

export default function CasesShowcase() {
  return (
    <section
      id="cases"
      className="relative bg-tech-bg py-32 md:py-48 text-tech-text"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* ── Header ── */}
        <div className="mb-20 max-w-3xl md:mb-28">
          <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            <span className="h-px w-8 bg-tech-success" />
            Capítulo 3 · Casos
          </span>
          <KineticHeading
            as="h2"
            className="font-sans font-semibold tracking-tight text-tech-text"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 4rem)",
              lineHeight: "1.05",
              letterSpacing: "-0.035em",
            }}
          >
            <span className="block">Resultados reales,</span>
            <span
              className="block font-light"
              style={{
                background:
                  "linear-gradient(120deg, var(--tech-success) 0%, var(--tech-accent) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              negocios reales.
            </span>
          </KineticHeading>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-tech-text-soft md:text-[18px]">
            Nada de lorem ipsum. Tres negocios como el tuyo que crecieron con
            PACAME en menos de un trimestre.
          </p>
        </div>

        {/* ── Cases ── */}
        <div className="space-y-32 md:space-y-48">
          {CASES.map((cs, i) => (
            <CaseRow key={cs.slug} caseStudy={cs} reverse={i % 2 === 1} index={i} />
          ))}
        </div>

        {/* ── Footer link ── */}
        <div className="mt-20 flex items-center justify-between border-t border-tech-border pt-8 md:mt-32">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-tech-text-mute">
            ¿Tu negocio podría ser el siguiente?
          </span>
          <Link
            href="/casos"
            data-cursor="hover"
            className="group inline-flex items-center gap-2 text-[15px] font-medium text-tech-text underline decoration-tech-text-faint underline-offset-[6px] transition-colors hover:text-tech-accent hover:decoration-tech-accent"
          >
            Ver todos los casos
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CaseRow({
  caseStudy,
  reverse,
  index,
}: {
  caseStudy: CaseStudyCard;
  reverse: boolean;
  index: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1.05]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.4],
    ["inset(0 0 100% 0)", "inset(0 0 0% 0)"],
  );

  return (
    <article
      ref={containerRef}
      className={`grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12 ${
        reverse ? "md:[&>div:first-child]:order-2" : ""
      }`}
    >
      {/* Image with reveal */}
      <div className="md:col-span-7">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-tech-elevated md:aspect-[16/10]">
          <motion.div
            style={{ y: imageY, scale: imageScale, clipPath }}
            className="absolute inset-0"
          >
            <Image
              src={caseStudy.image}
              alt={`${caseStudy.client} — ${caseStudy.sector}`}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />
          </motion.div>
          {/* Overlay con número caso */}
          <div className="pointer-events-none absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-tech-text/30 bg-tech-bg/40 px-3 py-1.5 backdrop-blur-md">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text">
              Caso 0{index + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Copy */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.8, ease: EASE_LUSION }}
        className="space-y-5 md:col-span-5"
      >
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-tech-text-mute">
          {caseStudy.sector}
        </div>

        <h3
          className="font-sans text-[36px] font-semibold leading-[1.05] tracking-tight text-tech-text md:text-[48px]"
          style={{ letterSpacing: "-0.025em" }}
        >
          {caseStudy.client}
        </h3>

        <div className="flex items-baseline gap-3 border-y border-tech-border-soft py-5">
          <span
            className="font-sans text-5xl font-light tabular-nums leading-none md:text-6xl"
            style={{
              background:
                "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {caseStudy.metric}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-tech-text-mute">
            {caseStudy.metricLabel}
          </span>
        </div>

        <p className="text-[15px] leading-relaxed text-tech-text-soft md:text-[17px]">
          {caseStudy.summary}
        </p>

        <Link
          href={`/casos/${caseStudy.slug}`}
          data-cursor="hover"
          className="group inline-flex items-center gap-2 pt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-tech-accent transition-colors hover:text-tech-accent-soft"
        >
          Leer caso completo
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" />
        </Link>
      </motion.div>
    </article>
  );
}
