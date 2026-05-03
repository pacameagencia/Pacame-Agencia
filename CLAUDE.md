# PACAME — Agencia Digital de Agentes IA

> Agencia digital que resuelve problemas digitales para PYMEs en España.
> 10 agentes IA + 120 subespecialistas, supervisados por Pablo Calleja.
> Visión y obsesión actual: ver [`IDENTIDAD-PABLO.md`](IDENTIDAD-PABLO.md).

---

## 🚨 Protocolos OBLIGATORIOS (cargar antes de generar)

| Cuándo aplica | Protocolo |
|---------------|-----------|
| Antes de tocar cualquier `.tsx/.jsx/.css/.html/.svg/.png` o asset visual | [`docs/protocols/visual-first.md`](docs/protocols/visual-first.md) |
| Antes de responder a CUALQUIER petición creativa/estratégica | [`docs/protocols/cerebro-pacame.md`](docs/protocols/cerebro-pacame.md) |
| Para cualquier ejecución / deploy / config | [`docs/protocols/autonomia-total.md`](docs/protocols/autonomia-total.md) |
| Al cerrar un bloque de trabajo entregable | [`docs/protocols/pr-merge-automatico.md`](docs/protocols/pr-merge-automatico.md) |
| Para elegir qué agente/skill cargar | [`docs/protocols/routing-rules.md`](docs/protocols/routing-rules.md) |
| Antes de tocar datos/credenciales/notas de cualquier cliente | [`docs/protocols/aislamiento-clientes.md`](docs/protocols/aislamiento-clientes.md) |

> **Regla dura:** si saltas del input a generar sin cargar el protocolo aplicable, estás rompiendo el contrato PACAME. Para y vuelve aquí.

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion.
- **Backend:** Supabase (Postgres + RLS + Realtime), Stripe, Claude API.
- **Infra:** VPS Hostinger KVM2 (`72.62.185.125`), 8GB RAM, 2 cores AMD EPYC, Docker, n8n, Nginx, Ollama + Gemma 4.
- **Deployment:** Vercel (web), VPS (n8n + Gemma 4 + automations).

## Estructura del repo

```
web/                   → Next.js app (frontend + API routes)
agents/                → Prompts completos de los 10 agentes PACAME
agency-agents/         → 120+ subespecialistas (referencia)
clients/               → Capa 2 — clientes B2B (royo, talleresjaula, ecomglobalbox, casa-marisol)
workflows/             → SOPs en Markdown (WAT framework)
strategy/              → Roadmap, pricing, personas, visual-toolkit
infra/                 → Scripts de despliegue y VPS
tools/                 → Scripts internos PACAME (incluye scripts/ con build-skills-index.mjs)
docs/                  → Protocolos, identidad, integraciones (cargados bajo demanda)
.claude/skills/        → 959 skills indexadas en INDEX.md (autogenerado)
.claude/agents/        → Subagentes con model routing (incluye visual-reviewer)
```

## Identidad y contacto

- **Pablo Calleja** (fundador): visión y estilo en [`IDENTIDAD-PABLO.md`](IDENTIDAD-PABLO.md).
- **Datos públicos PACAME:** [`docs/identity/contacto.md`](docs/identity/contacto.md).
- **Arquitectura 4 capas (PACAME / Clientes / SaaS propios / Personal Pablo):** [`strategy/arquitectura-3-capas.md`](strategy/arquitectura-3-capas.md).

## Coding conventions

- TypeScript strict mode, no `any`.
- Componentes React: functional, props tipados, composition pattern.
- API routes: validar input, Supabase-first, error handling estructurado.
- Secrets en `.env.local`, nunca en código.
- Mobile-first CSS, Lighthouse 90+.
- Commits en español, descriptivos.

## Comunicación con el usuario

- Tutear siempre.
- Tono directo, cercano, sin humo.
- Frases cortas. Verbos activos. Números concretos.
- Cada respuesta cierra con próximo paso accionable.

## Inventarios autogenerados

- **Skills disponibles:** [`.claude/skills/INDEX.md`](.claude/skills/INDEX.md) (regenerar con `node tools/scripts/build-skills-index.mjs`).
- **Visual toolkit completo:** [`strategy/visual-toolkit.md`](strategy/visual-toolkit.md).

## Clientes activos (Capa 2)

| Cliente | Carpeta | Estado |
|---------|---------|--------|
| Joyería Royo | [`clients/royo/`](clients/royo/) | Activo (mantenimiento + enrichment) |
| Talleres Jaula | [`clients/talleresjaula/`](clients/talleresjaula/) | Activo (PIVOT 2026-04-29 a Shopify) |
| Ecomglobalbox | [`clients/ecomglobalbox/`](clients/ecomglobalbox/) | Activo (Stripe+Lauth, Laravel 12) |
| Casa Marisol | [`clients/casa-marisol/`](clients/casa-marisol/) | Test E2E Factoría completado |

> Convención de carpeta cliente: ver [`clients/README.md`](clients/README.md).

---

## Modo de ejecucion (autonomia total)

> Versión completa: [`docs/protocols/autonomia-total.md`](docs/protocols/autonomia-total.md). Lo siguiente es resumen literal — no tocar (se valida por hook `infra/scripts/verify-claude-rules.py`).

**Regla maestra:** Ejecuta TÚ MISMO todo lo que el entorno permita. Pedir a Pablo que haga algo manualmente es el ÚLTIMO recurso, solo cuando no exista forma programática.

**Ejecuta SIN preguntar:** commits, push a ramas feature, abrir PRs, `npm run dev/build/test`, deploys a Vercel preview Y producción, `vercel env add/rm`, migraciones a Supabase, configurar webhooks, rotar tokens, conectar repos, crear/editar archivos, instalar deps, lanzar workflows n8n y crons.

**Pausa y confirma SOLO en estos 3 casos irreversibles:**
1. **Pagos reales con dinero** — `stripe charge`, transferencias, compra de créditos en APIs externas, **crear productos/precios live en Stripe**.
2. **Borrado masivo en producción** — `DROP TABLE`, `DELETE` sin WHERE, vaciar buckets, `rm -rf` sobre datos.
3. **Push --force a main** o cualquier reescritura de historia compartida.

**Anti-patrón prohibido:** "ahora ejecuta tú `npm run build`", "añade esta env var en Vercel", "lanza este SQL en Supabase", "haz push tú" son **violación**. Hazlo TÚ. Si tres intentos fallan, escala con error exacto.

## Ciclo PR + merge a main (automatico, sin esperar a Pablo)

> Versión completa: [`docs/protocols/pr-merge-automatico.md`](docs/protocols/pr-merge-automatico.md). Lo siguiente es resumen literal — no tocar (se valida por hook `infra/scripts/verify-claude-rules.py`).

**Regla:** cada vez que termines un bloque entregable (feature, fix, doc, refactor, regla, configuración), ejecuta el ciclo COMPLETO sin pedir permiso ni esperar review humano:

1. `git add <archivos>` — solo lo que tocaste, nunca `-A` ciego.
2. `git commit -m "<tipo>(<scope>): <mensaje en español>"` con HEREDOC + `Co-Authored-By: Claude` al final.
3. `git push origin <rama>` (con `-u` la primera vez).
4. `gh pr create --title "..." --body "$(cat <<EOF ... EOF)"` con Summary + Test plan.
5. `gh pr merge <PR> --merge --delete-branch=false` (estrategia merge commit).
6. `gh pr view <PR>` para confirmar `state: MERGED` + reportar URL + commit a Pablo.

**Pablo NO tiene que estar atento ni dar OK.** Tu juicio es el filtro: si compila, no introduce secretos, no rompe contratos públicos y no entra en los 3 casos irreversibles → merge directo.

**Anti-patrón prohibido:** "PR abierto en #X, ¿lo mergeo?" → NO. Mergéalo. "¿Quieres que haga PR?" → NO. Hazlo. Dejar PR `OPEN` >5 minutos cuando está terminado → MAL.

**Reportar a Pablo SOLO al final:** "PR #X mergeado a main (commit `abc1234`). Resumen: N archivos. Próximo: …".
