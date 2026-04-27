"use client";

/**
 * PACAME — ContactCTA (Sprint 25)
 *
 * CTA pantalla completa final. Background gradient mesh animado.
 * Magnetic CTA grande. Lusion-grade drama final.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import KineticHeading from "./KineticHeading";
import MagneticBox from "@/components/effects/MagneticBox";
import { EASE_APPLE } from "@/lib/animations/easings";

export default function ContactCTA() {
  return (
    <section
      id="contact-cta"
      className="relative overflow-hidden bg-tech-bg text-tech-text"
    >
      {/* Background mesh dramatic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-tech-mesh opacity-100" />
        <div
          className="absolute inset-0 mix-blend-screen blur-3xl animate-gradient-orbit opacity-50"
          style={{
            background:
              "conic-gradient(from 90deg at 50% 50%, var(--tech-accent) 0deg, transparent 120deg, var(--tech-accent-2) 240deg, transparent 360deg)",
            backgroundSize: "200% 200%",
          }}
        />
        <div className="absolute inset-0 bg-tech-noise opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/0 via-transparent to-tech-bg/60" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center md:py-48">
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_APPLE }}
          className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-accent"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tech-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tech-accent" />
          </span>
          El siguiente paso
        </motion.span>

        {/* Headline */}
        <KineticHeading
          as="h2"
          className="font-sans font-semibold tracking-tight text-tech-text"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 6rem)",
            lineHeight: "0.98",
            letterSpacing: "-0.04em",
          }}
        >
          <span className="block">Tienes un problema</span>
          <span className="block">digital.</span>
        </KineticHeading>

        <KineticHeading
          as="div"
          delay={300}
          className="mt-2 font-sans font-light tracking-tight"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 6rem)",
            lineHeight: "0.98",
            letterSpacing: "-0.04em",
            background:
              "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          <span className="block">Nosotros lo resolvemos.</span>
        </KineticHeading>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.6, ease: EASE_APPLE }}
          className="mt-10 max-w-xl text-[16px] leading-relaxed text-tech-text-soft md:text-[18px]"
        >
          Treinta minutos de llamada. Sin compromiso. Sin presupuestos ciegos.
          Te decimos exactamente qué necesitas y cuánto cuesta.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.75, ease: EASE_APPLE }}
          className="mt-12 flex flex-col items-center gap-5 sm:flex-row"
        >
          <MagneticBox strength={0.2}>
            <Link
              href="/contacto"
              data-cursor="hover"
              className="group relative inline-flex min-h-[60px] items-center justify-center gap-3 overflow-hidden rounded-full bg-tech-accent px-8 py-4 text-[16px] font-semibold text-tech-bg transition-all duration-300 hover:bg-tech-accent-soft hover:shadow-tech-glow focus:outline-none focus-visible:ring-4 focus-visible:ring-tech-accent-glow active:scale-[0.98]"
            >
              Agendar llamada gratis
              <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
            </Link>
          </MagneticBox>

          <Link
            href="mailto:hola@pacameagencia.com"
            data-cursor="hover"
            className="group inline-flex min-h-[60px] items-center justify-center gap-2 rounded-full border border-tech-border bg-tech-surface/40 px-8 py-4 text-[15px] font-medium text-tech-text backdrop-blur-md transition-all duration-300 hover:border-tech-text-faint hover:bg-tech-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
          >
            <MessageSquare className="h-4 w-4" strokeWidth={1.8} />
            Escribir por email
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 1.0 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-tech-border-soft pt-8"
        >
          {["Respuesta · bajo 2h", "Sin compromiso", "Presupuesto · 24h"].map(
            (signal, i) => (
              <div key={signal} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="h-1 w-1 rounded-full bg-tech-accent" aria-hidden="true" />
                )}
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                  {signal}
                </span>
              </div>
            ),
          )}
        </motion.div>
      </div>
    </section>
  );
}
