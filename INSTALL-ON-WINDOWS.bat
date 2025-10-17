@echo off
title Moussa Inventory System - Windows Builder
color 0A
echo.
echo ===============================================
echo    MOUSSA INVENTORY SYSTEM - WINDOWS BUILDER
echo ===============================================
echo.
echo This will build and install the app on THIS computer
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo After installation, restart this script.
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Install dependencies
echo.
echo [2/6] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Install electron and electron-builder locally
echo.
echo [3/6] Installing build tools...
call npm install electron electron-builder --save-dev
if errorlevel 1 (
    echo [ERROR] Failed to install build tools
    pause
    exit /b 1
)

REM Clean previous builds
echo.
echo [4/6] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Build for current Windows architecture
echo.
echo [5/6] Building Windows installer...
echo This may take 5-10 minutes...
call npx electron-builder --win --publish=never
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

REM Find and run the installer
echo.
echo [6/6] Installing application...
for %%f in (dist\*.exe) do (
    echo Found installer: %%f
    echo Running installer...
    start "" "%%f"
    echo.
    echo Installer is running!
    echo Follow the installation wizard to complete setup.
    echo.
    echo The installer will:
    echo - Install Moussa Inventory System
    echo - Create desktop shortcut
    echo - Add to Start Menu
    echo.
    goto :end
)

echo [ERROR] No installer found in dist folder
pause
exit /b 1

:end
echo.
echo ===============================================
echo    BUILD AND INSTALL COMPLETED SUCCESSFULLY!
echo ===============================================
echo.
echo The installer is now running.
echo After installation, you can find the app in:
echo - Desktop shortcut
echo - Start Menu ^> Moussa Inventory System
echo.
echo Press any key to exit...
pause >nul