"use client";

import { matCeramic } from "@/lib/3d/materials";
import { ISLAND_POSITIONS } from "@/lib/3d/camera-paths";

import IslandBase from "./IslandBase";

/**
 * Isla 2 — SEO (índigo profundo).
 *
 * Forma: faro/observatorio cilíndrico con linterna superior y haz de luz
 * cónico semitransparente proyectado al cielo crema.
 * Inspiración: faros costa cantábrica + observatorios modernistas.
 */

interface IslandSEOProps {
  active: boolean;
  hovered?: boolean;
  tier: "low" | "mid" | "high";
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export default function IslandSEO({
  active,
  hovered,
  tier,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: IslandSEOProps) {
  const castShadow = tier !== "low";

  return (
    <IslandBase
      slug="seo"
      position={ISLAND_POSITIONS.seo}
      active={active}
      hovered={hovered}
      tier={tier}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Base ancha cilíndrica índigo */}
      <mesh
        position={[0, 0.3, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.indigo}
      >
        <cylinderGeometry args={[0.85, 1.0, 0.6, 24]} />
      </mesh>

      {/* Torre principal cilíndrica más estrecha */}
      <mesh
        position={[0, 1.4, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.indigo}
      >
        <cylinderGeometry args={[0.55, 0.7, 1.6, 24]} />
      </mesh>

      {/* Plataforma observador (anillo) */}
      <mesh
        position={[0, 2.25, 0]}
        castShadow={castShadow}
        material={matCeramic.indigo}
      >
        <cylinderGeometry args={[0.7, 0.65, 0.15, 24]} />
      </mesh>

      {/* Linterna superior — cubo transparente con esfera mustard emisiva dentro */}
      <mesh position={[0, 2.55, 0]} castShadow={castShadow} material={matCeramic.indigo}>
        <cylinderGeometry args={[0.45, 0.5, 0.45, 24]} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={0xe8b730}
          emissive={0xe8b730}
          emissiveIntensity={active ? 0.8 : 0.4}
          roughness={0.5}
          metalness={0}
        />
      </mesh>

      {/* Cúpula */}
      <mesh
        position={[0, 2.85, 0]}
        castShadow={castShadow}
        material={matCeramic.indigo}
      >
        <coneGeometry args={[0.5, 0.4, 8]} />
      </mesh>

      {/* Haz de luz cónico semitransparente índigo (apuntando arriba con tilt) */}
      <mesh
        position={[0.15, 4.0, 0]}
        rotation={[0, 0, -0.15]}
      >
        <coneGeometry args={[0.7, 2.5, 32, 1, true]} />
        <meshBasicMaterial
          color={0xe8b730}
          transparent
          opacity={active ? 0.18 : 0.08}
          side={2 /* DoubleSide */}
          depthWrite={false}
        />
      </mesh>
    </IslandBase>
  );
}
