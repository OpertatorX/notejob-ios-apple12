@echo off
cd /d "%~dp0"
start "" http://localhost:8787
python -m http.server 8787
if errorlevel 1 py -m http.server 8787
