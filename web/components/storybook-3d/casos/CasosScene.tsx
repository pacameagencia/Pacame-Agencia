"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

import { useDeviceTier } from "@/lib/3d/use-device-tier";
import { useReducedMotion } from "@/lib/3d/use-reduced-motion";
import { matPaperGround, BRAND } from "@/lib/3d/materials";
import { caseStudies } from "@/lib/data/case-studies";

import CaseCard from "./CaseCard";

/**
 * CasosScene — Canvas R3F separado para galería de casos (Fase 3).
 *
 * Diferencias vs Scene principal:
 *  - Canvas más pequeño (70vh máx, no fullscreen).
 *  - 3 case-cards en arco horizontal centradas.
 *  - Sin scroll-driven (cámara fija, las cards rotan idle).
 *  - Click en card → navegación a /casos/[slug] (página existente).
 *
 * Reusa: useDeviceTier, useReducedMotion, materiales canónicos.
 */

interface CasosSceneProps {
  hidden?: boolean;
}

export default function CasosScene({ hidden = false }: CasosSceneProps) {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const dpr: [number, number] = useMemo(() => {
    if (tier === "low") return [1, 1];
    if (tier === "mid") return [1, 1.5];
    return [1, 2];
  }, [tier]);

  if (hidden || reducedMotion) return null;

  // Top 3 casos (mostramos los 3 primeros del array)
  const topCases = caseStudies.slice(0, 3);

  // Posiciones en arco horizontal: -3.5 / 0 / 3.5 (X), Y=0, Z=0
  const positions: Array<[number, number, number]> = [
    [-3.5, 0, 0],
    [0, 0, 0.5],
    [3.5, 0, 0],
  ];

  // Colores alternos para diferenciar cards
  const colors: Array<"terracotta" | "indigo" | "mustard"> = [
    "terracotta",
    "indigo",
    "mustard",
  ];

  return (
    <Canvas
      frameloop="always" // las cards giran sin parar, mejor "always"
      dpr={dpr}
      camera={{
        position: [0, 1.2, 7.5],
        fov: 42,
        near: 0.1,
        far: 50,
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
      <ambientLight color={0xffe8c8} intensity={0.5} />
      <directionalLight
        color={0xffffff}
        intensity={0.8}
        position={[3, 5, 4]}
        castShadow={tier !== "low"}
        shadow-mapSize-width={tier === "high" ? 1024 : 512}
        shadow-mapSize-height={tier === "high" ? 1024 : 512}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
      />

      {/* Ground paper */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
        receiveShadow={tier !== "low"}
        material={matPaperGround}
      >
        <planeGeometry args={[20, 12, 1, 1]} />
      </mesh>

      {/* 3 case cards */}
      {topCases.map((cs, i) => (
        <CaseCard
          key={cs.slug}
          position={positions[i]}
          baseColor={colors[i]}
          metricHeadline={cs.metricHeadline}
          metricSubtitle={cs.metricSubtitle}
          clientName={cs.clientName}
          sector={cs.sector}
          city={cs.city}
          slug={cs.slug}
          tier={tier}
          onClick={() => {
            router.push(`/casos/${cs.slug}`);
          }}
        />
      ))}
    </Canvas>
  );
}
