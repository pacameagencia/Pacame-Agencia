"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useDeviceTier } from "@/lib/3d/use-device-tier";
import { useReducedMotion } from "@/lib/3d/use-reduced-motion";
import { useScrollProgress } from "@/lib/3d/use-scroll-progress";
import { matCeramic, matPaperGround, BRAND, disposeAllBrandMaterials } from "@/lib/3d/materials";
import {
  CAMERA_KEYFRAMES,
  interpolateCamera,
  progressToKeyframes,
} from "@/lib/3d/camera-paths";

/**
 * Scene Storybook 3D — Fase 1.
 *
 * Esta primera versión es el "hello world" del paisaje:
 *   - Canvas R3F con frameloop="demand" (no quema batería en idle).
 *   - Cubo terracota orbital en el centro (placeholder de las 5 islas que vendrán en Fase 2).
 *   - Ground paper plano.
 *   - Iluminación canónica: ambient cálida 0.4 + directional 35° SE.
 *   - LOD por device tier (pixelRatio dinámico, sombras condicionales).
 *   - Cámara scroll-driven entre 6 keyframes (Lenis fuente única).
 *
 * En Fase 2 se reemplaza el cubo por las 5 islas + HUD overlay + CTA.
 */

interface SceneProps {
  /** Si `true`, oculta el Canvas y deja al fallback HTML. Para reduced-motion. */
  hidden?: boolean;
}

export default function Scene({ hidden = false }: SceneProps) {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();

  // Cleanup global de materiales al unmount
  useEffect(() => {
    return () => {
      disposeAllBrandMaterials();
    };
  }, []);

  if (hidden || reducedMotion) return null;

  const dpr: [number, number] = useMemo(() => {
    if (tier === "low") return [1, 1];
    if (tier === "mid") return [1, 1.5];
    return [1, 2];
  }, [tier]);

  return (
    <Canvas
      // Demand: solo redibuja cuando hay scroll/hover, ahorra batería
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
      style={{ width: "100%", height: "100%", display: "block" }}
      // Color de fondo paper para evitar flash
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(BRAND.paper));
      }}
    >
      <SceneContent tier={tier} />
    </Canvas>
  );
}

interface SceneContentProps {
  tier: "low" | "mid" | "high";
}

function SceneContent({ tier }: SceneContentProps) {
  const progress = useScrollProgress();
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // Cubo orbital placeholder — en Fase 2 esto se reemplaza por las 5 islas
  const cubeRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    // Rotación lenta del cubo
    if (cubeRef.current) {
      cubeRef.current.rotation.y += delta * 0.4;
      cubeRef.current.rotation.x += delta * 0.15;
    }

    // Cámara scroll-driven
    const { from, to, localT } = progressToKeyframes(progress);
    if (state.camera instanceof THREE.PerspectiveCamera) {
      interpolateCamera(state.camera, from, to, localT, lookAtRef.current);
    }

    // Demand mode: forzar re-render cada frame mientras hay scroll
    state.invalidate();
  });

  return (
    <>
      {/* Iluminación canónica — ambient cálida + directional 35° SE */}
      <ambientLight color={0xffe8c8} intensity={0.4} />
      <directionalLight
        color={0xffffff}
        intensity={0.7}
        position={[5, 8, 4]}
        castShadow={tier !== "low"}
        shadow-mapSize-width={tier === "high" ? 1024 : 512}
        shadow-mapSize-height={tier === "high" ? 1024 : 512}
      />

      {/* Ground paper plano 30×30 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow={tier !== "low"}
        material={matPaperGround}
      >
        <planeGeometry args={[30, 30, 1, 1]} />
      </mesh>

      {/* Cubo terracota orbital — placeholder Fase 1 */}
      <mesh
        ref={cubeRef}
        position={[0, 0.5, 0]}
        castShadow={tier !== "low"}
        receiveShadow={tier !== "low"}
        material={matCeramic.terracotta}
      >
        <boxGeometry args={[1.2, 1.2, 1.2]} />
      </mesh>
    </>
  );
}
