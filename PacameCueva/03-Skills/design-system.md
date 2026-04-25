---
type: skill
title: Design_System
tags:
  - type/skill
created: '2026-04-25T21:44:20.747Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/design-system.md'
neural_id: 71ef4309-db06-47c7-9227-c2c6d4e902d3
---

# Context
You are Pixel + Nova collaborating at PACAME. Creas design systems completos que mantienen consistencia visual en todos los touchpoints del cliente.

# Que es un Design System
Un sistema de diseno es la fuente unica de verdad para como se ve y se comporta la marca digital del cliente. Incluye:
- **Design Tokens**: colores, tipografia, spacing, sombras, radios
- **Componentes UI**: botones, inputs, cards, modals, navs
- **Patrones**: layouts, formularios, navegacion, estados de error
- **Documentacion**: como y cuando usar cada elemento

# Proceso de Creacion

## Fase 1: Auditoria Visual
1. Recopilar assets existentes del cliente (web, RRSS, print)
2. Identificar inconsistencias
3. Definir la identidad visual core:
   - Paleta de colores (primario, secundario, neutros, semanticos)
   - Tipografia (heading, body, mono)
   - Iconografia (estilo: outline, filled, duotone)
   - Fotografia/ilustracion (estilo, tratamiento)

## Fase 2: Design Tokens

```typescript
// tokens/colors.ts
export const colors = {
  // Brand
  primary: { 50: '#f0f9ff', 100: '#e0f2fe', /* ... */ 900: '#0c4a6e' },
  secondary: { /* escala completa */ },
  
  // Semantic
  success: { light: '#dcfce7', DEFAULT: '#22c55e', dark: '#15803d' },
  warning: { light: '#fef9c3', DEFAULT: '#eab308', dark: '#a16207' },
  error: { light: '#fecaca', DEFAULT: '#ef4444', dark: '#b91c1c' },
  info: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1d4ed8' },
  
  // Neutrals
  gray: { 50: '#f9fafb', /* ... */ 950: '#030712' },
}

// tokens/typography.ts
export const typography = {
  fontFamily: {
    heading: ['Inter', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
}

// tokens/spacing.ts
export const spacing = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
  16: '4rem',
  24: '6rem',
}
```

## Fase 3: Componentes Base (Radix UI + Tailwind)

### Estructura de componentes
```
components/
├── ui/                    # Atoms
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Spinner.tsx
│   └── index.ts
├── composed/              # Molecules
│   ├── Card.tsx
│   ├── FormField.tsx
│   ├── SearchBar.tsx
│   ├── NavItem.tsx
│   └── index.ts
├── sections/              # Organisms
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── HeroSection.tsx
│   ├── CTASection.tsx
│   └── index.ts
└── layouts/               # Templates
    ├── PageLayout.tsx
    ├── DashboardLayout.tsx
    └── index.ts
```

### Patron de Componente
```typescript
import { type ComponentPropsWithoutRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}
```

## Fase 4: Documentacion

Crear `DESIGN-SYSTEM.md` en la raiz del proyecto del cliente:

```markdown
# Design System — [Nombre Cliente]

## Colores
- Primario: #hex (uso: CTAs, enlaces, acentos)
- Secundario: #hex (uso: backgrounds, cards)
- Ver tailwind.config.ts para escala completa

## Tipografia
- Headings: Inter Bold
- Body: Inter Regular
- Ver tokens/typography.ts

## Componentes
- Boton: `<Button variant="primary" size="md">`
- Input: `<Input placeholder="..." />`
- Card: `<Card title="..." description="...">`

## Spacing
- Sistema de 4px base
- Padding cards: 24px (p-6)
- Gap entre elementos: 16px (gap-4)
- Margin entre secciones: 64px (my-16)
```

# Reglas del Design System
- NUNCA hardcodear valores — siempre tokens
- NUNCA crear componentes one-off si existe uno en el sistema
- Cada componente tiene: typed props, variantes, estados (hover/focus/disabled)
- Accesibilidad obligatoria: ARIA, keyboard, contrast
- Mobile-first en todos los componentes
- Composition over configuration: componentes pequenos y combinables

# Referencia
- Frontend: `agents/04-PIXEL.md`
- Branding: `agents/01-NOVA.md`
