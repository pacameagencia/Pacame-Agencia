import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, ArrowRight, HelpCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServiceBySlug, getAllServiceSlugs, services } from "@/lib/data/services";
import { agents } from "@/lib/data/agents";
import ServiceCheckoutButton from "@/components/ServiceCheckoutButton";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import { createServerSupabase } from "@/lib/supabase/server";
import ExpressServicePage, {
  type ExpressProduct,
} from "@/components/marketplace/ExpressServicePage";

interface Props {
  params: Promise<{ slug: string }>;
}

// Revalidate cada 5 min — pagina de detalle de servicio
export const revalidate = 300;

// Allow on-demand rendering for marketplace slugs not in the static list
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

async function fetchMarketplaceProduct(slug: string): Promise<ExpressProduct | null> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("service_catalog")
      .select(
        "slug, name, tagline, description, price_cents, currency, agent_id, delivery_sla_hours, revisions_included, features, faq, cover_image_url, is_active"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return null;
    return {
      slug: data.slug as string,
      name: data.name as string,
      tagline: (data.tagline as string) || null,
      description: (data.description as string) || null,
      price_cents: data.price_cents as number,
      currency: (data.currency as string) || "eur",
      agent_id: data.agent_id as string,
      delivery_sla_hours: data.delivery_sla_hours as number,
      revisions_included: (data.revisions_included as number) ?? 2,
      features: (data.features as string[]) || [],
      faq: (data.faq as { q: string; a: string }[]) || [],
      cover_image_url: (data.cover_image_url as string) || null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = getServiceBySlug(slug);
  if (result) {
    const { service, item } = result;
    return {
      title: `${item.name} — ${service.name} | PACAME`,
      description: `${item.longDescription.slice(0, 155)}...`,
      alternates: { canonical: `https://pacameagencia.com/servicios/${item.slug}` },
      openGraph: {
        title: `${item.name} — ${service.name} | PACAME`,
        description: item.description,
        url: `https://pacameagencia.com/servicios/${item.slug}`,
        siteName: "PACAME",
        type: "website",
        locale: "es_ES",
      },
    };
  }

  // Fallback: marketplace product
  const mk = await fetchMarketplaceProduct(slug);
  if (!mk) return {};
  const description = mk.tagline || mk.description || mk.name;
  return {
    title: `${mk.name} — ${(mk.price_cents / 100).toFixed(0)}€ | PACAME`,
    description: description.slice(0, 155),
    alternates: { canonical: `https://pacameagencia.com/servicios/${mk.slug}` },
    openGraph: {
      title: `${mk.name} | PACAME`,
      description,
      url: `https://pacameagencia.com/servicios/${mk.slug}`,
      siteName: "PACAME",
      type: "website",
      locale: "es_ES",
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = getServiceBySlug(slug);
  if (!result) {
    // Try marketplace catalog before 404
    const mk = await fetchMarketplaceProduct(slug);
    if (mk) {
      return <ExpressServicePage product={mk} />;
    }
    notFound();
  }
  const { service, item } = result;

  // Get related agents
  const relatedAgents = item.relatedAgents
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean);

  // Get related services (same category, different slug)
  const relatedItems = service.items.filter((i) => i.slug !== item.slug).slice(0, 2);

  return (
    <div className="bg-paper min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Servicios", url: "https://pacameagencia.com/servicios" },
          { name: item.name, url: `https://pacameagencia.com/servicios/${item.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-olympus-radial pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-body text-ink/30 mb-8">
            <Link href="/servicios" className="hover:text-ink/50 transition-colors">
              Servicios
            </Link>
            <span>/</span>
            <Link href={`/servicios#${service.id}`} className="hover:text-ink/50 transition-colors">
              {service.name}
            </Link>
            <span>/</span>
            <span className="text-ink/50">{item.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Content */}
            <div className="lg:col-span-2">
              {item.featured && (
                <span className="inline-block text-[11px] font-body font-semibold text-accent-gold uppercase tracking-wider bg-accent-gold/10 rounded-full px-3 py-1 mb-4 border border-accent-gold/20">
                  Mas contratado
                </span>
              )}
              <h1 className="font-accent font-bold text-4xl sm:text-5xl text-ink mb-4">
                {item.name}
              </h1>
              <p className="text-xl text-ink/60 font-body leading-relaxed mb-8">
                {item.longDescription}
              </p>

              {/* Who works on this */}
              {relatedAgents.length > 0 && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-ink/30" />
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
                    <span className="text-xs text-ink/30 font-body">trabajan en esto</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Pricing card */}
            <div className="lg:col-span-1">
              <CardTilt tiltMaxAngle={6} scale={1.02}>
              <CardTiltContent>
              <div className="rounded-2xl p-7 bg-paper-deep border border-ink/[0.06] sticky top-28 card-golden-shine">
                <div className="font-heading font-bold text-3xl text-ink mb-1">
                  {item.price}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-ink/40 font-body mb-6">
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
                  className="block text-center text-xs text-ink/30 hover:text-ink/50 font-body transition-colors"
                >
                  o hablar primero sin compromiso
                </Link>
              </div>
              </CardTiltContent>
              </CardTilt>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* What's included */}
      <section className="section-padding relative">
        <div className="px-6"><GoldenDivider variant="line" /></div>
        <div className="max-w-4xl mx-auto px-6">
          <ScrollReveal>
          <h2 className="font-heading font-bold text-2xl text-ink mb-8">
            Que incluye
          </h2>
          </ScrollReveal>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.06}>
            {item.includes.map((inc) => (
              <StaggerItem key={inc}>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-paper-deep border border-white/[0.04]">
                <Check className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-ink/65 font-body">{inc}</span>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {item.deliverables.length > 0 && (
            <div className="mt-10">
              <h3 className="font-heading font-semibold text-lg text-ink mb-5">
                Entregables exactos
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.deliverables.map((d) => (
                  <span
                    key={d}
                    className="text-xs font-body px-3 py-1.5 rounded-full bg-brand-primary/8 text-accent-gold/80 border border-accent-gold/15"
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
          <div className="px-6"><GoldenDivider variant="line" /></div>
          <div className="max-w-4xl mx-auto px-6">
            <ScrollReveal>
            <h2 className="font-heading font-bold text-2xl text-ink mb-10">
              Como lo hacemos
            </h2>
            </ScrollReveal>
            <div className="space-y-6">
              {item.process.map((step, i) => (
                <ScrollReveal key={step.step} delay={i * 0.1}>
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center">
                    <span className="font-heading font-bold text-sm text-accent-gold">
                      {i + 1}
                    </span>
                  </div>
                  <div className="pt-1">
                    <h3 className="font-heading font-semibold text-lg text-ink mb-1">
                      {step.step}
                    </h3>
                    <p className="text-sm text-ink/50 font-body">
                      {step.description}
                    </p>
                  </div>
                </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {item.faq.length > 0 && (
        <section className="section-padding relative">
          <div className="px-6"><GoldenDivider variant="line" /></div>
          <div className="max-w-4xl mx-auto px-6">
            <ScrollReveal>
            <h2 className="font-heading font-bold text-2xl text-ink mb-8">
              Preguntas frecuentes
            </h2>
            </ScrollReveal>
            <div className="space-y-4">
              {item.faq.map((f, i) => (
                <ScrollReveal key={f.q} delay={i * 0.08}>
                <div className="rounded-2xl p-6 bg-paper-deep border border-ink/[0.06] card-golden-shine">
                  <div className="flex items-start gap-3 mb-2">
                    <HelpCircle className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                    <h3 className="font-heading font-semibold text-ink">{f.q}</h3>
                  </div>
                  <p className="text-sm text-ink/55 font-body pl-8">{f.a}</p>
                </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related services */}
      {relatedItems.length > 0 && (
        <section className="section-padding relative">
          <div className="px-6"><GoldenDivider variant="laurel" /></div>
          <div className="max-w-4xl mx-auto px-6">
            <ScrollReveal>
            <h2 className="font-heading font-bold text-2xl text-ink mb-8">
              Tambien te puede interesar
            </h2>
            </ScrollReveal>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-5" staggerDelay={0.1}>
              {relatedItems.map((related) => (
                <StaggerItem key={related.slug}>
                <CardTilt tiltMaxAngle={8} scale={1.02}>
                <CardTiltContent>
                <Link
                  href={`/servicios/${related.slug}`}
                  className="group block rounded-2xl p-7 bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/20 transition-all duration-500 card-golden-shine"
                >
                  <h3 className="font-heading font-bold text-xl text-ink mb-2">
                    {related.name}
                  </h3>
                  <p className="text-sm text-ink/50 font-body mb-4">
                    {related.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-ink/70">{related.price}</span>
                    <ArrowRight className="w-4 h-4 text-ink/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                </CardTiltContent>
                </CardTilt>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="section-padding bg-paper text-center">
        <ScrollReveal className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-ink mb-4 text-balance">
            Listo para empezar?
          </h2>
          <p className="text-ink/60 font-body mb-10 text-lg">
            Contratalo ahora o hablamos primero. Sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MagneticButton>
              <ShinyButton
                gradientFrom="#E8B730"
                gradientTo="#B54E30"
                gradientOpacity={0.8}
                className="group min-w-[260px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
              >
                <Link href={`/contacto?service=${service.id}`} className="flex items-center gap-2 text-ink">
                  Hablar con el equipo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </ShinyButton>
            </MagneticButton>
            <Button variant="outline" size="xl" asChild className="rounded-full border-ink/[0.08] hover:border-white/20">
              <Link href="/servicios">
                Ver todos los servicios
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
