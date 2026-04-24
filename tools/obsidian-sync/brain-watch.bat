@echo off
REM PacameCueva brain watcher (Windows local).
REM Arranca chokidar + Supabase sync para editar vault en vivo.
REM Doble click para ejecutar. Dejar la ventana abierta.

cd /d "%~dp0"
title PACAME Brain Watcher
echo.
echo ============================================
echo   PACAME Brain Watcher — PacameCueva
echo   Vault: %CD%\..\..\PacameCueva
echo   Supabase: sync real-time on edit
echo ============================================
echo.

if not exist node_modules (
  echo Instalando dependencias...
  call npm install --silent
)

call npm run watch
pause
