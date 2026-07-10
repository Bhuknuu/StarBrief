<#
.SYNOPSIS
    Production Build Script for StarBrief Dashboard
.DESCRIPTION
    This script prepares the Next.js application for deployment into a production system.
    It enforces clean installations, type checking, linting, and generates a standalone build.
#>

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   StarBrief System Build Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check Dependencies
Write-Host "`n[1/4] Installing / Verifying Dependencies..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}

# 2. Linting
Write-Host "`n[2/4] Running ESLint..." -ForegroundColor Yellow
npm run lint

# 3. Type Checking
Write-Host "`n[3/4] Running Strict Type Check..." -ForegroundColor Yellow
npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    Write-Host "Type checking failed. Please fix TypeScript errors before building." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 4. Production Build
Write-Host "`n[4/4] Generating Standalone Production Build..." -ForegroundColor Yellow
# Using clear to prevent caching issues in some environments
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm run build

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " Build Successful!" -ForegroundColor Green
Write-Host " Output located in: .next/standalone" -ForegroundColor Green
Write-Host " To run the production build locally: node .next/standalone/server.js" -ForegroundColor DarkGray
Write-Host "=========================================" -ForegroundColor Green
