$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root
function Run([string]$Label,[scriptblock]$Block){Write-Host "`n[$Label]" -ForegroundColor Cyan;& $Block;if($LASTEXITCODE -ne 0){throw "$Label failed ($LASTEXITCODE)"}}
if(Test-Path '.\package-lock.json'){Run 'NPM CI' {npm ci}}else{Run 'NPM INSTALL' {npm install}}
Run 'TYPECHECK' {npm run typecheck}
Run 'CORE TESTS' {npm run test:logic}
Run 'OX INVOICE AUDIT' {npm run audit:oxinvoice}
Run 'EXPO DOCTOR' {npx expo-doctor}
Write-Host "`nOX INVOICE QA PASS" -ForegroundColor Green
Write-Host 'Production IAP purchase flow still requires a physical iPhone and configured App Store products/IAPKit key.' -ForegroundColor Yellow
