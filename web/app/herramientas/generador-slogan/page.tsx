import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SloganClient from "./SloganClient";

export const metadata: Metadata = {
  title: "Generador de slogans · PACAME",
  description:
    "10 slogans tier-1 para tu marca en 30 segundos. Input: sector + tono + 3 keywords. Generado por IA.",
  alternates: { canonical: "https://pacameagencia.com/herramientas/generador-slogan" },
};

export default function SloganPage() {
  return (
    <ToolLayout
      kicker="§ TOOL 01 · BRANDING"
      title="10 slogans que venden en 30 segundos"
      titleAccent="en 30 segundos"
      desc="Sector + tono + 3 keywords. Te damos 10 propuestas de slogan tier-1 adaptadas a tu negocio. Copia, comparte o usa como punto de partida para tu agencia."
    >
      <SloganClient />
    </ToolLayout>
  );
}
