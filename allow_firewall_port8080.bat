@echo off
title Permitir puerto 8080 en el Firewall de Windows
echo Solicitando permisos de administrador...
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Agregando regla al Firewall de Windows para el puerto 8080...
netsh advfirewall firewall delete rule name="Philips_DFM100_Simulator_8080" >nul 2>&1
netsh advfirewall firewall add rule name="Philips_DFM100_Simulator_8080" dir=in action=allow protocol=TCP localport=8080 profile=any
echo.
echo =====================================================================
echo  REGLA DE FIREWALL APLICADA CON EXITO.
echo  El puerto 8080 ahora permite conexiones desde la tablet.
echo =====================================================================
pause
