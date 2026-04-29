import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import FactoriaHero from "./FactoriaHero";
import BriefBanner from "./BriefBanner";

const FactoriaCapas = dynamic(() => import("./FactoriaCapas"));
const FactoriaCatalogo = dynamic(() => import("./FactoriaCatalogo"));
const FactoriaCiclo = dynamic(() => import("./FactoriaCiclo"));
const FactoriaMetricas = dynamic(() => import("./FactoriaMetricas"));
const FactoriaCTA = dynamic(() => import("./FactoriaCTA"));

export const metadata: Metadata = {
  title: "Factoría de Soluciones con IA · PACAME",
  description:
    "PACAME no es una agencia: es una factoría que detecta problemas reales en PYMEs, los empaqueta como productos con IA y los ejecuta con 10 agentes especializados. Cada cliente alimenta la siguiente solución.",
  alternates: { canonical: "https://pacameagencia.com/factoria" },
  openGraph: {
    title: "Factoría de Soluciones con IA · PACAME",
    description:
      "Producción industrial de soluciones a medida para PYMEs. Cerebro IA + 10 agentes + 346 skills + ciclo cerrado de aprendizaje.",
    url: "https://pacameagencia.com/factoria",
    type: "website",
  },
};

export default function FactoriaPage() {
  return (
    <>
      {/* FASE H · Si llega ?brief=<uuid>, banner con brand precargado */}
      <Suspense fallback={null}>
        <BriefBanner />
      </Suspense>
      <FactoriaHero />
      <FactoriaCapas />
      <FactoriaCatalogo />
      <FactoriaCiclo />
      <FactoriaMetricas />
      <FactoriaCTA />
    </>
  );
}
