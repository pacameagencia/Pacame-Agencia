"use client";

import dynamic from "next/dynamic";

/**
 * Client wrapper para CasosScene — Next 16 obliga a `ssr: false` en
 * dynamic dentro de Client Components.
 */

const CasosScene = dynamic(() => import("@/components/storybook-3d/casos/CasosScene"), {
  ssr: false,
  loading: () => null,
});

export default function CasosSceneClient() {
  return <CasosScene />;
}
