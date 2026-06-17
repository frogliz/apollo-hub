@echo off
title Apollo Agent - Instalador
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

:: Verificar Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [AVISO] Node.js nao encontrado. Instalando via winget...
    winget install OpenJS.NodeJS.LTS -e --silent
    if %errorLevel% neq 0 (
        echo [ERRO] Falha ao instalar Node.js.
        echo Baixe manualmente em: https://nodejs.org
        pause
        exit /b 1
    )
    echo [OK] Node.js instalado!
)

echo [OK] Node.js encontrado.

:: Diretório do agent
set AGENT_DIR=%~dp0
echo [INFO] Diretorio do agent: %AGENT_DIR%

:: Criar tarefa no Task Scheduler para rodar no boot (SYSTEM - sem usuario)
echo [INFO] Criando tarefa no Agendador de Tarefas...

schtasks /delete /tn "ApolloAgent" /f >nul 2>&1

schtasks /create ^
    /tn "ApolloAgent" ^
    /tr "node \"%AGENT_DIR%agent.js\"" ^
    /sc ONSTART ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f

if %errorLevel% neq 0 (
    echo [ERRO] Falha ao criar tarefa agendada.
    pause
    exit /b 1
)

echo [OK] Tarefa ApolloAgent criada no Agendador!
echo.

:: Iniciar agora
echo [INFO] Iniciando Apollo Agent agora...
schtasks /run /tn "ApolloAgent"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     INSTALACAO CONCLUIDA!            ║
echo  ║                                      ║
echo  ║  O Apollo Agent vai iniciar          ║
echo  ║  automaticamente com o Windows.      ║
echo  ║                                      ║
echo  ║  Configure o config.json com o ID   ║
echo  ║  correto do cliente antes de usar!   ║
echo  ╚══════════════════════════════════════╝
echo.
pause
