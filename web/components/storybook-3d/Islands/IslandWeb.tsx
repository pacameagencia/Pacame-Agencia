"use client";

import { matCeramic } from "@/lib/3d/materials";
import { ISLAND_POSITIONS } from "@/lib/3d/camera-paths";

import IslandBase from "./IslandBase";

/**
 * Isla 1 — Desarrollo Web (terracota mate).
 *
 * Forma: casa-quiosco modernista de 2 pisos con pantalla frontal recessed.
 * Inspiración: kioscos urbanos catalanes + arquitectura Loewe craft.
 *
 * Composición:
 *  - Cilindro base bajo (cimientos)
 *  - Cuerpo principal: cubo extruido vertical
 *  - Pantalla frontal: panel recessed más oscuro (ink mate)
 *  - Tejado-techo: prisma triangular sutil arriba
 */

interface IslandWebProps {
  active: boolean;
  hovered?: boolean;
  tier: "low" | "mid" | "high";
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export default function IslandWeb({
  active,
  hovered,
  tier,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: IslandWebProps) {
  const castShadow = tier !== "low";

  return (
    <IslandBase
      slug="web"
      position={ISLAND_POSITIONS.web}
      active={active}
      hovered={hovered}
      tier={tier}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Cimientos cilíndricos terracota */}
      <mesh
        position={[0, 0.25, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.terracotta}
      >
        <cylinderGeometry args={[1.0, 1.05, 0.5, 24]} />
      </mesh>

      {/* Cuerpo principal — torre cuadrada terracota */}
      <mesh
        position={[0, 1.1, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.terracotta}
      >
        <boxGeometry args={[1.4, 1.7, 1.0]} />
      </mesh>

      {/* Pantalla frontal recessed (ink mate, simulando display) */}
      <mesh
        position={[0, 1.25, 0.51]}
        castShadow={false}
        receiveShadow={false}
        material={matCeramic.ink}
      >
        <boxGeometry args={[0.9, 0.7, 0.05]} />
      </mesh>

      {/* Detalle: 3 puntos de UI (muestra que es pantalla) — pequeñas esferas mostaza */}
      <mesh position={[-0.25, 1.4, 0.55]} material={matCeramic.mustard}>
        <sphereGeometry args={[0.04, 12, 12]} />
      </mesh>
      <mesh position={[0, 1.4, 0.55]} material={matCeramic.mustard}>
        <sphereGeometry args={[0.04, 12, 12]} />
      </mesh>
      <mesh position={[0.25, 1.4, 0.55]} material={matCeramic.mustard}>
        <sphereGeometry args={[0.04, 12, 12]} />
      </mesh>

      {/* Tejado-techo prisma triangular terracota más oscuro (rotación X 0) */}
      <mesh
        position={[0, 2.05, 0]}
        castShadow={castShadow}
        material={matCeramic.terracotta}
      >
        <coneGeometry args={[1.0, 0.4, 4]} />
      </mesh>
    </IslandBase>
  );
}
