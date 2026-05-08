import type { Metadata } from "next";

import ClassicHome from "@/components/home/ClassicHome";

/**
 * Home clásica preservada — accesible siempre en `/clasica`.
 *
 * Razón: cuando Pablo active el flag STORYBOOK_HOME=1, la home `/`
 * muestra Storybook 3D, pero crawlers ya indexados o usuarios que
 * prefieren la vista tradicional pueden seguir accediendo aquí.
 *
 * También es el "rollback no destructivo": si Storybook falla, esta ruta
 * sigue funcionando.
 *
 * canonical apunta a `/` (vista canónica): /clasica es alternativa, no canon.
 */

export const metadata: Metadata = {
  title:
    "PACAME (vista clásica) — Tu equipo digital completo, potenciado por IA",
  description:
    "Vista clásica de la home PACAME. 24 productos desde 99€, 5 herramientas gratis, quiz de recomendación. 60% más barato que una agencia, 3x más rápido.",
  alternates: { canonical: "https://pacameagencia.com" },
  // No indexar como duplicado de /
  robots: { index: false, follow: true },
};

export default function ClasicaPage() {
  return <ClassicHome />;
}
