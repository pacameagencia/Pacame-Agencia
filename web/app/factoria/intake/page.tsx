import type { Metadata } from "next";
import IntakeForm from "./IntakeForm";

export const metadata: Metadata = {
  title: "Pega tu web · Factoría · PACAME",
  description:
    "Pega la URL de tu web y la factoría PACAME extrae automáticamente tus colores, fuentes, logo y sector en 15 segundos. Después lanzamos la factoría con tu identidad ya pre-configurada.",
  alternates: { canonical: "https://pacameagencia.com/factoria/intake" },
};

export default function FactoriaIntakePage() {
  return (
    <main className="relative min-h-screen bg-paper overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="mb-12 pb-6 border-b-2 border-ink">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">
            Cuaderno · Factoría · Intake
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold leading-[0.95] tracking-tight text-ink mb-8">
          Pega tu web. <br />
          <span className="text-terracotta-500">Te genero la factoría</span> en 15 segundos.
        </h1>

        <p className="text-lg md:text-xl text-ink-mute max-w-2xl mb-12 leading-relaxed">
          Tu URL → Firecrawl scrapea tus colores, tipografía, logo, copy y sector. La
          factoría empieza con tu marca ya pre-configurada. Cero formularios de 30 campos.
        </p>

        <IntakeForm />

        <div className="mt-16 pt-8 border-t border-ink-mute/20">
          <p className="font-mono text-xs tracking-wider uppercase text-ink-mute mb-3">
            ¿Qué pasa con mis datos?
          </p>
          <ul className="text-sm text-ink-mute space-y-2 max-w-2xl">
            <li>· Solo se cachean 24 h tu brand brief (colores, fonts, logo). Sin datos personales.</li>
            <li>· No publicamos nada, no creamos cuenta. Esto es un preview.</li>
            <li>· Si decides lanzar la factoría, te pediremos lo mínimo (contacto + sector).</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
