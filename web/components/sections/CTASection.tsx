"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import MagneticButton from "@/components/effects/MagneticButton";
import { TextSpotlight } from "@/components/ui/text-spotlight";
import { ShinyButton } from "@/components/ui/shiny-button";

const GradientMeshCanvas = dynamic(
  () => import("@/components/effects/GradientMeshCanvas"),
  { ssr: false }
);

export default function CTASection() {
  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      {/* Background gradient mesh — low intensity */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <GradientMeshCanvas
          colors={["#D4A853", "#7C3AED", "#06B6D4", "#FF6B9D"]}
          speed={0.15}
          intensity={0.06}
        />
      </div>

      <ScrollReveal className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <div className="rounded-3xl p-10 sm:p-16 border border-olympus-gold/15 bg-dark-card/80 backdrop-blur-sm relative overflow-hidden">
          {/* Orbiting golden border light */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, transparent 70%, rgba(212,168,83,0.15) 80%, transparent 90%, transparent 100%)",
              animation: "border-orbit 8s linear infinite",
            }}
          />
          {/* Inner mask to keep the orbit on the border only */}
          <div className="absolute inset-[1px] rounded-3xl bg-dark-card/95 pointer-events-none" />

          <div className="relative z-10">
            {/* Headline */}
            <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-6 uppercase tracking-[0.2em]">
              El siguiente paso
            </p>

            <h2 className="font-accent font-bold text-display text-pacame-white mb-6 text-balance">
              Tienes un problema digital.
              <br />
              <span className="gradient-text-aurora">Nosotros lo resolvemos.</span>
            </h2>

            <p className="text-lg text-pacame-white/40 font-body mb-4 max-w-md mx-auto">
              30 minutos de llamada. Sin compromiso. Sin presupuestos ciegos.
            </p>

            <TextSpotlight
              text="El unico riesgo es no intentarlo."
              textClassName="font-accent text-xl sm:text-2xl font-bold"
              spotlightColor="212, 168, 83"
              spotlightSize={300}
              animateOnPhone
              className="mb-10 max-w-md mx-auto"
            />

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <MagneticButton>
                <ShinyButton
                  gradientFrom="#D4A853"
                  gradientTo="#06B6D4"
                  gradientOpacity={0.8}
                  className="group min-w-[260px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                >
                  <Link href="/contacto" className="flex items-center gap-2 text-pacame-white">
                    Agendar llamada gratis
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </ShinyButton>
              </MagneticButton>
              <Button variant="outline" size="xl" asChild className="group rounded-full min-w-[200px] border-olympus-gold/20 hover:border-olympus-gold/40 hover:bg-olympus-gold/5">
                <Link href="mailto:hola@pacameagencia.com">
                  <MessageSquare className="w-4 h-4" />
                  Escribir por email
                </Link>
              </Button>
            </div>

            {/* Trust signals — golden dots */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-pacame-white/30 font-body">
              {[
                "Respuesta en menos de 2h",
                "Sin compromiso",
                "Presupuesto en 24h",
              ].map((signal) => (
                <div key={signal} className="flex items-center gap-2">
                  <span className="block w-1.5 h-1.5 rounded-full bg-olympus-gold animate-pulse" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
