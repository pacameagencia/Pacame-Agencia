"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

import { matCeramic } from "@/lib/3d/materials";

/**
 * Tarjeta 3D rotable de caso de éxito — Fase 3.
 *
 * Diseño: cuboid vertical con 4 caras visibles:
 *  - Frente: metric headline gigante en Fraunces extruido + subtítulo
 *  - Lado derecho: cliente + sector + ciudad
 *  - Lado izquierdo: tags
 *  - Atrás: quote breve
 *
 * Animación:
 *  - Idle: rotación suave sobre eje Y (autoplay, 0.15 rad/s).
 *  - Hover: pausa rotación + scale 1.04 + glow mostaza.
 *  - Click: navega a /casos/[slug] (página existente, no se duplica).
 *
 * Materiales:
 *  - Body: terracotta o indigo según paleta (alterna por idx).
 *  - Frente: panel paper recessed con texto ink.
 *  - Edges sutiles bevel para look modernista.
 */

interface CaseCardProps {
  position: [number, number, number];
  /** Color base de la card (alterna entre terracotta/indigo/mustard). */
  baseColor: "terracotta" | "indigo" | "mustard";
  metricHeadline: string;
  metricSubtitle: string;
  clientName: string;
  sector: string;
  city: string;
  slug: string;
  tier: "low" | "mid" | "high";
  onClick?: () => void;
}

export default function CaseCard({
  position,
  baseColor,
  metricHeadline,
  metricSubtitle,
  clientName,
  sector,
  city,
  slug,
  tier,
  onClick,
}: CaseCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const castShadow = tier !== "low";

  const bodyMat =
    baseColor === "terracotta"
      ? matCeramic.terracotta
      : baseColor === "indigo"
        ? matCeramic.indigo
        : matCeramic.mustard;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Rotación idle sobre Y, pausa en hover
    if (!hovered) {
      groupRef.current.rotation.y += delta * 0.15;
    }
    // Lerp scale suave
    const targetScale = hovered ? 1.04 : 1;
    const s = groupRef.current.scale;
    const lerped = s.x + (targetScale - s.x) * 0.15;
    s.set(lerped, lerped, lerped);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (typeof document !== "undefined") {
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        if (typeof document !== "undefined") {
          document.body.style.cursor = "auto";
        }
      }}
      data-case-slug={slug}
    >
      {/* Cuerpo principal — cuboid vertical 1.5×2×1 */}
      <mesh
        castShadow={castShadow}
        receiveShadow={castShadow}
        material={bodyMat}
      >
        <boxGeometry args={[1.5, 2, 1]} />
      </mesh>

      {/* Frente — panel paper recessed */}
      <mesh position={[0, 0, 0.51]} material={matCeramic.paper}>
        <boxGeometry args={[1.3, 1.8, 0.03]} />
      </mesh>

      {/* Metric headline en Fraunces (Drei Text 3D-aware con sdf) */}
      <Text
        position={[0, 0.45, 0.54]}
        fontSize={0.42}
        color={baseColor === "mustard" ? "#1A1813" : "#B54E30"}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {metricHeadline}
      </Text>

      {/* Subtitle */}
      <Text
        position={[0, 0.05, 0.54]}
        fontSize={0.085}
        color="#1A1813"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={1.1}
      >
        {metricSubtitle}
      </Text>

      {/* Linea separadora */}
      <mesh position={[0, -0.15, 0.54]}>
        <planeGeometry args={[0.6, 0.005]} />
        <meshBasicMaterial color={0x1a1813} opacity={0.3} transparent />
      </mesh>

      {/* Cliente + sector + ciudad */}
      <Text
        position={[0, -0.35, 0.54]}
        fontSize={0.09}
        color="#1A1813"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={1.1}
      >
        {clientName}
      </Text>
      <Text
        position={[0, -0.5, 0.54]}
        fontSize={0.065}
        color="#1A1813"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={1.1}
      >
        {`${sector} · ${city}`}
      </Text>

      {/* CTA hint en la parte inferior */}
      <Text
        position={[0, -0.78, 0.54]}
        fontSize={0.055}
        color="#B54E30"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={1.1}
      >
        VER CASO →
      </Text>

      {/* Halo mostaza emisivo cuando hover */}
      {hovered && (
        <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.15, 48]} />
          <meshStandardMaterial
            color={0xe8b730}
            emissive={0xe8b730}
            emissiveIntensity={0.4}
            roughness={0.6}
            metalness={0}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
    </group>
  );
}
