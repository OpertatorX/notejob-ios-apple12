$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw "npx introuvable." }

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

function Strip-Ansi([string]$Text) {
  if ($null -eq $Text) { return "" }
  return [regex]::Replace($Text, "`e\[[0-9;?]*[ -/]*[@-~]", "")
}

$projectName = "operatorx-notejob"
Write-Host "[SITE] Deploy Vercel production..." -ForegroundColor Cyan
$log = Join-Path $env:TEMP "notejob-vercel-deploy.log"
$code = Invoke-NativeLogged -Command "set NO_UPDATE_NOTIFIER=1&& set NO_COLOR=1&& npx --yes vercel@59.23.2 .\site --prod --yes --name $projectName" -LogPath $log
if ($code -ne 0) {
  $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
  if ($txt -match '(?i)login|not authenticated|authorization|token') {
    throw "Vercel authentication required. Run: npx --yes vercel@59.23.2 login ; then rerun GO_RELEASE.ps1"
  }
  throw "Vercel deployment failed with exit code $code. See $log"
}

$raw = Get-Content $log -Raw -ErrorAction Stop
$clean = Strip-Ansi $raw
# Prefer the actual Production URL. Fallback to the last *.vercel.app URL.
$productionLine = ($clean -split "`r?`n" | Where-Object { $_ -match '(?i)Production:' } | Select-Object -Last 1)
$url = $null
if ($productionLine) {
  $m = [regex]::Match($productionLine, 'https://[^\s\]]+\.vercel\.app[^\s\]]*')
  if ($m.Success) { $url = $m.Value }
}
if (-not $url) {
  $matches = [regex]::Matches($clean, 'https://[^\s\]]+\.vercel\.app[^\s\]]*')
  if ($matches.Count -gt 0) { $url = $matches[$matches.Count - 1].Value }
}
if (-not $url) { throw "URL Vercel introuvable dans la sortie. See $log" }
$url = $url.TrimEnd('/',')',']','}',',',';')
Write-Host "[SITE] Deployment: $url" -ForegroundColor Green

# A public legal/app-ads site must not be behind project SSO protection.
# The command is safe to retry; failure is non-blocking because public HTTP verification below is authoritative.
$protLog = Join-Path $env:TEMP "notejob-vercel-protection.log"
$null = Invoke-NativeLogged -Command "set NO_UPDATE_NOTIFIER=1&& set NO_COLOR=1&& npx --yes vercel@59.23.2 project protection disable $projectName --sso" -LogPath $protLog

$expected = 'google.com, pub-9441192520255287, DIRECT, f08c47fec0942fa0'
$headers = Join-Path $env:TEMP "notejob-appads-headers.txt"
$bodyFile = Join-Path $env:TEMP "notejob-appads-body.txt"
if (Test-Path $headers) { Remove-Item $headers -Force }
if (Test-Path $bodyFile) { Remove-Item $bodyFile -Force }

Write-Host "[SITE] Verification publique /app-ads.txt..." -ForegroundColor Cyan
$old = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  $status = & curl.exe -sS -L --max-redirs 5 -D $headers -o $bodyFile -w "%{http_code}" "$url/app-ads.txt"
  $curlCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $old
}
if ($curlCode -ne 0) { throw "Impossible de verifier app-ads.txt publiquement (curl exit $curlCode)." }
$status = ([string]$status).Trim()
$body = if (Test-Path $bodyFile) { (Get-Content $bodyFile -Raw -ErrorAction SilentlyContinue).Trim() } else { "" }
$contentType = ""
if (Test-Path $headers) {
  $ct = Get-Content $headers | Select-String -Pattern '^content-type:' | Select-Object -Last 1
  if ($ct) { $contentType = $ct.Line.Trim() }
}

if ($status -ne '200') {
  throw "app-ads.txt public HTTP=$status. URL=$url/app-ads.txt. Verifiez la protection Vercel ou le routage du projet."
}
if ($body -ne $expected) {
  if ($body -match '(?is)<html|<!doctype|vercel') {
    throw "app-ads.txt renvoie une page HTML au lieu du fichier texte. URL=$url/app-ads.txt ; Content-Type=$contentType. Le script n'affiche plus le HTML complet."
  }
  $preview = $body
  if ($preview.Length -gt 160) { $preview = $preview.Substring(0,160) + '...' }
  throw "app-ads.txt live incorrect. Recu: $preview"
}

& "$PSScriptRoot\FINALIZE_RELEASE_STATE.ps1" -SiteUrl $url -SiteVerified
Write-Host "PASS site public + app-ads.txt live" -ForegroundColor Green
