import type { Metadata } from "next";

import StorybookHome from "@/app/(storybook)/page";
import ClassicHome from "@/components/home/ClassicHome";
import { STORYBOOK_HOME } from "@/lib/env/flags";

export const metadata: Metadata = {
  title:
    "PACAME — Tu equipo digital completo. Potenciado por IA, liderado por humanos.",
  description:
    "Agencia digital con 10 agentes IA especializados. 24 productos desde 99€, 5 herramientas gratis, quiz de recomendacion. 60% mas barato que una agencia, 3x mas rapido.",
  alternates: { canonical: "https://pacameagencia.com" },
};

/**
 * Home raíz — gateway entre la versión clásica y la nueva Storybook 3D.
 *
 * Switch atómico vía feature flag `NEXT_PUBLIC_STORYBOOK_HOME`:
 *  - "1" → renderiza StorybookHome (Fase 1+).
 *  - cualquier otro valor / no definido → ClassicHome (12 secciones).
 *
 * Rollback: cambiar env var en Vercel → redeploy <60s. Sin migración DB.
 *
 * `/clasica` siempre renderiza ClassicHome (vista preservada para Pablo
 * y para crawlers ya indexados con la versión vieja).
 */
export default function HomePage() {
  if (STORYBOOK_HOME) {
    return <StorybookHome />;
  }
  return <ClassicHome />;
}
