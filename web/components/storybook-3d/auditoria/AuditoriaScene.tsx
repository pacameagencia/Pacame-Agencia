"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { useDeviceTier } from "@/lib/3d/use-device-tier";
import { useReducedMotion } from "@/lib/3d/use-reduced-motion";
import { matCeramic, matPaperGround, BRAND } from "@/lib/3d/materials";

/**
 * AuditoriaScene — escena 3D íntima para /auditoria-3d.
 *
 * No es una isla: es un interior cálido. Mesa de madera (cilindro plano),
 * taza humeante (cilindro mate paper), libreta abierta (caja plana ink),
 * pequeño detalle terracota (lápiz/marca).
 *
 * Cámara fija (0, 1.5, 3) mirando ligeramente abajo. NO scroll-driven.
 *
 * El form HTML overlay se monta encima del Canvas (el form siempre tiene
 * pointer-events; el canvas no recibe clicks).
 */

interface AuditoriaSceneProps {
  hidden?: boolean;
}

export default function AuditoriaScene({ hidden = false }: AuditoriaSceneProps) {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();

  const dpr: [number, number] = useMemo(() => {
    if (tier === "low") return [1, 1];
    if (tier === "mid") return [1, 1.5];
    return [1, 2];
  }, [tier]);

  if (hidden || reducedMotion) return null;

  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{
        position: [0, 1.5, 3],
        fov: 38,
        near: 0.1,
        far: 30,
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
      <SceneContent tier={tier} />
    </Canvas>
  );
}

function SceneContent({ tier }: { tier: "low" | "mid" | "high" }) {
  const castShadow = tier !== "low";

  return (
    <>
      {/* Iluminación íntima — directional cálida desde derecha (luz ventana) */}
      <ambientLight color={0xfff4e0} intensity={0.55} />
      <directionalLight
        color={0xffe8c8}
        intensity={0.9}
        position={[3, 4, 2]}
        castShadow={castShadow}
        shadow-mapSize-width={tier === "high" ? 1024 : 512}
        shadow-mapSize-height={tier === "high" ? 1024 : 512}
        shadow-camera-far={10}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Mesa de madera (cilindro plano grande terracota oscuro) */}
      <mesh
        position={[0, -0.05, 0]}
        receiveShadow={castShadow}
        material={matCeramic.terracotta}
      >
        <cylinderGeometry args={[1.6, 1.6, 0.12, 48]} />
      </mesh>

      {/* Suelo paper a baja altura para sombras */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow={castShadow}
        material={matPaperGround}
      >
        <planeGeometry args={[12, 12, 1, 1]} />
      </mesh>

      {/* Libreta abierta — caja plana paper a la izquierda */}
      <group position={[-0.4, 0.05, 0.3]} rotation={[0, 0.18, 0]}>
        {/* Tapa fondo (terracota) */}
        <mesh
          castShadow={castShadow}
          receiveShadow={castShadow}
          material={matCeramic.terracotta}
        >
          <boxGeometry args={[0.9, 0.04, 0.7]} />
        </mesh>
        {/* Página derecha */}
        <mesh
          position={[0.225, 0.025, 0]}
          material={matCeramic.paper}
        >
          <boxGeometry args={[0.42, 0.02, 0.66]} />
        </mesh>
        {/* Página izquierda */}
        <mesh
          position={[-0.225, 0.025, 0]}
          material={matCeramic.paper}
        >
          <boxGeometry args={[0.42, 0.02, 0.66]} />
        </mesh>
        {/* Lomera central */}
        <mesh position={[0, 0.04, 0]} material={matCeramic.terracotta}>
          <boxGeometry args={[0.04, 0.01, 0.66]} />
        </mesh>
      </group>

      {/* Taza humeante — cilindro paper a la derecha */}
      <group position={[0.55, 0.18, 0.1]}>
        {/* Cuerpo taza */}
        <mesh
          castShadow={castShadow}
          receiveShadow={castShadow}
          material={matCeramic.paper}
        >
          <cylinderGeometry args={[0.14, 0.12, 0.26, 24]} />
        </mesh>
        {/* Asa (toro pequeño) */}
        <mesh
          position={[0.16, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow={castShadow}
          material={matCeramic.paper}
        >
          <torusGeometry args={[0.07, 0.018, 8, 16]} />
        </mesh>
        {/* Café visible (líquido oscuro top) */}
        <mesh position={[0, 0.13, 0]} material={matCeramic.ink}>
          <cylinderGeometry args={[0.13, 0.13, 0.005, 24]} />
        </mesh>
      </group>

      {/* Lápiz terracota cruzando libreta */}
      <mesh
        position={[-0.2, 0.13, 0.4]}
        rotation={[0, 0.5, Math.PI / 2 + 0.15]}
        castShadow={castShadow}
        material={matCeramic.terracotta}
      >
        <cylinderGeometry args={[0.018, 0.018, 0.5, 8]} />
      </mesh>
    </>
  );
}
