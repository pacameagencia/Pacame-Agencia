import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "7 Errores que Cometen las PYMEs con su Web",
  description:
    "Descubre los 7 errores digitales mas comunes en PYMEs espanolas y como solucionarlos. Guia gratuita con soluciones practicas de PACAME.",
  alternates: { canonical: "https://pacameagencia.com/7-errores" },
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
