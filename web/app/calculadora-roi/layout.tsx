import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Calculadora ROI Marketing Digital — Simula tu retorno | PACAME",
  description:
    "Calcula el retorno de inversión de contratar PACAME. Introduce tu sector, ticket medio e inversión para ver cuánto puedes ganar.",
  alternates: { canonical: "https://pacameagencia.com/calculadora-roi" },
  openGraph: {
    title: "Calculadora ROI Marketing Digital | PACAME",
    description: "Simula cuánto puedes ganar invirtiendo en marketing digital.",
    url: "https://pacameagencia.com/calculadora-roi",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Calculadora ROI", url: "https://pacameagencia.com/calculadora-roi" },
        ]}
      />
      {children}
    </>
  );
}
