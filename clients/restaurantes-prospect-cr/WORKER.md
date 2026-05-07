# Worker continuo · Sistema autónomo de captación

Worker que corre 24/7 procesando leads sin intervención. Cada lead que coge:
1. Genera demo HTML
2. Deploy a Vercel
3. Envía email Resend
4. Sincroniza a Supabase
5. Se ve EN DIRECTO en `/dashboard/prospect-leads`

## Lanzar worker

```bash
cd clients/restaurantes-prospect-cr
node scripts/worker.mjs --rate=4 --hours=8-22
```

**Rate seguro Resend free tier**: 4 leads/hora × 14h activas (08:00-22:00) = **56 leads/día**, dentro del límite de 100/día.

**Rate agresivo (Resend Pro $20/mes)**: 10/hora × 24h = 240 leads/día → cubre 3000 leads en 13 días.

## Opciones

| Flag | Por defecto | Efecto |
|---|---|---|
| `--rate=N` | 4 | leads por hora |
| `--hours=A-B` | 0-23 | solo procesar entre esas horas (24h por defecto) |
| `--max=N` | 0 (∞) | parar tras procesar N leads |
| `--dry` | off | genera demo pero no deploy ni envía |

## Stop

`Ctrl+C` cierra limpio (limpia heartbeat). Si está en background:

```bash
ps -ef | grep worker.mjs | grep -v grep
kill <PID>
```

## Estado en vivo

Mira https://pacameagencia.com/dashboard/prospect-leads (o `npm run dev` localhost):

- **Card "Worker"**: status (working/sleeping/idle), procesados, errores, próximo run
- **Card "Construyendo ahora"**: lead actual + step actual (generating / deploying / sending) con progress visual
- **Card "Últimas webs"**: últimas 8 webs creadas con link directo

Todo se actualiza realtime via Supabase channels. Sin recargar.

## Comportamiento

- **Idempotente**: nunca envía dos veces al mismo email (consulta `prospect_leads.sent_at`)
- **Concurrencia segura**: si lanzas 2 workers en paralelo, no procesan el mismo lead (ventana 15 min in-flight)
- **Out-of-hours**: si está fuera de la ventana `--hours`, duerme hasta la próxima ventana
- **Error tolerante**: si un lead falla, marca run como `failed` y sigue con el siguiente
- **Heartbeat**: cada 60s update a `worker_heartbeat`. Si el dashboard no ve heartbeat reciente, marca worker como inactivo

## Lanzamiento como servicio (24/7)

Para que el worker sobreviva a cierre de terminal / reboot:

### Opción A — PM2 (sencillo)

```bash
npm i -g pm2
pm2 start scripts/worker.mjs --name pacame-worker -- --rate=4 --hours=8-22
pm2 save
pm2 startup
```

### Opción B — VPS Hostinger (PACAME ya tiene)

```bash
ssh root@72.62.185.125
cd /opt/pacame
# Clonar repo o sync de archivos
node clients/restaurantes-prospect-cr/scripts/worker.mjs --rate=6 --hours=8-22
```

Mejor con `tmux` o `systemd` para que sobreviva al cierre de SSH.

### Opción C — GitHub Action cron

```yaml
# .github/workflows/worker-tick.yml
on:
  schedule:
    - cron: '*/15 8-22 * * *'  # cada 15 min entre 8h y 22h
jobs:
  tick:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node clients/restaurantes-prospect-cr/scripts/worker.mjs --max=1
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
```

Cada 15 min procesa 1 lead → 4 leads/hora × 14h = 56/día, perfecto para warm-up.

## Métricas que te dará el dashboard

- **Open rate** (target B2B España: 25-40%)
- **Click rate** (target: 8-15% del open)
- **Reply rate** (target: 3-6% del click)
- **Bounce rate** (mantener <5%, si sube parar y limpiar lista)

Si bounce rate supera 5%, el worker NO para automáticamente — Pablo decide si pausar (resend.com/webhooks marca `email.complained` y `email.bounced` que actualizan estado).

## Próximas mejoras (V3)

1. **Auto-pause** si bounce rate >5% en últimas 50
2. **Auto-throttle** si Resend devuelve 429 (rate limit)
3. **Auto-enrichment**: para cada lead, buscar IG/web del local antes de generar demo
4. **A/B testing**: 2 versiones de subject/copy en paralelo, comparar
5. **Auto-mejora**: cuando haya 200+ envíos, aplicar template winners
