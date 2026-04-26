"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="relative bg-indigo-600 text-paper overflow-hidden">
      {/* Grain + azulejo overlay sutil */}
      <div className="absolute inset-0 bg-azulejo opacity-[0.06] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* ── Grid split: imagen + copy ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Imagen arquitectura mediterránea */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.7, 0, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div
              className="relative aspect-[4/5] overflow-hidden"
              style={{ boxShadow: "10px 10px 0 #E8B730" }}
            >
              <Image
                src="/generated/hero-cinematic-bg.png"
                alt="Arquitectura mediterránea — el siguiente paso"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute top-4 left-4 bg-paper text-ink px-4 py-2 font-mono text-[10px] tracking-[0.3em] uppercase">
                Capítulo · Final
              </div>
            </div>
          </motion.div>

          {/* Copy + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.15, ease: [0.7, 0, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-mustard-500 mb-6 block">
              El siguiente paso
            </span>

            <h2
              className="font-display mb-10 text-balance"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
                lineHeight: "1.0",
                letterSpacing: "-0.035em",
                fontWeight: 500,
              }}
            >
              Tienes un problema digital.
              <span
                className="block italic font-light"
                style={{
                  color: "#E8B730",
                  fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
                }}
              >
                Nosotros lo resolvemos.
              </span>
            </h2>

            <p className="font-sans text-paper/80 text-[18px] leading-relaxed max-w-lg mb-4">
              Treinta minutos de llamada. Sin compromiso. Sin presupuestos ciegos.
            </p>

            <p
              className="font-display italic text-paper/95 text-2xl max-w-lg mb-12"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              El único riesgo es no intentarlo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
              <Link
                href="/contacto"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-mustard-500 text-ink font-sans font-semibold text-[15px] tracking-wide transition-all duration-300 hover:bg-mustard-400 rounded-sm"
                style={{ boxShadow: "5px 5px 0 #F4EFE3" }}
              >
                Agendar llamada gratis
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
              </Link>

              <Link
                href="mailto:hola@pacameagencia.com"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-paper text-paper font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-paper hover:text-ink rounded-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Escribir por email
              </Link>
            </div>

            {/* Trust signals — línea editorial */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-8 border-t border-paper/20">
              {[
                "Respuesta · bajo 2h",
                "Sin compromiso",
                "Presupuesto · 24h",
              ].map((signal, i) => (
                <div key={signal} className="flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-mustard-500" aria-hidden="true" />}
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-paper/60">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
