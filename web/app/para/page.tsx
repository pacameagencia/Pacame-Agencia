import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { niches } from "@/lib/data/niches";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Marketing digital por sector — PACAME",
  description:
    "Soluciones digitales especializadas por sector: restaurantes, hoteles, clínicas, gimnasios, inmobiliarias, ecommerce, academias y SaaS. Cada estrategia adaptada a tu mercado.",
  alternates: { canonical: "https://pacameagencia.com/para" },
  openGraph: {
    title: "Marketing digital por sector — PACAME",
    description:
      "Estrategias digitales especializadas por sector. 8 verticales con casos reales y planes adaptados.",
    url: "https://pacameagencia.com/para",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: ["/generated/og/servicios.png"],
  },
};

// Mapping nicho slug → sector image generado en /public/generated/sectors/
const NICHE_IMAGE_MAP: Record<string, string> = {
  restaurantes: "restaurant",
  hoteles: "hotel",
  clinicas: "clinic",
  gimnasios: "gym",
  inmobiliarias: "realestate",
  ecommerce: "ecommerce",
  academias: "academy",
  saas: "saas",
};

const ACCENT_MAP: string[] = [
  "#B54E30", // terracotta
  "#283B70", // indigo
  "#E8B730", // mustard
  "#6B7535", // olive
  "#CB6B47", // terracotta-light
  "#374A8C", // indigo-medium
  "#9C3E24", // terracotta-dark
  "#555F28", // olive-dark
];

export default function ParaIndexPage() {
  return (
    <div className="bg-paper min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Por sector", url: "https://pacameagencia.com/para" },
        ]}
      />

      {/* Hero editorial Spanish Modernism */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-paper">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 pb-8 border-b-2 border-ink">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  className="text-terracotta-500"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="6" fill="currentColor" />
                </svg>
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-terracotta-500 font-medium">
                  Capítulo III
                </span>
              </div>
            </div>
            <div className="lg:col-span-7">
              <h1
                className="font-display text-ink text-balance"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  lineHeight: "1.0",
                  letterSpacing: "-0.035em",
                  fontWeight: 500,
                }}
              >
                Por sector.
                <span
                  className="block italic font-light"
                  style={{
                    color: "#B54E30",
                    fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
                  }}
                >
                  Cada uno con su propio plan.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-3">
              <p className="font-sans text-ink-soft text-[15px] leading-relaxed">
                {niches.length} verticales con estrategia, contenido y precio
                adaptado a tu mercado.
                <span className="block mt-2 font-mono text-[11px] tracking-wide text-ink-mute uppercase">
                  Elige el tuyo
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de nichos editorial */}
      <section className="bg-paper pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {niches.map((niche, i) => {
              const imageSlug = NICHE_IMAGE_MAP[niche.slug];
              const accent = ACCENT_MAP[i % ACCENT_MAP.length];
              return (
                <Link
                  key={niche.slug}
                  href={`/para/${niche.slug}`}
                  className="group relative overflow-hidden bg-paper border border-ink/10 hover:border-terracotta-500/40 transition-all duration-500 rounded-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-terracotta-500/30"
                  aria-label={`Marketing digital para ${niche.namePlural}`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-sand-100">
                    {imageSlug ? (
                      <Image
                        src={`/generated/sectors/${imageSlug}.png`}
                        alt={`Sector ${niche.namePlural}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-sand-100 to-sand-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />

                    {/* Number ornamental top-left */}
                    <span
                      className="absolute top-4 left-4 font-display italic text-[40px] opacity-90 leading-none"
                      style={{
                        color: accent,
                        fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
                        fontWeight: 300,
                        textShadow: "1px 1px 0 rgba(244,239,227,0.6)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Bottom content */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="block font-mono text-[10px] tracking-[0.22em] uppercase text-paper/80 mb-1">
                        Para
                      </span>
                      <h2
                        className="font-display italic text-paper text-[26px] sm:text-[28px] leading-tight"
                        style={{
                          fontVariationSettings:
                            '"SOFT" 100, "WONK" 1, "opsz" 144',
                        }}
                      >
                        {niche.namePlural.charAt(0).toUpperCase() +
                          niche.namePlural.slice(1)}
                      </h2>
                    </div>

                    {/* Hover arrow */}
                    <ArrowUpRight
                      className="absolute top-4 right-4 w-5 h-5 text-paper opacity-0 group-hover:opacity-100 group-hover:rotate-45 transition-all duration-500"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Subhead under image */}
                  <div className="p-4 border-t border-ink/10">
                    <p className="font-sans text-[13px] text-ink/70 leading-relaxed line-clamp-2">
                      {niche.subheadline}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Editorial footer line */}
          <div className="mt-16 pt-8 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-sans text-[15px] text-ink/65 max-w-xl">
              ¿Tu sector no aparece? También trabajamos con clínicas dentales,
              despachos legales, ONGs, sector público y más.
            </p>
            <Link
              href="/contacto"
              className="group inline-flex items-center gap-2 font-display italic text-[18px] text-terracotta-600 hover:text-terracotta-700 underline decoration-terracotta-500/30 hover:decoration-terracotta-700 underline-offset-4 transition-colors"
              style={{
                fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
              }}
            >
              Hablar con el equipo
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
