@echo off
title Apollo Agent - TESTE (nao fecha sozinho)
echo.
echo ========================================
echo   APOLLO AGENT - Modo de Teste
echo   Ctrl+C para parar
echo ========================================
echo.

set AGENT_DIR=%~dp0
set "NODE_EXE="

where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('where node') do (
        if "!NODE_EXE!"=="" set "NODE_EXE=%%i"
    )
)
if not defined NODE_EXE if exist "%AGENT_DIR%node\node.exe" set "NODE_EXE=%AGENT_DIR%node\node.exe"
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"

if not defined NODE_EXE (
    echo [ERRO] Node.js nao encontrado! Rode o install.bat primeiro.
    pause
    exit /b 1
)

echo [INFO] Usando Node: %NODE_EXE%
echo [INFO] Rodando agent...
echo.

"%NODE_EXE%" "%AGENT_DIR%agent.js"
echo.
echo [AGENT ENCERRADO]
pause
