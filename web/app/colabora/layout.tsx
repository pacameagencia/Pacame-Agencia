import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Programa de Referidos — Gana Comisiones Recurrentes | PACAME",
  description:
    "Gana comisiones recurrentes recomendando PACAME. Hasta un 25% de comisión por cada cliente referido. Sin límite de ingresos.",
  alternates: { canonical: "https://pacameagencia.com/colabora" },
  openGraph: {
    title: "Programa de Referidos — Gana Comisiones Recurrentes | PACAME",
    description: "Recomienda PACAME y gana hasta 25% de comisión recurrente.",
    url: "https://pacameagencia.com/colabora",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function ColaboraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Colabora", url: "https://pacameagencia.com/colabora" },
        ]}
      />
      {children}
    </>
  );
}
