"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { matCeramic } from "@/lib/3d/materials";
import { ISLAND_POSITIONS } from "@/lib/3d/camera-paths";

import IslandBase from "./IslandBase";

/**
 * Isla 4 — Publicidad Digital (oliva).
 *
 * Forma: dispensador modernista (slot machine reinterpretado) con 3 rodillos
 * en la parte superior, display central, monedas oliva cayendo de la base
 * (animación: 4 esferas que se reciclan en loop vertical).
 */

interface IslandAdsProps {
  active: boolean;
  hovered?: boolean;
  tier: "low" | "mid" | "high";
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

const COIN_COUNT = 4;
const COIN_FALL_HEIGHT = 1.2;
const COIN_FALL_SPEED = 0.8;

export default function IslandAds({
  active,
  hovered,
  tier,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: IslandAdsProps) {
  const castShadow = tier !== "low";
  const coinsGroupRef = useRef<THREE.Group>(null);

  // Posiciones iniciales aleatorias en Y para distribuir las monedas en el ciclo
  const coinOffsets = useMemo(
    () =>
      Array.from({ length: COIN_COUNT }, (_, i) => i / COIN_COUNT),
    [],
  );

  useFrame((state, delta) => {
    if (!coinsGroupRef.current) return;
    coinsGroupRef.current.children.forEach((coin, i) => {
      // Animación: la moneda cae de Y=1.4 a Y=0.2, luego se recicla
      const t = (state.clock.elapsedTime * COIN_FALL_SPEED + coinOffsets[i]) % 1;
      const y = 1.4 - t * COIN_FALL_HEIGHT;
      coin.position.y = y;
      // Rotación durante la caída
      coin.rotation.x += delta * 1.5;
    });
  });

  return (
    <IslandBase
      slug="ads"
      position={ISLAND_POSITIONS.ads}
      active={active}
      hovered={hovered}
      tier={tier}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Cuerpo principal — caja dispensador oliva */}
      <mesh
        position={[0, 1.0, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.olive}
      >
        <boxGeometry args={[1.5, 1.8, 0.9]} />
      </mesh>

      {/* 3 rodillos parte superior (cilindros horizontales) */}
      {[-0.4, 0, 0.4].map((x, i) => (
        <mesh
          key={i}
          position={[x, 1.6, 0.46]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow={castShadow}
          material={matCeramic.terracotta}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
        </mesh>
      ))}

      {/* Display central — panel ink rectangular recessed */}
      <mesh
        position={[0, 1.0, 0.46]}
        material={matCeramic.ink}
      >
        <boxGeometry args={[1.0, 0.5, 0.06]} />
      </mesh>

      {/* Tilde verde mostaza dentro del display (chip de éxito) */}
      <mesh position={[0, 1.0, 0.5]} material={matCeramic.mustard}>
        <sphereGeometry args={[0.08, 12, 12]} />
      </mesh>

      {/* Slot inferior — abertura ranurada */}
      <mesh position={[0, 0.3, 0.46]} material={matCeramic.ink}>
        <boxGeometry args={[0.7, 0.1, 0.05]} />
      </mesh>

      {/* Monedas oliva cayendo */}
      <group ref={coinsGroupRef} position={[0, 0, 0.6]}>
        {coinOffsets.map((_, i) => (
          <mesh
            key={i}
            position={[0.0, 0.5, 0]}
            castShadow={castShadow}
            material={matCeramic.olive}
          >
            <cylinderGeometry args={[0.13, 0.13, 0.05, 16]} />
          </mesh>
        ))}
      </group>
    </IslandBase>
  );
}
