import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con PACAME. Diagnostico gratuito en 24 horas. Cuentanos tu proyecto y te preparamos una propuesta personalizada sin compromiso.",
  alternates: { canonical: "https://pacameagencia.com/contacto" },
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
