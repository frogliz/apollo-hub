@echo off
title Apollo Agent - Ativar RDP Local para Teste
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   Ativando RDP para Teste Local          ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Verificar Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute como ADMINISTRADOR!
    pause & exit /b 1
)

:: 1. Habilitar RDP no registro
echo [1/4] Habilitando Remote Desktop...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f >nul
echo      OK!

:: 2. Habilitar NLA (Network Level Authentication) - opcional
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" /v UserAuthentication /t REG_DWORD /d 0 /f >nul

:: 3. Abrir porta 3389 no Firewall
echo [2/4] Abrindo porta 3389 no Firewall...
netsh advfirewall firewall add rule name="RDP Apollo Teste" protocol=TCP dir=in localport=3389 action=allow >nul
echo      OK!

:: 4. Iniciar servico RDP
echo [3/4] Iniciando servico Remote Desktop...
net start TermService >nul 2>&1
sc config TermService start= auto >nul
echo      OK!

:: 5. Mostrar IP local
echo [4/4] Seu IP local:
ipconfig | findstr /i "IPv4"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   RDP ATIVADO COM SUCESSO!               ║
echo  ║                                          ║
echo  ║   Arquivo: teste-local.rdp               ║
echo  ║   Host:    127.0.0.1:3389                ║
echo  ║   Usuario: seu usuario Windows           ║
echo  ║                                          ║
echo  ║   Para conectar de outro PC use          ║
echo  ║   o IP mostrado acima na porta 3389      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Perguntar se quer abrir o RDP agora
set /p abrir="Abrir conexao RDP agora? (S/N): "
if /i "%abrir%"=="S" (
    start "" "%~dp0teste-local.rdp"
)

pause
