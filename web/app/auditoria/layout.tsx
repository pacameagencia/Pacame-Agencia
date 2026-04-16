import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Auditoría Web Gratis — Analiza tu Web en 30s | PACAME",
  description:
    "Analiza tu web gratis en 30 segundos. PACAME evalúa SEO, velocidad, móvil, seguridad y UX. Recibe un informe con recomendaciones prioritarias.",
  alternates: { canonical: "https://pacameagencia.com/auditoria" },
  openGraph: {
    title: "Auditoría Web Gratis — Analiza tu Web en 30s | PACAME",
    description: "Análisis completo de tu web gratis: SEO, velocidad, móvil y seguridad.",
    url: "https://pacameagencia.com/auditoria",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function AuditoriaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Auditoria", url: "https://pacameagencia.com/auditoria" },
        ]}
      />
      {children}
    </>
  );
}
