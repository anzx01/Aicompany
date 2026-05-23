@echo off
REM AI Company Builder - Docker Startup Script (Windows)
REM This script helps you build and run the application using Docker

echo.
echo ========================================
echo AI Company Builder - Docker Setup
echo ========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [ERROR] .env.local file not found!
    echo Please create .env.local with your environment variables.
    echo.
    echo Required variables:
    echo   - NEXT_PUBLIC_SUPABASE_URL
    echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo   - DATABASE_URL
    pause
    exit /b 1
)

echo [OK] Environment file found
echo.

:menu
echo Choose an option:
echo 1) Build and start with docker-compose (recommended)
echo 2) Build and start with Docker only
echo 3) Build image only
echo 4) Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto compose
if "%choice%"=="2" goto docker
if "%choice%"=="3" goto build
if "%choice%"=="4" goto end
echo [ERROR] Invalid choice
goto menu

:build
echo.
echo Building Docker image...
docker build -t ai-company-builder:latest .
if errorlevel 1 (
    echo [ERROR] Docker build failed
    pause
    exit /b 1
)
echo [OK] Docker image built successfully
echo.
if "%choice%"=="3" goto end
goto :eof

:compose
call :build
echo.
echo Starting application with docker-compose...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start with docker-compose
    pause
    exit /b 1
)
echo.
echo [OK] Application started!
echo.
echo Access the application at: http://localhost:3000
echo.
echo View logs with: docker-compose logs -f
echo Stop with: docker-compose down
echo.
pause
goto end

:docker
call :build
echo.
echo Starting application with Docker...
docker run -d --name ai-company-builder -p 3000:3000 --env-file .env.local ai-company-builder:latest
if errorlevel 1 (
    echo [ERROR] Failed to start Docker container
    pause
    exit /b 1
)
echo.
echo [OK] Application started!
echo.
echo Access the application at: http://localhost:3000
echo.
echo View logs with: docker logs -f ai-company-builder
echo Stop with: docker stop ai-company-builder ^&^& docker rm ai-company-builder
echo.
pause
goto end

:end
echo.
echo Goodbye!
exit /b 0
