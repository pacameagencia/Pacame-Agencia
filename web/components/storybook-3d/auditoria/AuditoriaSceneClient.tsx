"use client";

import dynamic from "next/dynamic";

const AuditoriaScene = dynamic(
  () => import("@/components/storybook-3d/auditoria/AuditoriaScene"),
  { ssr: false, loading: () => null },
);

/**
 * Client wrapper para AuditoriaScene — Next 16 obliga a `ssr: false` en
 * dynamic dentro de Client Components.
 */
export default function AuditoriaSceneClient() {
  return <AuditoriaScene />;
}
