# Moussa Inventory System - Windows Build Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Moussa Inventory System - Windows Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed. Please install Node.js first:" -ForegroundColor Red
    Write-Host "    https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "[✓] npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] npm is not available" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/4] Installing electron-builder..." -ForegroundColor Yellow
npm install --save-dev electron-builder
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Failed to install electron-builder" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[3/4] Building Windows installer..." -ForegroundColor Yellow
npm run build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Failed to build Windows installer" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[4/4] Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your Windows installer is ready:" -ForegroundColor Cyan
$exeFiles = Get-ChildItem -Path "dist" -Filter "*.exe" | Select-Object -First 1
if ($exeFiles) {
    Write-Host "Location: $($exeFiles.FullName)" -ForegroundColor White
    Write-Host "Size: $([math]::Round($exeFiles.Length/1MB, 2)) MB" -ForegroundColor White
} else {
    Write-Host "Location: dist\" -ForegroundColor White
}

Write-Host ""
Write-Host "Opening dist folder..." -ForegroundColor Yellow
Start-Process explorer "dist"

Write-Host ""
Write-Host "Build completed! Press Enter to exit..." -ForegroundColor Green
Read-Host