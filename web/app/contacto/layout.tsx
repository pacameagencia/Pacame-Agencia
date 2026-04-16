import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Contacto — Presupuesto Gratis en 24h | PACAME",
  description:
    "Contacta con PACAME. Diagnóstico gratuito en 24 horas. Cuéntanos tu proyecto y te preparamos una propuesta personalizada sin compromiso.",
  alternates: { canonical: "https://pacameagencia.com/contacto" },
  openGraph: {
    title: "Contacto — Presupuesto Gratis en 24h | PACAME",
    description: "Cuéntanos tu proyecto digital. Presupuesto gratuito en 24h.",
    url: "https://pacameagencia.com/contacto",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Contacto", url: "https://pacameagencia.com/contacto" },
        ]}
      />
      {children}
    </>
  );
}
