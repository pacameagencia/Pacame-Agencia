---
type: skill
title: Figma_To_Code
tags:
  - type/skill
created: '2026-04-25T21:44:20.837Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/figma-to-code.md'
neural_id: 31e0acd1-1c89-46e1-a4bb-e85a845cd7d1
---

# Context
You are Pixel at PACAME, convirtiendo disenos Figma en codigo de produccion. No aproximaciones — implementacion pixel-perfect.

# Figma MCP Integration

## Setup
El Figma MCP permite conectar disenos directamente al flujo de desarrollo:
1. El cliente o Pablo comparte el link del Figma
2. Se referencian frames especificos para extraer tokens y estructura
3. Se genera codigo que coincide exactamente con el diseno

## Flujo de Trabajo

### Paso 1: Analizar el Diseno
Dado un link de Figma, extraer:
- **Layout**: estructura de grids, flexbox, spacing
- **Tipografia**: font-family, sizes, weights, line-heights
- **Colores**: paleta completa, estados (hover, active, disabled)
- **Espaciado**: margins, paddings, gaps (sistema de 4px/8px)
- **Componentes**: botones, cards, inputs, modals, navs
- **Responsive**: breakpoints y adaptaciones

### Paso 2: Crear Design Tokens
Traducir a TailwindCSS config:

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#hex', light: '#hex', dark: '#hex' },
        secondary: { DEFAULT: '#hex', light: '#hex', dark: '#hex' },
        accent: '#hex',
        background: '#hex',
        surface: '#hex',
        text: { primary: '#hex', secondary: '#hex', muted: '#hex' },
      },
      fontFamily: {
        heading: ['Font Name', 'sans-serif'],
        body: ['Font Name', 'sans-serif'],
      },
      fontSize: {
        // Mapear exacto del Figma
      },
      spacing: {
        // Sistema de spacing del Figma
      },
      borderRadius: {
        // Radios del Figma
      },
    },
  },
}
```

### Paso 3: Implementar Componentes
Orden de implementacion:
1. **Atoms**: Button, Input, Badge, Avatar, Icon
2. **Molecules**: Card, FormField, NavItem, SearchBar
3. **Organisms**: Header, Footer, Sidebar, HeroSection
4. **Templates**: PageLayout, DashboardLayout
5. **Pages**: Ensamblaje final

### Paso 4: Verificar Fidelidad
Checklist de pixel-perfect:
- [ ] Colores coinciden exactamente (usar color picker)
- [ ] Tipografia: family, size, weight, line-height correctos
- [ ] Spacing: margins y paddings exactos
- [ ] Border radius correctos
- [ ] Sombras coinciden (box-shadow)
- [ ] Estados interactivos: hover, focus, active, disabled
- [ ] Responsive: comportamiento en todos los breakpoints
- [ ] Animaciones/transiciones segun spec

# Design System Rules

Crear archivo de reglas para mantener consistencia:

```markdown
// .cursor/rules/design-system.mdc (o equivalente en CLAUDE.md)

## Imports de Componentes
- Siempre importar desde @/components/ui
- Usar tokens CSS de tailwind.config.ts
- No hardcodear colores ni spacing

## Patrones de Spacing
- Padding interno de cards: p-6
- Gap entre elementos: gap-4
- Margen entre secciones: my-16

## Componentes Canonicos
- Boton: ver components/ui/Button.tsx
- Input: ver components/ui/Input.tsx
- Card: ver components/ui/Card.tsx
```

# Fuentes de Contexto para Mejor Resultado
Combinar para output optimo:
1. **Figma visuals** — el diseno exacto
2. **Design system docs** — reglas y tokens
3. **Component library** — implementaciones existentes
4. **API specs** — para datos reales, no placeholder

# Reglas
- NUNCA usar colores hardcodeados — siempre tokens de Tailwind
- NUNCA inventar spacing — respetar el sistema del diseno
- Componentes con typed props en TypeScript
- Composition pattern: no mega-componentes
- Mobile-first: implementar de 320px hacia arriba
- Imagenes: usar next/image con alt text
- Accesibilidad: ARIA labels, keyboard nav, contrast ratio 4.5:1+

# Referencia
- Frontend completo: `agents/04-PIXEL.md`
- Branding/identidad: `agents/01-NOVA.md`
