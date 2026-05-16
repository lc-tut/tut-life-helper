@echo off

echo ========================================
echo   TUT Life Helper - Startup Script
echo ========================================
echo.

where python > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] python not found.
    echo         Please activate your Anaconda environment first.
    echo         e.g.  conda activate uni_map
    pause
    exit /b 1
)

where npm > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found.
    echo         Please install Node.js.
    pause
    exit /b 1
)

echo [1/2] Starting Backend  (FastAPI  -> http://localhost:8000) ...
start "TUT Backend - FastAPI :8000" cmd /k "cd /d "%~dp0backend" && python app/main.py || pause"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Frontend (Vite     -> http://localhost:5173) ...
start "TUT Frontend - Vite :5173" cmd /k "cd /d "%~dp0frontend" && npm run dev || pause"

echo.
echo ----------------------------------------
echo  Frontend : http://localhost:5173
echo  API      : http://localhost:8000
echo  Swagger  : http://localhost:8000/docs
echo ----------------------------------------
echo.
pause
