$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$f = Get-Content .\factory.app.json -Raw | ConvertFrom-Json
if ($f.eas_project_id) { Write-Host "EAS already linked: $($f.eas_project_id)" -ForegroundColor Green; exit 0 }

function Invoke-NativeLogged {
  param(
    [Parameter(Mandatory=$true)][string]$Command,
    [Parameter(Mandatory=$true)][string]$LogPath
  )
  if (Test-Path $LogPath) { Remove-Item $LogPath -Force }
  $old = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $env:ComSpec /d /s /c "$Command 2>&1" |
      Tee-Object -FilePath $LogPath |
      ForEach-Object { Write-Host $_ }
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $old
  }
  return [int]$code
}

Write-Host "[EAS] Expo/EAS account..." -ForegroundColor Cyan
$whoLog = Join-Path $env:TEMP "notejob-eas-whoami.log"
$whoCode = Invoke-NativeLogged -Command 'npx --yes eas-cli@latest whoami' -LogPath $whoLog
if ($whoCode -ne 0) {
  throw "Expo/EAS non connecte. Lancez: npx --yes eas-cli@latest login puis relancez GO_RELEASE.ps1"
}

Write-Host "[EAS] Creating/linking @operatorx/notejob..." -ForegroundColor Cyan
$log = Join-Path $env:TEMP "notejob-eas-init.log"
$code = Invoke-NativeLogged -Command 'npx --yes eas-cli@latest init --non-interactive --force' -LogPath $log
if ($code -ne 0) { throw "eas init failed. Verify Expo login/EXPO_TOKEN. See $log" }

$easOut = Get-Content $log -ErrorAction Stop
$text = ($easOut -join "`n")
$uuid = [regex]::Match($text, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}').Value
if (-not $uuid) {
  $infoLog = Join-Path $env:TEMP "notejob-eas-info.log"
  $infoCode = Invoke-NativeLogged -Command 'npx --yes eas-cli@latest project:info --json' -LogPath $infoLog
  if ($infoCode -eq 0) {
    $info = Get-Content $infoLog -Raw
    $uuid = [regex]::Match($info, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}').Value
  }
}
if (-not $uuid) { throw "EAS project created/linked but projectId could not be extracted." }
& "$PSScriptRoot\FINALIZE_RELEASE_STATE.ps1" -EasProjectId $uuid
$env:EAS_PROJECT_ID = $uuid
Write-Host "PASS EAS projectId=$uuid" -ForegroundColor Green
