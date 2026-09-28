$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
Set-Location $PSScriptRoot

Write-Host "`nOX INVOICE - GO LIVE - BLINK METHOD" -ForegroundColor Cyan
Write-Host 'No manual .p12, provisioning profile, ASC key files, or EXPO_TOKEN entry is requested.' -ForegroundColor Green
Write-Host 'Existing BLINK/NoteJob GitHub EXPO_TOKEN is reused automatically.' -ForegroundColor Green

if(-not (Test-Path .\package-lock.json)){
  Write-Host "`nCreating package-lock.json for reproducible CI..." -ForegroundColor Cyan
  npm install --package-lock-only --ignore-scripts --no-audit --no-fund
  if($LASTEXITCODE -ne 0){ throw 'Unable to create package-lock.json' }
}

PowerShell -ExecutionPolicy Bypass -File .\FINAL_QA_WINDOWS.ps1
if($LASTEXITCODE -ne 0){ throw 'FINAL QA failed' }

PowerShell -ExecutionPolicy Bypass -File .\START_BLINK_IOS_RELEASE.ps1
if($LASTEXITCODE -ne 0){ throw 'BLINK-method iOS release failed' }
