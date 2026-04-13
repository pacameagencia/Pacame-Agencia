import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con PACAME. Diagnostico gratuito en 24 horas. Cuentanos tu proyecto y te preparamos una propuesta personalizada sin compromiso.",
  alternates: { canonical: "https://pacameagencia.com/contacto" },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
