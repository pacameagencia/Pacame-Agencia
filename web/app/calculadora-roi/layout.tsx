import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de ROI",
  description:
    "Calcula el retorno de inversion de contratar PACAME. Introduce tu sector, ticket medio e inversion para ver cuanto puedes ganar.",
  alternates: { canonical: "https://pacameagencia.com/calculadora-roi" },
};

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
