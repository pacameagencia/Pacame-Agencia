import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Briefcase,
  Calendar,
  Quote,
} from "lucide-react";
import {
  caseStudies,
  getCaseStudyBySlug,
  getRelatedCaseStudies,
} from "@/lib/data/case-studies";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

// ISR: 1h
export const revalidate = 3600;

export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = getCaseStudyBySlug(slug);
  if (!cs) return { title: "Caso no encontrado" };

  const title = `${cs.clientName}: ${cs.metricHeadline} ${cs.metricSubtitle} | PACAME`;
  return {
    title,
    description: cs.summary,
    alternates: { canonical: `https://pacameagencia.com/casos/${slug}` },
    openGraph: {
      title,
      description: cs.summary,
      url: `https://pacameagencia.com/casos/${slug}`,
      siteName: "PACAME",
      type: "article",
      publishedTime: cs.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cs.summary,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cs = getCaseStudyBySlug(slug);
  if (!cs) notFound();

  const related = getRelatedCaseStudies(slug, 2);
  const canonical = `https://pacameagencia.com/casos/${slug}`;

  return (
    <div className="bg-paper min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Casos", url: "https://pacameagencia.com/casos" },
          { name: cs.clientName, url: canonical },
        ]}
      />
      {/* Structured data: Review + Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            itemReviewed: {
              "@type": "Service",
              name: "PACAME — Agencia digital de agentes IA",
              provider: {
                "@type": "Organization",
                name: "PACAME",
                url: "https://pacameagencia.com",
              },
            },
            author: {
              "@type": "Person",
              name: cs.quoteAuthor,
            },
            reviewBody: cs.quote,
            reviewRating: {
              "@type": "Rating",
              ratingValue: 5,
              bestRating: 5,
            },
            publisher: {
              "@type": "Organization",
              name: "PACAME",
              url: "https://pacameagencia.com",
            },
            datePublished: cs.publishedAt,
            url: canonical,
          }),
        }}
      />

      {/* Hero con cover + metric gigante */}
      <section className="relative pt-36 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/casos"
            className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-accent-gold font-body transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Todos los casos
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="flex items-center gap-1.5 text-xs text-ink/60 font-body">
                  <Briefcase className="w-3.5 h-3.5 text-accent-gold" />
                  {cs.sector}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink/60 font-body">
                  <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                  {cs.city}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink/60 font-body">
                  <Calendar className="w-3.5 h-3.5 text-accent-gold" />
                  {new Date(cs.publishedAt).toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h1 className="font-heading font-bold text-display text-ink mb-6 text-balance leading-tight">
                {cs.clientName}
              </h1>
              <p className="text-xl text-ink/70 font-body font-light leading-relaxed mb-6">
                {cs.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {cs.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-ink/[0.08] text-ink/70 font-body"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Cover metric card */}
            <div
              className="relative aspect-square rounded-3xl overflow-hidden flex items-center justify-center border border-ink/[0.08] shadow-2xl"
              style={{ background: cs.coverGradient }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,0,0,0.1),rgba(0,0,0,0.55))]" />
              <div className="relative text-center px-6">
                <p className="text-[20vw] md:text-[14vw] lg:text-[10rem] font-heading font-bold text-ink leading-none">
                  {cs.metricHeadline}
                </p>
                <p className="text-sm md:text-base text-ink/95 font-body font-medium uppercase tracking-[0.2em] mt-4">
                  {cs.metricSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6">
        <GoldenDivider variant="star" />
      </div>

      {/* Problema */}
      <section className="py-20">
        <ScrollReveal className="max-w-3xl mx-auto px-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent-burgundy-soft font-body font-medium mb-4">
            El problema
          </p>
          <h2 className="font-heading font-bold text-section text-ink mb-6 text-balance">
            Lo que nos encontramos
          </h2>
          <p className="text-lg text-ink/70 font-body leading-relaxed">
            {cs.problem}
          </p>
        </ScrollReveal>
      </section>

      {/* Solucion */}
      <section className="py-20 bg-paper-deep/30 border-y border-white/[0.04]">
        <ScrollReveal className="max-w-3xl mx-auto px-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-body font-medium mb-4">
            La solucion PACAME
          </p>
          <h2 className="font-heading font-bold text-section text-ink mb-6 text-balance">
            Lo que hicimos
          </h2>
          <p className="text-lg text-ink/70 font-body leading-relaxed mb-10">
            {cs.solution}
          </p>

          <div className="rounded-2xl bg-paper/60 border border-ink/[0.06] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-gold/80 font-body font-medium mb-4">
              Productos usados
            </p>
            <ul className="space-y-2">
              {cs.productsUsed.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="group flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0 hover:border-accent-gold/20 transition-colors"
                  >
                    <span className="text-sm text-ink font-body group-hover:text-accent-gold transition-colors">
                      {p.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-ink/40 group-hover:text-accent-gold group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      {/* Resultados */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-body font-medium mb-4">
              Resultados
            </p>
            <h2 className="font-heading font-bold text-section text-ink text-balance">
              Los numeros que importan
            </h2>
          </ScrollReveal>

          <StaggerContainer
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            staggerDelay={0.1}
          >
            {cs.results.map((m) => (
              <StaggerItem key={m.label}>
                <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6 text-center h-full">
                  <p className="font-heading font-bold text-4xl md:text-5xl gradient-text-gold leading-none mb-3">
                    {m.value}
                  </p>
                  <p className="text-sm text-ink font-body font-medium mb-1">
                    {m.label}
                  </p>
                  {m.hint && (
                    <p className="text-[11px] text-ink/50 font-body">
                      {m.hint}
                    </p>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 bg-paper-deep/30 border-y border-white/[0.04]">
        <ScrollReveal className="max-w-3xl mx-auto px-6 text-center">
          <Quote className="w-10 h-10 text-accent-gold mx-auto mb-6 opacity-70" />
          <blockquote className="font-heading font-medium text-2xl md:text-3xl text-ink leading-snug text-balance mb-8">
            &ldquo;{cs.quote}&rdquo;
          </blockquote>
          <cite className="not-italic block">
            <p className="text-base text-ink font-body font-medium">
              {cs.quoteAuthor}
            </p>
            <p className="text-sm text-ink/50 font-body">
              {cs.quoteRole}
            </p>
          </cite>
        </ScrollReveal>
      </section>

      {/* CTA final */}
      <section className="py-24">
        <ScrollReveal>
          <CardTilt tiltMaxAngle={3}>
            <CardTiltContent className="max-w-4xl mx-auto px-6">
              <div className="rounded-3xl bg-gradient-to-br from-accent-gold/10 via-dark-card to-brand-primary/10 border border-accent-gold/20 p-10 md:p-14 text-center card-golden-shine">
                <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-body font-medium mb-4">
                  Tu turno
                </p>
                <h3 className="font-heading font-bold text-3xl md:text-4xl text-ink mb-4 text-balance">
                  Tienes un negocio parecido? Prueba PACAME.
                </h3>
                <p className="text-base md:text-lg text-ink/60 font-body mb-10 max-w-xl mx-auto">
                  Diagnostico gratuito en 24 horas. Te decimos que funciona para
                  tu sector y cuanto cuesta hacerlo bien.
                </p>
                <MagneticButton>
                  <ShinyButton
                    gradientFrom="#E8B730"
                    gradientTo="#B54E30"
                    gradientOpacity={0.8}
                    className="min-w-[280px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg"
                  >
                    <Link
                      href="/contacto"
                      className="flex items-center gap-2 text-ink"
                    >
                      Pedir mi diagnostico
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </ShinyButton>
                </MagneticButton>
              </div>
            </CardTiltContent>
          </CardTilt>
        </ScrollReveal>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="pb-24">
          <div className="max-w-5xl mx-auto px-6">
            <ScrollReveal>
              <h3 className="font-heading font-bold text-xl text-ink mb-8 text-center">
                Mas casos de exito
              </h3>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {related.map((rc) => (
                <Link
                  key={rc.slug}
                  href={`/casos/${rc.slug}`}
                  className="group block rounded-2xl bg-paper-deep border border-ink/[0.06] p-6 hover:border-accent-gold/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="text-3xl font-heading font-bold"
                      style={{
                        background: rc.coverGradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {rc.metricHeadline}
                    </span>
                    <ArrowRight className="w-4 h-4 text-ink/40 group-hover:text-accent-gold group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-heading font-semibold text-base text-ink group-hover:text-accent-gold transition-colors mb-2">
                    {rc.clientName}
                  </h4>
                  <p className="text-sm text-ink/60 font-body line-clamp-2">
                    {rc.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
