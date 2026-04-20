import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LeadMagnetForm from "./LeadMagnetForm";

// ISR: lead magnet — 1h cache
export const revalidate = 3600;

interface LeadMagnetConfig {
  slug: string;
  headline: string;
  subheadline: string;
  description: string;
  benefits: string[];
  ctaText: string;
}

const leadMagnets: Record<string, LeadMagnetConfig> = {
  "auditoria-web": {
    slug: "auditoria-web",
    headline: "Auditoria Web Gratuita",
    subheadline:
      "Descubre que esta frenando tu web con un analisis profesional en 24h",
    description:
      "Nuestros agentes de IA analizan tu web de arriba a abajo: velocidad, SEO, diseno, conversion y seguridad. Recibes un informe completo con las mejoras prioritarias para multiplicar tus resultados.",
    benefits: [
      "Analisis de velocidad y rendimiento",
      "Revision SEO: errores tecnicos y oportunidades",
      "Evaluacion de experiencia de usuario",
      "Analisis de conversion y llamadas a la accion",
      "Plan de mejora priorizado",
    ],
    ctaText: "Quiero mi auditoria gratis",
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(leadMagnets).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = leadMagnets[slug];
  if (!config) return {};

  return {
    title: `${config.headline} — PACAME Agencia Digital`,
    description: config.subheadline,
    alternates: { canonical: `https://pacameagencia.com/gratis/${slug}` },
    openGraph: {
      title: config.headline,
      description: config.subheadline,
      url: `https://pacameagencia.com/gratis/${slug}`,
      siteName: "PACAME",
      type: "website",
      locale: "es_ES",
    },
  };
}

export default async function LeadMagnetPage({ params }: PageProps) {
  const { slug } = await params;
  const config = leadMagnets[slug];
  if (!config) notFound();

  return (
    <main className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-radial from-electric-violet/10 via-olympus-gold/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lime-pulse/30 bg-lime-pulse/5 text-lime-pulse text-xs font-heading font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-pulse animate-pulse" />
                100% gratis
              </span>

              <h1 className="font-accent font-bold text-4xl sm:text-5xl text-pacame-white leading-tight tracking-tight">
                {config.headline}
              </h1>

              <p className="mt-6 text-lg text-pacame-white/60 font-body leading-relaxed">
                {config.subheadline}
              </p>

              <p className="mt-4 text-sm text-pacame-white/40 font-body leading-relaxed">
                {config.description}
              </p>

              {/* Benefits */}
              <ul className="mt-8 space-y-3">
                {config.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-pacame-white/70 font-body text-sm"
                  >
                    <svg
                      className="w-5 h-5 text-lime-pulse flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form */}
            <div>
              <LeadMagnetForm slug={config.slug} ctaText={config.ctaText} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-pacame-white/30 font-body text-sm">
            Mas de 150 PYMEs espanolas ya han recibido su auditoria. Sin
            spam, sin compromisos, solo un informe util para mejorar tu web.
          </p>
        </div>
      </section>
    </main>
  );
}
