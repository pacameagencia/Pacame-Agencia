"use client";

/**
 * BigFinalCTA — editorial closing spread (pag. 08/08 — FIN).
 *
 * Replaces generic gradient-mesh + shiny-magnetic-button combo with an
 * editorial "colophon" page. Typography does the work, not effects.
 */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function BigFinalCTA() {
  return (
    <section
      className="relative bg-paper text-ink py-32 md:py-48 overflow-hidden"
      aria-label="Siguiente paso"
    >
      {/* Subtle grain overlay — consistent con hero */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      {/* Single burgundy glow bottom-left only */}
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-[540px] h-[540px] rounded-full opacity-[0.14] pointer-events-none blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #5B0E14 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 px-5 md:px-10 lg:px-14 max-w-7xl mx-auto">
        {/* Top rule + FIN chrono */}
        <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-14 md:mb-20 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">
          <span className="text-accent-gold">§ FIN</span>
          <span className="hidden md:inline">COLOPHON · PACAME AGENCIA</span>
          <span>Pag. 08 / 08</span>
        </div>

        <ScrollReveal>
          <div className="grid md:grid-cols-[1.3fr_1fr] gap-12 md:gap-20 items-start">
            {/* LEFT — editorial headline */}
            <div>
              <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-8">
                <span className="text-accent-gold">§ 008</span>
                <span className="h-px w-8 bg-ink/20" />
                <span>Siguiente paso</span>
              </div>

              <h2 className="font-heading font-bold text-[clamp(2.5rem,7vw,6rem)] text-ink leading-[0.92] tracking-[-0.035em] mb-10">
                <span className="block">Listo para un</span>
                <span className="block">
                  <span className="font-accent italic font-normal text-accent-gold">
                    equipo digital
                  </span>
                </span>
                <span className="block">
                  sin contratarlo
                  <span className="text-accent-burgundy">?</span>
                </span>
              </h2>

              {/* Ornamental divider */}
              <div className="flex items-center gap-4 mb-10 max-w-[420px]">
                <span className="h-px flex-1 bg-ink/15" />
                <span className="font-accent italic font-normal text-accent-burgundy/70 text-2xl leading-none">
                  *
                </span>
                <span className="h-px flex-1 bg-ink/15" />
              </div>

              {/* Editorial CTAs */}
              <div className="flex flex-wrap items-center gap-x-12 gap-y-5">
                <Link
                  href="/portafolio"
                  className="group inline-flex items-center gap-3 border-b-2 border-accent-gold pb-1 font-heading font-semibold text-[16px] text-ink hover:text-accent-gold transition-colors"
                >
                  <span>Explorar catalogo</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-400 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/contacto"
                  className="group inline-flex items-center gap-3 border-b-2 border-ink/20 hover:border-ink pb-1 font-heading font-semibold text-[16px] text-ink/70 hover:text-ink transition-colors"
                >
                  <span>Hablar con Pablo — 15 min</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-400 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>

            {/* RIGHT — colophon micro-notes (magazine byline style) */}
            <aside className="border-t md:border-t-0 md:border-l border-ink/10 pt-10 md:pt-6 md:pl-12 space-y-8">
              {/* Firma Pablo */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-3">
                  Firma editorial
                </div>
                <div className="font-accent italic text-[26px] md:text-[32px] text-ink leading-tight mb-2">
                  Pablo Calleja
                </div>
                <div className="text-[13px] font-body text-ink/55 leading-relaxed">
                  Fundador & Director Editorial de PACAME.
                  <br />
                  Responde personalmente en menos de <strong className="text-ink">2h</strong>.
                </div>
              </div>

              {/* Coordenadas */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-3">
                  Coordenadas
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[13px] font-mono">
                  <dt className="text-ink/40">MAIL</dt>
                  <dd className="text-ink">
                    <a
                      href="mailto:hola@pacameagencia.com"
                      className="hover:text-accent-gold transition-colors"
                    >
                      hola@pacameagencia.com
                    </a>
                  </dd>
                  <dt className="text-ink/40">WHATSAPP</dt>
                  <dd className="text-ink">
                    <a
                      href="https://wa.me/34722669381"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-accent-gold transition-colors"
                    >
                      +34 722 669 381
                    </a>
                  </dd>
                  <dt className="text-ink/40">HORARIO</dt>
                  <dd className="text-ink/70">L-V 9h-20h · Madrid</dd>
                </dl>
              </div>

              {/* Garantias micro */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-3">
                  Garantia
                </div>
                <p className="text-[13px] font-body text-ink/60 leading-relaxed">
                  30 dias de satisfaccion o <strong className="text-ink">refund total</strong>.
                  Sin paperwork, sin preguntas.
                </p>
              </div>
            </aside>
          </div>
        </ScrollReveal>

        {/* Bottom chrono */}
        <div className="mt-20 md:mt-28 pt-6 border-t border-ink/10 flex items-baseline justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-ink/35">
          <span>Edicion Ocean · N°24 — 2026</span>
          <span className="hidden md:inline">pacameagencia.com</span>
          <span className="text-accent-gold/70">FIN ·</span>
        </div>
      </div>
    </section>
  );
}
