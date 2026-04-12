"use client";

import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-pacame-black">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-violet/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neon-cyan/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-deep-indigo/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        {/* Status badge */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <Badge variant="default" className="gap-2 py-1.5 px-4">
            <span className="w-2 h-2 rounded-full bg-lime-pulse animate-pulse-slow" />
            Equipo disponible ahora
          </Badge>
        </div>

        {/* Main headline */}
        <h1 className="font-heading font-bold text-[clamp(2.5rem,6vw,5rem)] leading-[1.08] tracking-tight text-pacame-white mb-6"
            style={{ animationDelay: "0.1s" }}>
          Tu problema digital.
          <br />
          <span className="gradient-text">Resuelto hoy.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-pacame-white/60 max-w-2xl mx-auto mb-4 leading-relaxed font-body">
          Un equipo de{" "}
          <span className="text-pacame-white font-medium">10 agentes IA especializados</span>,
          liderados por un humano. Más rápido que una agencia, más fiable que un freelancer,
          a una fracción del coste.
        </p>

        <p className="text-base text-pacame-white/40 font-mono mb-10">
          Web · SEO · Ads · Social · Branding · Backend · Estrategia
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button variant="gradient" size="xl" asChild className="group min-w-[220px]">
            <Link href="/contacto">
              <Calendar className="w-4 h-4" />
              Agenda una llamada gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild className="min-w-[180px]">
            <Link href="/servicios">
              Ver servicios y precios
            </Link>
          </Button>
        </div>

        {/* Social proof stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "10", label: "Especialistas IA", color: "#7C3AED" },
            { value: "24h", label: "Entrega mínima", color: "#06B6D4" },
            { value: "−60%", label: "vs agencia tradicional", color: "#84CC16" },
            { value: "100%", label: "Supervisión humana", color: "#F59E0B" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-4 text-center"
            >
              <div
                className="font-heading font-bold text-2xl sm:text-3xl mb-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-pacame-white/50 font-body">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-pacame-white/30">
        <span className="text-xs font-body">Descubrir más</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>
    </section>
  );
}
