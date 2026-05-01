# DarkRoom Discord Bot · thin relay

> Bot mínimo de Discord para la comunidad DarkRoom. **No contiene lógica de negocio**:
> los agentes IA (IRIS, NIMBO, VECTOR) viven en `web/lib/darkroom/community/` y se
> exponen vía `/api/darkroom/community/discord-event` en Vercel. El bot solo:
> 1. Conecta al servidor Discord.
> 2. Reenvía eventos relevantes al endpoint Vercel (con HMAC).
> 3. Postea de vuelta la respuesta del agente.

## Arquitectura

```
Discord guild  ─▶  bot (este container, VPS)  ─▶  HTTPS  ─▶  /api/darkroom/community/discord-event  ─▶  dispatcher  ─▶  IRIS/NIMBO/VECTOR
                                                                                                                              │
Discord guild  ◀──  bot postea reply ◀────────────────────────────────────────────────────────────────────────────────────────┘
```

## Variables de entorno

| Var | Obligatoria | Descripción |
|---|---|---|
| `DARKROOM_DISCORD_BOT_TOKEN` | Sí | Token del bot · Discord Developer Portal → Applications → Bot |
| `DARKROOM_DISCORD_BOT_SECRET` | Sí | HMAC compartido bot↔Vercel (≥32 chars random) |
| `DARKROOM_VERCEL_BASE` | No | Default `https://darkroomcreative.cloud` |
| `DARKROOM_COMMUNITY_PAUSE` | No | `"true"` para activar kill switch (Escenario 4 master-playbook) |

## Build local

```bash
cd infra/docker/darkroom-bot
docker build -t darkroom-bot:latest .
```

## Deploy en VPS Hostinger

1. SSH al VPS:
   ```bash
   ssh root@72.62.185.125
   ```

2. Clonar el repo (o usar workflow CI/CD):
   ```bash
   cd /opt/pacame
   git pull
   ```

3. Crear archivo de env (NO commitear):
   ```bash
   cat > /root/darkroom-bot.env <<EOF
   DARKROOM_DISCORD_BOT_TOKEN=...
   DARKROOM_DISCORD_BOT_SECRET=...
   DARKROOM_VERCEL_BASE=https://darkroomcreative.cloud
   DARKROOM_COMMUNITY_PAUSE=false
   EOF
   chmod 600 /root/darkroom-bot.env
   ```

4. Build + run:
   ```bash
   docker build -t darkroom-bot:latest /opt/pacame/infra/docker/darkroom-bot
   docker run -d \
     --name darkroom-bot \
     --restart unless-stopped \
     --env-file /root/darkroom-bot.env \
     darkroom-bot:latest
   ```

5. Logs:
   ```bash
   docker logs -f darkroom-bot
   ```

## Kill switch (Escenario 4 master-playbook · Adobe/Figma cease-and-desist)

```bash
# pausa total — bot responde solo "servicio en mantenimiento"
sed -i 's/^DARKROOM_COMMUNITY_PAUSE=.*/DARKROOM_COMMUNITY_PAUSE=true/' /root/darkroom-bot.env
docker restart darkroom-bot
```

## Mapeo nombre canal Discord → channel_key

El bot resuelve el `channel_key` mirando `msg.channel.name`. Los canales DEBEN llamarse así
en Discord para que el dispatcher los reconozca:

- `bienvenida` → `discord:bienvenida`
- `reglas-y-faq` → `discord:reglas-y-faq`
- `anuncios` → `discord:anuncios`
- `soporte-ai` → `discord:soporte-ai`
- `status-stack` → `discord:status-stack`
- `stack-tutoriales` → `discord:stack-tutoriales`
- `showcase` → `discord:showcase`
- `oportunidades` → `discord:oportunidades`
- `confesionario` → `discord:confesionario`
- `crew-vip` → `discord:crew-vip`
- `ofertas-pablo` → `discord:ofertas-pablo`

Cualquier canal cuyo nombre no esté en la lista se resuelve a `discord:dm` (NIMBO general).
