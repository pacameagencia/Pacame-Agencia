import type { Metadata } from "next";
import Link from "next/link";

import AuditoriaForm from "@/components/storybook-3d/auditoria/AuditoriaForm";
import AuditoriaSceneClient from "@/components/storybook-3d/auditoria/AuditoriaSceneClient";
import { caseStudies } from "@/lib/data/case-studies";
import {
  PROBLEM_OPTIONS,
  SECTOR_OPTIONS,
  type ProblemOption,
  type SectorOption,
} from "@/lib/storybook/auditoria-schema";

/**
 * Auditoría 15 min — Fase 4.
 *
 * Estructura:
 *  - Hero textual breve (vuelve a home).
 *  - Sección con AuditoriaScene 3D (escena íntima taza+libreta) + form HTML overlay.
 *  - Pre-rellenado opcional desde ?case=slug (mapea sector + problem del caso).
 *
 * Form envía POST /api/leads con campos extra en sage_analysis_extra.
 */

export const metadata: Metadata = {
  title: "Pide tu auditoría 15 min — PACAME",
  description:
    "Te cuento qué falla en tu web/SEO/redes/ads/branding y cómo arreglarlo. 15 min, sin compromiso, gratis.",
  alternates: { canonical: "https://pacameagencia.com/auditoria-3d" },
  // No indexar: es una página de conversión, no de SEO.
  robots: { index: false, follow: false },
};

/**
 * Mapea un caso a sector + problemas pre-rellenados del form.
 * Heurística simple basada en el case_study (sector textual + tags).
 */
function prefillFromCase(slug: string | undefined): {
  sector?: SectorOption;
  problem?: ProblemOption[];
} | null {
  if (!slug) return null;
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return null;

  // Mapeo sector textual → SectorOption
  const sectorLower = cs.sector.toLowerCase();
  let sector: SectorOption | undefined;
  if (sectorLower.includes("belleza") || sectorLower.includes("salud")) sector = "salud";
  else if (sectorLower.includes("gimnas") || sectorLower.includes("fitness")) sector = "salud";
  else if (sectorLower.includes("retail") || sectorLower.includes("tienda")) sector = "retail";
  else if (sectorLower.includes("hosteleria") || sectorLower.includes("restaur")) sector = "hosteleria";
  else if (sectorLower.includes("ecommerce") || sectorLower.includes("e-commerce")) sector = "ecommerce";
  else if (sectorLower.includes("b2b") || sectorLower.includes("empresa")) sector = "b2b";
  else if (sectorLower.includes("educac")) sector = "educacion";
  else if (sectorLower.includes("servicio")) sector = "servicios";
  else sector = "otro";

  // Heurística problemas según tags del caso
  const problem: ProblemOption[] = [];
  const tagsLower = cs.tags.map((t) => t.toLowerCase()).join(" ");
  if (tagsLower.includes("seo") || tagsLower.includes("local")) problem.push("bajo-seo");
  if (tagsLower.includes("ads") || tagsLower.includes("meta")) problem.push("ads-no-rentan");
  if (tagsLower.includes("brand") || tagsLower.includes("identidad")) problem.push("branding-debil");
  if (tagsLower.includes("reservas") || tagsLower.includes("whatsapp") || tagsLower.includes("leads")) {
    problem.push("no-captamos-leads");
  }
  if (tagsLower.includes("web") && !problem.includes("no-captamos-leads")) {
    problem.push("web-rota");
  }
  // Si no encontramos nada, default a "no-captamos-leads"
  if (problem.length === 0) problem.push("no-captamos-leads");

  // Validar que las opciones existen en SECTOR_OPTIONS y PROBLEM_OPTIONS
  const validSector = SECTOR_OPTIONS.includes(sector) ? sector : undefined;
  const validProblems = problem.filter((p) =>
    PROBLEM_OPTIONS.includes(p),
  );

  return {
    sector: validSector,
    problem: validProblems.length > 0 ? validProblems : undefined,
  };
}

interface AuditoriaPageProps {
  searchParams: Promise<{ case?: string }>;
}

export default async function AuditoriaTresDPage({
  searchParams,
}: AuditoriaPageProps) {
  const params = await searchParams;
  const caseSlug = params.case;
  const prefill = prefillFromCase(caseSlug);

  return (
    <main className="relative min-h-screen bg-paper text-ink overflow-hidden">
      {/* Header */}
      <section className="relative z-10 px-6 pt-24 pb-6 md:px-12 md:pt-32 md:pb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink/50 hover:text-ink mb-4"
        >
          ← Volver
        </Link>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink mb-3 max-w-2xl mx-auto leading-tight tracking-tight text-balance">
          Pide tu auditoría 15 min
        </h1>
        <p className="text-base md:text-lg text-ink/70 max-w-xl mx-auto">
          Te cuento qué falla y cómo arreglarlo. Sin compromiso, sin venta.
        </p>
      </section>

      {/* Layout split: escena 3D izquierda + form derecha (desktop) */}
      <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 md:px-12 max-w-6xl mx-auto pb-32">
        {/* Canvas 3D — sticky en desktop, oculto mobile en favor del form */}
        <div className="hidden lg:block relative">
          <div className="sticky top-32" style={{ height: "60vh" }}>
            <AuditoriaSceneClient />
          </div>
        </div>

        {/* Form */}
        <div className="relative z-10">
          <AuditoriaForm
            prefillFromCase={prefill}
            caseSlug={caseSlug}
          />

          {prefill && caseSlug && (
            <p className="text-xs text-ink/50 mt-4 text-center font-mono uppercase tracking-wider">
              Pre-rellenado desde caso:{" "}
              <span className="text-terracotta-600">{caseSlug}</span>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
