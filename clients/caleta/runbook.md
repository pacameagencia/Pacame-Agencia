# Runbook — La Caleta Manchega

> Cómo intervenir la web oficial PACAME `lacaletamanchega.com` desde el repo PACAME.

---

## 1. Topología (desde 2026-05-13)

```
   ┌──────────────────────────────┐         ┌──────────────────────────────┐
   │ GitHub                       │         │ GitHub                       │
   │ pacameagencia/               │         │ pacameagencia/               │
   │ lacaletamanchega-com (priv)  │         │ lacaletamanchegaalbacete     │
   │ ← PACAME edita aquí          │         │ ← Lovable edita aquí         │
   │ branch main                  │         │ branch main                  │
   └──────────────┬───────────────┘         └──────────────┬───────────────┘
                  │                                        │
        push triggers redeploy                  push triggers redeploy
                  ▼                                        ▼
   ┌──────────────────────────────┐         ┌──────────────────────────────┐
   │ Vercel project               │         │ Lovable hosting              │
   │ pacames-projects /           │         │ (proyecto privado Pablo)     │
   │ lacaletamanchegaalbacete     │         │ sirve lacaletamanchega.es    │
   │ sirve lacaletamanchega.com   │         │                              │
   │ + www. + edge cdg1 París     │         │                              │
   └──────────────────────────────┘         └──────────────────────────────┘
                  ▲                                        ▲
                  │                                        │
       ────  100% PACAME  ────                    ────  Pablo directo  ────
                                                       (fuera de scope PACAME)

DNS apex lacaletamanchega.com → A 216.198.79.1 (Vercel anycast AWS)
DNS www → CNAME apex
NS authoritative: ns1.dns-parking.com / ns2.dns-parking.com (Hostinger)
SSL: Let's Encrypt R12/R13 auto-renew Vercel (expira ~25 Jul 2026)
```

**Repos separados** desde 2026-05-13. Editar en Lovable solo afecta al `.es`. Editar en `lacaletamanchega-com` solo afecta al `.com`. Cero riesgo de pisarse.

**Vercel project name**: `lacaletamanchegaalbacete` (no se renombró para evitar romper aliases `*.vercel.app`). Pero su repo conectado es `pacameagencia/lacaletamanchega-com`.

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
curl -s https://www.lacaletamanchega.com | grep -iE "(canonical|og:url|\"url\":)"
```

---

## 3. Editar la web `.com` (PR flow)

### Setup primera vez

```powershell
git clone https://github.com/pacameagencia/lacaletamanchega-com.git C:\tmp\caleta-com
cd C:\tmp\caleta-com
npm install
```

### Flow de cambio

```powershell
cd C:\tmp\caleta-com
git checkout main && git pull
git checkout -b fix/<scope>-YYYY-MM-DD

# edita lo que toque
# (index.html, src/pages/*, src/data/menu.ts, etc.)

npm run dev          # localhost:8080 para ver en vivo
npm run build        # sanity check

git add <files>
git commit -m "<tipo>(<scope>): <mensaje en español>"
git push -u origin fix/<scope>-YYYY-MM-DD

gh pr create --repo pacameagencia/lacaletamanchega-com --fill
gh pr merge <num> --repo pacameagencia/lacaletamanchega-com --merge --delete-branch=false
```

Vercel auto-deployea en `main`. Esperar `READY` con `mcp__vercel__list_deployments` o `vercel inspect <url>`.

### Validar tras merge

```bash
curl -s https://www.lacaletamanchega.com | grep -i canonical
# → <link rel="canonical" href="https://www.lacaletamanchega.com/" />
```

### Reglas duras al editar (heredadas en CLAUDE.md del repo cliente)

- SEO siempre apunta a `https://www.lacaletamanchega.com` (canonical, og:url, JSON-LD, sitemap, robots, llms).
- Nada de Lovable: no añadir `lovable-tagger`, no usar URLs de Lovable, no subir assets a `gpt-engineer-file-uploads`.
- Datos legales fijos: GRUPO LA CALETA MANCHEGA SL · CIF B24910598.

---

## 4. Reconectar Vercel (ya hecho 2026-05-13, registrado para futuras referencias)

Si alguna vez hay que volver a apuntar el proyecto Vercel a otro repo:

```powershell
cd C:\tmp\caleta-com
vercel link --yes --scope pacames-projects --project lacaletamanchegaalbacete
vercel git disconnect --yes
vercel git connect https://github.com/<org>/<repo> --yes
vercel deploy --prod --yes
```

Vercel CLI ya está autenticado como `pacameagencia` en el equipo de Pablo.

---

## 5. Fallos típicos y resolución

### 404 / dominio caído

1. Comprobar último deploy en Vercel — si está `ERROR` o `BUILDING` colgado, redeploy con `vercel redeploy <url>` o desde UI.
2. Comprobar DNS — `nslookup lacaletamanchega.com 8.8.8.8` debe dar `216.198.79.1`.
3. Si DNS está mal, entrar en Hostinger DNS Zone y restaurar el A record apex.

### SSL caducado o ERR_CERT

- Vercel renueva auto Let's Encrypt 30 días antes del `notAfter`. Si peta, mirar Vercel project → Settings → Domains → SSL.
- En caso extremo, re-añadir el dominio en Vercel (Remove + Add Domain) fuerza re-emisión SSL en <60s.

### Vercel suspende el team `pacames-projects`

- Plan B: transferir el proyecto a un team aparte tipo "Caleta IO" o "Pablo Personal" (mismo patrón que Dark Room IO).
- Mientras llega, la web cae. Tener el repo backupeado y poder redeployar a otro hosting (Netlify / Cloudflare Pages) si fuera necesario.

---

## 6. Convenciones

- Commits del repo cliente: en español, formato Conventional Commits.
- Co-author Claude en commits hechos por PACAME: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- Cada sprint cerrado: entrada en `clients/caleta/history/YYYY-MM-DD-<sprint>.md`.
- Cero secrets en el repo. Cero PII de clientes finales.
