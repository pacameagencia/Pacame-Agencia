import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AgentsSpotlight from "@/components/cinematic/AgentsSpotlight";
import KineticHeading from "@/components/cinematic/KineticHeading";
import ThemeBodyClass from "@/components/theme/ThemeBodyClass";

const ContactCTA = dynamic(() => import("@/components/cinematic/ContactCTA"));

export const metadata: Metadata = {
  title: "Agentes IA — La redacción PACAME · 7 especialistas",
  description:
    "Conoce a Nova, Atlas, Nexus, Pixel, Core, Pulse y Sage. 7 agentes IA editoriales supervisados por Pablo Calleja, CEO. Personajes generados por IA con disclaimer claro.",
  alternates: { canonical: "https://pacameagencia.com/agentes" },
  openGraph: {
    title: "La redacción PACAME — 7 agentes IA + 1 editor humano",
    description: "Cada agente domina su disciplina. Pablo revisa cada entrega.",
    url: "https://pacameagencia.com/agentes",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: ["/generated/optimized/og/agentes.webp"],
  },
};

export default function AgentesPage() {
  return (
    <>
      <ThemeBodyClass className="theme-tech" />

      {/* Hero específico /agentes — más contenido editorial */}
      <section className="relative isolate overflow-hidden bg-tech-bg pb-16 pt-32 text-tech-text md:pb-24 md:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-tech-mesh opacity-70" />
          <div className="absolute inset-0 bg-tech-grid opacity-[0.04]" style={{ backgroundSize: "48px 48px" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/0 via-tech-bg/0 to-tech-bg" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            <span className="h-px w-8 bg-tech-accent-2" />
            La redacción · 7 + 1
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
            <span className="block">Siete agentes IA.</span>
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
                "linear-gradient(120deg, var(--tech-accent-2) 0%, var(--tech-accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <span className="block">Un editor jefe humano.</span>
          </KineticHeading>

          <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-tech-text-soft md:text-[19px]">
            PACAME funciona como una redacción editorial. Cada agente IA
            domina una disciplina concreta. Pablo Calleja, CEO y director
            editorial, revisa, corrige y firma cada entrega. No hay piloto
            automático.
          </p>
        </div>
      </section>

      <AgentsSpotlight />
      <ContactCTA />
    </>
  );
}
