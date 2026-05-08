import type { Metadata } from "next";
import Link from "next/link";

import CasosSceneClient from "@/components/storybook-3d/casos/CasosSceneClient";
import NoScriptCases from "@/components/storybook-3d/casos/NoScriptCases";
import PersistentCTA from "@/components/storybook-3d/PersistentCTA";

/**
 * Casos 3D — Galería navegable de case-studies (Fase 3).
 *
 * Estructura:
 *  - Hero textual breve (no compite con cards 3D).
 *  - Canvas R3F separado de 70vh con 3 cards rotables (CasosScene).
 *  - SSR fallback NoScriptCases siempre presente.
 *  - PersistentCTA persistente (mismo de la home).
 *
 * Click en card → `/casos/[slug]` (página de detalle ya existente, no se duplica).
 * "Quiero algo así" en NoScriptCases → `/auditoria-3d?case=slug` (Fase 4).
 */

export const metadata: Metadata = {
  title: "Casos de éxito 3D — PACAME",
  description:
    "3 PYMEs reales que crecieron con PACAME. Métricas verificables, no plantillas. Pide tu auditoría 15 min.",
  alternates: { canonical: "https://pacameagencia.com/casos-3d" },
};

export default function CasosTresDPage() {
  return (
    <main className="relative min-h-screen bg-paper text-ink overflow-hidden">
      {/* Hero textual breve */}
      <section className="relative z-10 px-6 pt-32 pb-8 md:px-12 md:pt-40 md:pb-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink/50 hover:text-ink mb-6"
        >
          ← Volver a la home
        </Link>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-4 max-w-2xl mx-auto leading-tight tracking-tight text-balance">
          3 historias.
          <br />
          Métricas reales.
        </h1>
        <p className="text-base md:text-lg text-ink/70 max-w-xl mx-auto">
          Pasa el cursor por cada tarjeta. Click para ver el caso completo.
        </p>
      </section>

      {/* Canvas R3F 70vh con las 3 cards 3D rotables */}
      <section
        aria-label="Galería 3D de casos"
        className="relative w-full"
        style={{ height: "70vh" }}
      >
        <CasosSceneClient />
      </section>

      {/* SSR semántico — siempre presente, oculto si Canvas activo */}
      <NoScriptCases />

      {/* CTA persistente compartido con la home */}
      <PersistentCTA />
    </main>
  );
}
