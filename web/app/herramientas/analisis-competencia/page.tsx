import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import CompetitorClient from "./CompetitorClient";

export const metadata: Metadata = {
  title: "Analisis competencia web · PACAME",
  description:
    "Compara tu web vs competidor: SEO score, velocidad, titulos, meta, CTAs visibles. 30 segundos.",
  alternates: { canonical: "https://pacameagencia.com/herramientas/analisis-competencia" },
};

export default function CompetitorPage() {
  return (
    <ToolLayout
      kicker="§ TOOL 02 · CRO"
      title="Tu web vs tu competidor, lado a lado"
      titleAccent="lado a lado"
      desc="Introduce tu URL + la del competidor que mas miedo te da. Comparamos SEO score, titulo, meta description, CTAs visibles y Core Web Vitals en 30 segundos. Gratis."
      ctaText="Auditoria completa con Pablo"
      ctaHref="/auditoria"
    >
      <CompetitorClient />
    </ToolLayout>
  );
}
