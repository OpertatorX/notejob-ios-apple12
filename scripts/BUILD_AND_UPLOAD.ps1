param([switch]$SkipSubmit)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Invoke-NativeLive {
  param([Parameter(Mandatory=$true)][string]$Command)
  $old = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $env:ComSpec /d /s /c "$Command 2>&1" | ForEach-Object { Write-Host $_ }
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $old
  }
  return [int]$code
}

& "$PSScriptRoot\PREFLIGHT_WINDOWS.ps1"
if ($LASTEXITCODE -ne 0) { throw "Preflight failed." }
$f = Get-Content .\factory.app.json -Raw | ConvertFrom-Json
if (-not $f.eas_project_id) { & "$PSScriptRoot\CREATE_EAS_PROJECT.ps1"; $f = Get-Content .\factory.app.json -Raw | ConvertFrom-Json }
$env:EAS_PROJECT_ID = $f.eas_project_id
$env:EAS_NO_VCS = '1'
Write-Host "[BUILD] EAS iOS production" -ForegroundColor Cyan
$buildCode = Invoke-NativeLive -Command 'npx --yes eas-cli@latest build --platform ios --profile production --non-interactive'
if ($buildCode -ne 0) { throw "EAS build failed with exit code $buildCode." }
if (-not $SkipSubmit -and $f.app_store_id) {
  Write-Host "[UPLOAD] App Store Connect/TestFlight" -ForegroundColor Cyan
  $env:ASC_APP_ID = $f.app_store_id
  $submitCode = Invoke-NativeLive -Command 'npx --yes eas-cli@latest submit --platform ios --profile production --latest --non-interactive'
  if ($submitCode -ne 0) { throw "EAS submit failed with exit code $submitCode." }
} elseif (-not $SkipSubmit) {
  Write-Host "Build termine. Upload auto ignore: app_store_id absent dans factory.app.json." -ForegroundColor Yellow
}
