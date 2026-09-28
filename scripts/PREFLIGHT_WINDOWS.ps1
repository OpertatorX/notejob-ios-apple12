$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
function Assert-Ok([string]$Step) { if ($LASTEXITCODE -ne 0) { throw "$Step failed with exit code $LASTEXITCODE" } }
Write-Host "=== NOTEJOB DOSSIER MAITRE PREFLIGHT ===" -ForegroundColor Cyan
Write-Host "[1/6] npm install" -ForegroundColor Cyan
npm install
Assert-Ok "npm install"
Write-Host "[2/6] static release audit" -ForegroundColor Cyan
node .\scripts\preflight.cjs
Assert-Ok "static audit"
Write-Host "[3/6] TypeScript" -ForegroundColor Cyan
npx tsc --noEmit
Assert-Ok "TypeScript"
Write-Host "[4/6] Expo doctor" -ForegroundColor Cyan
npx --yes expo-doctor
Assert-Ok "expo-doctor"
Write-Host "[5/6] iOS bundle smoke export" -ForegroundColor Cyan
$smoke = Join-Path (Get-Location) '.release-smoke-ios'
if (Test-Path $smoke) { Remove-Item $smoke -Recurse -Force }
npx expo export --platform ios --output-dir $smoke --clear
Assert-Ok "Expo iOS export"
Remove-Item $smoke -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[6/6] production config gate" -ForegroundColor Cyan
$env:EXPO_PUBLIC_APP_ENV='production'
$env:EXPO_PUBLIC_ADMOB_TEST_MODE='false'
npx expo config --type public | Out-Null
Assert-Ok "Expo production config"
Write-Host "PREFLIGHT PASS" -ForegroundColor Green
