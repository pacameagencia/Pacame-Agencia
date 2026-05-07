# Dashboard CRM Live · Setup

Pipeline outreach + dashboard en tiempo real con tracking Resend (open / click / reply / bounce).

## Cómo se ve

URL: `https://<tu-deploy>.vercel.app/dashboard/prospect-leads` (o local: `npm run dev` → http://localhost:3000/dashboard/prospect-leads)

- **Métricas live** arriba: total, sent, opened, clicked, replied, bounced, won + open rate / CTR / reply rate
- **Tabla filtrable**: search, estado, tipo, ciudad
- **Drill-down**: click en cualquier lead abre drawer lateral con timeline completo de eventos
- **Realtime Supabase**: sin recargar, las métricas se actualizan en cuanto Resend envía un evento

## Componentes técnicos

```
supabase/migrations/20260507_prospect_leads.sql       # tablas + vista métricas + RLS
web/app/api/webhooks/resend/route.ts                  # endpoint que recibe eventos
web/app/dashboard/prospect-leads/page.tsx             # página principal
web/app/dashboard/prospect-leads/metrics-bar.tsx      # cards de métricas live
web/app/dashboard/prospect-leads/leads-table.tsx      # tabla + drawer drill-down
clients/restaurantes-prospect-cr/scripts/sync-to-supabase.mjs  # sync log → Supabase tras cada pipeline run
```

## Setup webhook Resend (Pablo, 2 min)

Para que el dashboard reciba eventos en tiempo real:

1. Entrar en https://resend.com/webhooks
2. **Add Endpoint**:
   - URL: `https://pacameagencia.com/api/webhooks/resend`
     (o tu URL preview Vercel: `https://<tu-deploy>.vercel.app/api/webhooks/resend`)
   - Events: marca **TODOS los `email.*`** (sent, delivered, delivery_delayed, opened, clicked, bounced, complained)
   - **Save**
3. Resend muestra un **Signing Secret** (`whsec_...`). Copiar.
4. En `web/.env.local` añadir:
   ```
   RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Re-deploy del web (push a Vercel) para que recoja la env var.

Si NO configuras el secret, el endpoint funciona pero acepta cualquier POST (menos seguro pero útil para test rápido).

## Flujo completo cada vez que envías un batch

```
1. node scripts/pipeline.mjs --cap=30
   → Genera demos + deploy Vercel + envía emails Resend + log local

2. node scripts/sync-to-supabase.mjs
   → Sube los nuevos del log a tabla prospect_leads (idempotente)

3. Resend → webhook → /api/webhooks/resend
   → Insert en email_events + update prospect_leads
   → Dashboard se actualiza solo (Supabase Realtime)
```

Para automatizar el step 2 después de cada pipeline run, añadir al final de `pipeline.mjs`:

```js
import { execSync } from 'node:child_process';
execSync(`node "${resolve(here, 'sync-to-supabase.mjs')}"`, { stdio: 'inherit' });
```

(Lo añado en próxima iteración si quieres que sea totalmente auto.)

## Estados de un lead

```
pending      ← antes de enviar
sent         ← Resend aceptó el envío
delivered    ← inbox del destinatario aceptó
opened       ← email abierto al menos 1 vez
clicked      ← clic en link de la demo
replied      ← respondió al email (manual: marca tú)
won          ← cerrado contrato (manual: marca tú con deal_value_eur)
lost         ← descartado (manual)
bounced      ← rebote (auto)
complained   ← marcó spam (auto)
unsubscribed ← solicitó baja (auto via List-Unsubscribe)
```

## Marca manual de respuesta / venta

Cuando un cliente te responde por email o WhatsApp, marca el lead desde Supabase Studio o desde un comando rápido:

```bash
# Marcar como respondido
node -e "
const { Client } = require('./web/node_modules/pg');
const fs = require('fs');
const url = fs.readFileSync('web/.env.local', 'utf8').match(/DATABASE_URL=\"?([^\"\n]+)/)[1];
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  await c.query(\"update prospect_leads set status='replied', replied_at=now() where slug=\$1\", ['NOMBRE-DEL-LEAD']);
  console.log('OK');
  await c.end();
});
"
```

O simplemente edita el campo `status` en Supabase Studio (Table Editor → prospect_leads → fila → status).

## Roadmap V3 — agente auto-mejora

Cuando haya 200-300 envíos con eventos, el agente puede:
1. Comparar leads ganadores vs perdedores por: paleta usada, asunto usado, tipo de menú, ciudad, día/hora envío
2. Identificar patrón ganador
3. Aplicarlo al template / `copy-variants.mjs` automáticamente
4. Versionar templates: v1 (actual), v2 (post-iteración), etc.

A construir cuando haya data suficiente (~2 semanas).
