"use client";

import dynamic from "next/dynamic";

/**
 * Client wrapper para el Scene 3D — necesario en Next 16 porque
 * `dynamic({ ssr: false })` solo se permite en Client Components.
 *
 * Razón: la Scene usa Three.js + WebGL, APIs solo disponibles en browser.
 */

const Scene = dynamic(() => import("@/components/storybook-3d/Scene"), {
  ssr: false,
  loading: () => null,
});

export default function SceneClient() {
  return <Scene />;
}
