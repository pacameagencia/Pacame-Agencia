import Link from "next/link";

import { services } from "@/lib/data/services";

/**
 * Contenido HTML semántico SSR para crawlers + usuarios sin WebGL2 + reduced-motion.
 *
 * Reglas:
 *   - Siempre presente en el DOM (NO `display:none` puro). Visible a screen readers.
 *   - CSS oculta visualmente cuando WebGL2 OK + sin reduced-motion (clase `sr-only-canvas`).
 *   - 5 servicios como `<section>` con `<h2>` + descripción + items + CTA.
 *   - CTA único: "Pide tu auditoría 15 min" → `/auditoria-3d`.
 *
 * Esto es lo que Google indexará y lo que ven dispositivos sin Canvas.
 * Acepta clase opcional para que el page.tsx oculte si Canvas está activo.
 */

interface NoScriptContentProps {
  /** Si `true`, fuerza visibilidad incluso con WebGL2 (modo reducido manual). */
  visible?: boolean;
}

export default function NoScriptContent({ visible = false }: NoScriptContentProps) {
  return (
    <div
      // Visible si visible=true. Si false, oculto visualmente pero accesible.
      className={
        visible
          ? "relative z-0 px-6 py-24 md:px-12 md:py-32"
          : "sr-only focus-within:not-sr-only"
      }
      aria-label="Contenido alternativo de la home Storybook 3D"
    >
      <header className="mx-auto max-w-3xl text-center mb-16">
        <h1 className="font-display text-4xl md:text-6xl font-bold text-ink mb-6">
          Tu agencia de IA.
          <br />
          5 servicios. 1 transformación.
        </h1>
        <p className="text-lg md:text-xl text-ink/80 mb-8">
          PACAME es una agencia digital que resuelve problemas reales para PYMEs en
          España. Web, SEO, redes, ads y branding — orquestados por agentes de IA
          supervisados por humanos.
        </p>
        <Link
          href="/auditoria-3d"
          className="inline-flex items-center justify-center rounded-full bg-terracotta-500 px-8 py-4 text-lg font-medium text-paper hover:bg-terracotta-600 transition-colors"
        >
          Pide tu auditoría 15 min
        </Link>
      </header>

      <div className="mx-auto max-w-5xl space-y-16">
        {services.slice(0, 5).map((service) => (
          <section
            key={service.id}
            className="border-l-4 border-terracotta-500 pl-6 md:pl-8"
            aria-labelledby={`service-${service.id}-title`}
          >
            <h2
              id={`service-${service.id}-title`}
              className="font-display text-3xl md:text-4xl font-bold text-ink mb-4"
            >
              {service.name}
            </h2>
            <p className="text-base md:text-lg text-ink/80 mb-6 max-w-2xl">
              {service.description}
            </p>
            <ul className="space-y-2 mb-6 max-w-xl">
              {service.items.slice(0, 3).map((item) => (
                <li key={item.slug} className="flex items-baseline gap-3">
                  <span className="text-terracotta-500 font-mono text-sm">·</span>
                  <span className="text-base text-ink/90">
                    <strong>{item.name}</strong>
                    {item.price && (
                      <span className="text-ink/60 font-mono text-sm ml-2">
                        — {item.price}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/auditoria-3d"
              className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700 underline-offset-4 hover:underline"
            >
              Pide tu auditoría 15 min →
            </Link>
          </section>
        ))}
      </div>

      <footer className="mx-auto max-w-3xl text-center mt-24">
        <p className="text-sm text-ink/60 mb-4">
          ¿Listo para empezar? Auditoría gratuita, 15 minutos, sin compromiso.
        </p>
        <Link
          href="/auditoria-3d"
          className="inline-flex items-center justify-center rounded-full border border-ink/20 px-6 py-3 text-base font-medium text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          Pide tu auditoría
        </Link>
      </footer>
    </div>
  );
}
