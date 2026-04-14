import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, ArrowRight, HelpCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServiceBySlug, getAllServiceSlugs, services } from "@/lib/data/services";
import { agents } from "@/lib/data/agents";
import ServiceCheckoutButton from "@/components/ServiceCheckoutButton";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = getServiceBySlug(slug);
  if (!result) return {};
  const { service, item } = result;
  return {
    title: `${item.name} — ${service.name} | PACAME`,
    description: `${item.longDescription.slice(0, 155)}...`,
    alternates: { canonical: `https://pacameagencia.com/servicios/${item.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = getServiceBySlug(slug);
  if (!result) notFound();
  const { service, item } = result;

  // Get related agents
  const relatedAgents = item.relatedAgents
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean);

  // Get related services (same category, different slug)
  const relatedItems = service.items.filter((i) => i.slug !== item.slug).slice(0, 2);

  return (
    <div className="bg-pacame-black min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Servicios", url: "https://pacameagencia.com/servicios" },
          { name: item.name, url: `https://pacameagencia.com/servicios/${item.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/[0.06] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-body text-pacame-white/30 mb-8">
            <Link href="/servicios" className="hover:text-pacame-white/50 transition-colors">
              Servicios
            </Link>
            <span>/</span>
            <Link href={`/servicios#${service.id}`} className="hover:text-pacame-white/50 transition-colors">
              {service.name}
            </Link>
            <span>/</span>
            <span className="text-pacame-white/50">{item.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Content */}
            <div className="lg:col-span-2">
              {item.featured && (
                <span className="inline-block text-[11px] font-body font-semibold text-electric-violet uppercase tracking-wider bg-electric-violet/10 rounded-full px-3 py-1 mb-4">
                  Mas contratado
                </span>
              )}
              <h1 className="font-heading font-bold text-4xl sm:text-5xl text-pacame-white mb-4">
                {item.name}
              </h1>
              <p className="text-xl text-pacame-white/60 font-body leading-relaxed mb-8">
                {item.longDescription}
              </p>

              {/* Who works on this */}
              {relatedAgents.length > 0 && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-pacame-white/30" />
                  <div className="flex items-center gap-2">
                    {relatedAgents.map((agent) => agent && (
                      <Link
                        key={agent.id}
                        href="/equipo"
                        className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full transition-colors"
                        style={{ backgroundColor: `${agent.color}10`, color: agent.color }}
                      >
                        {agent.name}
                      </Link>
                    ))}
                    <span className="text-xs text-pacame-white/30 font-body">trabajan en esto</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Pricing card */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl p-7 bg-dark-card border border-white/[0.06] sticky top-28">
                <div className="font-heading font-bold text-3xl text-pacame-white mb-1">
                  {item.price}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-pacame-white/40 font-body mb-6">
                  <Clock className="w-3.5 h-3.5" />
                  {item.deadline}
                </div>

                {/* Checkout */}
                <div className="mb-4">
                  <ServiceCheckoutButton
                    serviceName={item.name}
                    serviceCategory={service.name}
                    featured={item.featured}
                  />
                </div>
                <Link
                  href={`/contacto?service=${service.id}`}
                  className="block text-center text-xs text-pacame-white/30 hover:text-pacame-white/50 font-body transition-colors"
                >
                  o hablar primero sin compromiso
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-heading font-bold text-2xl text-pacame-white mb-8">
            Que incluye
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {item.includes.map((inc) => (
              <div key={inc} className="flex items-start gap-3 p-4 rounded-xl bg-dark-card border border-white/[0.04]">
                <Check className="w-5 h-5 text-lime-pulse flex-shrink-0 mt-0.5" />
                <span className="text-sm text-pacame-white/65 font-body">{inc}</span>
              </div>
            ))}
          </div>

          {item.deliverables.length > 0 && (
            <div className="mt-10">
              <h3 className="font-heading font-semibold text-lg text-pacame-white mb-5">
                Entregables exactos
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.deliverables.map((d) => (
                  <span
                    key={d}
                    className="text-xs font-body px-3 py-1.5 rounded-full bg-electric-violet/8 text-electric-violet/80 border border-electric-violet/15"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Process */}
      {item.process.length > 0 && (
        <section className="section-padding relative">
          <div className="absolute top-0 inset-x-0 section-divider" />
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-heading font-bold text-2xl text-pacame-white mb-10">
              Como lo hacemos
            </h2>
            <div className="space-y-6">
              {item.process.map((step, i) => (
                <div key={step.step} className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-violet/10 flex items-center justify-center">
                    <span className="font-heading font-bold text-sm text-electric-violet">
                      {i + 1}
                    </span>
                  </div>
                  <div className="pt-1">
                    <h3 className="font-heading font-semibold text-lg text-pacame-white mb-1">
                      {step.step}
                    </h3>
                    <p className="text-sm text-pacame-white/50 font-body">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {item.faq.length > 0 && (
        <section className="section-padding relative">
          <div className="absolute top-0 inset-x-0 section-divider" />
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-heading font-bold text-2xl text-pacame-white mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {item.faq.map((f) => (
                <div key={f.q} className="rounded-2xl p-6 bg-dark-card border border-white/[0.06]">
                  <div className="flex items-start gap-3 mb-2">
                    <HelpCircle className="w-5 h-5 text-electric-violet flex-shrink-0 mt-0.5" />
                    <h3 className="font-heading font-semibold text-pacame-white">{f.q}</h3>
                  </div>
                  <p className="text-sm text-pacame-white/55 font-body pl-8">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related services */}
      {relatedItems.length > 0 && (
        <section className="section-padding relative">
          <div className="absolute top-0 inset-x-0 section-divider" />
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-heading font-bold text-2xl text-pacame-white mb-8">
              Tambien te puede interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedItems.map((related) => (
                <Link
                  key={related.slug}
                  href={`/servicios/${related.slug}`}
                  className="group rounded-2xl p-7 bg-dark-card border border-white/[0.06] hover:border-electric-violet/20 transition-all duration-500"
                >
                  <h3 className="font-heading font-bold text-xl text-pacame-white mb-2">
                    {related.name}
                  </h3>
                  <p className="text-sm text-pacame-white/50 font-body mb-4">
                    {related.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-pacame-white/70">{related.price}</span>
                    <ArrowRight className="w-4 h-4 text-pacame-white/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="section-padding bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4 text-balance">
            Listo para empezar?
          </h2>
          <p className="text-pacame-white/60 font-body mb-10 text-lg">
            Contratalo ahora o hablamos primero. Sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="xl" asChild className="group rounded-full shadow-glow-violet">
              <Link href={`/contacto?service=${service.id}`}>
                Hablar con el equipo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="rounded-full border-white/[0.08] hover:border-white/20">
              <Link href="/servicios">
                Ver todos los servicios
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
