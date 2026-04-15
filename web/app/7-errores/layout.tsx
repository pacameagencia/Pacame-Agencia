import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "7 Errores Digitales que Tu PYME Está Cometiendo (y Cómo Arreglarlos) | PACAME",
  description:
    "Descubre los 7 errores digitales más comunes en PYMEs españolas y cómo solucionarlos. Guía gratuita con soluciones prácticas de PACAME.",
  alternates: { canonical: "https://pacameagencia.com/7-errores" },
  openGraph: {
    title: "7 Errores Digitales que Tu PYME Está Cometiendo | PACAME",
    description: "Los 7 errores digitales que más dinero cuestan a las PYMEs. Descubre si los estás cometiendo.",
    url: "https://pacameagencia.com/7-errores",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function SieteErroresLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "7 Errores", url: "https://pacameagencia.com/7-errores" },
        ]}
      />
      {children}
    </>
  );
}
