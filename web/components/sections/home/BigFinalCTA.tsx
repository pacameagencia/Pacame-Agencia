"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

const GradientMeshCanvas = dynamic(
  () => import("@/components/effects/GradientMeshCanvas"),
  { ssr: false }
);

export default function BigFinalCTA() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* Gradient mesh full-width fondo */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <GradientMeshCanvas
          colors={["#7C3AED", "#D4A853", "#06B6D4", "#FF6B9D"]}
          speed={0.18}
          intensity={0.08}
        />
      </div>
      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-paper/60 pointer-events-none" />

      {/* Top/bottom hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

      <ScrollReveal className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <p className="text-[12px] font-body font-medium text-accent-gold/80 mb-6 uppercase tracking-[0.24em]">
          Siguiente paso
        </p>
        <h2 className="font-accent font-bold text-display text-ink mb-6 text-balance leading-tight">
          Listo para tener un{" "}
          <span className="gradient-text-aurora">equipo digital</span>{" "}
          sin contratarlo?
        </h2>
        <p className="text-lg sm:text-xl text-ink/55 font-body mb-10 max-w-xl mx-auto text-balance">
          Eligeun producto o habla 15 min con Pablo. Sin compromiso, sin presupuestos ciegos, sin humo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <MagneticButton>
            <ShinyButton
              gradientFrom="#D4A853"
              gradientTo="#7C3AED"
              gradientOpacity={0.85}
              className="group min-w-[240px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <Link
                href="/servicios"
                className="flex items-center gap-2 text-ink"
              >
                Explorar productos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ShinyButton>
          </MagneticButton>
          <Button
            variant="outline"
            size="xl"
            asChild
            className="rounded-full min-w-[220px] border-ink/[0.1] hover:border-accent-gold/30 hover:bg-white/[0.03] transition-colors duration-500"
          >
            <Link href="/contacto">
              <MessageSquare className="w-4 h-4" />
              Hablar con Pablo
            </Link>
          </Button>
        </div>

        <p className="text-xs text-ink/40 font-body">
          Respuesta en menos de 2h · Sin compromiso · Garantia 7 dias
        </p>
      </ScrollReveal>
    </section>
  );
}
