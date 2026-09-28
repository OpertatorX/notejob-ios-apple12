@echo off
cd /d "%~dp0"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_NOTEJOB_BLINK_RELEASE.ps1"
pause
