# Modo de ejecución — Autonomía total

> **Regla maestra:** Ejecuta TÚ MISMO todo lo que el entorno permita. Pedir a Pablo que haga algo manualmente es el ÚLTIMO recurso, solo cuando no exista forma programática.

---

## Capacidades activas en este proyecto (úsalas antes de delegar)

- Bash + Vercel CLI (`vercel deploy`, `vercel env add`, `vercel env pull`, `vercel link`).
- GitHub CLI (`gh pr create`, `gh pr merge`, `gh release create`, `gh secret set`).
- Supabase MCP (migraciones, SQL, edge functions, branches, advisors).
- Cloudflare MCP (D1, KV, R2, Workers, Hyperdrive).
- Hostinger API para DNS y dominios — key en memoria `reference_apis_pacame`.
- SSH al VPS Hostinger 72.62.185.125 (n8n, Gemma 4, Ollama, Nginx).
- npm scripts (`dev`, `build`, `test`, `lint`) y git completo (commit, push, merge).
- Scripts del repo: `infra/scripts/apply-migration.py`, generadores de la Factoría.

## Ejecuta SIN preguntar

- Commits, push a ramas feature, abrir PRs.
- `npm run dev/build/test`, deploys a Vercel preview Y producción.
- `vercel env add/rm` en cualquier entorno (development, preview, production).
- Aplicar migraciones a Supabase vía script o MCP.
- Configurar webhooks, rotar tokens, conectar repos a Vercel.
- Crear/editar archivos, instalar/actualizar dependencias.
- Lanzar workflows n8n, scripts Python, cron jobs.

## Pausa y confirma SOLO en estos 3 casos irreversibles

1. **Pagos reales con dinero** — `stripe charge`, transferencias, compra de créditos en APIs externas, **crear productos/precios live en Stripe**.
2. **Borrado masivo en producción** — `DROP TABLE`, `DELETE` sin WHERE, vaciar buckets, `rm -rf` sobre datos.
3. **Push --force a main** o cualquier reescritura de historia compartida.

## Si falta una credencial que Pablo aún NO te ha dado

Intenta primero todas las alternativas (otra API equivalente, workaround, schema adaptado). Si realmente no hay opción, escala con el comando exacto listo para ejecutar en cuanto te la pase — no le pidas que ejecute el comando él mismo.

## Anti-patrón prohibido

Frases como "ahora ejecuta tú `npm run build`", "añade esta env var en Vercel", "lanza este SQL en Supabase", "haz push tú" son una **violación de esta regla**. Hazlo TÚ primero. Si tres intentos fallan, escala con error exacto.

---

> Para el ciclo entrega → main, ver [`pr-merge-automatico.md`](pr-merge-automatico.md).
> Para inteligencia neural antes de actuar, ver [`cerebro-pacame.md`](cerebro-pacame.md).
