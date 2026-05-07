---
name: pacame-storybook-3d
description: Skill local del rediseño pacameagencia.com → Storybook 3D enfocado a captar leads cualificados. Mapa 3D isométrico con 5 islas (servicios PACAME), navegación scroll-driven, CTA único auditoría 15 min. Stack R3F + GSAP + Lenis + Tailwind. Mobile real con WebGL2 + LOD agresivo. Brand pack Spanish Modernism. Usar cuando se trabaje en cualquier archivo de web/app/(storybook)/, web/components/storybook-3d/, web/lib/3d/, public/3d/, o cuando se mencione "storybook 3d", "isla", "scene 3D", "r3f" + pacameagencia.
type: skill
slug: pacame-storybook-3d
tags:
  - type/skill
  - skill/3d
  - skill/frontend
  - skill/pacame-custom
  - status/active
  - project/storybook-3d
created: 2026-05-07
updated: 2026-05-07
heredada_de:
  - 3d-scroll-website
  - pacame-web
  - frontend-design
proyecto:
  plan: docs/projects/storybook-3d/README.md
  wireframes: docs/projects/storybook-3d/wireframes/
  moodboard: docs/projects/storybook-3d/moodboard.md
---

# pacame-storybook-3d — skill local del rediseño

## Misión

Construir una nueva home de **pacameagencia.com** con el concepto **Storybook 3D**: paisaje isométrico modernista con 5 islas (una por servicio PACAME), navegación scroll-driven que orbita y aterriza en cada zona, CTA único persistente "Pide tu auditoría 15 min" en cada escena, escena final con form auditoría integrado.

**Objetivo monetario único:** captar leads cualificados → form auditoría 15 min → Pablo cierra venta en la call (ticket alto 3.5K-15K€).

## Decisiones fundacionales (no se discuten)

1. **Mobile real con WebGL2** — no fallback degradado por elección, solo si el dispositivo realmente no soporta. LOD agresivo + KTX2 + frameloop demand.
2. **SEO intacto** — SSR del shell con `<NoScriptContent>` que renderiza los 5 servicios como `<section>` semántica con copy SEO completo.
3. **Brand pack Spanish Modernism** sin desviación: paleta y tipografías exactas del `web/tailwind.config.ts` actual.
4. **Lighthouse target:** ≥85 mobile / ≥90 desktop. LCP <2.5s. CLS <0.1.
5. **Quality gate** activo en cada PR: skill curada → checklist → revisor crítico.
6. **Assets 3D los crea Pablo (yo)** — sin Fiverr ni marketplace pagado. Capa A primitives R3F → Capa B texturas con `imagen` → Capa C `.glb` con Blender CLI o APIs gratuitas si imprescindible.

## Stack técnico canónico

```jsonc
{
  // Core 3D
  "three": "^0.171.0",
  "@react-three/fiber": "^9.0.0",        // Soporta React 19
  "@react-three/drei": "^10.0.0",
  "@react-three/postprocessing": "^3.0.0",
  "@types/three": "^0.171.0",
  "meshoptimizer": "^0.22.0",            // Compresión modelos

  // Animación scroll
  "gsap": "^3.13.0",
  "@gsap/react": "^2.1.2",               // useGSAP hook
  "lenis": "^1.3.21",                    // Ya instalado

  // Generación procedural
  "simplex-noise": "^4.0.3",             // Ya instalado

  // Dev only
  "leva": "^0.10.0"                      // Debug controls (devDependency)
}
```

**Versiones críticas:**
- R3F v9 = obligatorio para React 19 / Next 16. v8 NO compatible.
- Drei v10 alineado con R3F v9.
- GSAP v3.13+ con useGSAP hook estable.

## Estructura de carpetas (canónica)

```
web/app/(storybook)/                   # Route group, no afecta URL
  layout.tsx                           # Shell SSR + metadata + JSON-LD
  page.tsx                             # Home V2 (gated por flag)
  casos-3d/page.tsx                    # Galería 3D casos
  auditoria-3d/page.tsx                # Form auditoría escena final
  opengraph-image.tsx                  # OG image custom

web/components/storybook-3d/
  Scene.tsx                            # Canvas + lights + camera (fuente única)
  CameraController.tsx                 # GSAP scroll-driven cámara
  Ground.tsx                           # Plano paper con noise
  Islands/
    IslandWeb.tsx                      # Quiosco modernista
    IslandSEO.tsx                      # Faro/observatorio
    IslandRedes.tsx                    # Plaza con altavoces
    IslandAds.tsx                      # Dispensador monedas
    IslandBranding.tsx                 # Taller cerámica
  IslandLabel.tsx                      # HTML overlay sobre cada isla
  ProgressIndicator.tsx                # Mini-mapa 5 dots
  PersistentCTA.tsx                    # CTA flotante "Pide tu auditoría"
  AccessibleNav.tsx                    # Botones teclado (oculto visual)
  ReducedMotionFallback.tsx            # Snap-scroll 2D
  legacy-shell/NoScriptContent.tsx     # SEO content semántico
  auditoria/
    AuditoriaScene.tsx                 # Escena íntima café+libreta
    AuditoriaForm.tsx                  # Form HTML overlay
    ChipSelect.tsx                     # Selector chips (sector/budget/timing)
  EmailPrompt.tsx                      # Bottom-sheet captura email progresiva
  casos/
    CasosScene.tsx                     # Canvas separado 70vh
    CaseCard.tsx                       # Tarjeta 3D rotable
    NoScriptCases.tsx                  # SEO content casos

web/lib/3d/
  use-webgl-support.ts                 # Detección WebGL2 + fallback
  use-reduced-motion.ts                # Hook a11y
  use-scroll-progress.ts               # Hook 0..1 con Lenis
  use-device-tier.ts                   # low/mid/high → LOD
  lod.ts                               # Helpers de LOD
  materials.ts                         # MeshStandardMaterial brand-aware
  camera-paths.ts                      # 6 keyframes (overview + 5 islas)
  scene-config.ts                      # Tipos compartidos

web/lib/storybook/
  lead-tracker.ts                      # Tracking islas/tiempo cliente
  content.ts                           # Copy de cada isla (i18n-ready)
  auditoria-schema.ts                  # Zod schema form

public/3d/
  models/                              # .glb compressed (Draco + meshopt)
  textures/                            # .ktx2 multi-size (1024/2048)
  fallback/
    hero-1080.mp4                      # Pre-rendered fallback desktop
    hero-720.mp4                       # Pre-rendered fallback mobile
    hero-poster.webp                   # Poster LCP <2.5s
```

## Brand pack 3D (paleta exacta)

| Token | Hex | Uso 3D |
|---|---|---|
| `paper` | `#F4EFE3` | Fondo, ground material, escena auditoría |
| `terracotta` | `#B54E30` | Isla Web, CTA primary, accents |
| `indigo` | `#283B70` | Isla SEO, sombras profundas |
| `mustard` | `#E8B730` | Isla Redes, hover glow, highlights |
| `olive` | `#6B7535` | Isla Ads, materiales secundarios |
| `ink` | `#1A1813` | Texto principal HUD, líneas técnicas |

Tipografías:
- **Fraunces** (display, hooklines, metrics 3D)
- **Instrument Sans** (body, HUD overlay)
- **JetBrains Mono** (technical labels, debug)

## Materiales canónicos (`web/lib/3d/materials.ts`)

```ts
// Mate sin metallic, roughness alta para look cerámico modernista
export const matMatte = {
  terracotta: { color: "#B54E30", roughness: 0.8, metalness: 0 },
  indigo:     { color: "#283B70", roughness: 0.7, metalness: 0 },
  mustard:    { color: "#E8B730", roughness: 0.6, metalness: 0 },
  olive:      { color: "#6B7535", roughness: 0.75, metalness: 0 },
  paper:      { color: "#F4EFE3", roughness: 0.9, metalness: 0 },
};

// Ground con noise Perlin sutil generado en shader (simplex-noise)
export const paperGroundShader = /* glsl */ `
  // Vertex displacement con simplex 3D, intensidad 0.03
  // Fragment con color #F4EFE3 + ruido sutil ±0.02 lightness
`;
```

**Reglas:**
- NUNCA `metalness > 0` (look modernista, no SaaS-tech).
- NUNCA HDRI pesado en mobile. Solo `<Environment preset="park">` mid/high.
- Sombras: 1024 desktop / 512 mobile / off low-tier.

## Performance budgets (NO se negocian)

| Métrica | Desktop | Mobile mid | Mobile low |
|---|---|---|---|
| FPS objetivo | 60 | 30 | 24 (con frameloop demand) |
| Frame budget | <16ms | <33ms | <42ms |
| Bundle 3D inicial | <800kB gz | <600kB gz | <400kB gz |
| Pixel ratio | min(2, dpr) | min(1.5, dpr) | 1 |
| Texturas max | 2048px | 1024px | 512px |
| Postprocessing | SMAA + bloom | FXAA | OFF |
| Shadow map | 1024 | 512 | OFF |
| HDRI | preset park | preset park | OFF |
| Modelos LOD | high | mid | low |

**Detección automática** vía `useDeviceTier()`:
- `navigator.deviceMemory < 4` → low
- `4 ≤ deviceMemory < 8` → mid
- `deviceMemory ≥ 8 && hardwareConcurrency ≥ 4` → high
- Fallback: leer `connection.effectiveType` (`slow-2g/2g/3g` → low)

## Scroll-driven canónico

**Fuente única de verdad: Lenis.** No mezclar con ScrollTrigger en scroll global.

```tsx
// Lenis ya inicializado en layout (web/components/lenis-provider.tsx)
// Hook propio:
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const lenis = window.__lenis;
    const handler = ({ progress }) => setProgress(progress);
    lenis.on("scroll", handler);
    return () => lenis.off("scroll", handler);
  }, []);
  return progress;
}

// CameraController consume progress y mueve camera con gsap.to
// 6 keyframes en camera-paths.ts: [overview, web, seo, redes, ads, branding]
// Interpolación bezier suave entre puntos. Click en isla = override.
```

**ScrollTrigger** queda permitido SOLO para reveals locales (HUD aparece, label fade-in), no para el control de cámara global.

## SSR + SEO

`(storybook)/page.tsx` importa Scene con `next/dynamic`:

```tsx
const Scene = dynamic(() => import("@/components/storybook-3d/Scene"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

export default function StorybookHome() {
  return (
    <>
      <NoScriptContent />          {/* Crawlers ven HTML real */}
      <ClientOnly>
        <Scene />
        <HUD />
      </ClientOnly>
    </>
  );
}
```

**`<NoScriptContent>`** renderiza los 5 servicios como `<section>` semántica con `<h2>` + copy completo (~150 palabras por servicio). CSS lo oculta cuando WebGL2 OK pero el HTML está siempre en el DOM.

**Schema.org** en `(storybook)/layout.tsx`: Organization + WebSite + 5 Service[] + BreadcrumbList. Genera JSON-LD que Google indexa.

**OG image** custom con `next/og` en `opengraph-image.tsx` (paleta brand + headline).

## Accesibilidad

- `<AccessibleNav>` siempre en DOM, oculto visual por defecto, visible al `:focus-within` o si `prefers-reduced-motion`.
- Atajos teclado: `1..5` saltan a isla, `Esc` overview, `Tab` cycle HUD, `Enter` activa CTA.
- Toggle "Modo reducido" en footer + auto-detect `prefers-reduced-motion: reduce` → cambia a snap-scroll 2D con animaciones CSS suaves.
- Form auditoría: labels asociadas, errores con `aria-live="polite"`, focus trap mientras abierto.
- Contraste WCAG AA verificado en HUD (texto sobre canvas dinámico → pill backgrounds).

## Anti-patrones específicos del proyecto

🔴 **NUNCA**:
- Colores hex random fuera de la paleta (ej. `#FF6B6B` o gradientes Tailwind random).
- `metallic: 1` o materiales reflejantes (rompe look modernista mate).
- HDRI pesado (>500kB) en mobile.
- ScrollTrigger como fuente única de scroll global (race con Lenis).
- Form HTML dentro de `<Canvas>` directo (perdida de focus). Form va en overlay.
- `<svg>` placeholder genérico para iconos. Lucide/Radix consistente.
- Copy con palabras IA prohibidas (desbloquea, embárcate, viaje, transformador).
- CTA múltiples en una escena. UN CTA único: "Pide tu auditoría 15 min".
- Texturas no comprimidas (PNG/JPG). KTX2 obligatorio.
- Modelos sin Draco compression.
- Audio autoplay con sonido. Mute por defecto.
- Lighthouse <85 mobile sin justificación documentada.

✅ **SIEMPRE**:
- Paleta exacta del tailwind config.
- `MeshStandardMaterial` mate (`roughness 0.6-0.8`).
- LOD agresivo en mobile.
- `frameloop="demand"` para no quemar batería en idle.
- `next/dynamic` con `{ ssr: false }` para Scene.
- `<NoScriptContent>` semántico siempre presente.
- CTA persistente "Pide tu auditoría 15 min".
- `useGSAP` hook (no manual gsap.context).
- Tree-shake explícito de Three: `import { Mesh } from "three"` (NO `import * as THREE`).
- Dispose de geometrías/materiales en unmount.

## Quality gate por fase

Cada fase del proyecto pasa por:
1. **Capa 1** — invocar las skills documentadas en este SKILL.md
2. **Capa 2** — checklist específico de la fase (en `docs/projects/storybook-3d/README.md`)
3. **Capa 3** — revisor crítico:
   - `visual-reviewer` para escenas/HUD/mockups
   - `quality-reviewer` dom=copy para hooklines/CTAs
   - `code-reviewer` para .ts/.tsx 3D (LOD, dispose, memoización)

## Referencias

- **Plan completo del proyecto:** `docs/projects/storybook-3d/README.md`
- **Wireframes 6 escenas:** `docs/projects/storybook-3d/wireframes/`
- **Moodboard cerámica modernista:** `docs/projects/storybook-3d/moodboard.md`
- **Mockups generados con imagen:** `docs/projects/storybook-3d/mockups/`
- **Servicios PACAME (fuente copy):** `web/lib/data/services.ts`
- **Casos PACAME (fuente galería):** `web/lib/data/case-studies.ts`
- **Brand tailwind config:** `web/tailwind.config.ts`
- **Endpoint leads (extender):** `web/app/api/leads/route.ts`

## Cuándo se invoca esta skill

- Antes de crear/modificar cualquier archivo en `web/app/(storybook)/`, `web/components/storybook-3d/`, `web/lib/3d/`, `web/lib/storybook/`, `public/3d/`.
- Cuando el hook `quality-gate-hook.py` detecta intent "storybook 3d", "isla", "scene 3d", "r3f", "react-three-fiber".
- Cuando Pablo pide "siguiente fase del storybook" o referencia el proyecto.
- En cada PR del proyecto storybook-3d como Capa 1 obligatoria del quality gate.
