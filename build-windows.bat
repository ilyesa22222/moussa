@echo off
echo ========================================
echo   Moussa Inventory System - Windows Build
echo ========================================
echo.

echo [1/4] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Installing electron-builder...
call npm install --save-dev electron-builder
if errorlevel 1 (
    echo ERROR: Failed to install electron-builder
    pause
    exit /b 1
)

echo.
echo [3/4] Building Windows installer...
call npm run build:win
if errorlevel 1 (
    echo ERROR: Failed to build Windows installer
    pause
    exit /b 1
)

echo.
echo [4/4] Build completed successfully!
echo.
echo Your Windows installer is ready:
echo Location: dist\Moussa Inventory System Setup 1.0.0.exe
echo.
echo Opening dist folder...
start explorer dist
echo.
echo Build completed! Press any key to exit...
pause >nul