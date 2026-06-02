@echo off

echo ========================================
echo   TUT Life Helper - Startup Script
echo ========================================
echo.

where npm > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found.
    echo         Please install Node.js.
    pause
    exit /b 1
)

echo Starting Frontend (Vite -> http://localhost:5173) ...
cd /d "%~dp0frontend" && npm run dev

echo.
echo ----------------------------------------
echo  Frontend : http://localhost:5173
echo ----------------------------------------
echo.
pause
