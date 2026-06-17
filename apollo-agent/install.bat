@echo off
title Apollo Agent - Instalador
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════╗
echo  ║     APOLLO AGENT - Instalador        ║
echo  ╚══════════════════════════════════════╝
echo.

:: Verificar se está rodando como Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute este arquivo como ADMINISTRADOR!
    echo Clique com botao direito ^> "Executar como administrador"
    pause
    exit /b 1
)

:: Diretório do agent
set AGENT_DIR=%~dp0

:: ── Verificar Node.js ────────────────────────────────────────────────────────
echo [1/4] Verificando Node.js...

set NODE_EXE=
if exist "C:\Program Files\nodejs\node.exe"       set NODE_EXE=C:\Program Files\nodejs\node.exe
if exist "C:\Program Files (x86)\nodejs\node.exe" set NODE_EXE=C:\Program Files (x86)\nodejs\node.exe
if exist "%AGENT_DIR%node\node.exe"               set NODE_EXE=%AGENT_DIR%node\node.exe

:: Testa se node está no PATH
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('where node') do set NODE_EXE=%%i
)

if not "%NODE_EXE%"=="" (
    echo      Node.js encontrado em: %NODE_EXE%
    goto NODE_OK
)

:: ── Baixar Node.js portable direto do nodejs.org ────────────────────────────
echo      Node.js nao encontrado. Baixando do nodejs.org...
echo      Aguarde, isso pode levar 1-2 minutos...

set NODE_ZIP=%AGENT_DIR%node.zip
set NODE_DIR=%AGENT_DIR%node

:: Baixar Node.js portable (zip) via PowerShell
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile '%NODE_ZIP%' -UseBasicParsing }"

if not exist "%NODE_ZIP%" (
    echo [ERRO] Falha ao baixar Node.js.
    echo Baixe manualmente em https://nodejs.org e instale.
    pause
    exit /b 1
)

echo      Download OK! Extraindo...

:: Extrair ZIP via PowerShell
powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%AGENT_DIR%node_tmp' -Force"
:: Mover pasta extraída para node\
if exist "%NODE_DIR%" rmdir /s /q "%NODE_DIR%"
for /d %%i in ("%AGENT_DIR%node_tmp\node-*") do move "%%i" "%NODE_DIR%" >nul
rmdir /s /q "%AGENT_DIR%node_tmp" >nul 2>&1
del "%NODE_ZIP%" >nul 2>&1

set NODE_EXE=%NODE_DIR%\node.exe

if not exist "%NODE_EXE%" (
    echo [ERRO] Extracao falhou. Instale Node.js manualmente.
    pause
    exit /b 1
)

echo      Node.js instalado em: %NODE_DIR%

:NODE_OK
echo      OK!

:: ── Criar script de inicialização ────────────────────────────────────────────
echo [2/4] Criando script de inicializacao...

set START_SCRIPT=%AGENT_DIR%start-agent.bat
(
    echo @echo off
    echo "%NODE_EXE%" "%AGENT_DIR%agent.js"
) > "%START_SCRIPT%"

echo      OK!

:: ── Criar tarefa no Task Scheduler (SYSTEM - sobrevive a logoff) ─────────────
echo [3/4] Registrando no Agendador de Tarefas...

schtasks /delete /tn "ApolloAgent" /f >nul 2>&1

schtasks /create ^
    /tn "ApolloAgent" ^
    /tr "\"%START_SCRIPT%\"" ^
    /sc ONSTART ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f >nul

if %errorLevel% neq 0 (
    echo [ERRO] Falha ao criar tarefa agendada.
    pause
    exit /b 1
)

echo      OK! Tarefa ApolloAgent criada.

:: ── Iniciar Agent agora ───────────────────────────────────────────────────────
echo [4/4] Iniciando Apollo Agent...
schtasks /run /tn "ApolloAgent" >nul
echo      OK!

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     INSTALACAO CONCLUIDA!                ║
echo  ║                                          ║
echo  ║  Apollo Agent iniciado e configurado     ║
echo  ║  para iniciar automaticamente com o PC.  ║
echo  ║                                          ║
echo  ║  Verifique o Apollo Hub em ~5 segundos   ║
echo  ║  para confirmar que o agent esta online! ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  [!] Lembre de editar config.json com o ID do cliente!
echo.
pause
