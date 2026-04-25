---
type: skill
title: Visual_Design_Exploration
tags:
  - type/skill
created: '2026-04-25T21:44:21.398Z'
source_path: >-
  C:/Users/Pacame24/Downloads/PACAME
  AGENCIA/.claude/skills/visual-design-exploration.md
neural_id: 4b2531ff-fdf0-4900-bbcc-27cf9efcac36
---

# Context
You are Nova + Pixel collaborating at PACAME. Exploras multiples direcciones visuales rapidamente para que el cliente elija su estetica antes de construir en produccion.

# Filosofia
- Los disenadores saben juzgar calidad: que se ve cheap, que confunde, que genera confianza
- La IA permite explorar 5 direcciones en el tiempo que antes se tardaba en hacer 1
- El cliente elige entre opciones tangibles, no conceptos abstractos
- Cada exploracion es codigo funcional en el navegador, no un mockup estatico

# Estilos Esteticos Disponibles

## Corporativo/Profesional
- Colores sobrios (azul navy, gris, blanco)
- Tipografia serif o sans-serif clasica
- Layout limpio, mucho whitespace
- Ideal para: consultoras, abogados, finanzas, B2B

## Minimalista/Premium
- Paleta reducida (2-3 colores max)
- Tipografia elegante, thin weights
- Espaciado generoso
- Ideal para: marcas de lujo, arquitectura, diseno

## Bold/Startup
- Colores vibrantes, gradientes
- Tipografia sans-serif gruesa
- CTAs grandes y llamativos
- Ideal para: SaaS, apps, tech startups

## Playful/Creativo
- Colores saturados y variados
- Formas organicas, ilustraciones
- Animaciones divertidas
- Ideal para: educacion, ecommerce joven, gaming

## Dark Mode Premium
- Fondos oscuros (#0a0a0a a #1a1a2e)
- Acentos neon o metalicos
- Glassmorphism, bordes sutiles
- Ideal para: tech, fintech, crypto, musica

## Editorial/Magazine
- Grid asimetrico
- Tipografia mix serif + sans-serif
- Imagenes grandes como protagonistas
- Ideal para: medios, blogs, portfolios creativos

## Retro/Y2K
- Colores pasteles o neon
- Elementos nostalgicos
- Bordes gruesos, sombras duras
- Ideal para: moda, cultura, arte

# Workflow de Exploracion

## Paso 1: Brief del Cliente
Antes de explorar, definir:
```markdown
## Brief Visual
- Sector: [industria del cliente]
- Audiencia: [edad, nivel socioeconomico, gustos]
- Competidores: [3-5 webs de referencia]
- Personalidad de marca: [adjetivos: serio, cercano, premium, accesible...]
- Que NO quieren: [estilos a evitar]
- Referencias que les gustan: [URLs, marcas, screenshots]
```

## Paso 2: Generar 3 Direcciones
Crear 3 variantes de la misma pagina (normalmente la home):

### Direccion A: [Nombre descriptivo]
```
Implementa esta landing page con estetica [estilo].
- Header: [descripcion]
- Hero: [descripcion]
- Secciones: [descripcion]
- Colores: [paleta especifica]
- Fuente: [tipografia]
Guarda en /explorations/direction-a/
```

### Direccion B y C: misma estructura, diferente estetica

## Paso 3: Presentar al Cliente
- Deploy cada direccion en Vercel (URLs separadas)
- El cliente ve y navega en su movil y desktop
- Feedback concreto: "Me gusta el header de A pero los colores de B"

## Paso 4: Fusionar y Refinar
Con el feedback:
```
Toma el layout de la Direccion A, aplica la paleta de colores de B, 
y usa la tipografia de C. Anade las animaciones de hover que tenia A.
```

## Paso 5: Consolidar Design Tokens
Una vez elegida la direccion, extraer tokens finales:
- Colores → tailwind.config.ts
- Tipografia → Google Fonts + config
- Spacing → sistema consistente
- Componentes → libreria reutilizable

# Prompting Estrategico para Diseno

## Referenciar Marcas Conocidas
```
"Disena como Stripe: limpio, profesional, con gradientes sutiles y tipografia clara"
"Estilo Notion: minimalista, whitespace generoso, iconografia outline"
"Estetica Apple: premium, fotografias hero grandes, texto centrado con peso"
```

## Lenguaje Comparativo
```
"Como la landing de Linear pero adaptada para sector inmobiliario"
"El dashboard de Vercel pero con los colores del cliente"
```

## Descomponer por Secciones
```
"Header estilo Airbnb (busqueda prominente)"
"Cards estilo Dribbble (imagen grande, texto minimo)"
"Pricing estilo Framer (3 columnas, feature comparison)"
"Footer estilo Stripe (multi-columna, bien organizado)"
```

## Direcciones de Data Visualization
```
"Graficos estilo Edward Tufte: minimalistas, data-ink ratio alto"
"Dashboard estilo Robinhood: limpio, numeros grandes, graficos de linea simples"
"Analytics estilo Amplitude: denso pero organizado, muchos filtros"
```

# Reglas
- Minimo 2 direcciones, maximo 4 (paralisis de eleccion)
- Cada direccion debe ser navegable en el navegador
- Mobile-first en TODAS las exploraciones
- No invertir mas de 2h por direccion (son exploraciones, no produccion)
- Documentar feedback del cliente para futuras referencias
- Una vez elegida la direccion, TODO lo demas se descarta

# Referencia
- Branding: `agents/01-NOVA.md`
- Frontend: `agents/04-PIXEL.md`
- Estrategia: `agents/07-SAGE.md`
