# =============================================================================
#  INAMHI — Build Angular + subir proyecto al servidor Linux
#  Ejecutar desde la raíz del proyecto en PowerShell
#  Requiere: Node.js, npm, OpenSSH (ssh/scp)
# =============================================================================

param(
    [string]$Server   = "10.0.153.69",
    [string]$User     = "root",
    [string]$RemotePath = "/tmp/inamhi-deploy"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================================"
Write-Host "  INAMHI — Build y despliegue"
Write-Host "  Servidor: $User@$Server"
Write-Host "======================================================"

# ── 1. Build Angular producción ───────────────────────────────────────────────
Write-Host ""
Write-Host "[1/3] Construyendo Angular en modo produccion..."
npm run build
if (-not $?) { Write-Error "Fallo el build de Angular"; exit 1 }
Write-Host "  Build completado en dist/"

# ── 2. Crear carpeta temporal en el servidor ──────────────────────────────────
Write-Host ""
Write-Host "[2/3] Preparando servidor..."
ssh "$User@$Server" "rm -rf $RemotePath && mkdir -p $RemotePath"

# ── 3. Subir archivos al servidor ─────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Subiendo archivos al servidor (scp)..."

# Frontend (dist)
Write-Host "  Subiendo frontend..."
scp -r "dist" "$User@${Server}:$RemotePath/"

# Backend
Write-Host "  Subiendo backend..."
scp -r "backend" "$User@${Server}:$RemotePath/"

# Scripts de despliegue
Write-Host "  Subiendo scripts de despliegue..."
scp -r "deploy" "$User@${Server}:$RemotePath/"

Write-Host ""
Write-Host "======================================================"
Write-Host "  Archivos subidos correctamente"
Write-Host "======================================================"
Write-Host ""
Write-Host "  Ahora en el servidor ejecuta:"
Write-Host ""
Write-Host "    ssh $User@$Server"
Write-Host "    cd $RemotePath"
Write-Host "    chmod +x deploy/deploy.sh"
Write-Host "    sudo bash deploy/deploy.sh"
Write-Host ""
