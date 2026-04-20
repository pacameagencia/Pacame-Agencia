"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import ScrollReveal, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import SalesHero from "@/components/sales/SalesHero";
import PainPoints from "@/components/sales/PainPoints";
import GuaranteeBadge from "@/components/sales/GuaranteeBadge";
import TestimonialCard from "@/components/TestimonialCard";
import type { SalesPageData } from "@/lib/data/sales-pages";
import type { Testimonial } from "@/lib/data/testimonials";

interface SalesPageClientProps {
  page: SalesPageData;
  testimonials: Testimonial[];
}

function TrustStrip() {
  const companies = [
    "Clinica Dental Sonrisa",
    "Transportes Levante",
    "Aceites Sierra Sur",
    "Inmobiliaria Costa del Sol",
    "Yoga & Bienestar Studio",
    "Consultoria RS Partners",
  ];

  return (
    <section className="py-12 border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-ink/30 font-body text-sm mb-8 uppercase tracking-wider">
          Confian en nosotros
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {companies.map((name) => (
            <span
              key={name}
              className="text-ink/20 font-heading font-semibold text-sm sm:text-base whitespace-nowrap hover:text-ink/40 transition-colors"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection({
  solutions,
}: {
  solutions: SalesPageData["solution"];
}) {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-mint/10 text-mint text-xs font-heading font-semibold mb-4">
              La solucion
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">
              Nuestra solucion
            </h2>
            <p className="mt-4 text-ink/50 font-body text-lg max-w-2xl mx-auto">
              Todo lo que necesitas para tener una presencia digital que
              realmente genera resultados.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutions.map((sol) => (
            <StaggerItem key={sol.title}>
              <div className="rounded-2xl bg-paper-deep border border-mint/10 hover:border-mint/30 transition-colors p-6 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-mint" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-ink mb-2">
                      {sol.title}
                    </h3>
                    <p className="text-ink/50 font-body text-sm leading-relaxed">
                      {sol.description}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function ProcessSection({
  steps,
}: {
  steps: SalesPageData["process"];
}) {
  return (
    <section className="py-20 lg:py-28 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-heading font-semibold mb-4">
              El proceso
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">
              Como funciona
            </h2>
            <p className="mt-4 text-ink/50 font-body text-lg max-w-2xl mx-auto">
              De la idea a la pagina publicada en 4 pasos sencillos.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          {steps.map((step, idx) => (
            <ScrollReveal key={step.step} delay={idx * 0.1}>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-accent-gold flex items-center justify-center flex-shrink-0">
                  <span className="font-heading font-bold text-lg text-white">
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-xl text-ink mb-1">
                    {step.title}
                  </h3>
                  <p className="text-ink/50 font-body text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-accent-gold/10 text-accent-gold text-xs font-heading font-semibold mb-4">
              Resultados reales
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">
              Lo que dicen nuestros clientes
            </h2>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <TestimonialCard testimonial={t} className="h-full" />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function PricingCard({
  price,
  recurring,
  serviceName,
}: {
  price: number;
  recurring: boolean;
  serviceName: string;
}) {
  return (
    <section className="py-20 lg:py-28 bg-white/[0.02]">
      <div className="max-w-lg mx-auto px-6">
        <ScrollReveal>
          <div className="rounded-2xl border-2 border-brand-primary/30 bg-paper-deep p-8 sm:p-10 text-center relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-primary/10 blur-3xl rounded-full" />

            <div className="relative">
              <Sparkles className="w-6 h-6 text-brand-primary mx-auto mb-4" />
              <h3 className="font-heading font-bold text-2xl text-ink mb-2">
                {serviceName}
              </h3>

              <div className="mt-6 mb-2">
                <span className="text-ink/50 font-body text-sm">
                  Desde
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-heading font-bold text-5xl text-ink">
                  {price}
                </span>
                <span className="font-heading text-2xl text-ink/50">
                  &euro;
                </span>
                {recurring && (
                  <span className="text-ink/40 font-body text-sm">
                    /mes
                  </span>
                )}
              </div>

              <ul className="mt-8 space-y-3 text-left">
                {[
                  "Diseno responsive personalizado",
                  "Copywriting persuasivo incluido",
                  "SEO on-page basico",
                  "Formulario de contacto",
                  "Hosting 1 ano incluido",
                  "Entrega en 2-3 dias",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-ink/70 font-body text-sm"
                  >
                    <Check className="w-4 h-4 text-mint flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <MagneticButton>
                  <Link href="/servicios">
                    <ShinyButton className="shadow-glow-gold w-full px-8 py-4 text-base font-heading font-semibold cursor-pointer">
                      <span className="flex items-center justify-center gap-2 text-ink">
                        Quiero mi landing page
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </ShinyButton>
                  </Link>
                </MagneticButton>
              </div>

              <p className="mt-4 text-ink/30 font-body text-xs">
                Pago unico. Sin sorpresas. Garantia 15 dias.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FaqSection({ faqs }: { faqs: SalesPageData["faq"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">
              Preguntas frecuentes
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <ScrollReveal key={faq.q} delay={idx * 0.05}>
              <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 transition-all overflow-hidden">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === idx ? null : idx)
                  }
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  aria-expanded={openIndex === idx}
                >
                  <h3 className="font-heading font-semibold text-base text-ink pr-4">
                    {faq.q}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-ink/40 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    openIndex === idx
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-ink/60 font-body leading-relaxed px-6 pb-6">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-20 lg:py-28 bg-white/[0.02]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal>
          <Zap className="w-8 h-8 text-accent-gold mx-auto mb-6" />
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink mb-4">
            Tu competencia ya tiene landing page.
            <br />
            <span className="text-accent-gold">Y tu?</span>
          </h2>
          <p className="text-ink/50 font-body text-lg mb-10 max-w-xl mx-auto">
            Cada dia sin una pagina que convierta es dinero que dejas en la
            mesa. Empieza hoy, ten tu landing lista en 3 dias.
          </p>

          <MagneticButton className="inline-block">
            <Link href="/servicios">
              <ShinyButton className="shadow-glow-gold px-10 py-4 text-base font-heading font-semibold cursor-pointer">
                <span className="flex items-center gap-2 text-ink">
                  Quiero mi landing page ahora
                  <ArrowRight className="w-5 h-5" />
                </span>
              </ShinyButton>
            </Link>
          </MagneticButton>

          <p className="mt-4 text-ink/30 font-body text-xs">
            Sin compromiso. Garantia de devolucion 15 dias.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function SalesPageClient({
  page,
  testimonials,
}: SalesPageClientProps) {
  return (
    <main className="bg-paper min-h-screen">
      {/* 1. Hero */}
      <SalesHero
        headline={page.headline}
        subheadline={page.subheadline}
        stats={page.stats}
        ctaText="Quiero mi landing page"
        ctaAction="/servicios"
      />

      {/* 2. Trust strip */}
      <TrustStrip />

      {/* Divider */}
      <GoldenDivider variant="star" className="my-4" />

      {/* 3. Pain points */}
      <PainPoints painPoints={page.painPoints} />

      {/* 4. Solution */}
      <SolutionSection solutions={page.solution} />

      <GoldenDivider variant="laurel" className="max-w-2xl mx-auto" />

      {/* 5. Process */}
      <ProcessSection steps={page.process} />

      {/* 6. Testimonials */}
      <TestimonialsSection testimonials={testimonials} />

      <GoldenDivider variant="star" className="max-w-2xl mx-auto" />

      {/* 7. Pricing */}
      <PricingCard
        price={page.price}
        recurring={page.recurring}
        serviceName={page.serviceName}
      />

      {/* 8. Guarantee */}
      <GuaranteeBadge
        title={page.guarantee.title}
        description={page.guarantee.description}
      />

      {/* 9. FAQ */}
      <FaqSection faqs={page.faq} />

      {/* 10. Final CTA */}
      <FinalCta />
    </main>
  );
}
