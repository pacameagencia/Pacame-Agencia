# Moodboard — Storybook 3D pacameagencia.com

> Dirección visual elegida: **Cerámica modernista mate**.

## Razón de la elección

De las 3 direcciones evaluadas, **cerámica modernista mate** gana porque:

1. **Encaja perfecta con la paleta Spanish Modernism** (terracota + índigo + mostaza + oliva sobre crema). Estos colores evocan ya cerámica artesanal española.
2. **Mate roughness 0.7-0.8 = look cálido y artesanal**, opuesto al "AI generic look" (gradientes brillantes + metalness alto). Diferenciador real.
3. **Compatible con primitives R3F** (cubos, cilindros, esferas extruidas con materiales mate brand-aware). No necesito modelos custom complejos para que se vea bien.
4. **Funciona en mobile real**: roughness alta = no necesita reflejos especulares ni HDRI pesado.
5. **Coherente con la cultura PACAME** (Cruz Novillo + Loewe + Joaquim Mir + arquitectura modernista catalana).

## Referencias visuales (sin usar imagen externa, solo descritas)

### Lenguaje formal
- **Loewe craft prize** — objetos cerámicos modernos, formas limpias, paleta tierra.
- **Cruz Novillo** — sistema modernista español, geometrías reducidas con personalidad.
- **Joaquim Mir** — luminosidad ibérica, paleta cálida.
- **Arquitectura modernista catalana** (Domènech, Gaudí pre-Sagrada) — formas orgánicas pero geométricas.
- **Faros costa cantábrica** — referencia para isla SEO.

### Cualidades 3D
- **Mate ceramic finish** — roughness 0.7-0.8, sin metallic, sin clearcoat.
- **Edges suaves** — bevel pequeño en cubos/cilindros para look pulido a mano.
- **Sombras definidas pero suaves** — directional light 35° SE + ambient cálida 0.4.
- **Sin reflejos especulares** — el material absorbe luz, no la rebota.

### Cualidades cromáticas
- **Paleta limitada** — 5 colores brand + neutros.
- **Sin gradientes** — colores planos por superficie. La profundidad viene de la luz, no de transiciones de color.
- **Acento mostaza** para hover/glow (chispa de vida sobre la base mate).
- **Crema paper** como ground/atmósfera — no negro, no blanco. Luminosidad ibérica cálida.

## Materials canónicos (traducción exacta)

```ts
// web/lib/3d/materials.ts
import { MeshStandardMaterial } from "three";

export const matCeramic = {
  paper:      new MeshStandardMaterial({ color: 0xF4EFE3, roughness: 0.9, metalness: 0 }),
  terracotta: new MeshStandardMaterial({ color: 0xB54E30, roughness: 0.78, metalness: 0 }),
  indigo:     new MeshStandardMaterial({ color: 0x283B70, roughness: 0.72, metalness: 0 }),
  mustard:    new MeshStandardMaterial({ color: 0xE8B730, roughness: 0.62, metalness: 0 }),
  olive:      new MeshStandardMaterial({ color: 0x6B7535, roughness: 0.75, metalness: 0 }),
  ink:        new MeshStandardMaterial({ color: 0x1A1813, roughness: 0.85, metalness: 0 }),
};

// Ground paper con noise sutil generado en shader
export const matPaperGround = new MeshStandardMaterial({
  color: 0xF4EFE3,
  roughness: 0.95,
  metalness: 0,
  // displacement map: simplex 3D, intensity 0.03
  // envMap: solo en mid/high tier
});

// Hover/active glow: mostaza emisiva sutil
export const matMustardEmissive = new MeshStandardMaterial({
  color: 0xE8B730,
  emissive: 0xE8B730,
  emissiveIntensity: 0.15,
  roughness: 0.6,
  metalness: 0,
});
```

## Iluminación canónica

```ts
// Setup en Scene.tsx
<ambientLight color={0xFFE8C8} intensity={0.4} />            // cálida
<directionalLight
  color={0xFFFFFF}
  intensity={0.7}
  position={[5, 8, 4]}                                        // 35° SE
  castShadow={tier !== "low"}
  shadow-mapSize-width={tier === "high" ? 1024 : 512}
/>

// Solo mid/high
<Environment preset="park" backgroundBlurriness={0.8} />

// NO HDRI pesado custom (excede budget mobile)
```

## Tipografías 3D

Cuando se necesita texto en 3D (metric headlines de casos, números grandes), usar **Fraunces extruida** (skill `troika-three-text` o `<Text3D>` de Drei).

```tsx
import { Text3D } from "@react-three/drei";
import frauncesFont from "@/public/fonts/fraunces-bold.json";

<Text3D
  font={frauncesFont}
  size={0.6}
  height={0.08}
  curveSegments={12}
  bevelEnabled
  bevelSize={0.01}
  bevelThickness={0.01}
>
  +47%
  <meshStandardMaterial color={0xB54E30} roughness={0.7} />
</Text3D>
```

Texto HUD overlay (no 3D): Fraunces para hooklines, Instrument Sans para body, JetBrains Mono para technical labels.

## Ground / atmósfera

- Plano de 30×30 unidades color paper `#F4EFE3`.
- Material con noise Perlin sutil (simplex-noise) en displacement, intensidad 0.03.
- Sin niebla volumétrica (pesa demasiado mobile). Si se quiere profundidad atmosférica → `<fog attach="fog" args={[0xF4EFE3, 18, 30]} />` solo desktop.

## Estados visuales (transiciones)

| Estado | Material | Glow | Scale | Y offset |
|---|---|---|---|---|
| `idle` | base mate | 0 | 1.0 | 0 |
| `hover` | base mate | mustard 0.15 | 1.04 | +0.1 |
| `active` | base mate | mustard 0.25 + halo | 1.0 (cámara cerca) | 0 |
| `exited` | base mate | 0 | 1.0 | 0 |

Transición con `gsap.to`, easing `power2.inOut`, duration 400ms.

## Reglas de oro (no negociables)

1. **NUNCA mezclar paleta** — los 5 colores brand exclusivamente. Si un material parece flojo, ajusto roughness, no añado un sexto color.
2. **NUNCA metalness > 0** — el look es cerámico mate, no metal pulido.
3. **NUNCA HDRI pesado** — `preset="park"` o nada.
4. **NUNCA gradientes Tailwind random** en el HUD overlay — usar tokens del tailwind config.
5. **NUNCA tipografía system-ui** en proyecto branded — Fraunces / Instrument Sans / JetBrains Mono según tipo.
6. **NUNCA SVG genérico como icono** — Lucide consistente, o `imagen` si necesito ilustración.

## Próximo paso

→ Generar 6 mockups con `imagen` (Google Gemini) usando este moodboard + wireframes.
→ Mockups en `docs/projects/storybook-3d/mockups/`.
→ Validar look con Pablo antes de Fase 1 (instalación stack).
