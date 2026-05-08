"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { matCeramic } from "@/lib/3d/materials";
import type { IslandSlug } from "@/lib/storybook/content";

/**
 * Base compartida de cada isla — disco-podio + animación hover/active suave.
 *
 * Patrón:
 *  - Disco horizontal de radio 1.6, altura 0.2, color paper (matiza con luz).
 *  - Pequeño bevel para look modernista (no canto puro).
 *  - Estados: idle / hover (scale 1.04, +0.1 Y) / active (scale 1.0, glow halo).
 *  - Hijos = la "forma temática" de cada isla (cilindro/torre/altavoces…).
 *
 * Render orders:
 *  - El disco recibe sombra del directional light (en mid/high).
 *  - Los hijos arrojan sombra sobre el disco.
 */

interface IslandBaseProps {
  /** Slug de la isla (para tracking y a11y). */
  slug: IslandSlug;
  /** Posición en el mundo (centro de la isla). */
  position: THREE.Vector3 | [number, number, number];
  /** Si esta isla está activa (cámara cerca). */
  active: boolean;
  /** Si está siendo hover (mouse encima). */
  hovered?: boolean;
  /** Tier de calidad para sombras. */
  tier: "low" | "mid" | "high";
  /** Hijos = forma temática 3D específica. */
  children?: React.ReactNode;
  /** Click handler — usado para activar isla manualmente. */
  onClick?: () => void;
  /** Hover handlers. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export default function IslandBase({
  slug,
  position,
  active,
  hovered = false,
  tier,
  children,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: IslandBaseProps) {
  const groupRef = useRef<THREE.Group>(null);
  // Target Y offset según estado (hover lifts +0.1)
  const targetYRef = useRef(0);
  // Target scale según estado
  const targetScaleRef = useRef(1);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Decide objetivos
    const yTarget = hovered ? 0.1 : 0;
    const scaleTarget = hovered ? 1.04 : 1;
    targetYRef.current = yTarget;
    targetScaleRef.current = scaleTarget;

    // Lerp suave (15% per frame ≈ 250ms para alcanzar)
    const cur = groupRef.current.position;
    const basePos = Array.isArray(position)
      ? position
      : [position.x, position.y, position.z];
    cur.x += (basePos[0] - cur.x) * 0.15;
    cur.y += (basePos[1] + yTarget - cur.y) * 0.15;
    cur.z += (basePos[2] - cur.z) * 0.15;

    const s = groupRef.current.scale;
    const lerpedScale = s.x + (scaleTarget - s.x) * 0.15;
    s.set(lerpedScale, lerpedScale, lerpedScale);

    // Suprime warning de delta sin uso
    void delta;
  });

  // Emisivo cuando active = halo mostaza sutil (clonado para no mutar shared)
  const baseMat = useMemo(() => {
    return matCeramic.paper.clone();
  }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      // Cursor pointer hover
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
      }}
      data-island-slug={slug}
    >
      {/* Disco-podio paper, recibe sombra de hijos */}
      <mesh
        position={[0, -0.1, 0]}
        receiveShadow={tier !== "low"}
        material={baseMat}
      >
        <cylinderGeometry args={[1.6, 1.6, 0.2, 32]} />
      </mesh>

      {/* Halo mostaza cuando isla activa (anillo sutil debajo del disco) */}
      {active && (
        <mesh position={[0, -0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.7, 1.95, 64]} />
          <meshStandardMaterial
            color={0xe8b730}
            emissive={0xe8b730}
            emissiveIntensity={0.4}
            roughness={0.6}
            metalness={0}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Forma temática 3D específica de cada isla */}
      {children}
    </group>
  );
}
