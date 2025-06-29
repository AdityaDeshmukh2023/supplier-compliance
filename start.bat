@echo off
echo Starting Supplier Compliance Monitor...

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed or not running. Please install Docker Desktop.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo docker-compose is not available. Using docker compose instead.
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)

echo Building and starting services...
%COMPOSE_CMD% up --build -d

echo.
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo Services are starting up...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo To stop the services, run: %COMPOSE_CMD% down
echo To view logs, run: %COMPOSE_CMD% logs -f
echo.

REM Try to open the frontend in default browser
start http://localhost:3000

pause
