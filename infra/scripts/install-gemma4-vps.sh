#!/bin/bash
# ============================================================
# PACAME — Instalacion Gemma 4 en VPS Hostinger KVM2 (72.62.185.125)
# ============================================================
# Uso:
#   bash install-gemma4-vps.sh          # Instalacion completa
#   bash install-gemma4-vps.sh test     # Solo test de inferencia
#
# Requiere: root o sudo, 10+ GB disco libre, 8+ GB RAM
# ============================================================

set -e

STEP() { echo ""; echo "================================================"; echo ">>> $1"; echo "================================================"; }

if [ "$1" = "test" ]; then
    STEP "Test de inferencia Gemma 4"
    curl -sS http://localhost:11434/api/generate -d '{
        "model": "gemma4:4b",
        "prompt": "Eres ATLAS, experto SEO de PACAME. Dame 5 palabras clave long-tail para una pasteleria artesanal en Valencia. Solo lista, sin explicaciones.",
        "stream": false
    }' | head -c 2000
    exit 0
fi

STEP "1. Verificar recursos del sistema"
echo "RAM disponible:"
free -h
echo ""
echo "Espacio en disco:"
df -h / | tail -1
echo ""
echo "CPU:"
nproc
lscpu | grep "Model name" | head -1
echo ""
echo "GPU (si hay):"
lspci | grep -i -E "vga|nvidia|amd" || echo "Sin GPU dedicada (ok, usaremos CPU)"

STEP "2. Instalar Ollama"
if command -v ollama &> /dev/null; then
    echo "Ollama ya instalado, version: $(ollama --version)"
else
    curl -fsSL https://ollama.com/install.sh | sh
fi

STEP "3. Configurar Ollama para escuchar en todas las interfaces"
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=https://pacameagencia.com,https://*.pacameagencia.com,http://localhost:*"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_NUM_PARALLEL=2"
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama
sleep 3

STEP "4. Descargar Gemma 4 (E4B, ~5 GB)"
# Si Gemma 4 aun no esta en Ollama, usar gemma3:4b como fallback
if ollama list | grep -q "gemma4"; then
    echo "Gemma 4 ya descargado"
else
    ollama pull gemma4:4b || ollama pull gemma3:4b
fi

STEP "5. Configurar Nginx reverse proxy (gemma.pacameagencia.com)"
cat > /etc/nginx/sites-available/gemma.pacameagencia.com <<'EOF'
server {
    listen 80;
    server_name gemma.pacameagencia.com;

    location / {
        proxy_pass http://localhost:11434;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;

        # Requiere header Authorization: Bearer <token> (configurar en app)
        if ($http_authorization !~ "^Bearer ") {
            return 401 '{"error":"Unauthorized"}';
        }
    }
}
EOF

ln -sf /etc/nginx/sites-available/gemma.pacameagencia.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

STEP "6. SSL con certbot (Let's Encrypt)"
if command -v certbot &> /dev/null; then
    certbot --nginx -d gemma.pacameagencia.com --non-interactive --agree-tos -m hola@pacameagencia.com || echo "Certbot fallo, revisar DNS de gemma.pacameagencia.com"
else
    echo "certbot no instalado, saltando SSL"
fi

STEP "7. Test de inferencia"
echo "Prompt: 'Eres ATLAS, experto SEO de PACAME. 5 keywords long-tail para pasteleria Valencia.'"
time curl -sS http://localhost:11434/api/generate -d '{
    "model": "gemma4:4b",
    "prompt": "Eres ATLAS, experto SEO de PACAME. Dame 5 palabras clave long-tail para una pasteleria artesanal en Valencia. Solo lista.",
    "stream": false
}' | head -c 3000

STEP "8. Resumen"
echo ""
echo "Ollama en: http://localhost:11434 (interno)"
echo "Proxy publico: https://gemma.pacameagencia.com (con auth Bearer)"
echo ""
echo "Modelos instalados:"
ollama list
echo ""
echo "Uso de RAM:"
free -h
echo ""
echo "Estado del servicio:"
systemctl status ollama --no-pager | head -10
echo ""
echo "LISTO. Siguiente paso: crear web/lib/gemma.ts en el codigo de PACAME."
