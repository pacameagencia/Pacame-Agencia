# Runbook — La Caleta Manchega

> Cómo intervenir la web oficial PACAME `lacaletamanchega.com` sin romper nada y sin pisar el `.es` que Pablo edita en Lovable.

---

## 1. Topología

```
                ┌──────────────────────────────────────────┐
                │ GitHub: pacameagencia/                   │
                │         lacaletamanchegaalbacete (priv)  │
                │ branch main                              │
                └────────────┬───────────┬─────────────────┘
                             │           │
                  push triggers          │ sync bidireccional
                             │           │ (vía Lovable app)
                             ▼           ▼
              ┌────────────────────┐  ┌────────────────────────┐
              │ Vercel             │  │ Lovable (GPT-Engineer) │
              │ team pacames-      │  │ proyecto privado de    │
              │ projects           │  │ Pablo                  │
              │ project            │  │ sirve lacaletamanchega │
              │ lacaletamanchega   │  │ .es                    │
              │ albacete           │  │                        │
              │ sirve .com + www   │  │                        │
              └────────────────────┘  └────────────────────────┘
                  Edge cdg1 París       Cloudflare frontend

DNS apex caletamanchega.com → A 216.198.79.1 (Vercel anycast AWS)
DNS www → CNAME apex
NS authoritative: ns1.dns-parking.com / ns2.dns-parking.com (Hostinger)
SSL: Let's Encrypt R12/R13 auto-renew Vercel (expira ~25 Jul 2026)
```

**Importante:** el repo es uno solo y ambas plataformas (Vercel + Lovable) miran a la misma rama `main`. Si editas en Lovable, el repo cambia → Vercel redeploya. Si editas en el repo directamente, Lovable también lo absorbe.

Esto implica que un fix hecho desde PACAME puede ser **pisado por una edición posterior de Pablo en Lovable** si Lovable regenera ese mismo bloque. Hay que coordinar.

---

## 2. Operaciones seguras (read-only)

### Inspección Vercel (MCP)

```
mcp__vercel__get_project { teamId: team_I9hX5FeEq7t4r9GstZlrtrvF, projectId: prj_B5wlyLrEzHIGPnG2Zvsj8VX55lcu }
mcp__vercel__list_deployments { teamId: team_I9hX5FeEq7t4r9GstZlrtrvF, projectId: prj_B5wlyLrEzHIGPnG2Zvsj8VX55lcu }
mcp__vercel__get_deployment { teamId: team_I9hX5FeEq7t4r9GstZlrtrvF, idOrUrl: <dpl_id> }
```

### Inspección externa desde Bash

```bash
nslookup lacaletamanchega.com 8.8.8.8
curl -sI https://lacaletamanchega.com
curl -sI https://www.lacaletamanchega.com
echo | openssl s_client -connect www.lacaletamanchega.com:443 -servername www.lacaletamanchega.com 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates -ext subjectAltName
```

Cero riesgo: solo lectura, no modifica nada.

---

## 3. Operaciones de escritura (con cuidado Lovable bidireccional)

### Pasos genéricos para tocar el código

1. Avisar a Pablo: "voy a editar repo `lacaletamanchegaalbacete`, pausa Lovable si tienes algo a medias".
2. Clonar repo en directorio temporal fuera del worktree PACAME:
   ```powershell
   git clone https://github.com/pacameagencia/lacaletamanchegaalbacete.git C:\tmp\caleta-edit
   cd C:\tmp\caleta-edit
   ```
3. Crear rama feature (no `main` directo):
   ```powershell
   git checkout -b fix/<scope>-YYYY-MM-DD
   ```
4. Editar.
5. Probar build local:
   ```powershell
   npm install --silent
   npm run build
   ```
6. Commit + push:
   ```powershell
   git add <files>
   git commit -m "fix(seo): canonical apunta a .com en vez de .es"
   git push -u origin fix/<scope>-YYYY-MM-DD
   ```
7. Abrir PR contra `main` con `gh pr create`. Mergear con `gh pr merge --merge`.
8. Vercel deployea automático en main → esperar `READY` con `mcp__vercel__list_deployments`.
9. Validar con `curl -s https://www.lacaletamanchega.com | grep canonical`.

### Riesgo Lovable: cómo mitigar

- **Antes de editar**, decir a Pablo que no toque Lovable durante ~10 minutos.
- Los archivos que Lovable regenera frecuentemente son `index.html`, components de páginas, data, schema. Si tu fix toca esos → mayor riesgo de pisarse.
- Si Lovable pisa el fix, repetir y dejar una NOTA en `clients/caleta/history/` del incidente para que la próxima vez sea evidente.
- Solución definitiva (a evaluar más adelante): **fork del repo** a uno nuevo gestionado solo por PACAME, desconectar Lovable de ese fork, y dejar el `.es` con el repo original que sigue Lovable. Dos webs, dos repos, sin pisarse.

---

## 4. Fallos típicos y resolución

### 404 / dominio caído

1. Comprobar último deploy en Vercel — si está `ERROR` o `BUILDING` colgado, redeploy.
2. Comprobar DNS — `nslookup lacaletamanchega.com 8.8.8.8` debe dar `216.198.79.1`.
3. Si DNS está mal, entrar en Hostinger DNS Zone y restaurar el A record apex.

### SSL caducado o ERR_CERT

- Vercel renueva auto Let's Encrypt 30 días antes del `notAfter`. Si peta, mirar `Vercel project → Settings → Domains → SSL`.
- En caso extremo, re-añadir el dominio en Vercel (Remove + Add Domain) fuerza re-emisión SSL en <60s.

### Lovable rompe el SEO

- Verificar canonical: `curl -s https://www.lacaletamanchega.com | grep -i canonical`.
- Debe apuntar a `https://www.lacaletamanchega.com/`. Si vuelve a apuntar a `.es`, repetir fix (Lovable pisó).

### Vercel suspende el team `pacames-projects` (riesgo identificado en `strategy/arquitectura-3-capas.md`)

- Plan B: transferir el proyecto a un team aparte tipo "Caleta IO" o "Pablo Personal" (mismo patrón que Dark Room IO).
- Mientras llega, la web cae. Tener el repo backupeado y poder redeployar a otro hosting (Netlify / Cloudflare Pages) si fuera necesario.

---

## 5. Convenciones

- Commits del repo cliente: en español, formato Conventional Commits.
- Co-author Claude en commits hechos por PACAME: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- Cada sprint cerrado: entrada en `clients/caleta/history/YYYY-MM-DD-<sprint>.md`.
- Cero secrets en el repo. Cero PII de clientes finales.
