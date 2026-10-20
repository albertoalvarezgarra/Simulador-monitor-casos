@echo off
title Simulador Clinico Philips Efficia DFM100
cd /d "%~dp0"

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python server.py
    pause
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "start_simulator.ps1"
pause
