"use client";

import { matCeramic } from "@/lib/3d/materials";
import { ISLAND_POSITIONS } from "@/lib/3d/camera-paths";

import IslandBase from "./IslandBase";

/**
 * Isla 5 — Branding (mix terracota + mostaza).
 *
 * Forma: taller de cerámica con 3 piezas distintas en estantería:
 *  - Amphora alta terracota
 *  - Bowl ancho mostaza
 *  - Vaso cilíndrico terracota con banda mostaza
 *
 * Inspiración: Loewe craft prize + talleres modernistas catalanes.
 */

interface IslandBrandingProps {
  active: boolean;
  hovered?: boolean;
  tier: "low" | "mid" | "high";
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export default function IslandBranding({
  active,
  hovered,
  tier,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: IslandBrandingProps) {
  const castShadow = tier !== "low";

  return (
    <IslandBase
      slug="branding"
      position={ISLAND_POSITIONS.branding}
      active={active}
      hovered={hovered}
      tier={tier}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Estantería base — caja alta terracota mate (mueble del taller) */}
      <mesh
        position={[0, 0.9, -0.2]}
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={matCeramic.terracotta}
      >
        <boxGeometry args={[1.8, 1.7, 0.4]} />
      </mesh>

      {/* Estante divisor mostaza */}
      <mesh
        position={[0, 0.9, -0.2]}
        material={matCeramic.mustard}
      >
        <boxGeometry args={[1.85, 0.06, 0.42]} />
      </mesh>

      {/* Pieza 1: amphora terracota alta a la izquierda */}
      <group position={[-0.55, 1.45, 0]}>
        {/* Cuerpo amphora */}
        <mesh castShadow={castShadow} material={matCeramic.terracotta}>
          <sphereGeometry args={[0.22, 16, 16]} />
        </mesh>
        {/* Cuello */}
        <mesh
          position={[0, 0.25, 0]}
          castShadow={castShadow}
          material={matCeramic.terracotta}
        >
          <cylinderGeometry args={[0.07, 0.1, 0.3, 12]} />
        </mesh>
        {/* Boca */}
        <mesh position={[0, 0.4, 0]} material={matCeramic.terracotta}>
          <cylinderGeometry args={[0.1, 0.08, 0.05, 12]} />
        </mesh>
      </group>

      {/* Pieza 2: bowl mostaza ancho centro */}
      <group position={[0, 1.4, 0]}>
        <mesh castShadow={castShadow} material={matCeramic.mustard}>
          <cylinderGeometry args={[0.32, 0.22, 0.3, 24]} />
        </mesh>
        {/* Hueco superior (cylinder más pequeño en ink mate para profundidad visual) */}
        <mesh position={[0, 0.05, 0]} material={matCeramic.terracotta}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
        </mesh>
      </group>

      {/* Pieza 3: vaso cilíndrico con banda mostaza, derecha */}
      <group position={[0.55, 1.45, 0]}>
        <mesh castShadow={castShadow} material={matCeramic.terracotta}>
          <cylinderGeometry args={[0.18, 0.2, 0.55, 24]} />
        </mesh>
        {/* Banda mostaza en medio */}
        <mesh position={[0, 0.0, 0]} material={matCeramic.mustard}>
          <cylinderGeometry args={[0.205, 0.205, 0.12, 24]} />
        </mesh>
      </group>
    </IslandBase>
  );
}
