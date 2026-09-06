param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " TRATTORIA BELLAVISTA - ARRANQUE LOCAL CON DOCKER" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

try {
    docker version | Out-Null
}
catch {
    Write-Host "[ERROR] Docker no esta disponible. Instala/inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env")) {
    if (-not (Test-Path ".env.example")) {
        Write-Host "[ERROR] Falta .env.example" -ForegroundColor Red
        exit 1
    }

    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Se creo .env desde .env.example." -ForegroundColor Green
    Write-Host "[INFO] La password es solo para el PostgreSQL local de Docker." -ForegroundColor Yellow
}

Write-Host "[INFO] Construyendo y arrancando servicios..." -ForegroundColor Yellow
docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] docker compose up fallo." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Esperando FastAPI..." -ForegroundColor Yellow

$Ready = $false

for ($i = 1; $i -le 40; $i++) {
    try {
        $Health = Invoke-RestMethod "http://127.0.0.1:8000/health" -TimeoutSec 2

        if ($Health.status -eq "ok") {
            $Ready = $true
            break
        }
    }
    catch {}

    Start-Sleep -Seconds 2
}

if (-not $Ready) {
    Write-Host "[ERROR] FastAPI no respondio a tiempo." -ForegroundColor Red
    docker compose ps
    docker compose logs backend --tail 100
    exit 1
}

$Db = Invoke-RestMethod "http://127.0.0.1:8000/health/database"
$Mesas = @(Invoke-RestMethod "http://127.0.0.1:8000/api/mesas")
$Productos = @(Invoke-RestMethod "http://127.0.0.1:8000/api/productos")

Write-Host ""
Write-Host "API_STATUS=ok" -ForegroundColor Green
Write-Host "DATABASE=$($Db.database_name)"
Write-Host "MESAS=$($Mesas.Count)"
Write-Host "PRODUCTOS=$($Productos.Count)"
Write-Host ""
docker compose ps

Write-Host ""
Write-Host "FRONTEND=http://127.0.0.1:5500" -ForegroundColor Cyan
Write-Host "SWAGGER=http://127.0.0.1:8000/docs" -ForegroundColor Cyan

if (-not $NoBrowser) {
    Start-Process "http://127.0.0.1:5500"
}

Write-Host ""
Write-Host "TRATTORIA_BELLAVISTA_LOCAL_OK=SI" -ForegroundColor Green