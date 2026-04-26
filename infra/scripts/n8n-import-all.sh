#!/bin/bash
# ==========================================================================
# PACAME — Importar todos los workflows al n8n del VPS via CLI del container
#
# Uso local (desde Windows/WSL/Mac con la clave SSH hostinger_vps):
#   bash infra/scripts/n8n-import-all.sh
#
# Uso desde el VPS directamente:
#   bash infra/scripts/n8n-import-all.sh local
# ==========================================================================

set -e

MODE="${1:-remote}"
SSH_HOST="root@72.62.185.125"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/hostinger_vps}"
CONTAINER="n8n-n8n-1"
REMOTE_DIR="/tmp/pacame-workflows"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOWS_DIR="$(cd "$SCRIPT_DIR/../n8n/workflows" && pwd)"
PREPARE_PY="$SCRIPT_DIR/n8n-prepare.py"

if [ ! -d "$WORKFLOWS_DIR" ]; then
  echo "ERROR: no se encuentra $WORKFLOWS_DIR"
  exit 1
fi

echo "== PACAME n8n import =="
echo "Mode: $MODE"
echo "Workflows dir: $WORKFLOWS_DIR"
echo

run_remote() {
  if [ "$MODE" = "local" ]; then
    bash -c "$1"
  else
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" "$1"
  fi
}

copy_to_vps() {
  if [ "$MODE" = "local" ]; then
    cp -r "$1" "$2"
  else
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$1" "$SSH_HOST:$2"
  fi
}

# -------------------------------------------------------------------
# 1. Preparar TODOS los workflows con id + versionId (un solo python)
# -------------------------------------------------------------------
TMP_LOCAL="$(mktemp -d)"
echo "[1/4] Inyectando id + versionId en todos los workflows..."
if [ ! -f "$PREPARE_PY" ]; then
  echo "ERROR: no se encuentra $PREPARE_PY"
  exit 1
fi
WORKFLOWS_DIR="$WORKFLOWS_DIR" TMP_LOCAL="$TMP_LOCAL" python3 "$PREPARE_PY"

echo "[2/4] Copiando $TMP_LOCAL/*.json al VPS ($REMOTE_DIR)..."
run_remote "mkdir -p $REMOTE_DIR && rm -f $REMOTE_DIR/*.json"
for f in "$TMP_LOCAL"/*.json; do
  echo "  - $(basename "$f")"
  copy_to_vps "$f" "$REMOTE_DIR/$(basename "$f")"
done
rm -rf "$TMP_LOCAL"

# -------------------------------------------------------------------
# 3. Copiar al container y ejecutar import
# -------------------------------------------------------------------
echo
echo "[3/4] Copiando al container $CONTAINER..."
run_remote "docker exec --user root $CONTAINER rm -rf /tmp/workflows /tmp/wf-import"
run_remote "docker cp $REMOTE_DIR/. $CONTAINER:/tmp/wf-import"
run_remote "docker exec --user root $CONTAINER chmod -R a+r /tmp/wf-import && docker exec --user root $CONTAINER chown -R node:node /tmp/wf-import"

echo
echo "[4/4] Importando cada workflow via n8n CLI..."
run_remote 'docker exec '"$CONTAINER"' sh -c "for f in /tmp/wf-import/*.json; do echo \"  importando \$(basename \$f)...\"; n8n import:workflow --input=\$f 2>&1 | tail -2; done"'

# -------------------------------------------------------------------
# Listado final
# -------------------------------------------------------------------
echo
echo "== Workflows instalados =="
run_remote "docker exec $CONTAINER n8n list:workflow"

echo
echo "== Done =="
echo "Activa los que necesites desde https://n8n.pacameagencia.com/"
echo "Env vars n8n adicionales necesarios:"
echo "  - GOOGLE_PLACES_API_KEY   (workflow 06)"
echo "  - HUNTER_API_KEY          (workflow 07)"
echo "  - CLEARBIT_API_KEY        (workflow 07)"
echo "  - PACAME_WEBHOOK_SECRET   (workflow 05)"
echo "  - CRON_SECRET             (workflows 05, 07)"
