@echo off
echo ========================================
echo   Quick Windows Build (if deps installed)
echo ========================================
echo.

echo Building Windows installer...
call npm run build:win
if errorlevel 1 (
    echo ERROR: Build failed. Try running build-windows.bat first
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Opening dist folder...
start explorer dist
pause