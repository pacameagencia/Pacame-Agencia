"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";

export default function FactoriaCTA() {
  return (
    <section className="relative section-padding bg-paper overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          viewBox="0 0 800 400"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ctaGlow" cx="50%" cy="0%" r="60%">
              <stop offset="0%" stopColor="#E8B730" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E8B730" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="400" cy="0" rx="400" ry="200" fill="url(#ctaGlow)" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] }}
          className="relative bg-ink p-12 md:p-16"
          style={{ boxShadow: "10px 10px 0 #B54E30" }}
        >
          {/* Banda superior */}
          <div className="flex items-center justify-between pb-6 border-b border-paper/15 mb-12">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-mustard-400">
              § Cierre · Próximo paso
            </span>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-paper/50">
              FIN · Pag 04/04
            </span>
          </div>

          {/* Titular */}
          <h2
            className="font-display text-paper mb-8 text-balance"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: 500 }}
          >
            Cuéntanos tu problema digital.{" "}
            <span
              className="italic font-light"
              style={{ color: "#E8B730", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              La factoría hace el resto.
            </span>
          </h2>

          {/* Subtítulo */}
          <p className="font-sans text-paper/75 text-[17px] leading-relaxed max-w-2xl mb-12">
            Sin formularios largos. Sin presupuestos genéricos. Mándanos un mensaje a WhatsApp o un email
            describiendo tu PYME y tu problema. Te respondemos con un plan empaquetado en 24 horas.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              href="https://wa.me/34722669381?text=Hola%20PACAME%2C%20quiero%20encargar%20una%20soluci%C3%B3n%20de%20la%20factor%C3%ADa"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-mustard-500 text-ink font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-mustard-400 rounded-sm"
              style={{ boxShadow: "5px 5px 0 #B54E30" }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp · +34 722 669 381
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            </a>

            <Link
              href="mailto:hola@pacameagencia.com?subject=Encargo%20factor%C3%ADa"
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 border-2 border-paper text-paper font-sans font-medium text-[15px] tracking-wide transition-all duration-300 hover:bg-paper hover:text-ink rounded-sm"
            >
              hola@pacameagencia.com
            </Link>
          </div>

          {/* Footer técnico */}
          <div className="pt-8 border-t border-paper/15 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-paper/50 block mb-2">
                Respuesta
              </span>
              <p className="font-display text-paper text-[1.25rem]" style={{ fontWeight: 500 }}>
                ≤ 24 horas
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-paper/50 block mb-2">
                Llamada de descubrimiento
              </span>
              <p className="font-display text-paper text-[1.25rem]" style={{ fontWeight: 500 }}>
                Gratis · 30 min
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-paper/50 block mb-2">
                Cotización cerrada
              </span>
              <p className="font-display text-paper text-[1.25rem]" style={{ fontWeight: 500 }}>
                ≤ 48 horas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Firma editorial */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 flex items-center justify-between"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute">
            PACAME · Madrid · 2026
          </span>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-terracotta-500" aria-hidden="true">
              <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M7 2 L8 6 L12 7 L8 8 L7 12 L6 8 L2 7 L6 6 Z" fill="currentColor" />
            </svg>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute">
              Factoría · Cerebro · IA
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
