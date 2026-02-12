@echo off
REM ===================================================================
REM Climate Disaster Response - Windows Startup Script
REM ===================================================================

echo ========================================
echo Starting Climate Disaster Response
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env
    echo.
    echo [ERROR] Please edit .env file and add your OPENWEATHER_API_KEY
    echo Get it from: https://openweathermap.org/api
    pause
    exit /b 1
)

echo [OK] Environment configured
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo Building and starting services...
echo This may take a few minutes on first run...
echo.

docker-compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo Service URLs:
echo   Frontend:        http://localhost:3001
echo   Backend API:     http://localhost:3000
echo   Pathway Service: http://localhost:8080
echo   MongoDB:         localhost:27017
echo.
echo API Documentation:
echo   Pathway Health:  http://localhost:8080/health
echo   Risk Predictions: http://localhost:8080/api/v1/risk-predictions
echo   Weather Data:    http://localhost:8080/api/v1/weather
echo.
echo Useful Commands:
echo   View logs:       docker-compose logs -f
echo   Stop services:   docker-compose down
echo   Restart:         docker-compose restart
echo.
echo ========================================
echo.
echo Opening frontend in browser...
start http://localhost:3001
echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause >nul

docker-compose logs -f
