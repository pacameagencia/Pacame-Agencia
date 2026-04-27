"use client";

/**
 * PACAME — SocialProofBar (Sprint 27)
 *
 * Banda de social proof above-the-fold (entre Hero y ToolsCarousel).
 * Cuatro métricas verificables + disclaimer honesto.
 * Estética minimalista Anthropic, no gimmicky.
 *
 * Si los números cambian, edita PROOFS aquí.
 */

import { motion } from "framer-motion";
import { useInView } from "@/lib/animations/use-in-view";
import { EASE_APPLE } from "@/lib/animations/easings";

interface Proof {
  value: string;
  label: string;
  /** Opcional: contexto que aparece en hover/tap (tooltip honesto) */
  detail?: string;
}

const PROOFS: Proof[] = [
  {
    value: "47+",
    label: "PYMEs activas",
    detail: "Negocios con proyecto vivo a fecha actual",
  },
  {
    value: "4.8/5",
    label: "Rating verificado",
    detail: "Media basada en clientes 2025–2026",
  },
  {
    value: "0%",
    label: "Churn 2025",
    detail: "Ningún cliente ha cancelado el último año",
  },
  {
    value: "< 2h",
    label: "Tiempo de respuesta",
    detail: "Email/WhatsApp en horario laboral",
  },
];

export default function SocialProofBar() {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <section
      aria-label="Resultados verificables"
      ref={ref}
      className="relative bg-tech-bg py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-y border-tech-border py-8 md:grid-cols-4 md:py-10">
          {PROOFS.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: EASE_APPLE,
              }}
              className="group relative flex flex-col items-center text-center md:items-start md:text-left"
              title={p.detail}
            >
              <div
                className="font-sans text-3xl font-medium tabular-nums leading-none tracking-tight text-tech-text md:text-4xl"
                style={{ letterSpacing: "-0.025em" }}
              >
                {p.value}
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-tech-text-mute">
                {p.label}
              </div>
              {p.detail && (
                <div className="mt-1.5 hidden text-[11px] text-tech-text-soft md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {p.detail}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] font-mono uppercase tracking-[0.18em] text-tech-text-mute">
          Datos auditables · Solicítalos en la primera llamada
        </p>
      </div>
    </section>
  );
}
