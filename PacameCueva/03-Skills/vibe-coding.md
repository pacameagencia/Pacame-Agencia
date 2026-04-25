---
type: skill
title: Vibe_Coding
tags:
  - type/skill
created: '2026-04-25T21:44:21.295Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/vibe-coding.md'
neural_id: 0970bc80-5d9f-433e-b8ed-ccc3758b242d
---

# Context
You are Pixel working in rapid-build mode at PACAME. Vibe coding = describir lo que quieres en lenguaje natural y que la IA lo construya. El cliente o Pablo describe la vision, tu ejecutas.

# Filosofia
- No necesitas que el cliente entienda codigo. Necesita entender QUE quiere construir.
- El cuello de botella no es la habilidad tecnica, es la traduccion entre vision e implementacion.
- Iteraciones rapidas: prompt → codigo → preview → ajuste.
- Enviar 10x mas rapido que la ruta tradicional.

# Workflow: De Idea a Deploy

## Fase 1: Planificacion (OBLIGATORIA)
Antes de escribir UNA linea de codigo, crear `plan.md`:

```markdown
# [Nombre Proyecto] - Plan de Implementacion

## 1. Stack Tecnologico
- Frontend: Next.js 15 + TailwindCSS + Framer Motion
- Backend: Supabase (Postgres + Auth + Storage)
- Deploy: Vercel
- APIs: [listar las necesarias]

## 2. Estructura de Archivos
web/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── [rutas necesarias]/
├── components/
├── lib/
└── public/

## 3. Consideraciones de Diseno
- Mobile-first
- Paleta de colores del cliente
- Tipografia: [especificar]
- Animaciones sutiles con Framer Motion

## 4. Plan Paso a Paso
1. Estructura base HTML/componentes
2. Estilos y responsive
3. Funcionalidad (auth, BD, APIs)
4. Testing local
5. Deploy a Vercel
```

## Fase 2: Implementacion Iterativa
1. Implementar segun plan.md, empezando por estructura
2. Preview local: `npm run dev` → http://localhost:3000
3. Iterar con prompts especificos:
   - "Haz la seccion hero full-height (100vh). Centra el texto verticalmente."
   - "Las tarjetas se ven apretadas. Anade 32px de padding entre ellas."
   - "Anade hover effect sutil en las tarjetas: escala ligera + sombra."
   - "Hazlo responsive. En movil, apila las tarjetas verticalmente."

## Fase 3: Funcionalidad Avanzada
- Auth con Supabase (Google Sign-in preferido)
- Base de datos para persistencia
- APIs externas (OpenAI, Stripe, etc.)
- Variables de entorno en `.env.local` (NUNCA en codigo)

## Fase 4: Deploy
1. `git add . && git commit -m "descripcion" && git push`
2. Vercel auto-deploya desde GitHub
3. Configurar variables de entorno en Vercel Dashboard
4. Dominio personalizado si aplica

# Prompts de Iteracion por Categoria

## Estructura
- "Anade seccion [X] con [descripcion de contenido]"
- "Reorganiza el layout: sidebar izquierda, contenido principal derecha"

## Estilos
- "Cambia la fuente a Inter de Google Fonts"
- "Usa esta paleta: primario #1a1a2e, secundario #16213e, acento #0f3460"
- "Anade efecto glassmorphism al header"

## Funcionalidad
- "Anade formulario de contacto que envie a [email] via Formspree"
- "Integra chat IA que responda sobre los servicios del cliente"
- "Anade autenticacion con Google via Supabase"

## Responsive
- "En mobile, el nav se convierte en hamburger menu bajo 768px"
- "Las imagenes se adaptan al ancho del contenedor en movil"

## Debugging
- "Recibo este error: [pegar error]. Encuentra y arregla el problema."

# Reglas
- SIEMPRE crear plan.md antes de codificar
- Iterar en cambios pequenos y frecuentes
- Preview despues de cada cambio
- .env.local en .gitignore SIEMPRE
- Mobile-first CSS
- Lighthouse 90+ antes de entregar
- Commits descriptivos en espanol

# Referencia
- Stack completo: `agents/04-PIXEL.md`
- Backend: `agents/05-CORE.md`
