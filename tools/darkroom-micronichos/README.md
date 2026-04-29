# DarkRoom Micronichos — Free Tools que Alimentan el Flagship

> **Owner**: Pablo Calleja + DarkRoom team.
> **Repo destino final**: estos tools deberían vivir en el repo separado de DarkRoom (no en el monorepo PACAME). Mientras tanto se construyen aquí como **scaffolding standalone** y se transfieren cuando Pablo asigne el repo destino.
> **Última revisión**: 2026-04-28.

---

## Filosofía

Cada micronicho es una **tool gratis** que resuelve UN dolor específico del ICP DarkRoom (creators visuales hispanohablantes). El usuario la usa, le aporta valor real, y al pie ve un CTA discreto a DarkRoom (membresía colectiva con el stack premium completo).

**Regla maestra**: cada tool es útil POR SÍ MISMA, sin pedir nada. Si el usuario nunca convierte a DarkRoom, vale igual: hace SEO + boca a boca + brand recall.

Diseño completo del flywheel: [`strategy/darkroom/flywheel-micronichos.md`](../../strategy/darkroom/flywheel-micronichos.md).

---

## Estado de los 6 micronichos

| # | Tool | URL destino | Estado | Build | Recurrente |
|---|---|---|---|---|---|
| 1 | **Paletas desde foto** | `paletas.darkroomcreative.cloud` | 🟢 MVP en este repo | ~10h | 0€/mes |
| 2 | **Mockup batch** | `mockup-batch.darkroomcreative.cloud` | 🟡 pendiente | ~25h | 10-25€/mes |
| 3 | **Hooks virales** | `hooks.darkroomcreative.cloud` | 🟡 pendiente | ~15h | 30-50€/mes |
| 4 | **Comparador alternatives** | `alternativas.darkroomcreative.cloud` | 🟡 pendiente | ~20h | 0€/mes |
| 5 | **Prompts pulidos** | `prompts.darkroomcreative.cloud` | 🟡 pendiente | ~20h | 40-80€/mes |
| 6 | **Carruseles IA** | `carrusel.darkroomcreative.cloud` | 🟡 pendiente | ~30h | 25-40€/mes |

Sprint 1 (validación rápida): #1 Paletas + #4 Comparador alternatives. Cero coste recurrente, máximo SEO.

---

## Stack común

- **Frontend**: HTML + CSS + JS vanilla (no framework). Razones:
  - Cero build step → deploy en 1 minuto en Vercel/Cloudflare Pages/cualquier estático.
  - Cero dependencias npm → cero `npm install`.
  - Funciona offline después del primer load.
  - SEO óptimo: HTML server-rendered desde cero.
  - Más fácil iterar y mantener para tools simples.
- **Backend** (cuando aplique, ej: hooks, prompts, carrusel): Vercel serverless functions o Edge Functions, con LLM calls vía `web/lib/llm.ts` (auto-inyecta brain context si reutilizamos `agentId: "nexus"` o `"copy"`).
- **DB email capture**: Supabase `dark-room-prod` (org `Dark Room IO` aislada).
- **Email transactional**: Resend `re_ZPx6dkfB_…` DarkRoom.
- **Analytics**: Plausible (privacy-friendly, GDPR-compliant).
- **Hosting**: Vercel team `Dark Room IO` (cuando se complete el transfer; mientras tanto cualquier subdominio).
- **DNS**: Hostinger, subdominios `*.darkroomcreative.cloud`.

---

## Reglas duras de marca y código

1. **Cero mención a PACAME** en cualquier tool. DarkRoom es marca independiente.
2. **Voz definida en `strategy/darkroom/positioning.md`**: directa, cómplice, honesta. Tutear. Frases cortas.
3. **Estética coherente**: dark mode minimalista, fondo `#0A0A0A`, texto `#F5F5F0`, acento `#E11D48` (rojo señal) o `#D4A656` (dorado mate).
4. **Tipografía**: sans-serif técnica (Space Grotesk para headlines, Inter o IBM Plex Sans para body). No usar fuentes premium ilegales.
5. **Cero dark patterns**: nada de "popup oblige email para usar". Email capture es opcional, transparente, post-uso (no antes).
6. **CTA a DarkRoom siempre al pie**, no en popup intrusivo. Discreto y honesto.
7. **OG meta tags optimizados** para compartir en RRSS.
8. **Schema.org WebApplication** para SEO.
9. **Privacy first**: imágenes/textos del usuario nunca se loguean en backend (procesamiento client-side donde sea posible).
10. **Antes de tocar `.tsx`/`.jsx`/`.css`/`.svg` invocar VISUAL-FIRST** (`frontend-design`, `imagen` Gemini, `theme-factory`). Hook automático en `.claude/settings.json` recordándolo.

---

## Cómo desplegar uno de los micronichos

Cada subcarpeta es **autónoma**. Para desplegar:

```bash
# Opción A — Vercel CLI (recomendado)
cd tools/darkroom-micronichos/paletas-de-foto
vercel --prod  # asocia con dominio paletas.darkroomcreative.cloud

# Opción B — Cloudflare Pages
# Conectar el subfolder con Cloudflare Pages dashboard

# Opción C — drag-drop manual
# Subir el contenido a Vercel via vercel.com/new/clone o Netlify drop
```

Cada subcarpeta incluye:
- `index.html` (la UI)
- `styles.css` (estilos, paleta DarkRoom)
- `app.js` (lógica)
- `README.md` (deployment notes específicas)

Los que requieren backend (hooks, prompts, carrusel) tendrán también `api/` con serverless functions.

---

## Plan de migración cuando exista repo DarkRoom dedicado

Estos micronichos son **transferibles**. Cuando Pablo asigne el repo DarkRoom (probablemente fork del Vercel project actual `dark-room`), se hace:

1. `git mv tools/darkroom-micronichos/* <repo-darkroom>/tools/`
2. Configurar subdominios en Vercel team `Dark Room IO`.
3. Apuntar DNS Hostinger.
4. Borrar `tools/darkroom-micronichos/` del monorepo PACAME (mantener solo este README como referencia y link al repo destino).

---

## KPIs del flywheel (mes 6, agregado de los 6 tools)

- Visitas/mes: 8.000-15.000 (Plausible)
- Email capture rate: ≥30%
- Conversión email → trial DarkRoom: ≥3%
- MRR generado por flywheel orgánico: +520-960€/mes

Detalles por tool en [`strategy/darkroom/flywheel-micronichos.md`](../../strategy/darkroom/flywheel-micronichos.md).

---

**Empezamos por #1 Paletas desde foto.** El más barato y rápido de validar.
