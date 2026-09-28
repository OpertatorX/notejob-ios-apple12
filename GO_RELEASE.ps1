param(
  [switch]$UmpPublished,
  [switch]$SkipSite,
  [switch]$SkipSubmit
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "=== NOTEJOB 1.0 - FULL AUTOMATION ===" -ForegroundColor Cyan
if ($UmpPublished) { & .\scripts\FINALIZE_RELEASE_STATE.ps1 -UmpPublished }
if (-not $SkipSite) {
  $f = Get-Content .\factory.app.json -Raw | ConvertFrom-Json
  if (-not $f.website.deployed) { & .\scripts\DEPLOY_SITE.ps1 }
}
$f = Get-Content .\factory.app.json -Raw | ConvertFrom-Json
if (-not $f.eas_project_id) { & .\scripts\CREATE_EAS_PROJECT.ps1 }
& .\scripts\BUILD_AND_UPLOAD.ps1 -SkipSubmit:$SkipSubmit
Write-Host "=== AUTOMATION FINISHED ===" -ForegroundColor Green
Write-Host "App Privacy reste volontairement manuelle, puis arret avant Submit for Review." -ForegroundColor Yellow
