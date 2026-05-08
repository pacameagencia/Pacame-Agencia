"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useDeviceTier } from "@/lib/3d/use-device-tier";
import { useReducedMotion } from "@/lib/3d/use-reduced-motion";
import { useScrollProgress } from "@/lib/3d/use-scroll-progress";
import {
  matPaperGround,
  BRAND,
  disposeAllBrandMaterials,
} from "@/lib/3d/materials";
import {
  CAMERA_KEYFRAMES,
  interpolateCamera,
  progressToKeyframes,
} from "@/lib/3d/camera-paths";
import { useIslandState } from "@/lib/storybook/island-state";
import { ISLAND_ORDER, type IslandSlug } from "@/lib/storybook/content";

import IslandWeb from "./Islands/IslandWeb";
import IslandSEO from "./Islands/IslandSEO";
import IslandRedes from "./Islands/IslandRedes";
import IslandAds from "./Islands/IslandAds";
import IslandBranding from "./Islands/IslandBranding";

/**
 * Scene Storybook 3D — Fase 2.
 *
 * Diferencias vs Fase 1:
 *  - Las 5 islas reales sustituyen al cubo placeholder.
 *  - Conectado a IslandStateProvider (emite progress, recibe override).
 *  - Click en isla → setActiveIslandManually + scroll programático.
 *  - Hover state → IslandBase aplica scale 1.04 + lift Y.
 *  - Cámara respeta override hasta que el usuario hace scroll real.
 *
 * Sigue cumpliendo:
 *  - frameloop="demand" (no quema batería en idle).
 *  - LOD por device tier (pixelRatio dinámico, sombras condicionales).
 *  - Lenis fuente única de progress.
 */

interface SceneProps {
  /** Si `true`, oculta el Canvas y deja al fallback HTML. */
  hidden?: boolean;
}

export default function Scene({ hidden = false }: SceneProps) {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const scrollProgress = useScrollProgress();
  const islandState = useIslandState();

  // Cleanup global de materiales al unmount
  useEffect(() => {
    return () => {
      disposeAllBrandMaterials();
    };
  }, []);

  const dpr: [number, number] = useMemo(() => {
    if (tier === "low") return [1, 1];
    if (tier === "mid") return [1, 1.5];
    return [1, 2];
  }, [tier]);

  // Sync scroll progress → provider (throttled internamente)
  useEffect(() => {
    islandState.setProgress(scrollProgress);
  }, [scrollProgress, islandState]);

  if (hidden || reducedMotion) return null;

  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{
        position: CAMERA_KEYFRAMES[0].position.toArray(),
        fov: CAMERA_KEYFRAMES[0].fov,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: tier !== "low",
        powerPreference: tier === "high" ? "high-performance" : "default",
      }}
      shadows={tier !== "low"}
      style={{ width: "100%", height: "100%", display: "block" }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(BRAND.paper));
      }}
    >
      <SceneContent
        tier={tier}
        scrollProgress={scrollProgress}
        activeIsland={islandState.activeIsland}
        overrideIsland={islandState.overrideIsland}
        onIslandClick={(slug) => {
          const targetProgress = islandState.setActiveIslandManually(slug);
          if (typeof window !== "undefined") {
            const max =
              document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({
              top: max * targetProgress,
              behavior: "smooth",
            });
          }
        }}
      />
    </Canvas>
  );
}

interface SceneContentProps {
  tier: "low" | "mid" | "high";
  scrollProgress: number;
  activeIsland: IslandSlug | null;
  overrideIsland: IslandSlug | null;
  onIslandClick: (slug: IslandSlug) => void;
}

function SceneContent({
  tier,
  scrollProgress,
  activeIsland,
  overrideIsland,
  onIslandClick,
}: SceneContentProps) {
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const overrideProgressRef = useRef<number | null>(null);
  const overrideTransitionRef = useRef(0);

  // Track override changes (click/keyboard activate)
  useEffect(() => {
    if (overrideIsland) {
      const idx = ISLAND_ORDER.indexOf(overrideIsland);
      const targetProgress = (idx + 1) / ISLAND_ORDER.length;
      overrideProgressRef.current = targetProgress;
      overrideTransitionRef.current = 0;
    } else {
      overrideProgressRef.current = null;
    }
  }, [overrideIsland]);

  useFrame((state, delta) => {
    let effectiveProgress: number;
    if (overrideProgressRef.current !== null) {
      overrideTransitionRef.current = Math.min(
        1,
        overrideTransitionRef.current + delta * 1.2,
      );
      const t = overrideTransitionRef.current;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      effectiveProgress =
        scrollProgress + (overrideProgressRef.current - scrollProgress) * ease;
    } else {
      effectiveProgress = scrollProgress;
    }

    const { from, to, localT } = progressToKeyframes(effectiveProgress);
    if (state.camera instanceof THREE.PerspectiveCamera) {
      interpolateCamera(state.camera, from, to, localT, lookAtRef.current);
    }

    state.invalidate();
  });

  return (
    <>
      <ambientLight color={0xffe8c8} intensity={0.4} />
      <directionalLight
        color={0xffffff}
        intensity={0.7}
        position={[5, 8, 4]}
        castShadow={tier !== "low"}
        shadow-mapSize-width={tier === "high" ? 1024 : 512}
        shadow-mapSize-height={tier === "high" ? 1024 : 512}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow={tier !== "low"}
        material={matPaperGround}
      >
        <planeGeometry args={[30, 30, 1, 1]} />
      </mesh>

      <IslandWeb
        active={activeIsland === "web"}
        tier={tier}
        onClick={() => onIslandClick("web")}
      />
      <IslandSEO
        active={activeIsland === "seo"}
        tier={tier}
        onClick={() => onIslandClick("seo")}
      />
      <IslandRedes
        active={activeIsland === "redes"}
        tier={tier}
        onClick={() => onIslandClick("redes")}
      />
      <IslandAds
        active={activeIsland === "ads"}
        tier={tier}
        onClick={() => onIslandClick("ads")}
      />
      <IslandBranding
        active={activeIsland === "branding"}
        tier={tier}
        onClick={() => onIslandClick("branding")}
      />
    </>
  );
}
