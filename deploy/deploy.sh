#!/bin/bash
# =============================================================================
#  INAMHI Liberación Web — Script de despliegue en Linux
#  Servidor: 10.0.153.69
#  Ejecutar como root o con sudo desde el directorio raíz del proyecto:
#    sudo bash deploy/deploy.sh
# =============================================================================

set -e

APP_DIR="/var/www/inamhi"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$APP_DIR/venv"
NGINX_CONF="/etc/nginx/sites-available/inamhi"
SERVICE_FILE="/etc/systemd/system/inamhi-backend.service"

echo "======================================================"
echo "  Desplegando INAMHI Liberación Web"
echo "======================================================"

# ── 1. Paquetes del sistema ───────────────────────────────────────────────────
echo ""
echo "[1/9] Instalando paquetes del sistema..."
apt-get update -qq
apt-get install -y -qq \
    nginx \
    python3 \
    python3-venv \
    python3-pip \
    python3-dev \
    libmysqlclient-dev \
    pkg-config \
    build-essential \
    curl \
    rsync
echo "  Paquetes instalados"

# ── 2. Estructura de directorios ──────────────────────────────────────────────
echo ""
echo "[2/9] Creando estructura de directorios..."
mkdir -p "$FRONTEND_DIR"
mkdir -p "$BACKEND_DIR/uploads/documentos"
mkdir -p "$BACKEND_DIR/uploads/firmados"
mkdir -p "$BACKEND_DIR/uploads/escaneados"
mkdir -p "$BACKEND_DIR/uploads/temp_certs"
mkdir -p "$BACKEND_DIR/logs"
mkdir -p "$BACKEND_DIR/static/img"
echo "  Directorios creados en $APP_DIR"

# ── 3. Frontend Angular ───────────────────────────────────────────────────────
echo ""
echo "[3/9] Copiando frontend Angular..."
DIST_PATH="dist/sistema-liberacion-web/browser"

if [ ! -d "$DIST_PATH" ]; then
    echo ""
    echo "  ERROR: No se encontró $DIST_PATH"
    echo "  Ejecuta primero en Windows: npm run build"
    echo ""
    exit 1
fi

cp -r "$DIST_PATH"/. "$FRONTEND_DIR/"
echo "  Frontend copiado a $FRONTEND_DIR"

# ── 4. Backend Flask ──────────────────────────────────────────────────────────
echo ""
echo "[4/9] Copiando backend Flask..."
rsync -a \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='logs/*' \
    --exclude='uploads/*' \
    backend/ "$BACKEND_DIR/"
echo "  Backend copiado a $BACKEND_DIR"

# ── 5. Entorno virtual Python ─────────────────────────────────────────────────
echo ""
echo "[5/9] Configurando entorno virtual Python..."

if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo "  Entorno virtual creado en $VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --upgrade pip -q
"$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q
echo "  Dependencias instaladas (incluye gunicorn)"

# ── 6. Archivo .env ───────────────────────────────────────────────────────────
echo ""
echo "[6/9] Verificando archivo .env..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "backend/.env" ]; then
        cp backend/.env "$BACKEND_DIR/.env"
        echo "  .env copiado desde el proyecto"
    else
        cp deploy/.env.example "$BACKEND_DIR/.env"
        echo ""
        echo "  ATENCIÓN: Se copió .env.example — edita $BACKEND_DIR/.env"
        echo "  antes de iniciar el servicio."
        echo ""
    fi
else
    echo "  .env ya existe, no se sobreescribe"
fi
chmod 600 "$BACKEND_DIR/.env"

# ── 7. Permisos ───────────────────────────────────────────────────────────────
echo ""
echo "[7/9] Aplicando permisos..."
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod 600 "$BACKEND_DIR/.env"
chmod -R 775 "$BACKEND_DIR/uploads"
chmod -R 775 "$BACKEND_DIR/logs"
echo "  Permisos aplicados"

# ── 8. Nginx ──────────────────────────────────────────────────────────────────
echo ""
echo "[8/9] Configurando Nginx..."
cp deploy/nginx.conf "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/inamhi
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx
echo "  Nginx configurado y activo"

# ── 9. Servicio systemd ───────────────────────────────────────────────────────
echo ""
echo "[9/9] Configurando servicio systemd..."
cp deploy/inamhi-backend.service "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable inamhi-backend
systemctl restart inamhi-backend

# Esperar que arranque
sleep 3

# ── Firewall (si ufw está activo) ─────────────────────────────────────────────
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    echo "  Abriendo puertos en ufw..."
    ufw allow 80/tcp
    ufw allow 5050/tcp
fi

echo ""
echo "======================================================"
echo "  Despliegue completado exitosamente"
echo "======================================================"
echo ""
echo "  Frontend : http://10.0.153.69"
echo "  API      : http://10.0.153.69:5050/api"
echo ""
echo "  Estado del servicio backend:"
systemctl status inamhi-backend --no-pager -l
echo ""
echo "  Comandos útiles:"
echo "    Ver logs:    journalctl -u inamhi-backend -f"
echo "    Reiniciar:   systemctl restart inamhi-backend"
echo "    Ver errores: tail -f $BACKEND_DIR/logs/error.log"
