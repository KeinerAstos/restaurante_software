$Root = "C:\Users\Keiner Astos\OneDrive\Desktop\restaurante_software"
$Frontend = "$Root\frontend"
$Python = "$Root\.venv\Scripts\python.exe"

Set-Location $Frontend

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " RESTAURANTE SOFTWARE - FRONTEND" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "URL=http://127.0.0.1:5500"
Write-Host "CTRL+C para detener."
Write-Host ""

& $Python -m http.server 5500 --bind 127.0.0.1