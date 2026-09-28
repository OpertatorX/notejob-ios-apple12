$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root=Split-Path -Parent $PSScriptRoot
$Site=Join-Path $Root 'site'
Set-Location $Site
Write-Host 'Deploying OX Invoice legal/support site to Vercel...' -ForegroundColor Cyan
if(Get-Command vercel -ErrorAction SilentlyContinue){
  & vercel --prod --yes
} else {
  & npx --yes vercel@latest --prod --yes
}
if($LASTEXITCODE -ne 0){ throw "Vercel deployment failed ($LASTEXITCODE)" }
Write-Host 'Verify the production alias is https://operatorx-ox-invoice.vercel.app, then run scripts\PUBLISH_READINESS.ps1.' -ForegroundColor Green
