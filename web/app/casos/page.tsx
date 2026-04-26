import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Briefcase } from "lucide-react";
import { caseStudies } from "@/lib/data/case-studies";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

// ISR: 1h de cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Casos de exito PACAME — Resultados reales de PYMEs espanolas",
  description:
    "Historias reales de negocios que crecieron con PACAME. Metricas, procesos y aprendizajes concretos — sin humo.",
  alternates: { canonical: "https://pacameagencia.com/casos" },
};

function CasesListJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Casos de exito PACAME",
    description: "Historias reales de negocios que han crecido con PACAME.",
    url: "https://pacameagencia.com/casos",
    numberOfItems: caseStudies.length,
    itemListElement: caseStudies.map((cs, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Article",
        headline: `${cs.clientName}: ${cs.metricHeadline} ${cs.metricSubtitle}`,
        description: cs.summary,
        url: `https://pacameagencia.com/casos/${cs.slug}`,
        datePublished: cs.publishedAt,
        author: {
          "@type": "Organization",
          name: "PACAME",
          url: "https://pacameagencia.com",
        },
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function CasosPage() {
  return (
    <div className="bg-paper min-h-screen">
      <CasesListJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Casos de exito", url: "https://pacameagencia.com/casos" },
        ]}
      />

      {/* Hero */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-accent-gold/[0.05] rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-primary/[0.04] rounded-full blur-[180px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-accent-gold mb-5 uppercase tracking-[0.25em]">
            Casos de exito
          </p>
          <h1 className="font-heading font-bold text-display text-ink mb-6 text-balance">
            Resultados reales de{" "}
            <span className="gradient-text-vivid">negocios reales.</span>
          </h1>
          <p className="text-xl text-ink/60 font-body max-w-2xl mx-auto font-light">
            Nada de lorem ipsum. Estos son tres negocios como el tuyo que
            crecieron gracias a los agentes IA de PACAME.
          </p>
        </ScrollReveal>
      </section>

      {/* Grid de casos */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-6xl mx-auto px-6">
          <StaggerContainer
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            staggerDelay={0.12}
          >
            {caseStudies.map((cs) => (
              <StaggerItem key={cs.slug}>
                <CardTilt tiltMaxAngle={6}>
                  <CardTiltContent className="h-full">
                    <Link
                      href={`/casos/${cs.slug}`}
                      className="group block h-full rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden hover:border-accent-gold/30 transition-all duration-300 card-golden-shine"
                    >
                      {/* Cover: mockup editorial generado + métrica overlay */}
                      <div
                        className="relative h-48 flex items-center justify-center overflow-hidden"
                        style={{ background: cs.coverGradient }}
                      >
                        <Image
                          src={`/generated/optimized/cases/case-${((caseStudies.indexOf(cs) % 6) + 1)}.webp`}
                          alt={`Mockup editorial ${cs.clientName}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover opacity-45 mix-blend-multiply"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.2),rgba(0,0,0,0.6))]" />
                        <div className="relative text-center px-6 z-10">
                          <p className="text-[9vw] md:text-[5vw] lg:text-6xl font-heading font-bold text-paper leading-none drop-shadow-[2px_2px_0_rgba(26,24,19,0.5)]">
                            {cs.metricHeadline}
                          </p>
                          <p className="text-xs text-paper/95 font-body font-medium uppercase tracking-[0.15em] mt-2">
                            {cs.metricSubtitle}
                          </p>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-3 text-xs text-ink/50 font-body mb-3">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {cs.sector}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cs.city}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg text-ink mb-3 leading-snug group-hover:text-accent-gold transition-colors">
                          {cs.clientName}
                        </h3>
                        <p className="text-sm text-ink/60 font-body leading-relaxed line-clamp-3 mb-5">
                          {cs.summary}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <div className="flex flex-wrap gap-1.5">
                            {cs.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-ink/50 font-body"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <ArrowRight className="w-4 h-4 text-ink/40 group-hover:text-accent-gold group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  </CardTiltContent>
                </CardTilt>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6">
        <GoldenDivider variant="laurel" />
      </div>

      {/* CTA bottom */}
      <section className="section-padding bg-paper">
        <ScrollReveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-section text-ink mb-4 text-balance">
            Tu negocio podria ser el proximo caso de exito.
          </h2>
          <p className="text-lg text-ink/60 font-body mb-10 max-w-xl mx-auto">
            Diagnostico digital gratuito. Te decimos exactamente que hay que
            mover y cuanto cuesta moverlo.
          </p>
          <MagneticButton>
            <ShinyButton
              gradientFrom="#E8B730"
              gradientTo="#B54E30"
              gradientOpacity={0.8}
              className="min-w-[260px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg"
            >
              <Link
                href="/contacto"
                className="flex items-center gap-2 text-ink"
              >
                Pedir diagnostico gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </ShinyButton>
          </MagneticButton>
        </ScrollReveal>
      </section>
    </div>
  );
}
