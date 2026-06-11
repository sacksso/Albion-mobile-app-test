@echo off
echo Albion Fish Calculator
echo Abriendo en http://localhost:8080 ...
cd /d "%~dp0"
start "" "http://localhost:8080"
python -m http.server 8080 2>nul || python3 -m http.server 8080
pause
