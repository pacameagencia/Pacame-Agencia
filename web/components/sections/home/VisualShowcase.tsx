"use client";

/**
 * VisualShowcase — WOW editorial section con imagenes reales DALL-E 3 HD.
 *
 * Uses the 10 images we actually generated:
 *   - /hero/master.png (cinematic ocean+gold architecture scene)
 *   - /showcase/dashboard.png (SaaS dashboard mockup)
 *   - /verticals/{8-slugs}.png (one per sub-brand, editorial flat-lays)
 *
 * Composition:
 *   1. HERO SPREAD — huge master image with editorial overlay caption
 *   2. DASHBOARD SHOWCASE — laptop dashboard with floating captions
 *   3. VERTICALS GRID — 8 editorial thumbnails linking to /portafolio/[slug]
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ScrollReveal, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";

const VERTICALS_VISUAL = [
  { slug: "restaurante",  name: "Restaurante",  n: "01", cat: "Hosteleria" },
  { slug: "hotel",        name: "Hotel",        n: "02", cat: "Turismo" },
  { slug: "clinica",      name: "Clinica",      n: "03", cat: "Salud" },
  { slug: "gym",          name: "Gym",          n: "04", cat: "Fitness" },
  { slug: "inmobiliaria", name: "Inmo",         n: "05", cat: "Real Estate" },
  { slug: "ecommerce",    name: "Shop",         n: "06", cat: "Ecommerce" },
  { slug: "formacion",    name: "Academy",      n: "07", cat: "Formacion" },
  { slug: "saas",         name: "Core",         n: "08", cat: "SaaS" },
];

export default function VisualShowcase() {
  return (
    <section
      className="relative bg-paper py-24 md:py-32 overflow-hidden"
      aria-label="Showcase visual PACAME"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14">
        {/* ═══════════════════════════════════════════════════════════════
            SECTION 005 — HERO SPREAD: master image 16:9 full-width editorial
            ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal className="mb-24 md:mb-32">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6 border-b border-ink/10 pb-3">
            <span className="text-accent-gold">§ 005</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Portada editorial</span>
            <span className="ml-auto text-ink/35">
              Fotografia N°24 · Edicion Ocean
            </span>
          </div>

          {/* Master hero image full-bleed con overlay typography */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden border border-ink/10 shadow-[0_40px_100px_-20px_rgba(40,114,161,0.35)]">
            <Image
              src="/hero/master.png"
              alt="PACAME Edicion Ocean — escena arquitectonica editorial con luz dorada filtrandose por lamas verticales, esfera bronce y reflejos en marmol"
              fill
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover"
              quality={90}
              priority={false}
            />
            {/* Bottom fade for legibility */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

            {/* Editorial overlay caption */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-14">
              <div className="flex items-baseline justify-between gap-4 border-t border-white/20 pt-4 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-white/70">
                <span>Madrid — 2026</span>
                <span className="hidden md:inline">Fotografia Pacame</span>
                <span className="text-accent-gold">
                  Arquitectura de marca
                </span>
              </div>
              <h3 className="mt-3 font-heading font-bold text-white text-[clamp(1.5rem,3.5vw,3rem)] leading-[1]">
                Construimos marcas que{" "}
                <span className="font-accent italic font-normal text-accent-gold">
                  duran.
                </span>
              </h3>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 005b — DASHBOARD SHOWCASE: laptop product photography
            ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center mb-24 md:mb-32">
            {/* Image 8/12 */}
            <div className="lg:col-span-8 relative">
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-ink/10 shadow-[0_30px_80px_-20px_rgba(40,114,161,0.30)]">
                <Image
                  src="/showcase/dashboard.png"
                  alt="Dashboard cliente PACAME — panel analitica editorial con acentos Ocean Blue y lineas de crecimiento mint sobre pantalla laptop"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  quality={88}
                />
              </div>
              <div className="absolute -top-3 left-6 flex items-center gap-2 bg-paper px-3 py-1.5 border border-ink/10 rounded-full">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/60">
                  DASHBOARD
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-brand-primary">
                  Portal cliente
                </span>
              </div>
            </div>

            {/* Text 4/12 */}
            <div className="lg:col-span-4">
              <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
                <span className="text-accent-gold">§ 005b</span>
                <span className="h-px w-8 bg-ink/20" />
                <span>Portal cliente</span>
              </div>
              <h3 className="font-heading font-bold text-[28px] md:text-[40px] text-ink leading-[1.02] tracking-[-0.02em] mb-5">
                Tu pedido en{" "}
                <span className="font-accent italic font-normal text-accent-gold">
                  tiempo real
                </span>
                <span className="text-accent-burgundy">.</span>
              </h3>
              <p className="text-[15px] md:text-[16px] text-ink/60 font-body leading-relaxed mb-8 max-w-[38ch]">
                Pedidos, entregables, facturas y metricas en un solo portal. Nivel visual
                Stripe / Linear, para que tus clientes presuman del panel cuando lo enseñan.
              </p>
              <Link
                href="/portal"
                className="group inline-flex items-center gap-2 border-b-2 border-accent-gold pb-1 font-heading font-semibold text-[14px] text-ink hover:text-accent-gold transition-colors"
              >
                Ver portal demo
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 006 — 8 VERTICALS EDITORIAL GRID
            ═══════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-baseline justify-between border-b border-ink/15 pb-3 mb-8">
            <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">
              <span className="text-accent-gold">§ 006</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>8 sub-marcas — vista galeria</span>
            </div>
            <Link
              href="/portafolio"
              className="group inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.18em] text-ink/50 hover:text-accent-gold transition-colors"
            >
              <span>Indice completo</span>
              <ArrowUpRight className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <StaggerContainer
            staggerDelay={0.06}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
          >
            {VERTICALS_VISUAL.map((v) => (
              <StaggerItem key={v.slug}>
                <Link
                  href={`/portafolio/${v.slug}`}
                  className="group block relative aspect-[4/5] rounded-2xl overflow-hidden border border-ink/10 hover:border-accent-gold/40 transition-colors"
                >
                  <Image
                    src={`/verticals/${v.slug}.png`}
                    alt={`PACAME ${v.name} — escena editorial ${v.cat.toLowerCase()}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.06] transition-transform duration-[900ms] ease-out"
                    quality={80}
                  />
                  {/* Fade overlay bottom for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  {/* Chrono + name at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <div className="flex items-baseline justify-between mb-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
                      <span>N°{v.n}</span>
                      <span>{v.cat}</span>
                    </div>
                    <div className="font-heading font-bold text-[16px] md:text-[18px] text-white tracking-[-0.015em] leading-tight">
                      PACAME{" "}
                      <span className="font-accent italic font-normal group-hover:text-accent-gold transition-colors">
                        {v.name}
                      </span>
                    </div>
                  </div>
                  {/* Arrow indicator top-right on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 rounded-full bg-accent-gold/95 flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-paper" />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
