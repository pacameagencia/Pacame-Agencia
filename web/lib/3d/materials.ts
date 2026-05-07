import * as THREE from "three";

/**
 * Materiales canónicos del Storybook 3D (skill pacame-storybook-3d).
 *
 * Reglas duras:
 *   - SIEMPRE matte (roughness 0.6-0.9), NUNCA metalness > 0.
 *   - Paleta exacta del web/tailwind.config.ts (Spanish Modernism).
 *   - Sin clearcoat, sin sheen, sin transmission.
 *   - Diseño cerámica modernista (Loewe craft + Cruz Novillo + Catalan modernista).
 *
 * Estos materiales se reutilizan por instancia compartida (ahorra GPU).
 * Para variaciones temporales (hover/active), se clonan y se libera con dispose().
 */

export const BRAND = {
  paper: 0xf4efe3, // fondo, ground material, escena auditoría
  ink: 0x1a1813, // texto principal HUD, líneas técnicas
  terracotta: 0xb54e30, // Isla Web, CTA primary, accents
  indigo: 0x283b70, // Isla SEO, sombras profundas
  mustard: 0xe8b730, // Isla Redes, hover glow, highlights
  olive: 0x6b7535, // Isla Ads, materiales secundarios
} as const;

/**
 * Materiales base mate. Compartidos por instancia.
 * NO cambiar `metalness` ni añadir `clearcoat` — rompe el look modernista.
 */
export const matCeramic = {
  paper: new THREE.MeshStandardMaterial({
    color: BRAND.paper,
    roughness: 0.9,
    metalness: 0,
  }),
  terracotta: new THREE.MeshStandardMaterial({
    color: BRAND.terracotta,
    roughness: 0.78,
    metalness: 0,
  }),
  indigo: new THREE.MeshStandardMaterial({
    color: BRAND.indigo,
    roughness: 0.72,
    metalness: 0,
  }),
  mustard: new THREE.MeshStandardMaterial({
    color: BRAND.mustard,
    roughness: 0.62,
    metalness: 0,
  }),
  olive: new THREE.MeshStandardMaterial({
    color: BRAND.olive,
    roughness: 0.75,
    metalness: 0,
  }),
  ink: new THREE.MeshStandardMaterial({
    color: BRAND.ink,
    roughness: 0.85,
    metalness: 0,
  }),
} as const;

/**
 * Material ground paper con roughness alta (no refleja).
 * En `low` tier no recibe sombras (perf budget).
 */
export const matPaperGround = new THREE.MeshStandardMaterial({
  color: BRAND.paper,
  roughness: 0.95,
  metalness: 0,
});

/**
 * Hover/active glow: mostaza emisiva sutil.
 * Usar SOLO en estados temporales (hover/active), no como base.
 */
export const matMustardEmissive = new THREE.MeshStandardMaterial({
  color: BRAND.mustard,
  emissive: BRAND.mustard,
  emissiveIntensity: 0.15,
  roughness: 0.6,
  metalness: 0,
});

/**
 * Disposer global — llamar al unmount de la escena para liberar GPU.
 */
export function disposeAllBrandMaterials(): void {
  for (const mat of Object.values(matCeramic)) {
    mat.dispose();
  }
  matPaperGround.dispose();
  matMustardEmissive.dispose();
}
