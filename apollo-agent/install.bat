@echo off
setlocal enabledelayedexpansion
title Apollo Agent - Instalador

echo.
echo ==========================================
echo    APOLLO AGENT - Instalador v2.0
echo ==========================================
echo.

:: Verificar Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute como ADMINISTRADOR!
    echo Clique com botao direito - Executar como administrador
    pause
    exit /b 1
)

set AGENT_DIR=%~dp0
echo [INFO] Pasta do agent: %AGENT_DIR%
echo.

:: ── 1. Verificar Node.js ────────────────────────────────────────────────────
echo [1/5] Verificando Node.js...

set "NODE_EXE="

where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('where node') do (
        if "!NODE_EXE!"=="" set "NODE_EXE=%%i"
    )
)

if not exist "!NODE_EXE!" (
    if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
)

if not exist "!NODE_EXE!" (
    if exist "%AGENT_DIR%node\node.exe" set "NODE_EXE=%AGENT_DIR%node\node.exe"
)

if exist "!NODE_EXE!" (
    echo [OK] Node.js: !NODE_EXE!
    goto NODE_OK
)

:: Baixar Node.js portable
echo [INFO] Node.js nao encontrado. Baixando do nodejs.org...
echo [INFO] Aguarde cerca de 1-2 minutos...

set "NODE_ZIP=%AGENT_DIR%node.zip"
set "NODE_DIR=%AGENT_DIR%node"

powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile '%NODE_ZIP%' -UseBasicParsing"

if not exist "%NODE_ZIP%" (
    echo [ERRO] Falha no download. Verifique sua conexao com a internet.
    pause
    exit /b 1
)

echo [INFO] Extraindo Node.js...
if exist "%NODE_DIR%" rmdir /s /q "%NODE_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%AGENT_DIR%node_tmp' -Force"
for /d %%D in ("%AGENT_DIR%node_tmp\node-*") do (
    move "%%D" "%NODE_DIR%" >nul
)
rmdir /s /q "%AGENT_DIR%node_tmp" >nul 2>&1
del "%NODE_ZIP%" >nul 2>&1

set "NODE_EXE=%NODE_DIR%\node.exe"

if not exist "%NODE_EXE%" (
    echo [ERRO] Extracao falhou. Instale Node.js manualmente em nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js instalado em: %NODE_DIR%

:NODE_OK
echo.

:: ── 2. Verificar config.json ─────────────────────────────────────────────────
echo [2/5] Verificando config.json...
if not exist "%AGENT_DIR%config.json" (
    echo [ERRO] Arquivo config.json nao encontrado!
    echo Crie o config.json na mesma pasta do install.bat
    pause
    exit /b 1
)
echo [OK] config.json encontrado.
echo.

:: ── 3. Criar script de start ─────────────────────────────────────────────────
echo [3/5] Criando script de inicializacao...

set "START_SCRIPT=%AGENT_DIR%start-agent.bat"
echo @echo off > "%START_SCRIPT%"
echo cd /d "%AGENT_DIR%" >> "%START_SCRIPT%"
echo "%NODE_EXE%" "%AGENT_DIR%agent.js" >> "%START_SCRIPT%"

echo [OK] start-agent.bat criado.
echo.

:: ── 4. Registrar no Agendador de Tarefas ────────────────────────────────────
echo [4/5] Registrando tarefa no Windows...

schtasks /delete /tn "ApolloAgent" /f >nul 2>&1

schtasks /create /tn "ApolloAgent" /tr "\"%START_SCRIPT%\"" /sc ONSTART /ru SYSTEM /rl HIGHEST /f >nul 2>&1

if %errorLevel% neq 0 (
    echo [AVISO] Falha no Task Scheduler. Tentando metodo alternativo...
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "ApolloAgent" /t REG_SZ /d "\"%NODE_EXE%\" \"%AGENT_DIR%agent.js\"" /f >nul
    echo [OK] Registrado no startup via registro do Windows.
) else (
    echo [OK] Tarefa ApolloAgent registrada no Agendador.
)
echo.

:: ── 5. Iniciar Agent ─────────────────────────────────────────────────────────
echo [5/5] Iniciando Apollo Agent...

start "" /b "%NODE_EXE%" "%AGENT_DIR%agent.js"

timeout /t 3 /nobreak >nul
echo [OK] Agent iniciado!
echo.

echo ==========================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo.
echo    O agent esta rodando em background.
echo    Acesse o Apollo Hub - Dar Carga
echo    para ver este PC aparecer online!
echo.
echo    IMPORTANTE: Se ainda nao configurou
echo    o clienteId no config.json, o PC vai
echo    aparecer como "Sem Cliente" no site.
echo ==========================================
echo.
pause
