$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $PSScriptRoot 'lib\OperatorX.Common.psm1') -Force
Set-Location $Root
$gh=Get-Gh -ProjectRoot $Root
Ensure-GhAuth -Gh $gh
node .\scripts\source-manifest.mjs .
if($LASTEXITCODE -ne 0){throw 'SOURCE_MANIFEST failed'}
& $gh workflow run ios-release.yml -f mode=build
if($LASTEXITCODE -ne 0){throw 'Impossible de declencher le build GitHub'}
Write-Host 'Build declenche. RELEASE.ps1 attendra son resultat et telechargera l IPA.' -ForegroundColor Green
