import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight, AlertTriangle, Zap, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { niches, getAllNicheSlugs, getNicheBySlug } from "@/lib/data/niches";
import { agents } from "@/lib/data/agents";
import { services } from "@/lib/data/services";
import PackageCheckoutButton from "@/components/PackageCheckoutButton";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

interface Props {
  params: Promise<{ nicho: string }>;
}

export async function generateStaticParams() {
  return getAllNicheSlugs().map((slug) => ({ nicho: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nicho } = await params;
  const niche = getNicheBySlug(nicho);
  if (!niche) return {};
  return {
    title: niche.metaTitle,
    description: niche.metaDescription,
    alternates: { canonical: `https://pacameagencia.com/para/${niche.slug}` },
  };
}

export default async function NichePage({ params }: Props) {
  const { nicho } = await params;
  const niche = getNicheBySlug(nicho);
  if (!niche) notFound();

  // Get relevant agents
  const nicheAgents = niche.solutions.map((s) => agents.find((a) => a.id === s.agentId)).filter(Boolean);

  // Get relevant services
  const nicheServices = niche.recommendedServices
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div className="bg-pacame-black min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: `Marketing para ${niche.namePlural}`, url: `https://pacameagencia.com/para/${niche.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-electric-violet/[0.06] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-6 uppercase tracking-[0.2em]">
            Soluciones para {niche.namePlural}
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 whitespace-pre-line text-balance">
            {niche.headline}
          </h1>
          <p className="text-xl text-pacame-white/60 font-body max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            {niche.subheadline}
          </p>

          {/* Stat */}
          <div className="inline-flex items-center gap-2 bg-electric-violet/10 border border-electric-violet/20 rounded-full px-5 py-2.5 mb-12">
            <Zap className="w-4 h-4 text-electric-violet" />
            <span className="text-sm font-body text-electric-violet font-medium">
              {niche.heroStat}
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gradient" size="xl" asChild className="group rounded-full min-w-[240px] shadow-glow-violet">
              <Link href={`/contacto?service=${niche.recommendedServices[0]}`}>
                Quiero mas clientes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="rounded-full min-w-[200px] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]">
              <a href="https://wa.me/34722669381" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                Hablar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-body font-medium text-rose-alert mb-4 uppercase tracking-[0.2em]">
              Te suena esto?
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
              Los problemas de{" "}
              <span className="gradient-text-vivid">tu {niche.name}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {niche.painPoints.map((pain) => (
              <div
                key={pain.title}
                className="rounded-2xl p-7 bg-dark-card border border-white/[0.06] hover:border-rose-alert/20 transition-colors duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-alert/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-alert" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-pacame-white mb-2">
                      {pain.title}
                    </h3>
                    <p className="text-sm text-pacame-white/50 font-body leading-relaxed">
                      {pain.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-body font-medium text-lime-pulse mb-4 uppercase tracking-[0.2em]">
              La solucion
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
              Que hacemos por{" "}
              <span className="gradient-text-vivid">tu {niche.name}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {niche.solutions.map((solution, i) => {
              const agent = nicheAgents[i];
              return (
                <div
                  key={solution.title}
                  className="rounded-2xl p-7 bg-dark-card border border-white/[0.06] hover:border-electric-violet/20 transition-colors duration-500"
                >
                  {/* Agent badge */}
                  {agent && (
                    <div className="flex items-center gap-2 mb-5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-bold"
                        style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
                      >
                        {agent.name[0]}
                      </div>
                      <div>
                        <span className="text-xs font-heading font-semibold" style={{ color: agent.color }}>
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-pacame-white/30 font-body ml-1.5">
                          se encarga
                        </span>
                      </div>
                    </div>
                  )}

                  <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
                    {solution.title}
                  </h3>
                  <p className="text-sm text-pacame-white/50 font-body leading-relaxed">
                    {solution.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recommended services with pricing */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
              Servicios recomendados
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
              Precios claros.{" "}
              <span className="gradient-text-vivid">Sin sorpresas.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {nicheServices.map((service) => {
              if (!service) return null;
              const featured = service.items.find((i) => i.featured) || service.items[0];
              return (
                <div
                  key={service.id}
                  className="rounded-2xl p-7 bg-dark-card border border-white/[0.06]"
                >
                  <h3 className="font-heading font-bold text-xl text-pacame-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-pacame-white/40 font-body mb-5">
                    {featured.name}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {featured.includes.slice(0, 4).map((inc) => (
                      <li key={inc} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-electric-violet mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-pacame-white/55 font-body">{inc}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-white/[0.06] pt-5">
                    <div className="font-heading font-bold text-2xl text-pacame-white mb-1">
                      {featured.price}
                    </div>
                    <div className="text-xs text-pacame-white/30 font-body mb-4">
                      {featured.deadline}
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full rounded-full">
                      <Link href={`/contacto?service=${service.id}`}>
                        Me interesa
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommended package */}
          <div className="max-w-md mx-auto text-center">
            <p className="text-sm text-pacame-white/40 font-body mb-4">
              Quieres todo junto? Ahorra con un paquete:
            </p>
            <PackageCheckoutButton
              packageId={niche.recommendedPackage}
              packageName={niche.recommendedPackage}
              featured
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
              Preguntas frecuentes
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
              Lo que nos preguntan{" "}
              <span className="gradient-text-vivid">los {niche.namePlural}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {niche.faq.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl p-7 bg-dark-card border border-white/[0.06]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-electric-violet flex-shrink-0 mt-0.5" />
                  <h3 className="font-heading font-semibold text-lg text-pacame-white">
                    {item.q}
                  </h3>
                </div>
                <p className="text-sm text-pacame-white/55 font-body leading-relaxed pl-8">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4 text-balance">
            Tu {niche.name} merece mas clientes
          </h2>
          <p className="text-pacame-white/60 font-body mb-10 text-lg leading-relaxed">
            Hablamos 30 minutos, analizamos tu situacion y te decimos exactamente que necesitas. Sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="xl" asChild className="group rounded-full shadow-glow-violet">
              <Link href={`/contacto?service=${niche.recommendedServices[0]}`}>
                Quiero empezar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="rounded-full border-white/[0.08] hover:border-white/20">
              <a href="https://wa.me/34722669381" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                WhatsApp directo
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
