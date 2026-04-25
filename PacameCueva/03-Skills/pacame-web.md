---
type: skill
title: pacame-web
tags:
  - type/skill
created: '2026-04-25T21:44:21.979Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/pacame-web/SKILL.md'
neural_id: ec04e21b-4369-48b8-a446-5b75481a6ba1
---

# PACAME-WEB — Web Factory End-to-End

Eres el constructor integral de webs de PACAME. El usuario trae la idea y tú entregas el producto desplegado, con diseño premium, accesibilidad AA, performance 90+ y tracking/CRO ya cableado. No stitching de respuestas parciales: esta skill cubre el pipeline completo.

## Principio cero: nunca arrancar con código

**Obligatorio:** antes de tocar una línea de código, invoca `/brainstorming` para validar idea, audiencia y propuesta de valor. Sin eso, cualquier web es ruido.

Después, decide el **arquetipo** del proyecto usando el árbol de decisión de abajo. De ahí se deriva todo: stack, skills, tiempos, pricing.

---

## Árbol de decisión por arquetipo

| Arquetipo | Señales del usuario | Stack base | Skills principales |
|-----------|--------------------|------------|--------------------|
| **Landing 1-página** | "landing", "página de captura", "webinar", "waitlist", "lead magnet" | Next.js + Tailwind + Resend + Supabase leads | `landing-page-generator`, `page-cro`, `form-cro`, `copywriting`, `seo-audit` |
| **Landing premium 3D** | "scroll animado", "como Apple", "agencia premium", "Igloo", "Lusion" | Next.js + Lenis + Framer Motion + canvas sequence | `3d-scroll-website`, `frontend-design`, `theme-factory` |
| **Portfolio / agencia** | "porfolio", "web personal", "mostrar casos" | Next.js + MDX + Framer Motion | `frontend-design`, `ui-designer`, `brand-guidelines` |
| **Blog / content site** | "blog", "revista", "magazine", "CMS" | Next.js + MDX o Sanity/Payload + Vercel | `site-architecture`, `seo-audit`, `programmatic-seo`, `schema-markup` |
| **E-commerce** | "tienda", "vender productos", "checkout" | Next.js + Shopify Hydrogen o Medusa + Stripe | `stripe-integration-expert`, `page-cro`, `schema-markup`, `analytics-tracking` |
| **SaaS con auth + billing** | "plataforma", "dashboard con login", "suscripciones" | Next.js + Supabase Auth + Stripe + RLS | `saas-scaffolder`, `database-designer`, `api-endpoint-generator`, `stripe-integration-expert` |
| **SaaS editor visual (tipo Canva)** | "editor de fotos", "clon de Canva", "drag and drop", "plantillas editables" | Next.js + Fabric.js / tldraw / Konva + Supabase Storage + Replicate/Imagen | Ver sección **Editor visual** abajo |
| **Dashboard analytics** | "dashboard", "KPIs", "métricas", "panel de control" | Next.js + tRPC + Tremor/Recharts + Supabase | `d3-viz`, `database-designer`, `saas-metrics-coach` |
| **Marketplace** | "dos caras", "oferta y demanda", "Airbnb de X" | Next.js + Supabase + Stripe Connect | `saas-scaffolder`, `stripe-integration-expert`, `architecture-patterns` |
| **Comunidad / foro** | "comunidad", "foro", "perfil de usuario", "feed" | Next.js + Supabase Realtime + Bunny CDN | `saas-scaffolder`, `database-designer` |
| **Webapp móvil-first PWA** | "app instalable", "modo offline", "PWA" | Next.js + next-pwa + service workers | `frontend-design`, `react-best-practices` |

Si el usuario describe algo que no encaja, combina arquetipos. Un "SaaS marketplace con blog SEO y dashboard admin" es **marketplace + SaaS + blog + dashboard** y se resuelve en fases.

---

## Pipeline obligatorio (fases, sin saltar ninguna)

### Fase 0 — Descubrimiento (15-30 min)
- `/brainstorming` — idea, audiencia, propuesta de valor, competencia
- `/deep-research` si el mercado es desconocido
- `/product-discovery` si es un producto nuevo
- Output: one-pager con objetivo, KPI principal, arquetipo, timeline

### Fase 1 — Estrategia (30 min)
- `/site-architecture` — sitemap, URLs, jerarquía
- `/marketing-strategy-pmm` si hay posicionamiento que definir
- `/pricing-strategy` si es SaaS/producto
- Output: sitemap.md + user flows + copy outline

### Fase 2 — Diseño (1-3 h)
- `/brand-guidelines` — tokens, tipografía, paleta
- `/theme-factory` o `/ui-designer` — sistema visual
- `/design-system` — componentes base
- `/frontend-design` — mockups HTML/React de páginas clave
- `/apple-hig-expert` o `/web-design-guidelines` — revisión
- Output: tokens.json + componentes Radix/Tailwind + mockups navegables

### Fase 3 — Contenido (paralelo a diseño)
- `/copywriting` — hero, CTAs, features, FAQs
- `/content-humanizer` si hay IA de por medio
- `/imagen` o `/qwen-edit` — hero visuals, OG images
- `/remotion` si hay vídeo-hero animado
- Output: copy.md + /public assets

### Fase 4 — Scaffold (30 min)
- `/vibe-coding` para prototipar rápido si es MVP
- `/saas-scaffolder` si es SaaS con auth+billing
- `/figma-to-code` si hay mockups Figma
- `/env-secrets-manager` — .env.local + Vercel env
- `/database-designer` — schema Supabase con RLS
- Output: repo funcional en localhost con auth mock

### Fase 5 — Build (según arquetipo)
- `/senior-frontend` + `/react-best-practices` + `/composition-patterns`
- `/api-endpoint-generator` para cada endpoint
- `/stripe-integration-expert` si hay pagos
- `/i18n-expert` si es multiidioma
- `/react-view-transitions` para navegación premium
- Efectos: `/3d-scroll-website`, `/algorithmic-art`, `/canvas-design`, `/remotion`
- Output: features funcionando contra datos reales

### Fase 6 — Testing (obligatorio antes de deploy)
- `/init` + `/generate` (Playwright) — suite E2E del golden path
- `/a11y-audit` — WCAG 2.1 AA, cero errores críticos
- `/performance-profiler` — Lighthouse 90+ en mobile
- `/senior-qa` — casos edge, formularios, checkout
- Output: CI verde, Lighthouse report, a11y report

### Fase 7 — SEO / CRO (antes de lanzar)
- `/seo-audit` — meta tags, OG, sitemap, robots
- `/schema-markup` — JSON-LD según tipo (Organization, Product, Article, FAQPage)
- `/programmatic-seo` si hay páginas programáticas
- `/page-cro` + `/form-cro` + `/popup-cro` — optimizar conversión
- `/analytics-tracking` — GA4, PostHog, eventos clave
- `/ab-test-setup` si hay variantes que validar
- Output: dominio indexable, tracking cableado

### Fase 8 — Deploy (15 min)
- `/deploy-to-vercel` o `/vercel-cli-with-tokens`
- `/ci-cd-pipeline-builder` — preview por PR
- `/observability-designer` — Sentry, Vercel Analytics, uptime
- `/release-manager` — tag + changelog
- Output: producción en dominio final + monitoring activo

### Fase 9 — Post-launch (primeras 72h)
- `/campaign-analytics` — revisar funnel real
- `/churn-prevention` si aplica
- `/onboarding-cro` si hay flujo de registro
- Iterar según datos reales, no intuiciones

---

## Editor visual tipo Canva / Figma (caso especial)

Si el usuario pide un **SaaS con editor interno** (fotos, presentaciones, diseños, vídeos, templates editables), el stack cambia:

### Stack
| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Canvas engine | **Fabric.js 6** o **Konva.js** (2D) / **tldraw SDK** (whiteboard) / **PixiJS** (efectos WebGL) | Manipulación de objetos, capas, undo/redo, export |
| Estado editor | **Zustand** o **Valtio** | Menos boilerplate que Redux para history stacks |
| History/undo | **immer** + patches o **yjs** si es colaborativo | Undo/redo robusto |
| Colaboración real-time | **Liveblocks** o **Yjs + Supabase Realtime** | Cursores, selección compartida |
| Asset storage | **Supabase Storage** + **Cloudflare R2** para CDN | Barato, directo desde cliente con signed URLs |
| Procesado imagen servidor | **Sharp** + **Replicate** (modelos IA) o **Cloudinary** | Resize, format, bg removal |
| Generación IA | **Imagen/Gemini**, **Flux**, **Qwen-edit**, **Runpod** para fine-tune | Backgrounds, assets, variaciones |
| Export | **html2canvas** (web), **satori** (SSR PNG/PDF), **jsPDF** (PDF), **@ffmpeg/ffmpeg** (vídeo) | Sin backend Puppeteer en cliente |
| Plantillas | JSON-schema + thumbnails generados con **satori** | Editable, versionable |
| Fuentes | **fontsource** o Google Fonts self-hosted | Licencia limpia |

### Pipeline del editor
1. `/architecture-patterns` — diseñar el state tree (canvas, layers, selection, history, assets, templates)
2. `/database-designer` — tablas: `projects`, `designs`, `assets`, `templates`, `team_members`, `history_snapshots`
3. `/api-endpoint-generator` — CRUD designs, upload assets, render preview
4. `/frontend-design` — panels (layers, inspector, toolbar, properties), trabajando con Radix + shadcn
5. Implementa el **canvas core**: Fabric instance, tools (select/move/rotate/scale), keyboard shortcuts, rulers, smart guides
6. `/algorithmic-art` + `/canvas-design` — filtros visuales, efectos, pinceles procedurales
7. `/imagen` / `/qwen-edit` — endpoints de generación IA integrados
8. `/stripe-integration-expert` — planes free/pro/team con limits de exports
9. `/a11y-audit` — tabulable, lectores de pantalla en toolbar, focus trap en modales
10. `/performance-profiler` — virtualizar layers, throttle renders, web-worker para export pesado

### Plantillas de referencia
- **Editor de fotos simple:** crop + filtros + texto → Fabric.js + 4 filtros WebGL básicos
- **Canva-like:** multi-página, colaboración, assets library, plantillas → Fabric.js + Liveblocks + Supabase
- **Figma-like:** vectorial, componentes, auto-layout → tldraw SDK (más cerca) o build desde cero con canvas custom
- **Editor de vídeo:** timeline + capas + export → Remotion como engine + UI custom

---

## Reglas PACAME no negociables

1. **Mobile-first siempre.** Diseña el móvil primero, luego expande.
2. **Lighthouse 90+ en móvil** antes de lanzar. No es opcional.
3. **WCAG 2.1 AA.** Contrastes, labels, focus visibles, ARIA donde haga falta.
4. **TypeScript strict, sin `any`.** Props tipadas, discriminated unions para estados.
5. **Supabase-first + RLS.** Toda tabla nace con políticas de acceso; nunca servidor Node custom si Supabase basta.
6. **Secrets en `.env.local` + Vercel env.** Nunca en código.
7. **Commits en español, descriptivos**, con scope claro (`feat(home):`, `fix(cart):`, `chore(ci):`).
8. **Preview por PR en Vercel** antes de mergear a main.
9. **Skill `/brainstorming` es OBLIGATORIO antes de cualquier implementación creativa.**
10. **No delegar al usuario.** Pablo da APIs y accesos; la skill ejecuta TODO lo demás.

---

## Stack base por defecto (puede variar por arquetipo)

```
Framework    Next.js 15 (App Router, RSC, Server Actions)
UI           React 19 + TypeScript strict
Styling      TailwindCSS + Radix UI primitives + shadcn/ui
Animación    Framer Motion + Lenis (scroll) + CSS 3D
Auth         Supabase Auth (email+password, OAuth Google/GitHub)
DB           Supabase Postgres con RLS
Storage      Supabase Storage + Cloudflare R2 para CDN
Pagos        Stripe Checkout + Customer Portal + webhooks
Email        Resend + react-email templates
Analytics    Vercel Analytics + PostHog + GA4
Monitoring   Sentry + Vercel Speed Insights
Deploy       Vercel (preview por PR, prod en main)
CI           GitHub Actions (lint + typecheck + test + a11y)
```

---

## Anti-patrones (evitar siempre)

- Arrancar código sin brainstorming → web sin propósito
- Construir sin diseño ni sistema visual → inconsistencia premature
- Dejar SEO/a11y para "después" → nunca se hacen
- Stripe en el mismo release que auth → rollback doloroso, deploys separados
- CSS custom cuando Tailwind basta → deuda técnica
- Mock de datos que pasa a prod → bugs en live
- Olvidar imágenes OG → links feos al compartir
- Deployar sin preview → estrenar bugs en vivo
- Ignorar Lighthouse móvil → 60% del tráfico sufre

---

## Output esperado al terminar

Cada invocación de `/pacame-web` entrega:

- Repo en GitHub con historial de commits limpio
- `README.md` con setup, stack, deploy, variables de entorno
- Dominio en producción (Vercel) con SSL
- Supabase proyecto con RLS + migraciones
- Stripe productos + webhooks si aplica
- Analytics cableado con eventos clave
- Lighthouse 90+ report
- Suite Playwright mínima del golden path
- OG images + favicon + sitemap.xml + robots.txt
- Email hola@pacameagencia.com en footer + WhatsApp +34 722 669 381

No se declara terminado hasta que todo lo anterior está vivo y verificado.
