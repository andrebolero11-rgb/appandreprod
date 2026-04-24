@echo off
:start
echo Iniciando o servidor na porta 8083...
npm run dev
echo.
echo O servidor caiu! Reiniciando em 5 segundos...
timeout /t 5
goto start
