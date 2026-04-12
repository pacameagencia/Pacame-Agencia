import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check, ArrowRight, MessageSquare, Phone, Clock,
  CheckCircle2, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  seoServices, seoSectors, seoCities,
  generateAllCombinations, generateTitle, generateMetaDescription,
} from "@/lib/data/seo";

// Generar todas las rutas estaticas
export function generateStaticParams() {
  return generateAllCombinations().map((c) => ({ seoSlug: c.slug }));
}

// Metadata dinamica
export async function generateMetadata({ params }: { params: Promise<{ seoSlug: string }> }): Promise<Metadata> {
  const { seoSlug } = await params;
  const combo = findCombination(seoSlug);
  if (!combo) return { title: "Página no encontrada" };

  const title = `${generateTitle(combo.service, combo.sector, combo.city)} | PACAME`;
  const description = generateMetaDescription(combo.service, combo.sector, combo.city);

  return {
    title,
    description,
    alternates: { canonical: `https://pacameagencia.com/${seoSlug}` },
    openGraph: {
      title,
      description,
      url: `https://pacameagencia.com/${seoSlug}`,
      siteName: "PACAME",
      type: "website",
    },
  };
}

function findCombination(slug: string) {
  for (const service of seoServices) {
    for (const sector of seoSectors) {
      for (const city of seoCities) {
        if (`${service.slug}-${sector.slug}-${city.slug}` === slug) {
          return { service, sector, city };
        }
      }
    }
  }
  return null;
}

export default async function SEOPage({ params }: { params: Promise<{ seoSlug: string }> }) {
  const { seoSlug } = await params;
  const combo = findCombination(seoSlug);
  if (!combo) notFound();

  const { service, sector, city } = combo;
  const pageTitle = generateTitle(service, sector, city);

  // FAQ especificas
  const faqs = [
    {
      q: `¿Cuánto cuesta ${service.nameShort.toLowerCase()} para ${sector.namePlural} en ${city.name}?`,
      a: `Nuestros servicios de ${service.nameShort.toLowerCase()} empiezan ${service.priceFrom}. El precio final depende de la complejidad y el alcance. Te damos presupuesto exacto en 24 horas, sin compromiso.`,
    },
    {
      q: `¿En cuánto tiempo veré resultados?`,
      a: `Depende del servicio. Webs se entregan en 5-10 días. SEO muestra resultados en 60-90 días. Redes sociales y ads generan impacto desde la primera semana. Te damos un timeline concreto antes de empezar.`,
    },
    {
      q: `¿Trabajáis solo en ${city.name}?`,
      a: `Trabajamos con negocios de toda España de forma remota. Aunque estés en ${city.name}, nos coordinamos online. Si prefieres, Pablo puede hacer una videollamada para conocerte.`,
    },
    {
      q: `¿PACAME es una IA de verdad?`,
      a: `Sí. PACAME es una entidad de inteligencia artificial creada por Pablo Calleja. Un equipo de 9 agentes IA especializados que trabajan para tu negocio. Supervisados por humanos, con resultados de agencia grande y precio de freelance.`,
    },
    {
      q: `¿Qué pasa si no me gusta el resultado?`,
      a: `Trabajamos con rondas de revisión hasta que estés satisfecho. Si al final no te convence, te devolvemos el dinero. Sin letra pequeña.`,
    },
  ];

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: `PACAME — ${pageTitle}`,
            description: generateMetaDescription(service, sector, city),
            areaServed: { "@type": "City", name: city.name },
            serviceType: service.name,
            url: `https://pacameagencia.com/${seoSlug}`,
            provider: {
              "@type": "Organization",
              name: "PACAME",
              url: "https://pacameagencia.com",
            },
          }),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[140px] pointer-events-none" style={{ backgroundColor: `${service.color}15` }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-pacame-white/30 font-body mb-8">
            <Link href="/" className="hover:text-pacame-white/50">PACAME</Link>
            <span>/</span>
            <Link href="/servicios" className="hover:text-pacame-white/50">Servicios</Link>
            <span>/</span>
            <span className="text-pacame-white/50">{pageTitle}</span>
          </nav>

          <h1 className="font-heading font-bold text-[clamp(2rem,4.5vw,3.5rem)] text-pacame-white leading-tight mb-6">
            {service.nameShort} para{" "}
            <span style={{ color: service.color }}>{sector.namePlural}</span>
            <br />
            en {city.name}
          </h1>

          <p className="text-lg text-pacame-white/60 font-body max-w-2xl mb-8">
            {service.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="gradient" size="xl" asChild className="group">
              <Link href="/contacto">
                Pide tu diagnóstico gratuito
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="https://wa.me/34722669381" target="_blank" rel="noopener">
                <MessageSquare className="w-4 h-4" />
                Habla con PACAME
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-sm mb-4 uppercase tracking-widest" style={{ color: service.color }}>
            El problema
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-8">
            ¿Tu {sector.name} en {city.name} tiene alguno de estos problemas?
          </h2>
          <div className="space-y-4">
            {sector.problems.map((problem, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 font-heading font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-pacame-white/70 font-body">{problem}</p>
              </div>
            ))}
          </div>
          <p className="text-pacame-white/50 font-body mt-6">
            {city.localFact}
          </p>
        </div>
      </section>

      {/* Solucion */}
      <section className="section-padding bg-pacame-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-sm mb-4 uppercase tracking-widest" style={{ color: service.color }}>
            La solución
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-8">
            Esto es lo que PACAME hace por tu {sector.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: service.color }} />
                <p className="text-sm text-pacame-white/70 font-body">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
            Cómo funciona
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-12">
            De tu problema a la solución en 4 pasos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Cuéntanos", desc: "Rellena el formulario o escríbenos por WhatsApp. Nos cuentas tu problema en 2 minutos." },
              { step: "2", title: "Diagnóstico", desc: "PACAME analiza tu situación y te envía una propuesta personalizada en 24 horas." },
              { step: "3", title: "Ejecución", desc: "Empezamos a trabajar. Entregamos resultados en días, no en semanas." },
              { step: "4", title: "Resultados", desc: "Reporting mensual con métricas reales. Sin permanencias. Cancela cuando quieras." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 font-heading font-bold text-lg"
                  style={{ backgroundColor: `${service.color}20`, color: service.color }}
                >
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-pacame-white mb-2">{item.title}</h3>
                <p className="text-sm text-pacame-white/50 font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section className="section-padding bg-pacame-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4">
            ¿Cuánto cuesta?
          </h2>
          <p className="text-pacame-white/60 font-body mb-8 max-w-xl mx-auto">
            {service.nameShort} para {sector.namePlural}: <strong className="text-pacame-white">{service.priceFrom}</strong>.
            El precio final depende de tu caso concreto. Te damos presupuesto exacto en 24 horas.
          </p>
          <Button variant="gradient" size="xl" asChild className="group">
            <Link href="/contacto">
              Pedir presupuesto sin compromiso
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-8 text-center">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: service.color }} />
                  <div>
                    <h3 className="font-heading font-semibold text-pacame-white mb-2">{faq.q}</h3>
                    <p className="text-sm text-pacame-white/60 font-body leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            ¿Listo para hacer crecer tu {sector.name} en {city.name}?
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Diagnóstico gratuito. Presupuesto en 24 horas. Sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gradient" size="xl" asChild className="group">
              <Link href="/contacto">
                Empezar ahora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
