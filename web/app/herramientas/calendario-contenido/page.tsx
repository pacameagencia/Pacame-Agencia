import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import CalendarClient from "./CalendarClient";

export const metadata: Metadata = {
  title: "Calendario de contenido 30 dias · PACAME",
  description:
    "30 ideas de publicaciones personalizadas para tu sector + plataformas. CSV descargable + Google Calendar import.",
  alternates: { canonical: "https://pacameagencia.com/herramientas/calendario-contenido" },
};

export default function CalendarPage() {
  return (
    <ToolLayout
      kicker="§ TOOL 05 · SOCIAL"
      title="30 ideas de contenido en un click"
      titleAccent="en un click"
      desc="Sector + plataformas + frecuencia = calendario 30 dias con ideas concretas. CSV para Excel / Google Calendar + iCal descargable. Deja de mirar el cursor parpadeando."
      ctaText="PACAME Social mensual · desde 97€"
      ctaHref="/planes"
    >
      <CalendarClient />
    </ToolLayout>
  );
}
