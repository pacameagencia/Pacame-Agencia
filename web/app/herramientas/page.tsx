import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Palette,
  Calendar,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  FileText,
  ArrowUpRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Herramientas gratis · PACAME",
  description:
    "8 tools profesionales gratis: generador slogan, analisis competencia, paleta de marca, calculadora pricing, calendario contenido, auditoria web, ROI calc, 7 errores comunes.",
  alternates: { canonical: "https://pacameagencia.com/herramientas" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "8 herramientas gratis · PACAME",
    description: "Reciprocidad real: te damos las herramientas que necesitas antes de pedirte nada.",
    url: "https://pacameagencia.com/herramientas",
    siteName: "PACAME",
  },
};

const TOOLS = [
  {
    href: "/herramientas/generador-slogan",
    Icon: Sparkles,
    kicker: "NUEVO · IA",
    title: "Generador de slogans",
    desc: "10 slogans tier-1 para tu marca en 30 segundos. Input: sector + tono + 3 keywords.",
    accent: "#F1E194",
  },
  {
    href: "/herramientas/analisis-competencia",
    Icon: Target,
    kicker: "NUEVO · CRO",
    title: "Analisis competencia",
    desc: "Compara tu web vs competidor: SEO score, velocidad, CTAs visibles. PDF descargable.",
    accent: "#2872A1",
  },
  {
    href: "/herramientas/color-palette-brand",
    Icon: Palette,
    kicker: "NUEVO · BRANDING",
    title: "Paleta de marca",
    desc: "5 colores + 2 fuentes Google generados por IA desde 3 adjetivos. Kit descargable.",
    accent: "#5F4A8B",
  },
  {
    href: "/herramientas/calculadora-pricing",
    Icon: BarChart3,
    kicker: "NUEVO · FINANZAS",
    title: "Calculadora pricing",
    desc: "Calcula tu precio por hora y por proyecto segun costes + horas + margen deseado.",
    accent: "#00A19B",
  },
  {
    href: "/herramientas/calendario-contenido",
    Icon: Calendar,
    kicker: "NUEVO · SOCIAL",
    title: "Calendario de contenido",
    desc: "30 ideas de publicaciones personalizadas para tu sector. CSV + Google Calendar.",
    accent: "#5B0E14",
  },
  {
    href: "/auditoria",
    Icon: Lightbulb,
    kicker: "GRATIS · SEO",
    title: "Auditoria web",
    desc: "En 10 min te decimos SEO score, mobile, speed, security, UX con recomendaciones.",
    accent: "#F1E194",
  },
  {
    href: "/calculadora-roi",
    Icon: TrendingUp,
    kicker: "GRATIS · ROI",
    title: "Calculadora ROI",
    desc: "Simula retorno de inversion con diferentes paquetes PACAME antes de contratar.",
    accent: "#2872A1",
  },
  {
    href: "/7-errores",
    Icon: FileText,
    kicker: "GRATIS · GUIA",
    title: "7 errores comunes",
    desc: "Los fallos digitales mas caros para PYMEs espanolas con como evitarlos.",
    accent: "#5B0E14",
  },
];

export default function HerramientasHubPage() {
  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        {/* Header editorial */}
        <div className="mb-14 md:mb-20 border-b border-ink/10 pb-10">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45 mb-6">
            <span className="text-accent-gold">§ HERRAMIENTAS GRATIS</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Reciprocidad real · Sin registro previo</span>
          </div>
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 items-end">
            <h1 className="font-heading font-bold text-[clamp(2rem,5vw,4.5rem)] text-ink leading-[0.92] tracking-[-0.03em]">
              Te damos las{" "}
              <span className="font-accent italic font-normal text-accent-gold">
                herramientas
              </span>{" "}
              antes que la factura
              <span className="text-accent-burgundy">.</span>
            </h1>
            <p className="text-[17px] text-ink/55 font-body leading-[1.55] max-w-[42ch]">
              8 utilidades profesionales que resuelven micro-problemas reales de tu
              negocio. <span className="text-ink font-medium">Sin email previo</span>.
              Usalas, aprende, llevatelas. Si luego quieres contratarnos, genial.
            </p>
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map((tool, i) => {
            const n = String(i + 1).padStart(2, "0");
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative overflow-hidden rounded-3xl bg-paper border border-ink/[0.08] hover:border-ink/[0.2] transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${tool.accent}10 0%, transparent 60%)`,
                }}
              >
                <div className="p-6 flex flex-col h-full">
                  {/* Chrono + Icon */}
                  <div className="flex items-baseline justify-between border-b border-ink/[0.08] pb-3 mb-5 text-[10px] font-mono uppercase tracking-[0.22em]">
                    <span className="text-ink/50">N°{n}</span>
                    <span style={{ color: tool.accent }}>{tool.kicker}</span>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
                    style={{
                      backgroundColor: `${tool.accent}18`,
                      borderColor: `${tool.accent}35`,
                    }}
                  >
                    <tool.Icon
                      className="w-5 h-5"
                      style={{ color: tool.accent }}
                    />
                  </div>
                  <h3 className="font-heading font-bold text-[18px] text-ink leading-tight mb-2 tracking-[-0.015em]">
                    {tool.title}
                  </h3>
                  <p className="text-[13px] text-ink/55 font-body leading-relaxed flex-1 mb-4">
                    {tool.desc}
                  </p>
                  <div className="flex items-center justify-end pt-3 border-t border-ink/[0.06]">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border border-ink/10 group-hover:border-accent-gold/40 group-hover:bg-accent-gold/10 transition-all">
                      <ArrowUpRight className="w-4 h-4 text-ink/50 group-hover:text-accent-gold transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer CTA */}
        <section className="mt-20 p-10 md:p-14 rounded-3xl border border-accent-gold/20 bg-gradient-to-br from-accent-gold/[0.05] via-transparent to-brand-primary/[0.05] text-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-3">
            ¿Necesitas mas que una herramienta?
          </div>
          <h3 className="font-heading font-bold text-3xl md:text-4xl text-ink leading-tight mb-4 max-w-2xl mx-auto">
            Hacemos el trabajo por ti en{" "}
            <span className="font-accent italic font-normal text-accent-gold">
              7 a 28 dias
            </span>
            .
          </h3>
          <p className="text-ink/60 font-body max-w-xl mx-auto mb-6 leading-relaxed">
            24 servicios desde 49€. 8 verticales con 3 personas cada una. Pago
            cerrado, entrega garantizada, codigo tuyo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/encuentra-tu-solucion"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-accent-gold text-paper font-heading font-semibold text-sm hover:brightness-110 transition"
            >
              Quiz 2 min — recomendacion personalizada
            </Link>
            <Link
              href="/portafolio"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-ink border border-ink/15 hover:border-ink/30 font-heading font-medium text-sm transition"
            >
              Ver portfolio completo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
