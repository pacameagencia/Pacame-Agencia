"use client";

/**
 * PACAME — ManifestSection (Sprint 25)
 *
 * 5 servicios como párrafos editoriales kinéticos.
 * Reemplaza el ServicesSection legacy con cards genéricas.
 * Estilo: Anthropic minimalismo + Lusion drama.
 *
 * Cada servicio se enfatiza al scroll progress (color shift accent + scale).
 * Sin cards, sin SVGs decorativos. Solo tipografía + acentos.
 */

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import KineticHeading from "./KineticHeading";
import { EASE_APPLE } from "@/lib/animations/easings";

const MANIFEST_ITEMS = [
  {
    n: "01",
    name: "Diseño y desarrollo web",
    statement:
      "Webs que cargan en menos de 2 segundos, indexan en Google desde el día uno y convierten visitas en clientes. Stack 2026 — Next.js, Vercel, Supabase.",
    price: "Desde 300 €",
    href: "/servicios#web",
  },
  {
    n: "02",
    name: "Posicionamiento orgánico",
    statement:
      "SEO técnico, contenido con criterio editorial y link building con cabeza. Resultados verificables en 60–90 días, no promesas mágicas.",
    price: "Desde 300 €/mes",
    href: "/servicios#seo",
  },
  {
    n: "03",
    name: "Redes sociales",
    statement:
      "Estrategia, copy, diseño y community como un solo equipo. Calendario en 48h, contenido que conecta sin parecer plantilla.",
    price: "Desde 300 €/mes",
    href: "/servicios#redes",
  },
  {
    n: "04",
    name: "Publicidad digital",
    statement:
      "Meta Ads y Google Ads con embudos completos, automatización y reporting semanal. Optimizamos hasta el último céntimo.",
    price: "Desde 400 €/mes",
    href: "/servicios#ads",
  },
  {
    n: "05",
    name: "Branding e identidad",
    statement:
      "Logo, paleta, tipografía y manual con intención. Diseñamos marcas que se recuerdan, no plantillas reciclables.",
    price: "Desde 400 €",
    href: "/servicios#branding",
  },
];

export default function ManifestSection() {
  return (
    <section
      id="manifest"
      className="relative bg-tech-bg py-32 md:py-48 text-tech-text"
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* ── Eyebrow + section heading ── */}
        <div className="mb-20 max-w-3xl md:mb-28">
          <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            <span className="h-px w-8 bg-tech-accent" />
            Capítulo 1 · Manifiesto
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
            <span className="block">Cinco disciplinas.</span>
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
              Un solo equipo.
            </span>
          </KineticHeading>
        </div>

        {/* ── Manifest items ── */}
        <ul className="space-y-2">
          {MANIFEST_ITEMS.map((item, i) => (
            <ManifestRow key={item.n} item={item} index={i} />
          ))}
        </ul>

        {/* ── Footer link ── */}
        <div className="mt-16 flex items-center justify-between border-t border-tech-border pt-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-tech-text-mute">
            ¿Necesitas algo a medida?
          </span>
          <Link
            href="/servicios"
            data-cursor="hover"
            className="group inline-flex items-center gap-2 text-[15px] font-medium text-tech-text underline decoration-tech-text-faint underline-offset-[6px] transition-colors hover:text-tech-accent hover:decoration-tech-accent"
          >
            Ver todos los servicios
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ManifestRow({
  item,
  index,
}: {
  item: (typeof MANIFEST_ITEMS)[number];
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 60%"],
  });
  const accentOpacity = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0, 1, 0.4]);

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: EASE_APPLE }}
      className="group relative grid grid-cols-[3rem_1fr] gap-6 border-b border-tech-border-soft py-10 md:grid-cols-[4rem_1fr_auto] md:gap-12 md:py-14"
    >
      {/* Number ornament */}
      <div className="relative">
        <motion.span
          style={{ opacity: accentOpacity }}
          className="absolute inset-0 -z-10 rounded-full bg-tech-accent-glow blur-2xl"
          aria-hidden="true"
        />
        <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-tech-text-mute">
          {item.n}
        </span>
      </div>

      {/* Statement */}
      <div className="space-y-3 md:space-y-4">
        <h3
          className="font-sans text-[26px] font-semibold leading-tight tracking-tight text-tech-text transition-colors duration-500 group-hover:text-tech-accent md:text-[34px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {item.name}
        </h3>
        <p className="max-w-2xl text-[15px] leading-relaxed text-tech-text-soft md:text-[17px]">
          {item.statement}
        </p>
        <Link
          href={item.href}
          data-cursor="hover"
          className="inline-flex items-center gap-2 pt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-tech-text-mute transition-colors duration-300 hover:text-tech-accent"
        >
          {item.price}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Right CTA arrow desktop */}
      <Link
        href={item.href}
        data-cursor="hover"
        aria-label={`Conocer ${item.name}`}
        className="hidden self-center justify-self-end rounded-full border border-tech-border p-3 text-tech-text-soft transition-all duration-300 hover:border-tech-accent hover:text-tech-accent md:inline-flex"
      >
        <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
      </Link>
    </motion.li>
  );
}
