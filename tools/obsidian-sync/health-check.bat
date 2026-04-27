@echo off
cd /d "%~dp0"
title PACAME Health Check
call npx tsx verify.ts --notify
exit /b %ERRORLEVEL%
