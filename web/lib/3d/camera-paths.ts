import * as THREE from "three";

/**
 * Keyframes de cámara para el Storybook 3D.
 *
 * 6 keyframes ordenados por scroll progress:
 *   [0] overview     — vista de pájaro de las 5 islas
 *   [1] isla-web
 *   [2] isla-seo
 *   [3] isla-redes
 *   [4] isla-ads
 *   [5] isla-branding
 *
 * Escena auditoría es ruta separada `/auditoria-3d` con cámara propia.
 *
 * Posiciones definidas en world units. Origen (0,0,0) es centro del paisaje.
 * Y+ es arriba, X+ es derecha, Z+ hacia el observador (estilo Three.js).
 */

export interface CameraKeyframe {
  /** Slug identificador (también el id de la isla activa). */
  slug: "overview" | "web" | "seo" | "redes" | "ads" | "branding";
  /** Posición en world units. */
  position: THREE.Vector3;
  /** Punto al que mira la cámara. */
  lookAt: THREE.Vector3;
  /** Field of view en grados. */
  fov: number;
}

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  {
    slug: "overview",
    position: new THREE.Vector3(-1, 8, 14),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 50,
  },
  {
    slug: "web",
    position: new THREE.Vector3(-3, 4, 6),
    lookAt: new THREE.Vector3(-2.5, 1, 4),
    fov: 45,
  },
  {
    slug: "seo",
    position: new THREE.Vector3(3, 4, 6),
    lookAt: new THREE.Vector3(2.5, 1.2, 4),
    fov: 45,
  },
  {
    slug: "redes",
    position: new THREE.Vector3(-3, 4, -2),
    lookAt: new THREE.Vector3(-2.5, 1, -3),
    fov: 45,
  },
  {
    slug: "ads",
    position: new THREE.Vector3(3, 4, -2),
    lookAt: new THREE.Vector3(2.5, 1, -3),
    fov: 45,
  },
  {
    slug: "branding",
    position: new THREE.Vector3(0, 4, -5),
    lookAt: new THREE.Vector3(0, 1, -6),
    fov: 45,
  },
] as const;

/**
 * Posiciones de cada isla en el mundo (centro de su volumen).
 * Volumen aproximado: 3×3×3 unidades. Cada isla flota a Y=0 (sobre ground).
 */
export const ISLAND_POSITIONS = {
  web: new THREE.Vector3(-3, 0, 4),
  seo: new THREE.Vector3(3, 0, 4),
  redes: new THREE.Vector3(-3, 0, -2),
  ads: new THREE.Vector3(3, 0, -2),
  branding: new THREE.Vector3(0, 0, -5),
} as const;

/**
 * Interpola entre dos keyframes con clamp 0..1.
 * Modifica la cámara in-place (no crea nuevos Vector3 cada frame → GC-friendly).
 */
export function interpolateCamera(
  camera: THREE.PerspectiveCamera,
  from: CameraKeyframe,
  to: CameraKeyframe,
  t: number,
  lookAtTarget: THREE.Vector3,
): void {
  const tt = Math.max(0, Math.min(1, t));
  // Bezier ease-in-out simple
  const e = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;

  camera.position.lerpVectors(from.position, to.position, e);
  lookAtTarget.lerpVectors(from.lookAt, to.lookAt, e);
  camera.fov = from.fov + (to.fov - from.fov) * e;
  camera.updateProjectionMatrix();
  camera.lookAt(lookAtTarget);
}

/**
 * Dado un progress global 0..1, devuelve [from, to, localT] entre keyframes.
 *
 * Distribuye las 6 keyframes uniformemente:
 *   progress 0.0  → overview
 *   progress 0.2  → web
 *   progress 0.4  → seo
 *   progress 0.6  → redes
 *   progress 0.8  → ads
 *   progress 1.0  → branding
 */
export function progressToKeyframes(
  progress: number,
): { from: CameraKeyframe; to: CameraKeyframe; localT: number } {
  const segments = CAMERA_KEYFRAMES.length - 1;
  const scaled = Math.max(0, Math.min(1, progress)) * segments;
  const fromIdx = Math.min(Math.floor(scaled), segments - 1);
  const toIdx = fromIdx + 1;
  const localT = scaled - fromIdx;
  return {
    from: CAMERA_KEYFRAMES[fromIdx],
    to: CAMERA_KEYFRAMES[toIdx],
    localT,
  };
}
