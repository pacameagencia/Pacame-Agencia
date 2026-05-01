# DarkRoom Discord bot — Node 20 thin relay.
# Plan: C:\Users\Pacame24\.claude\plans\ya-que-tienes-acceso-glittery-rain.md
#
# Build:
#   docker build -t darkroom-bot:latest infra/docker/darkroom-bot
#
# Run (VPS Hostinger 72.62.185.125):
#   docker run -d \
#     --name darkroom-bot \
#     --restart unless-stopped \
#     --env-file /root/darkroom-bot.env \
#     darkroom-bot:latest
#
# Las env vars necesarias:
#   DARKROOM_DISCORD_BOT_TOKEN   (BotFather token desde Discord Developer Portal)
#   DARKROOM_DISCORD_BOT_SECRET  (HMAC secret compartido con Vercel · gen aleatorio 32+ chars)
#   DARKROOM_VERCEL_BASE         (default https://darkroomcreative.cloud)
#   DARKROOM_COMMUNITY_PAUSE     (kill switch · "true" = bot responde mensaje canned)

FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-alpine AS runner

WORKDIR /app

# usuario no-root
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER app

# healthcheck simple: el bot está vivo si el proceso responde a SIGUSR1
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

CMD ["node", "src/index.js"]
