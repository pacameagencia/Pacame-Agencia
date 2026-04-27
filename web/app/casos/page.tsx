import type { Metadata } from "next";
import dynamic from "next/dynamic";
import CasesShowcase from "@/components/cinematic/CasesShowcase";
import KineticHeading from "@/components/cinematic/KineticHeading";
import ThemeBodyClass from "@/components/theme/ThemeBodyClass";

const ContactCTA = dynamic(() => import("@/components/cinematic/ContactCTA"));

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Casos de éxito — Resultados reales PACAME",
  description:
    "Tres negocios reales que crecieron con PACAME. Métricas, procesos y aprendizajes concretos. Sin lorem ipsum, sin humo.",
  alternates: { canonical: "https://pacameagencia.com/casos" },
  openGraph: {
    title: "Casos PACAME — Resultados reales de negocios reales",
    description: "Restaurantes, hoteles, clínicas. Antes y después con datos.",
    url: "https://pacameagencia.com/casos",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: ["/generated/optimized/og/casos.webp"],
  },
};

export default function CasosPage() {
  return (
    <>
      <ThemeBodyClass className="theme-tech" />

      {/* Hero específico /casos */}
      <section className="relative isolate overflow-hidden bg-tech-bg pb-16 pt-32 text-tech-text md:pb-24 md:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-tech-mesh opacity-60" />
          <div className="absolute inset-0 bg-tech-grid opacity-[0.04]" style={{ backgroundSize: "48px 48px" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/0 via-tech-bg/0 to-tech-bg" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            <span className="h-px w-8 bg-tech-success" />
            Casos · Resultados verificables
          </span>

          <KineticHeading
            as="h1"
            className="font-sans font-semibold tracking-tight text-tech-text"
            style={{
              fontSize: "clamp(2.75rem, 8vw, 6rem)",
              lineHeight: "0.98",
              letterSpacing: "-0.04em",
            }}
          >
            <span className="block">Resultados reales,</span>
          </KineticHeading>

          <KineticHeading
            as="div"
            delay={300}
            className="mt-1 font-sans font-light tracking-tight"
            style={{
              fontSize: "clamp(2.75rem, 8vw, 6rem)",
              lineHeight: "0.98",
              letterSpacing: "-0.04em",
              background:
                "linear-gradient(120deg, var(--tech-success) 0%, var(--tech-accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <span className="block">negocios reales.</span>
          </KineticHeading>

          <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-tech-text-soft md:text-[19px]">
            Tres PYMEs como la tuya que crecieron en menos de un trimestre con
            PACAME. Las métricas se verifican durante el onboarding.
          </p>
        </div>
      </section>

      <CasesShowcase />
      <ContactCTA />
    </>
  );
}
