# Runbook — Rollback Storybook 3D

> Cómo desactivar la home Storybook 3D y volver a la home clásica si algo sale mal.

## Tipos de rollback (de menos a más invasivo)

### 1. Rollback en caliente (60 segundos, sin redeploy de código)

**Cuándo usar**: el código en main está bien, pero necesitas apagar la home Storybook (e.g. usuarios reportan bugs visuales, conversión cae, error JS critico).

**Pasos**:

1. Ir a https://vercel.com/pacames-projects/web/settings/environment-variables
2. Buscar `NEXT_PUBLIC_STORYBOOK_HOME` en environment "Production".
3. Cambiar valor de `1` → `0`.
4. Click "Save".
5. Vercel automáticamente redeploya con la nueva env var (~30-60s).
6. Verificar: `curl -s https://pacameagencia.com/ | grep -i "storybook\|hero"` — debería devolver el HTML de la home clásica (Hero + ServicesSection + 10 más).

La home Storybook sigue accesible en **`/clasica`** ↔ no, espera: `/clasica` siempre es la clásica. Para acceder al Storybook con el flag off, lo más fácil es usar el preview env donde el flag esté en `1`.

### 2. Rollback de despliegue (rollback al deploy anterior)

**Cuándo usar**: el flag está OFF pero hay un bug en otra parte del código que llegó en el último deploy.

**Pasos**:

1. Ir a https://vercel.com/pacames-projects/web/deployments
2. Buscar el último deploy READY anterior al actual.
3. Click "..." → "Promote to Production".
4. Confirmar.

### 3. Revert del PR Storybook 3D

**Cuándo usar**: necesitas que el código del Storybook desaparezca del repo (escenario muy raro: e.g. ataque de supply chain a una dependencia 3D).

**Pasos**:

```bash
# Ver lista de PRs Storybook 3D mergeados
gh pr list --search "storybook-3d" --state merged --limit 10

# Revert quirúrgico (un PR en concreto)
git checkout main && git pull origin main
git revert -m 1 <merge-commit-sha>
git push origin main

# Vercel auto-deploya
```

**Lista de merges Storybook 3D** (orden cronológico):

| PR | Fase | Commit merge | Descripción |
|---|---|---|---|
| #142 | 0 | `c9d1ab5` | Preparación: skill + plan + wireframes + 6 mockups + hook |
| #154 | 1 | `f8268e2` | Stack R3F + estructura + Canvas R3F orbital + SSR shell |
| #158 | 2 | `196d407` | 5 islas reales + HUD overlay + a11y teclado |
| #160 | 3 | `d48db54` | Galería casos 3D con tarjetas rotables |
| #161 | 4 | `9715d10` | Email capture + form auditoría funcional |
| #163 | 5 | `66ecdab` | SEO + a11y + OG image custom |
| #?? | 6 | (este PR) | Migración legacy + clasica + sitemap + runbook |

Revertir todos en orden inverso si necesario:

```bash
git revert -m 1 66ecdab 9715d10 d48db54 196d407 f8268e2 c9d1ab5
git push origin main
```

### 4. Recuperar branch tag pre-Storybook

**Cuándo usar**: necesitas comparar comportamiento exacto pre-Storybook (e.g. para reproducir un bug que solo aparece tras la migración).

**Pasos**:

```bash
# Tag creado en Fase 6 (este PR)
git checkout v1.0-pre-storybook
# o branch:
git checkout legacy/pre-storybook-2026-05
```

## Verificaciones post-rollback

Después de cualquier rollback, verifica:

1. **Home carga sin errores**: `curl -s -o /dev/null -w "%{http_code}\n" https://pacameagencia.com/` → 200.
2. **Endpoints leads vivos**: `curl -X POST https://pacameagencia.com/api/leads -H 'Content-Type: application/json' -d '{}'` → 400 con mensaje "Datos invalidos" (NO 500 ni HTML home).
3. **Sitemap válido**: `curl -s https://pacameagencia.com/sitemap.xml | head -20` — debería listar URLs sin `/casos-3d` (si revert PR #160) o con (si solo flag off).
4. **Lighthouse**: revisar que Performance/SEO no caen >10 puntos respecto al baseline.

## Checklist completo del flag

| Estado del flag | `/` muestra | `/clasica` muestra | `/casos-3d` muestra | `/auditoria-3d` muestra |
|---|---|---|---|---|
| `STORYBOOK_HOME=1` | StorybookHome (Canvas 3D) | ClassicHome | CasosScene 3D | AuditoriaScene 3D + form |
| `STORYBOOK_HOME=0` (default) | ClassicHome (12 secciones) | ClassicHome | CasosScene 3D | AuditoriaScene 3D + form |

**Nota:** Las rutas `/casos-3d` y `/auditoria-3d` SIEMPRE están vivas (no las controla el flag). Si quieres ocultarlas también, hay que añadir lógica al feature flag.

## Datos preservados

- **Tabla `leads`**: intacta. El form Storybook 3D escribe en la misma tabla con `source="storybook_v1"` o `source="storybook_lite_capture"`. Filtrar:
  ```sql
  SELECT * FROM leads
  WHERE source LIKE 'storybook%'
  ORDER BY created_at DESC;
  ```
- **localStorage cliente** (`pacame_storybook_v1`, `pacame_reduced_motion_v1`): es estado local del usuario, no se persiste server-side. Sigue funcionando aunque flag esté off (no afecta).
- **Caso de éxito legacy** `/casos/[slug]`: páginas individuales intactas, no se modificaron.

## Contacto

Si el rollback no resuelve, escribe en Telegram al canal PACAME-DEV con:
- Hora exacta del incidente
- Output de `curl https://pacameagencia.com/` antes y después del rollback
- Captura del browser console si hay errores JS
