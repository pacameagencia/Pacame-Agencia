"use client";

import { motion } from "framer-motion";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ArrowRight } from "lucide-react";

interface SalesHeroProps {
  headline: string;
  subheadline: string;
  stats: { value: string; label: string }[];
  ctaText: string;
  ctaAction: string;
}

export default function SalesHero({
  headline,
  subheadline,
  stats,
  ctaText,
  ctaAction,
}: SalesHeroProps) {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background gradient effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-electric-violet/10 via-olympus-gold/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-olympus-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-olympus-gold/30 bg-olympus-gold/5 text-olympus-gold text-xs font-heading font-semibold mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-olympus-gold animate-pulse" />
          Servicio mas vendido
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-accent font-bold text-4xl sm:text-5xl lg:text-6xl text-pacame-white leading-tight tracking-tight max-w-4xl mx-auto"
        >
          {headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-lg sm:text-xl text-pacame-white/60 font-body leading-relaxed max-w-3xl mx-auto"
        >
          {subheadline}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10"
        >
          <a href={ctaAction}>
            <ShinyButton className="shadow-glow-gold px-8 py-4 text-base font-heading font-semibold cursor-pointer">
              <span className="flex items-center gap-2 text-pacame-white">
                {ctaText}
                <ArrowRight className="w-5 h-5" />
              </span>
            </ShinyButton>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-heading font-bold text-olympus-gold">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-pacame-white/50 font-body">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
