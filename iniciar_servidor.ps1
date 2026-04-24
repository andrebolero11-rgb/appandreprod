while($true) {
    Write-Host "Iniciando servidor..." -ForegroundColor Cyan
    npm run dev
    Write-Host "Servidor caiu! Reiniciando em 5 segundos..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
