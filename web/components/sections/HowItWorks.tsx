"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Cuentanos tu problema",
    description:
      "Agenda una llamada de 30 minutos con Pablo. Escuchamos primero, cotizamos despues. Sin formularios eternos.",
    color: "#7C3AED",
  },
  {
    number: "02",
    title: "El equipo entra en accion",
    description:
      "Sage diagnostica, Nova disena, Pixel construye, Atlas posiciona. Cada agente hace lo suyo. En paralelo.",
    color: "#06B6D4",
  },
  {
    number: "03",
    title: "Recibes tu entregable",
    description:
      "En dias, no en semanas. Pablo revisa antes de entregarte. Con metricas, guia de uso y soporte.",
    color: "#84CC16",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-[#0A0A0A] relative">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <p className="text-[13px] font-body font-medium text-neon-cyan mb-4 uppercase tracking-[0.2em]">
            Como funciona
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white text-balance">
            De problema a solucion.{" "}
            <span className="gradient-text-vivid">En tres pasos.</span>
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16" staggerDelay={0.15}>
          {steps.map((step, i) => (
            <StaggerItem key={step.number}>
              <div className="text-center md:text-left">
                {/* Number */}
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 text-xl font-heading font-bold"
                  style={{
                    backgroundColor: `${step.color}10`,
                    color: step.color,
                  }}
                >
                  {step.number}
                </div>

                <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
                  {step.title}
                </h3>
                <p className="text-[15px] text-pacame-white/40 font-body leading-relaxed max-w-sm mx-auto md:mx-0">
                  {step.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Tagline + CTA */}
        <ScrollReveal className="text-center" delay={0.3}>
          <div className="inline-block rounded-2xl px-8 py-5 border border-white/[0.06] bg-dark-card mb-10">
            <p className="font-heading font-bold text-lg sm:text-xl text-pacame-white text-balance">
              Lo que una agencia tarda semanas,{" "}
              <span className="gradient-text-vivid">nosotros lo entregamos en dias.</span>
            </p>
          </div>
          <div>
            <Button variant="gradient" size="lg" asChild className="group rounded-full shadow-glow-violet">
              <Link href="/contacto">
                Empezar ahora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
