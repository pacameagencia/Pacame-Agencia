# PACAME · Design System Tech-IA (Sprint 25)

Identidad nueva: **dark dominante + light mode**, accent cálido, tipografía Geist, microinteracciones cinematográficas. Paleta inspirada en Linear, Anthropic, Vercel; drama visual inspirado en Lusion / Igloo.

---

## 1. Paleta

Todos los tokens se exponen como **CSS vars** para que cambiar cualquier color sea **una línea** en `web/app/globals.css`.

### Dark mode (default)

| Token | CSS var | HEX | Uso |
|---|---|---|---|
| `tech.bg` | `--tech-bg` | `#0A0A0B` | Fondo principal |
| `tech.surface` | `--tech-surface` | `#111114` | Cards, panels |
| `tech.elevated` | `--tech-elevated` | `#17171B` | Raised surfaces |
| `tech.border` | `--tech-border` | `#26262C` | Borders strong |
| `tech.border-soft` | `--tech-border-soft` | `#1F1F24` | Borders sutiles |
| `tech.text` | `--tech-text` | `#F4F4F5` | Texto primario |
| `tech.text-soft` | `--tech-text-soft` | `#A1A1AA` | Texto secundario |
| `tech.text-mute` | `--tech-text-mute` | `#71717A` | Texto terciario |
| `tech.text-faint` | `--tech-text-faint` | `#52525B` | Texto desactivado |

### Light mode (`.light` en `<html>`)

Override automático vía `next-themes`. Ver `globals.css` línea 64+.

### Accent (variable — Pablo iterará con sus fotos)

| Token | CSS var | HEX | Uso |
|---|---|---|---|
| `tech.accent` | `--tech-accent` | `#FF6B35` | CTA primario, highlights |
| `tech.accent-soft` | `--tech-accent-soft` | `#FFB088` | Hover state |
| `tech.accent-glow` | `--tech-accent-glow` | `rgba(255,107,53,0.25)` | Glow rings |
| `tech.accent-2` | `--tech-accent-2` | `#7C3AED` | Glow secundario, gradients |

**Cambiar accent global**: modifica `--tech-accent` en `globals.css:11`. Todo el sistema reacciona en cascade.

---

## 2. Tipografía

**Solo 2 fuentes** (reducidas de 7 que cargábamos antes):

- **Display + body**: `GeistSans` (variable). Fallback `system-ui, sans-serif`.
- **Mono**: `GeistMono`. Fallback `ui-monospace`.

Tokens Tailwind: `font-sans`, `font-display`, `font-mono`.

Escala fontSize sugerida (usar inline `style` con `clamp()` para hero):

```ts
fontSize: "clamp(2.75rem, 9vw, 7.5rem)",  // hero
fontSize: "clamp(2.25rem, 5vw, 4rem)",    // section
fontSize: "clamp(1.5rem, 3vw, 2rem)",     // subsection
```

Letter-spacing recomendado:

- Hero: `-0.04em`
- Section: `-0.035em`
- Body/UI: `-0.02em` o default

---

## 3. Espaciado y radius

- `borderRadius: rounded-{none, xs, sm, md, lg, xl, 2xl, 3xl, 4xl}` (definidos)
- Spacing custom: `18`, `22`, `30` (rem)
- Section padding cinematic: `py-32 md:py-48`

---

## 4. Sombras

| Token | Uso |
|---|---|
| `shadow-tech-sm/tech/tech-lg/tech-xl` | Cards multi-layer Apple-grade |
| `shadow-tech-glow` | Glow del accent (ej. botón primary hover) |
| `shadow-tech-glow-sm` | Glow ligero |
| `shadow-tech-ring` | Ring focus accesible |
| `shadow-tech-inner` | Inset highlight + lowlight |

---

## 5. Animaciones

Keyframes Tailwind:

- `animate-kinetic-reveal` — fade up + blur reveal
- `animate-mask-wipe` — clip-path inset
- `animate-magnetic-pulse` — ring expansion infinite
- `animate-gradient-orbit` — background-position orbit (24s)
- `animate-glow-breathe` — opacity + scale pulse
- `animate-scroll-hint` — translate vertical hint

Easings (de `web/lib/animations/easings.ts`):

- `EASE_APPLE = [0.23, 1, 0.32, 1]` — micro-interacciones
- `EASE_LUSION = [0.7, 0, 0.3, 1]` — entrada cinematográfica
- `EASE_OUT_EXPO = [0.16, 1, 0.3, 1]` — reveals dramáticos

Duraciones estándar (`DURATION` en easings.ts): `micro 150ms`, `fast 220ms`, `medium 400ms`, `slow 600ms`, `cinematic 900ms`, `hero 1200ms`.

---

## 6. Componentes cinematic

Todos en `web/components/cinematic/`:

| Componente | Para qué |
|---|---|
| `HeroCinematic` | Hero scroll-driven con gradient mesh + char split + magnetic CTA |
| `KineticHeading` | H1/H2/H3 con char-by-char reveal al intersectar viewport |
| `ManifestSection` | 5 servicios como manifiesto editorial scroll-driven |
| `AgentsSpotlight` | 7 agentes IA grid + Pablo card con disclaimer |
| `CasesShowcase` | Casos con image reveal clip-path scroll-driven |
| `PricingTier` | 3 tiers Linear-style + anchoring competitivo |
| `ContactCTA` | CTA pantalla completa con drama Lusion |
| `ToolsCarousel` | Marquee infinito de tools (sin SVG inventados) |

---

## 7. Microinteracciones

`web/components/effects/`:

- `CursorRing` — anillo custom Lusion. Solo desktop ≥1024px y hover-capable.
- `MagneticBox` — wrapper genérico para magnetic effect.
- `ScrollProgress` — barra superior 2 px gradient accent.

`web/components/theme/`:

- `ThemeSwitcher` — sun/moon morph en Header.
- `ThemeBodyClass` — aplica `body.theme-tech` mientras la página está montada (las 5 core).

---

## 8. Estrategia dual: tech vs legacy

**5 páginas core** (home + servicios + agentes + casos + contacto) usan `<ThemeBodyClass className="theme-tech" />` que activa la paleta dark tech-IA.

**Resto de la app** (portal, dashboard, herramientas, blog, /para, /casos/[slug], etc.) mantiene la paleta **Spanish Modernism legacy** (paper #F4EFE3 + terracota + índigo + mostaza). NO se tocan; los tokens legacy están intactos en `tailwind.config.ts` y `globals.css`.

Esto evita romper 100+ páginas internas mientras se moderniza la cara pública.

---

## 9. Cómo añadir una nueva sección cinematic

1. Crea el componente en `web/components/cinematic/MiSeccion.tsx`.
2. Usa `KineticHeading` para el título y `MagneticBox` para CTAs.
3. Aplica los tokens `bg-tech-bg`, `text-tech-text`, `text-tech-text-soft`.
4. Importa los easings desde `@/lib/animations/easings`.
5. Añade `data-cursor="hover"` a links/buttons interactivos para el cursor expansion.
6. Inserta en la página: el wrapper `<ThemeBodyClass />` debe estar al inicio.

---

## 10. Cómo cambiar el accent (cuando Pablo suba paleta)

Edita `web/app/globals.css` líneas 11–15:

```css
:root {
  --tech-accent: #YOUR_HEX_HERE;
  --tech-accent-soft: #LIGHTER_VARIANT;
  --tech-accent-glow: rgba(R, G, B, 0.25);
  --tech-accent-2: #SECONDARY_HEX;
  --tech-accent-2-soft: #SECONDARY_LIGHT;
}
```

Reload. Listo. Todo el sistema usa esos vars.

---

🤖 Sprint 25 · Cinematic redesign by Claude Code
