import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Encuentra tu solucion — Quiz 2 min · PACAME",
  description:
    "5 preguntas. 2 minutos. Recomendacion tailor-made de bundle + precio + timeline adaptada a tu negocio. Gratis.",
  alternates: { canonical: "https://pacameagencia.com/encuentra-tu-solucion" },
  openGraph: {
    title: "¿Que necesita tu negocio? Quiz 2 min · PACAME",
    description:
      "Respondes 5 preguntas y te recomendamos bundle + precio + timeline exacto para tu caso.",
    url: "https://pacameagencia.com/encuentra-tu-solucion",
    siteName: "PACAME",
  },
  robots: { index: true, follow: true },
};

export default function QuizPage() {
  return <QuizClient />;
}
