#!/usr/bin/env bash
# =============================================================================
# PACAME Cerebro IA → Deploy watcher + pull en VPS Hostinger (72.62.185.125)
# Uso (desde tu máquina local, con SSH acceso al VPS ya configurado):
#   scp infra/deploy-brain-vps.sh root@72.62.185.125:/root/
#   ssh root@72.62.185.125 'bash /root/deploy-brain-vps.sh'
# =============================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/pacameagencia/Pacame-Agencia.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="/opt/pacame"
VAULT_DIR="${APP_DIR}/PacameCueva"
LOG_DIR="/var/log/pacame"

echo "[deploy] 1/7 instalando dependencias base"
apt-get update -y
apt-get install -y git curl build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "[deploy] 2/7 instalando Node.js 22 LTS"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] 3/7 instalando pm2"
  npm install -g pm2
fi

echo "[deploy] 4/7 clonando/actualizando repo en ${APP_DIR}"
mkdir -p "${APP_DIR}" "${LOG_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  cd "${APP_DIR}"
  git fetch origin "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
else
  git clone --branch "${BRANCH}" --depth 1 "${REPO_URL}" "${APP_DIR}"
fi

echo "[deploy] 5/7 instalando deps tools/obsidian-sync"
cd "${APP_DIR}/tools/obsidian-sync"
npm ci

if [ ! -f "${APP_DIR}/web/.env.local" ]; then
  echo "[deploy] ⚠️  falta ${APP_DIR}/web/.env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  echo "[deploy] crea el fichero y relanza el script"
  exit 1
fi

if [ ! -d "${VAULT_DIR}" ]; then
  echo "[deploy] ⚠️  falta vault en ${VAULT_DIR}."
  echo "          Opciones:"
  echo "          (a) Si vault está en repo → ya clonado, seguir."
  echo "          (b) Si vault separado → 'git clone <vault-repo> ${VAULT_DIR}'"
  echo "          (c) rclone/rsync desde local"
  echo "          Continuando con la carpeta si existe parcial..."
fi

echo "[deploy] 6/7 arrancando pm2 con ecosystem.config.cjs"
cd "${APP_DIR}"
pm2 delete pacame-vault-watcher 2>/dev/null || true
pm2 delete pacame-vault-pull 2>/dev/null || true
pm2 start tools/obsidian-sync/ecosystem.config.cjs
pm2 save

echo "[deploy] 7/7 configurando pm2 startup (systemd)"
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true
pm2 save

echo ""
echo "[deploy] ✅ LISTO. Procesos corriendo:"
pm2 list
echo ""
echo "[deploy] Logs en tiempo real:"
echo "          pm2 logs pacame-vault-watcher"
echo "          pm2 logs pacame-vault-pull"
echo ""
echo "[deploy] Verifica que Supabase responde:"
echo "          cd ${APP_DIR}/tools/obsidian-sync && npx tsx verify.ts"
