# Protocolo: Aislamiento de datos de clientes

> **Regla maestra:** los datos del cliente son del cliente. PACAME guarda **metadata del encargo** + secrets cifrados. Cero leakage entre clientes.

Este protocolo es OBLIGATORIO antes de ingestar info de un cliente nuevo, escribir notas de cliente, o generar contenido público que mencione clientes.

---

## 1. Las 4 capas (recordatorio)

| Capa | Qué es | Mención pública con PACAME |
|---|---|---|
| **1 — PACAME** | Factoría agencia (web pacameagencia.com, agentes IA propios, infra) | ✅ Sí |
| **2 — Clientes B2B** | Externos que contratan la factoría (Royo, Talleres Jaula, Casa Marisol) | ✅ Como casos cliente, con permiso |
| **3 — SaaS propios** | Productos PACAME (Dark Room, AsesorPro, PromptForge, PacameGPT) | ✅ Como ecosistema |
| **4 — Personal Pablo** | La Caleta + Ecomglobalbox (entidades aparte de Pablo) | ❌ **NUNCA** en marketing/RRSS/casos PACAME |

Doc maestro completo: [`strategy/arquitectura-3-capas.md`](../../strategy/arquitectura-3-capas.md).

---

## 2. Estructura de aislamiento

### Repo

```
clients/
├── README.md                    # convenciones (capa 2)
├── _template/                   # plantilla nuevo cliente
└── <cliente-slug>/              # kebab-case ASCII (royo, casa-marisol)
    ├── README.md                # estado + contactos + accesos POR REFERENCIA
    ├── runbook.md               # cómo intervenir SIN tocar lo que no toca
    ├── scripts/                 # PACAME scripts para este cliente
    └── history/                 # log de sprints
```

**SÍ va aquí:** runbooks, scripts, drafts, mockups, history.
**NUNCA va aquí:** API keys, passwords, tokens, BD del cliente, datos finales del cliente.

### Base de datos (Supabase)

| Tabla | Propósito | Cómo se aísla |
|---|---|---|
| `clients` (45 cols) | Metadata del cliente | UUID `id` único; row-by-row separation |
| `client_credentials` | **Secrets cifrados** AES-256-GCM | `client_id` FK + `ciphertext + iv + tag` por columna |
| `client_websites` | WP/Shopify/etc. del cliente | `client_id` FK + `wp_app_password_*` cifrada en 3 cols |
| `client_brand_settings` | Brand del cliente (colores, fonts) | `client_id` FK |
| `client_backups` | Snapshots por cliente | `client_id + website_id` (jerarquía) |
| `client_deployments` | Deploys auto (Factoría) | `client_id` FK |
| `client_files` | Assets entregables | `client_id` FK |
| `client_messages` | Mensajes del cliente | `client_id` FK |

Toda tabla `client_*` tiene `client_id UUID` como FK. **Cualquier query SIN `WHERE client_id = ?` es bug.**

### Cerebro neural

`agent_memories`, `agent_discoveries` y `knowledge_nodes` son **compartidas** (tabla única). El aislamiento se hace con **tags**:

```
tags = ['client:royo', 'memoria-tipo-x', ...]
```

Triggers automáticos (en `agent_memories` y `agent_discoveries`):
- Si el `title + content` menciona `royo` → añade tag `client:royo`
- Si menciona `talleresjaula` → tag `client:talleresjaula`
- Si menciona `ecomglobalbox` o `caleta` → tag `capa-4-mention` (entidades aparte)
- Si menciona ≥2 clientes diferentes → flag `metadata.cross_client_warning` para revisión humana

**Antes de hacer `/api/neural/query` para info de cliente:**
```sql
SELECT * FROM agent_memories
WHERE 'client:royo' = ANY(tags)   -- aislamiento estricto
ORDER BY embedding <=> $1 LIMIT 5;
```

---

## 3. Política de credenciales por categoría

| Tipo de credencial | DÓNDE va | Cómo se accede |
|---|---|---|
| **WP App Password** del cliente | `client_websites.wp_app_password_*` (cifrado AES-GCM) | `lib/wordpress.ts` desencripta runtime |
| **Hosting API key** del cliente (Hostinger, etc.) | `client_credentials` type=`hostinger_api` | `GET /api/clients/[id]/credentials/[credId]` |
| **SFTP/SSH/MySQL** del cliente | `client_credentials` type=`sftp/ssh/mysql` | idem |
| **Webhooks PACAME** que envía a cliente | `client_websites.webhook_secret` | runtime |
| **Stripe key del CLIENTE** (si lo gestionas tú) | `client_credentials` type=`stripe_secret` | idem |
| **Stripe key PACAME** (cuenta agencia) | `process.env.STRIPE_SECRET_KEY` | una sola cuenta |
| **Tokens Meta/Google del cliente** | `client_credentials` type=`generic_api` | idem |

**NUNCA:**
- Secrets en `.env.local` por cliente (mezclas todo en una sola env)
- Secrets en notas Markdown del vault Obsidian (vault va a GitHub privado, riesgo de leak)
- Secrets en `clients/<slug>/README.md` (versionado en repo PACAME)
- Secrets en `metadata` JSONB plano (no cifrado)

**Setup necesario:**
```bash
# Una vez por entorno: generar y guardar la clave maestra de cifrado
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → poner el output en WP_SECRET_KEY en .env.local + Vercel env vars
```

---

## 4. Flujo: ingestar un cliente nuevo

```
1. Crear ficha mínima en `clients` (name, business_name, plan, status='active')
2. Crear carpeta `clients/<slug>/` desde `clients/_template/`
3. Pedir SOLO los accesos que el encargo necesita (no asumir set fijo)
4. Cifrar credenciales y guardar en `client_credentials`:
   POST /api/clients/<id>/credentials
   { type: 'hostinger_api', label: 'Hostinger Royo', secret: 'xxx', metadata: {...} }
5. Si tiene web: crear entry en `client_websites` con wp_app_password cifrado
6. Documentar runbook en `clients/<slug>/runbook.md` (sin secrets, solo cómo)
7. Tag en cerebro: cualquier memoria/discovery sobre este cliente lleva 'client:<slug>'
```

---

## 5. Flujo: ofrecer caso público / marketing

Antes de mencionar un cliente en RRSS, propuesta o web pública:

| Pregunta | Si NO | Acción |
|---|---|---|
| ¿Es Capa 2 (B2B) o 3 (SaaS propio)? | Capa 4 → **PROHIBIDO** | Stop. Escoger otro caso. |
| ¿El cliente ha autorizado mención pública? | No → no usar | Pedir permiso o anonimizar |
| ¿Hay datos personales del cliente final? | Sí → mostrar agregado | Solo métricas anonimizadas |
| ¿Mencionas resultados con números? | Sí → verificar | Confirmar números reales (no inflados) |

**Anti-patrón crítico (capa-4):**
- ❌ "Caso de éxito: La Caleta facturó X gracias a PACAME"
- ❌ "Ecomglobalbox usa nuestro sistema con 6.9k MRR"
- ✅ "Cliente del sector restauración pasó de Y a Z" (sin nombrar)

---

## 6. Auditoría continua

### Auditor automático

```bash
python infra/scripts/audit-client-isolation.py
```

Detecta:
- Secrets expuestos en vault Obsidian (CRÍTICO — vault va a GitHub privado)
- Secrets expuestos en repo PACAME (cualquier file no whitelisted)
- Notas que mencionan ≥2 clientes (potencial cruce)
- Capa 4 leaks (La Caleta, Ecomglobalbox) en código/strategy/agents

```bash
# Modo estricto: exit 1 si hay críticos (para CI)
python infra/scripts/audit-client-isolation.py --strict
```

### Auditoría neural (DB)

```sql
-- Memorias sin scope de cliente cuando deberían
SELECT id, title FROM agent_memories
WHERE (lower(title || ' ' || content) ~ '\m(royo|talleresjaula|casa-marisol)\M')
  AND NOT (tags @> ARRAY['client:royo', 'client:talleresjaula', 'client:casa-marisol']::text[]);

-- Cross-client warnings detectados por trigger
SELECT id, title, metadata->'cross_client_warning' AS detected
FROM agent_memories
WHERE metadata ? 'cross_client_warning';
```

### Schedule recomendado

- **CI/CD**: auditor `--strict` en cada PR (futuro)
- **Cron diario**: auditor + reporte Telegram si hay críticos
- **Pre-deploy producción**: auditor obligatorio

---

## 7. Casos límite y excepciones

| Caso | Política |
|---|---|
| Cliente menciona OTRO cliente legítimamente (comparativa) | OK con tag `cross-client-ref-intentional` en metadata |
| Memoria interna PACAME que cita aprendizaje de un cliente | Tag `client:<slug>` + `learning-extracted` |
| Capa 4 mencionada en doc de estrategia interna | OK si el doc está en `strategy/arquitectura-*` (excluido del auditor) |
| Caleta/Ecomglobalbox mencionados en infra/scripts | OK si es config técnica (memoria del setup), NO en marketing |

---

## 8. Checklist al pasar al siguiente cliente

Antes de cerrar el sprint de un cliente y pasar al siguiente, marca:

- [ ] Todas las credenciales del cliente están en `client_credentials` cifradas (nada en vault, nada en `.env.local` por nombre del cliente)
- [ ] Tabla `client_websites` tiene los websites con auth cifrada
- [ ] `clients/<slug>/README.md` actualizado con estado + contactos + accesos POR REFERENCIA
- [ ] `clients/<slug>/runbook.md` con cómo intervenir
- [ ] Memorias del sprint en `agent_memories` con tag `client:<slug>`
- [ ] Discoveries del sprint en `agent_discoveries` con `metadata.client_scope = '<slug>'`
- [ ] Auditor ejecutado: `python infra/scripts/audit-client-isolation.py --strict` → 0 críticos
- [ ] Vault Obsidian sin secrets nuevos del cliente

---

## 9. Si Pablo recibe un audit/RGPD/lo que sea

```bash
# Listar TODO lo que PACAME tiene de un cliente específico
psql $DATABASE_URL <<SQL
\set client_id '<uuid-del-cliente>'
SELECT 'clients' AS t, count(*) FROM clients WHERE id = :'client_id'
UNION ALL SELECT 'client_credentials', count(*) FROM client_credentials WHERE client_id = :'client_id'
UNION ALL SELECT 'client_websites', count(*) FROM client_websites WHERE client_id = :'client_id'
UNION ALL SELECT 'client_brand_settings', count(*) FROM client_brand_settings WHERE client_id = :'client_id'
UNION ALL SELECT 'client_backups', count(*) FROM client_backups WHERE client_id = :'client_id'
UNION ALL SELECT 'client_deployments', count(*) FROM client_deployments WHERE client_id = :'client_id'
UNION ALL SELECT 'client_files', count(*) FROM client_files WHERE client_id = :'client_id'
UNION ALL SELECT 'client_messages', count(*) FROM client_messages WHERE client_id = :'client_id'
UNION ALL SELECT 'agent_memories tagged', count(*) FROM agent_memories WHERE 'client:<slug>' = ANY(tags)
UNION ALL SELECT 'agent_discoveries scoped', count(*) FROM agent_discoveries WHERE metadata->>'client_scope' = '<slug>';
SQL
```

Y si el cliente solicita borrado RGPD:
```sql
-- Marca como deleted (NO hard delete — auditoría)
UPDATE clients SET
  status='churned',
  deletion_requested_at = now(),
  deletion_reason = 'RGPD request'
WHERE id = '<uuid>';
-- Hard delete tras 30 días vía cron
```

---

## Cambios

- **2026-05-03**: Versión inicial. Stack actual: 4 clientes activos, `client_credentials` con AES-256-GCM cifrado, triggers de tag automático en cerebro neural, auditor automático en `infra/scripts/`.
