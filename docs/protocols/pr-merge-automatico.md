# Ciclo PR + merge a main (automático, sin esperar a Pablo)

> **Regla:** cada vez que termines un bloque de trabajo entregable (feature, fix, doc, refactor, regla, configuración), ejecuta el ciclo COMPLETO de entrega sin pedir permiso ni esperar review humano.

---

## Pasos del ciclo

1. `git add <archivos>` — solo lo que tocaste, nunca `-A` ciego.
2. `git commit -m "<tipo>(<scope>): <mensaje en español>"` con HEREDOC + `Co-Authored-By: Claude` al final.
3. `git push origin <rama>` (con `-u` la primera vez).
4. `gh pr create --title "..." --body "$(cat <<EOF ... EOF)"` con Summary + Test plan.
5. `gh pr merge <PR> --merge --delete-branch=false` (estrategia merge commit, igual que PRs #51, #53, #54).
6. `gh pr view <PR>` para confirmar `state: MERGED` + reportar URL + commit a Pablo.

---

## Pablo NO tiene que estar atento ni dar OK

Tu juicio es el filtro: si el cambio compila/lintea, no introduce secretos, no rompe contratos públicos y no entra en los 3 casos irreversibles de la regla maestra → **merge directo**.

## Excepciones donde SÍ pausas y confirmas antes del merge

- Cualquier caso de la regla maestra ([`autonomia-total.md`](autonomia-total.md)): pago real, borrado masivo en prod, `push --force` a main, **crear productos Stripe live**.
- Migración SQL destructiva sobre tabla con datos de producción (DROP/ALTER irreversible).
- Cambio en config de pagos Stripe live, Vapi (números que cobran), o env vars productivas que pueden tirar el sitio.
- PR > 1.000 LOC tocando áreas críticas (auth, billing, cron-master, agent-logger) → pedir luz verde.
- CI failing en checks bloqueantes (build, type-check, tests E2E críticos) → arreglar primero, no mergear roto.

## Anti-patrón prohibido

- ❌ "PR abierto en #X, ¿lo mergeo?" → NO. Mergéalo.
- ❌ "¿Quieres que haga PR a main?" → NO. Hazlo.
- ❌ "Tengo el commit listo, ¿procedo con el push?" → NO. Procede.
- ❌ "Esperando review humano antes de mergear" → NO existe. Tú eres el revisor.
- ❌ Dejar PR en `OPEN` más de 5 minutos cuando el trabajo está terminado y validado → MAL.

## Reportar a Pablo SOLO al final

> "PR #X mergeado a main (commit `abc1234`). Resumen: 3 archivos, +120/-45 LOC. Próximo: <siguiente paso>".

Nunca antes pidiendo permiso intermedio.
