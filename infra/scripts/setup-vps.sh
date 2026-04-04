#!/bin/bash
# ==================================================
# PACAME — Setup VPS (Hetzner CX22 / Ubuntu 24.04)
# Dia 1 de la Semana 1
# ==================================================

set -e

echo "=== PACAME VPS Setup ==="
echo ""

# 1. Actualizar sistema
echo "[1/6] Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Docker
echo "[2/6] Instalando Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Docker Compose (plugin)
echo "[3/6] Verificando Docker Compose..."
docker compose version || {
    echo "Instalando Docker Compose plugin..."
    sudo apt install -y docker-compose-plugin
}

# 4. Node.js 20
echo "[4/6] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Nginx + Certbot
echo "[5/6] Instalando Nginx y Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 6. Estructura de directorios
echo "[6/6] Creando estructura..."
mkdir -p ~/pacame/{n8n,dashboard,backups,logs}

echo ""
echo "=== Setup completado ==="
echo ""
echo "Siguiente paso:"
echo "  1. Copia infra/n8n/docker-compose.yml a ~/pacame/n8n/"
echo "  2. Copia infra/n8n/.env.example a ~/pacame/n8n/.env y rellena"
echo "  3. Copia infra/nginx/n8n.pacame.es.conf a /etc/nginx/sites-available/"
echo "  4. Ejecuta: cd ~/pacame/n8n && docker compose up -d"
echo "  5. Configura SSL: sudo certbot --nginx -d n8n.pacame.es"
echo ""
echo "Validacion: accede a https://n8n.pacame.es"
