import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Todos los Agentes IA",
  description:
    "Conoce los 127+ agentes IA especializados de PACAME. Ingenieria, diseno, marketing, analytics, e-commerce, seguridad y mas. Un equipo completo a tu servicio.",
  alternates: { canonical: "https://pacameagencia.com/agentes" },
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
