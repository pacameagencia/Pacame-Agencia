import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programa de Referidos",
  description:
    "Gana comisiones recurrentes recomendando PACAME. Hasta un 25% de comision por cada cliente referido. Sin limite de ingresos.",
  alternates: { canonical: "https://pacameagencia.com/colabora" },
};

export default function ColaboraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
