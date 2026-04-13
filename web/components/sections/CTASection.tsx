"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function CTASection() {
  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-electric-violet/[0.06] rounded-full blur-[200px] pointer-events-none" />

      <ScrollReveal className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <div className="rounded-3xl p-10 sm:p-16 border border-white/[0.06] bg-dark-card">
          {/* Headline */}
          <p className="text-[13px] font-body font-medium text-electric-violet mb-6 uppercase tracking-[0.2em]">
            El siguiente paso
          </p>

          <h2 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            Tienes un problema digital.
            <br />
            <span className="gradient-text-vivid">Nosotros lo resolvemos.</span>
          </h2>

          <p className="text-lg text-pacame-white/40 font-body mb-10 max-w-md mx-auto">
            30 minutos de llamada. Sin compromiso. Sin presupuestos ciegos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button variant="gradient" size="xl" asChild className="group rounded-full min-w-[240px] shadow-glow-violet">
              <Link href="/contacto">
                Agendar llamada gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="group rounded-full min-w-[200px] border-white/[0.08] hover:border-white/20">
              <Link href="mailto:hola@pacameagencia.com">
                <MessageSquare className="w-4 h-4" />
                Escribir por email
              </Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-pacame-white/30 font-body">
            {[
              "Respuesta en menos de 2h",
              "Sin compromiso",
              "Presupuesto en 24h",
            ].map((signal) => (
              <div key={signal} className="flex items-center gap-2">
                <span className="block w-1.5 h-1.5 rounded-full bg-lime-pulse" />
                {signal}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
