param([switch]$StoreSubmission)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$hard = New-Object System.Collections.Generic.List[string]
$warn = New-Object System.Collections.Generic.List[string]
function Pass([string]$m){ Write-Host "PASS  $m" -ForegroundColor Green }
function Hard([string]$m){ $hard.Add($m); Write-Host "BLOCK $m" -ForegroundColor Red }
function Warn([string]$m){ $warn.Add($m); Write-Host "WARN  $m" -ForegroundColor Yellow }
function Get-EnvValue([string]$name){
  $item = Get-Item ("Env:" + $name) -ErrorAction SilentlyContinue
  if($null -eq $item){ return '' }
  return [string]$item.Value
}
function Test-HttpOk([string]$url){
  try {
    $r = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 15
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400)
  } catch {
    try {
      $r = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 15
      return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400)
    } catch { return $false }
  }
}

Write-Host "`n=== OX INVOICE PUBLISH READINESS ===`n" -ForegroundColor Cyan

& node .\scripts\audit-ox-invoice.mjs
if($LASTEXITCODE -ne 0){ Hard 'Product audit failed' } else { Pass '42-point product audit' }
& node .\tests\run-core-tests.mjs
if($LASTEXITCODE -ne 0){ Hard 'Core tests failed' } else { Pass 'Core logic/PDF tests' }

# Freeze exactly what is on disk now (including package-lock and restored MASTER iOS scripts)
# before the Factory integrity audit. This removes stale-manifest false failures while
# keeping GitHub CI verification strict after the freeze.
& node .\scripts\source-manifest.mjs .
if($LASTEXITCODE -ne 0){ Hard 'Source freeze failed' } else { Pass 'Source manifest refreshed' }
& node .\scripts\audit-app.mjs .
if($LASTEXITCODE -ne 0){ Hard 'Factory audit has hard failures' } else { Pass 'Factory audit has no hard failures' }

if(Test-Path .\package-lock.json){ Pass 'package-lock.json present' }
else { Hard 'package-lock.json missing. Run npm install once on the release machine, then re-run readiness.' }

$cfg = Get-Content .\app.operatorx.json -Raw | ConvertFrom-Json
if($cfg.bundleId -eq 'com.operatorx.oxinvoice'){ Pass 'Bundle ID locked' } else { Hard "Unexpected bundle ID: $($cfg.bundleId)" }
if($cfg.version -eq '1.0' -and [string]$cfg.build -eq '1'){ Pass 'Version/build 1.0 (1)' } else { Warn "Current version/build: $($cfg.version) ($($cfg.build))" }

$key = Get-EnvValue 'EXPO_PUBLIC_IAPKIT_API_KEY'
if($key -and $key.StartsWith('openiap-kit_pk_')){ Pass 'IAPKit publishable key loaded in this shell' }
else { Warn 'EXPO_PUBLIC_IAPKIT_API_KEY not loaded locally. GitHub Actions secret is authoritative and the production build will fail safely if it is missing.' }

$requiredEnv = @('ASC_KEY_ID','ASC_ISSUER_ID','ASC_API_KEY_BASE64')
foreach($name in $requiredEnv){
  $value = Get-EnvValue $name
  if(-not [string]::IsNullOrWhiteSpace($value)){ Pass "$name present" }
  else { Warn "$name not present in this local shell (acceptable if configured as GitHub Actions secret)" }
}

$siteUrls=@(
  'https://operatorx-ox-invoice.vercel.app',
  'https://operatorx-ox-invoice.vercel.app/en-US/privacy.html',
  'https://operatorx-ox-invoice.vercel.app/en-US/terms.html',
  'https://operatorx-ox-invoice.vercel.app/en-US/support.html',
  'https://operatorx-ox-invoice.vercel.app/fr-FR/privacy.html',
  'https://operatorx-ox-invoice.vercel.app/fr-FR/terms.html',
  'https://operatorx-ox-invoice.vercel.app/fr-FR/support.html'
)
foreach($url in $siteUrls){
  if(Test-HttpOk $url){ Pass "Site $url" }
  elseif($StoreSubmission){ Hard "Site unreachable: $url" }
  else { Warn "Site not live yet: $url (does not block binary build/upload)" }
}

foreach($locale in @('en-US','fr-FR')){
  $dir=Join-Path $Root "apple\screenshots\$locale"
  $shots=@(Get-ChildItem $dir -File -ErrorAction SilentlyContinue | Where-Object {$_.Extension -match '^\.(png|jpg|jpeg)$'})
  if($shots.Count -gt 0){ Pass "$locale screenshots: $($shots.Count)" }
  elseif($StoreSubmission){ Hard "$locale native App Store screenshots missing" }
  else { Warn "$locale native App Store screenshots missing (capture from final build before review)" }
}

if([string]::IsNullOrWhiteSpace([string]$cfg.apple.appStoreId)){ Warn 'App Store ID not recorded yet; create/confirm the App Store Connect app record.' }
else { Pass "App Store ID: $($cfg.apple.appStoreId)" }

if($hard.Count -eq 0){
  if($StoreSubmission){ Write-Host "`nSTORE SUBMISSION READINESS: PASS" -ForegroundColor Green }
  else { Write-Host "`nBINARY RELEASE READINESS: PASS" -ForegroundColor Green }
  if($warn.Count){ Write-Host "Warnings: $($warn.Count)" -ForegroundColor Yellow }
  exit 0
}
if($StoreSubmission){ Write-Host "`nSTORE SUBMISSION READINESS: BLOCKED ($($hard.Count) blocker(s))" -ForegroundColor Red }
else { Write-Host "`nBINARY RELEASE READINESS: BLOCKED ($($hard.Count) blocker(s))" -ForegroundColor Red }
$hard | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
exit 2
