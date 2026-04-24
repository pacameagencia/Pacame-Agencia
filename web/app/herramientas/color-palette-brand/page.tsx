import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import PaletteClient from "./PaletteClient";

export const metadata: Metadata = {
  title: "Paleta de marca + fuentes · PACAME",
  description:
    "3 adjetivos + sector = paleta 5 colores + 2 fuentes Google listas para usar. Deterministico, exportable CSS / Figma tokens.",
  alternates: { canonical: "https://pacameagencia.com/herramientas/color-palette-brand" },
};

export default function PalettePage() {
  return (
    <ToolLayout
      kicker="§ TOOL 03 · BRANDING"
      title="Tu paleta de marca en 10 segundos"
      titleAccent="en 10 segundos"
      desc="3 adjetivos describen tu marca. Te damos 5 colores coherentes + 2 fuentes Google + mood board visual. Export CSS variables o JSON tokens Figma."
    >
      <PaletteClient />
    </ToolLayout>
  );
}
