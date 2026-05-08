import Link from "next/link";

import { caseStudies } from "@/lib/data/case-studies";

/**
 * Contenido HTML semántico SSR para crawlers + a11y + reduced-motion.
 *
 * Renderiza los 3 case studies principales como `<article>` con
 * metric headline + cliente + sector + summary + link al detalle existente
 * en `/casos/[slug]`.
 *
 * Visible siempre en el DOM. CSS lo oculta visualmente cuando Canvas activo.
 */

interface NoScriptCasesProps {
  /** Si `true`, fuerza visibilidad (modo reducido). */
  visible?: boolean;
}

export default function NoScriptCases({ visible = false }: NoScriptCasesProps) {
  const topCases = caseStudies.slice(0, 3);

  return (
    <div
      className={
        visible
          ? "relative z-0 px-6 py-16 md:px-12 md:py-24"
          : "sr-only focus-within:not-sr-only"
      }
      aria-label="Casos de éxito PACAME"
    >
      <header className="mx-auto max-w-3xl text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-4">
          Casos de éxito
        </h1>
        <p className="text-lg text-ink/70">
          3 PYMEs reales. Resultados verificables. Cero plantillas.
        </p>
      </header>

      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {topCases.map((cs) => (
          <article
            key={cs.slug}
            className="rounded-2xl border border-ink/10 bg-paper p-6 hover:border-terracotta-500/40 transition-colors"
          >
            <div className="text-5xl md:text-6xl font-display font-bold text-terracotta-500 mb-3">
              {cs.metricHeadline}
            </div>
            <p className="text-sm text-ink/70 mb-4 min-h-[2.5rem]">
              {cs.metricSubtitle}
            </p>
            <h2 className="font-display text-xl font-bold text-ink mb-1">
              {cs.clientName}
            </h2>
            <p className="text-xs font-mono uppercase tracking-wider text-ink/50 mb-4">
              {cs.sector} · {cs.city}
            </p>
            <p className="text-sm text-ink/80 mb-6 line-clamp-3">{cs.summary}</p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/casos/${cs.slug}`}
                className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700 underline-offset-4 hover:underline"
              >
                Ver caso completo →
              </Link>
              <Link
                href={`/auditoria-3d?case=${cs.slug}`}
                className="text-sm font-medium text-ink/70 hover:text-ink underline-offset-4 hover:underline"
              >
                Quiero algo así →
              </Link>
            </div>
          </article>
        ))}
      </div>

      <footer className="mx-auto max-w-3xl text-center mt-16">
        <Link
          href="/casos"
          className="inline-flex items-center justify-center rounded-full border border-ink/20 px-6 py-3 text-base font-medium text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          Ver todos los casos
        </Link>
      </footer>
    </div>
  );
}
