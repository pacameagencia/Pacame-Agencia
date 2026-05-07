# Wireframes — Storybook 3D pacameagencia.com

> 6 escenas + estados de cámara + HUD overlay. Vista de pájaro y vista de cada isla.

## Vista general (overview)

Estado inicial al cargar la home. Cámara isométrica 35° elevación, distancia ~14 unidades.

```
                    Cámara overview (-1, 8, 14)
                              ↓
        ┌─────────────────────────────────────────┐
        │            ☁️                            │
        │                                          │
        │       🏘️ ISLA 1     💡 ISLA 2           │
        │       (Web)         (SEO)                │
        │       terracota     índigo               │
        │                                          │
        │   📣 ISLA 3                              │
        │   (Redes)        💰 ISLA 4               │
        │   mostaza        (Ads)                   │
        │                  oliva                   │
        │                                          │
        │              🏺 ISLA 5                   │
        │              (Branding)                  │
        │              terracota+mostaza           │
        │                                          │
        │  ━━━━━━━ ground paper #F4EFE3 ━━━━━━━   │
        └─────────────────────────────────────────┘

HUD overlay (siempre presente):
  ┌────────────────────────────────────────────┐
  │ 🟫 PACAME                       [≡ menú]   │  ← header transparente
  │                                            │
  │  ● ● ● ● ● ●                               │  ← progress 6 dots (overview activo)
  │                                            │
  │            "Tu agencia de IA"               │  ← hookline overview
  │            "5 servicios. 1 transformación." │
  │                                            │
  │  Scroll para empezar ↓                     │  ← affordance scroll
  │                                            │
  │                          [Pide auditoría]  │  ← CTA persistente bottom-right
  └────────────────────────────────────────────┘
```

## Isla 1 — Desarrollo Web (terracota #B54E30)

**Forma temática:** casa-quiosco modernista de 2 pisos con pantalla frontal. Inspiración: kioscos urbanos catalanes + arquitectura Loewe.

```
        Cámara isla-web (-3, 4, 6)
                 ↓
  ┌─────────────────────────────────────┐
  │                                      │
  │            ┌───────────┐             │
  │            │   ▢ ▢ ▢   │  ← pantalla con UI mock
  │            │  ▢ ▢ ▢ ▢  │
  │            ├───────────┤
  │            │  ┌─────┐  │  ← puerta
  │            │  │     │  │
  │            └──┴─────┴──┘
  │            cilindro base terracota
  │                                      │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
  └─────────────────────────────────────┘

HUD activo:
  ┌────────────────────────────────────────────┐
  │ 🟫 PACAME                       [≡ menú]   │
  │  ○ ● ○ ○ ○ ○                               │  ← progress isla 1 activa
  │                                            │
  │  WEB                                       │  ← label categoría
  │  "Tu negocio online en 30 días"            │  ← hookline
  │                                            │
  │  3 niveles desde 800€:                     │  ← oneLineValue
  │  • Landing ────────── 800€                 │
  │  • Web Corporativa ── 2.500€               │
  │  • E-commerce ─────── 4.000€+              │
  │                                            │
  │  Mini-caso: +47% conversión en 60 días     │
  │                                            │
  │                       [Pide auditoría]     │  ← CTA persistente
  └────────────────────────────────────────────┘
```

## Isla 2 — SEO (índigo #283B70)

**Forma temática:** faro/observatorio con haz de luz que rota lentamente. Inspiración: faros de la costa cantábrica + arquitectura observatorio.

```
        Cámara isla-seo (3, 4, 6)
                 ↓
  ┌─────────────────────────────────────┐
  │                                      │
  │           ╱ haz luz ╲                │  ← cono semitransparente índigo
  │          ╱           ╲                │
  │         ┌─────┐                      │
  │         │  ⊙  │  ← linterna superior │
  │         ├─────┤                      │
  │         │     │                      │
  │         │     │  ← torre cilíndrica  │
  │         │     │     índigo           │
  │         └─────┘                      │
  │                                      │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
  └─────────────────────────────────────┘

HUD activo:
  SEO
  "Te encuentran o no existes"
  Auditorías + estrategia + link building. Desde 300€/mes.
  Mini-caso: +180% tráfico orgánico en 6 meses
```

## Isla 3 — Redes Sociales (mostaza #E8B730)

**Forma temática:** plaza modernista circular con 3 altavoces tipo dazibao apuntando al cielo.

```
        Cámara isla-redes (-3, 4, -2)
                 ↓
  ┌─────────────────────────────────────┐
  │                                      │
  │      📣      📣      📣              │  ← 3 conos altavoces mostaza
  │       \\    ||    //                 │
  │        \\   ||   //                  │
  │         ╲══╪╪══╱                     │  ← plaza circular
  │       ┌──┴──┴──┐                     │
  │       │ plaza  │                     │
  │       └────────┘                     │
  │                                      │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
  └─────────────────────────────────────┘

HUD activo:
  REDES SOCIALES
  "Tu audiencia te escucha por fin"
  Contenido + community + estrategia. Desde 300€/mes.
  Mini-caso: 0 → 15K followers IG en 90 días
```

## Isla 4 — Publicidad Digital (oliva #6B7535)

**Forma temática:** dispensador de monedas (slot machine modernista) con monedas oliva cayendo.

```
        Cámara isla-ads (3, 4, -2)
                 ↓
  ┌─────────────────────────────────────┐
  │                                      │
  │        ┌─────────┐                   │
  │        │  ▢ ▢ ▢  │  ← rodillos     │
  │        ├─────────┤                   │
  │        │ ╳   ✓   │  ← display       │
  │        ├─────────┤                   │
  │        │         │                   │
  │        ├─────────┤                   │
  │        │   ◯ ◯   │  ← monedas oliva │
  │        └─────────┘     cayendo       │
  │            ◯  ◯                      │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
  └─────────────────────────────────────┘

HUD activo:
  ADS
  "Cada euro vuelve con tres más"
  Meta + Google + funnels. Desde 400€/mes + ad spend.
  Mini-caso: ROAS 4.8x en peluquería Bilbao
```

## Isla 5 — Branding (mix terracota + mostaza)

**Forma temática:** taller de cerámica con torno y 3 piezas brand: logo, paleta, tipografía.

```
        Cámara isla-branding (0, 4, -5)
                 ↓
  ┌─────────────────────────────────────┐
  │                                      │
  │       🏺  🏺  🏺                      │  ← 3 piezas cerámicas
  │       /│\\  /│\\  /│\\                  │
  │       └─┴┘ └─┴┘ └─┴┘                  │
  │      ┌───┴────┴────┴───┐              │
  │      │  estantería     │              │
  │      └─────────────────┘              │
  │                                      │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
  └─────────────────────────────────────┘

HUD activo:
  BRANDING
  "Tu marca con carácter, no plantilla"
  Logo + paleta + tipografía + manual. Desde 400€.
  Mini-caso: rebrand → +35% recordación
```

## Escena 6 — Auditoría (escena íntima crema #F4EFE3)

**Forma temática:** interior íntimo. Mesa de madera, taza de café humeante, libreta abierta. NO isla flotante: zoom interior cálido.

```
        Cámara escena-auditoria (0, 1.5, 3)
                 ↓
  ┌─────────────────────────────────────┐
  │                                      │
  │       ☕                              │  ← taza humeante
  │      ___                             │
  │     /   \                            │
  │    │     │                           │
  │    └─────┘                           │
  │                                      │
  │     ┌─────────────────┐              │
  │     │  📓             │              │
  │     │   ┌───────────┐ │              │
  │     │   │ Form      │ │  ← libreta + form HTML
  │     │   │ overlay   │ │     overlay encima
  │     │   └───────────┘ │              │
  │     └─────────────────┘              │
  │      mesa madera                     │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
  └─────────────────────────────────────┘

HUD escena auditoría (form HTML overlay encima del Canvas):
  ┌────────────────────────────────────────────┐
  │ 🟫 PACAME                       [≡ menú]   │
  │                                            │
  │       Pide tu auditoría 15 min             │  ← H1 Fraunces
  │       Te cuento qué falla y cómo arreglarlo│
  │                                            │
  │  ┌──────────────────────────────────────┐ │
  │  │ Nombre                               │ │
  │  │ ____________________________________ │ │
  │  │                                      │ │
  │  │ Email                                │ │
  │  │ ____________________________________ │ │
  │  │                                      │ │
  │  │ Tu web actual (opcional)             │ │
  │  │ ____________________________________ │ │
  │  │                                      │ │
  │  │ Sector                               │ │
  │  │ [hostelería] [retail] [salud]        │ │
  │  │ [servicios] [ecommerce] [b2b] [otro] │ │
  │  │                                      │ │
  │  │ Problema principal                   │ │
  │  │ [sin web] [web rota] [no captamos]   │ │
  │  │ [bajo SEO] [ads no rentan] [branding]│ │
  │  │                                      │ │
  │  │ Presupuesto orientativo              │ │
  │  │ [<500] [500-1.5K] [1.5K-3K] [3-5K]   │ │
  │  │ [>5K]                                │ │
  │  │                                      │ │
  │  │ Cuándo                               │ │
  │  │ [ya] [este mes] [3 meses] [explorando]│
  │  │                                      │ │
  │  │ <input hidden honeypot website>      │ │
  │  │                                      │ │
  │  │     [Pide auditoría 15 min →]        │ │
  │  └──────────────────────────────────────┘ │
  └────────────────────────────────────────────┘
```

## Email prompt progresivo (bottom-sheet)

Aparece tras `(islasVisitadas >= 3 || tiempoEnSitio >= 60s) && !mostradoYa && !capturado`. Dismissable.

```
                                                   pos: fixed bottom-4 left-1/2
                                                        ↓
            ┌──────────────────────────────────────────────┐
            │  ✨ Te mando un resumen                  [×] │
            │                                              │
            │  Sin spam, solo lo que has visto.           │
            │                                              │
            │  ┌─────────────────────┐  ┌─────────────┐   │
            │  │ tu@email.com        │  │ Mándamelo →│   │
            │  └─────────────────────┘  └─────────────┘   │
            └──────────────────────────────────────────────┘
```

## Mini-mapa (`<ProgressIndicator>`)

Posición `fixed top-1/2 right-6 -translate-y-1/2` desktop, `top-20 left-1/2 -translate-x-1/2` mobile.

```
Desktop:                     Mobile (top center):
                             ○──○──○──○──○──○
   ●  ← overview
   ○  ← isla 1               (línea horizontal de 6 dots)
   ○  ← isla 2
   ○  ← isla 3
   ○  ← isla 4
   ○  ← isla 5
   ◯  ← auditoría (anillo)
```

Estados:
- `○` no visitada
- `●` visitada
- `◉` activa (con halo mostaza)

Click en dot → `gsap.to camera` directo al keyframe correspondiente.

## Modo reducido (toggle "Reduced motion" en footer)

Cuando activo (auto-detect `prefers-reduced-motion: reduce` o user toggle):
- Canvas oculto, `<NoScriptContent>` visible
- 6 secciones snap-scroll con animaciones CSS suaves (fade + slide)
- Misma jerarquía info, misma copy, mismo CTA
- Form auditoría HTML puro (sin escena 3D)

```
   ┌─────────────────────────┐
   │  🟫 PACAME      [≡]     │
   ├─────────────────────────┤
   │                         │
   │  Tu agencia de IA       │  ← snap section overview
   │  5 servicios            │
   │                         │
   │  ↓ scroll               │
   ├─────────────────────────┤
   │  WEB                    │  ← snap section isla 1
   │  Tu negocio online      │
   │  ...                    │
   ├─────────────────────────┤
   │  ... (5 secciones más)  │
   ├─────────────────────────┤
   │  AUDITORÍA              │  ← snap section form
   │  [form HTML]            │
   └─────────────────────────┘
```

## Keyframes de cámara (`web/lib/3d/camera-paths.ts`)

| # | Nombre | Position (x, y, z) | LookAt | FOV |
|---|---|---|---|---|
| 0 | overview | (-1, 8, 14) | (0, 0, 0) | 50 |
| 1 | isla-web | (-3, 4, 6) | (-2.5, 1, 4) | 45 |
| 2 | isla-seo | (3, 4, 6) | (2.5, 1.2, 4) | 45 |
| 3 | isla-redes | (-3, 4, -2) | (-2.5, 1, -3) | 45 |
| 4 | isla-ads | (3, 4, -2) | (2.5, 1, -3) | 45 |
| 5 | isla-branding | (0, 4, -5) | (0, 1, -6) | 45 |

Escena auditoría es ruta separada `/auditoria-3d` con cámara propia (0, 1.5, 3) → (0, 0.8, 0).

## Posiciones de las islas en el mundo

```
                        z (atrás)
                            ↑
                            │
          isla-redes (-3, 0, -2)    isla-ads (3, 0, -2)
                            │
                            │  isla-branding (0, 0, -5)
                            │
   ─────────────────────────┼─────────────────────────→ x (derecha)
                            │
            isla-web (-3, 0, 4)     isla-seo (3, 0, 4)
                            │
                            │
                  CÁMARA OVERVIEW (-1, 8, 14)
                            ↓
                        z (delante)
```

Distancia entre islas: ~6 unidades. Cada isla cabe en un volumen ~3×3×3.

## Próximo paso

→ Generar 6 mockups con `imagen` (Google Gemini) usando estos wireframes como base.
→ Archivos en `docs/projects/storybook-3d/mockups/`.
