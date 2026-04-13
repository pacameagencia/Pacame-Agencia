"use client";

import Link from "next/link";
import { Calendar, MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function CTASection() {
  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Ambient - more vivid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-electric-violet/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-neon-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          className="glass-vivid rounded-3xl p-10 sm:p-14 border border-white/[0.10]"
          whileHover={{ boxShadow: "0 0 60px rgba(124, 58, 237, 0.15)" }}
          transition={{ duration: 0.5 }}
        >
          {/* Headline */}
          <div className="mb-4">
            <span className="font-mono text-electric-violet text-sm uppercase tracking-widest">
              El siguiente paso
            </span>
          </div>

          <h2 className="font-heading font-bold text-[clamp(2rem,4vw,3.5rem)] text-pacame-white leading-tight mb-6">
            Tienes un problema digital.
            <br />
            <span className="gradient-text-vivid">Nosotros lo resolvemos.</span>
          </h2>

          <p className="text-lg text-pacame-white/60 font-body mb-10 max-w-xl mx-auto">
            30 minutos de llamada. Sin compromiso. Sin presupuestos ciegos.
            Solo escuchamos tu problema y te decimos si podemos ayudarte y cuanto cuesta.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button variant="gradient" size="xl" asChild className="group min-w-[240px] shadow-glow-violet">
              <Link href="/contacto">
                <Calendar className="w-5 h-5" />
                Agendar llamada gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="group min-w-[200px] border-white/10 hover:border-electric-violet/40">
              <Link href="mailto:hola@pacameagencia.com">
                <MessageSquare className="w-4 h-4" />
                Escribir por email
              </Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-pacame-white/40 font-body">
            {[
              "Respuesta en menos de 2h",
              "Sin compromiso de contratacion",
              "Presupuesto en 24h",
            ].map((signal) => (
              <div key={signal} className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-pulse opacity-50" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-pulse" />
                </span>
                {signal}
              </div>
            ))}
          </div>
        </motion.div>
      </ScrollReveal>
    </section>
  );
}
