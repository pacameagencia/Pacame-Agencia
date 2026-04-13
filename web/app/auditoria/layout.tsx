import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auditoria Web Gratuita",
  description:
    "Analiza tu web gratis en 30 segundos. PACAME evalua SEO, velocidad, movil, seguridad y UX. Recibe un informe con recomendaciones prioritarias.",
  alternates: { canonical: "https://pacameagencia.com/auditoria" },
};

export default function AuditoriaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
