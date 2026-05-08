import Link from "next/link";

import { services } from "@/lib/data/services";

/**
 * Copy SEO-optimizado adicional por servicio (~120-150 palabras cada uno).
 * Reglas:
 *  - Sin palabras IA prohibidas (desbloquea, embárcate, viaje, transformador).
 *  - Verbos activos, números concretos, tutea.
 *  - Keywords ricas para indexación: ciudades, sectores, problemas, tickets.
 *  - Links internos a /servicios/[slug] para reforzar arquitectura.
 */
const SEO_COPY: Record<string, { intro: string; benefits: string[]; cta: string }> = {
  web: {
    intro:
      "Webs que convierten para PYMEs en España. Stack moderno (Next.js + Tailwind + Supabase), sin WordPress lento, sin plantillas Themeforest. Optimizadas para Lighthouse 90+, mobile-first, listas para Google Ads y SEO desde el día uno.",
    benefits: [
      "Landing de conversión desde 800€ — entrega en 7 días.",
      "Web corporativa multi-página desde 2.500€ — diseño editorial, blog incluido.",
      "E-commerce Shopify o Stripe Checkout desde 4.000€ — conectado a tu logística.",
    ],
    cta: "Te audito tu web actual y te digo qué romper.",
  },
  seo: {
    intro:
      "SEO técnico y de contenido para que te encuentren cuando importa. Auditorías reales (no plantillas), arquitectura limpia, link building manual y reporting que entiendes. Trabajamos local SEO (Google Business Profile) y national según tu ticket.",
    benefits: [
      "Auditoría SEO completa desde 600€ — informe accionable en 5 días.",
      "Plan SEO mensual desde 300€/mes — 10 keywords objetivo + 2 contenidos.",
      "SEO Premium desde 900€/mes — link building agresivo + technical fixes.",
    ],
    cta: "Pide tu auditoría: te digo si tu sector pinta para SEO.",
  },
  redes: {
    intro:
      "Estrategia + contenido + community para Instagram, TikTok, LinkedIn. Sin posts random ni reels generados con IA al peso. Investigamos a tu audiencia real, definimos pilares y producimos contenido que convierte (no que solo gusta).",
    benefits: [
      "Plan Starter desde 300€/mes — 8 piezas + community 30min/día.",
      "Plan Growth desde 600€/mes — 16 piezas + reels + estrategia trimestral.",
      "Plan Scale desde 1.200€/mes — full stack creativo + ads orgánicas.",
    ],
    cta: "Te muestro 3 cuentas que crecimos cuando pidas auditoría.",
  },
  ads: {
    intro:
      "Meta Ads y Google Ads con foco en ROAS, no en impresiones. Setup limpio (pixel, conversiones API, audiencias), creatividades testeadas (no carruseles random) y optimización semanal con números reales. Trabajamos desde 400€/mes + ad spend.",
    benefits: [
      "Setup de campaña desde 600€ — pixel, audiencias, creativos baseline.",
      "Gestión Meta Ads desde 400€/mes — optimización semanal + reporting.",
      "Gestión Google Ads desde 500€/mes — Performance Max + Search.",
    ],
    cta: "Auditoría gratuita: revisamos tu cuenta actual y veo qué quemas.",
  },
  branding: {
    intro:
      "Identidad visual con criterio: paleta justificada, tipografía con personalidad, logo que funciona en favicon y cartel. Sistema completo (no solo el logo): tokens, variantes, manual de uso, mockups en aplicaciones reales. Trabajamos rebrandings y proyectos desde cero.",
    benefits: [
      "Branding starter desde 400€ — logo + paleta + tipografía + 3 mockups.",
      "Branding completo desde 1.200€ — sistema visual + manual + 10 aplicaciones.",
      "Rebrand premium desde 2.500€ — research + estrategia + roll-out 90 días.",
    ],
    cta: "Mándame tu logo actual y te digo si toca rebrand o solo refresh.",
  },
};

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
        {services.slice(0, 5).map((service) => {
          const seo = SEO_COPY[service.id];
          return (
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
              <p className="text-base md:text-lg text-ink/80 mb-4 max-w-2xl">
                {service.description}
              </p>
              {seo && (
                <p className="text-sm md:text-base text-ink/70 mb-6 max-w-2xl leading-relaxed">
                  {seo.intro}
                </p>
              )}
              <ul className="space-y-2 mb-6 max-w-xl">
                {(seo?.benefits ?? service.items.slice(0, 3).map((i) => `${i.name}${i.price ? ` — ${i.price}` : ""}`)).map(
                  (line, idx) => (
                    <li key={idx} className="flex items-baseline gap-3">
                      <span className="text-terracotta-500 font-mono text-sm">·</span>
                      <span className="text-base text-ink/90">{line}</span>
                    </li>
                  ),
                )}
              </ul>
              <Link
                href={`/servicios/${service.items[0]?.slug ?? ""}`}
                className="inline-block mr-6 text-sm font-medium text-ink/60 hover:text-ink underline-offset-4 hover:underline"
              >
                Ver detalle de {service.name.toLowerCase()} →
              </Link>
              <Link
                href="/auditoria-3d"
                className="inline-block text-sm font-medium text-terracotta-600 hover:text-terracotta-700 underline-offset-4 hover:underline"
              >
                {seo?.cta ?? "Pide tu auditoría 15 min →"}
              </Link>
            </section>
          );
        })}
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
