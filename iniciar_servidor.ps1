while($true) {
    Write-Host "Iniciando servidor (Porta 8083)..." -ForegroundColor Cyan
    npm run dev
    Write-Host "O servidor caiu! Reiniciando automaticamente em 5 segundos..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
