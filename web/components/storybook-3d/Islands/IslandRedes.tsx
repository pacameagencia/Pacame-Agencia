"use client";

import { matCeramic } from "@/lib/3d/materials";
import { ISLAND_POSITIONS } from "@/lib/3d/camera-paths";

import IslandBase from "./IslandBase";

/**
 * Isla 3 — Redes Sociales (mostaza vibrante).
 *
 * Forma: plaza circular pavimentada con 3 altavoces tipo dazibao
 * apuntando al cielo en triángulo equilátero.
 * Inspiración: plazas modernistas + arte sonoro.
 */

interface IslandRedesProps {
  active: boolean;
  hovered?: boolean;
  tier: "low" | "mid" | "high";
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export default function IslandRedes({
  active,
  hovered,
  tier,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: IslandRedesProps) {
  const castShadow = tier !== "low";

  // 3 altavoces en triángulo, radio 0.6 alrededor del centro
  const speakers: Array<[number, number, number]> = [
    [0, 0.8, 0.6],          // frente
    [-0.52, 0.8, -0.3],     // izquierda
    [0.52, 0.8, -0.3],      // derecha
  ];

  return (
    <IslandBase
      slug="redes"
      position={ISLAND_POSITIONS.redes}
      active={active}
      hovered={hovered}
      tier={tier}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Plaza circular plana mostaza (podio extra encima del disc) */}
      <mesh
        position={[0, 0.15, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.mustard}
      >
        <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
      </mesh>

      {/* Anillo central mostaza (detalle) */}
      <mesh
        position={[0, 0.27, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={matCeramic.terracotta}
      >
        <ringGeometry args={[0.3, 0.45, 32]} />
      </mesh>

      {/* 3 altavoces tipo dazibao apuntando arriba */}
      {speakers.map((pos, i) => (
        <group key={i} position={pos} rotation={[Math.PI * -0.05, 0, (i % 2 === 0 ? 0.1 : -0.1)]}>
          {/* Mástil */}
          <mesh
            position={[0, -0.3, 0]}
            castShadow={castShadow}
            material={matCeramic.mustard}
          >
            <cylinderGeometry args={[0.05, 0.06, 0.6, 12]} />
          </mesh>
          {/* Cono altavoz mostaza */}
          <mesh
            position={[0, 0.15, 0]}
            castShadow={castShadow}
            material={matCeramic.mustard}
          >
            <coneGeometry args={[0.32, 0.55, 24, 1, true]} />
          </mesh>
          {/* Tapa interior cono (más oscura) */}
          <mesh position={[0, 0.0, 0]} material={matCeramic.terracotta}>
            <circleGeometry args={[0.31, 24]} />
          </mesh>
        </group>
      ))}
    </IslandBase>
  );
}
