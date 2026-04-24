import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import PricingCalcClient from "./PricingCalcClient";

export const metadata: Metadata = {
  title: "Calculadora de pricing · PACAME",
  description:
    "Calcula tu precio por hora y por proyecto segun costes fijos + horas trabajadas + margen deseado. Break-even + 3 escenarios.",
  alternates: { canonical: "https://pacameagencia.com/herramientas/calculadora-pricing" },
};

export default function PricingCalcPage() {
  return (
    <ToolLayout
      kicker="§ TOOL 04 · PRICING"
      title="El precio justo para tu negocio"
      titleAccent="precio justo"
      desc="Freelance, coach o agencia — calcula tu hora y tu proyecto tipo en 30 segundos. Evita el error de cobrar lo que cobra el de al lado sin revisar tus numeros."
    >
      <PricingCalcClient />
    </ToolLayout>
  );
}
