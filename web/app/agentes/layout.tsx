import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "127+ Agentes IA Especializados para Tu Negocio | PACAME",
  description:
    "Conoce los 127+ agentes IA especializados de PACAME. Ingeniería, diseño, marketing, analytics, e-commerce, seguridad y más. Un equipo completo a tu servicio.",
  alternates: { canonical: "https://pacameagencia.com/agentes" },
  openGraph: {
    title: "127+ Agentes IA Especializados para Tu Negocio | PACAME",
    description: "10 agentes IA + 120 subespecialistas trabajando 24/7 para tu negocio.",
    url: "https://pacameagencia.com/agentes",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function AgentesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Agentes", url: "https://pacameagencia.com/agentes" },
        ]}
      />
      {children}
    </>
  );
}
