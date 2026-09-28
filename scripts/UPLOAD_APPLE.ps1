param([string]$RunId)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $PSScriptRoot 'lib\OperatorX.Common.psm1') -Force
Set-Location $Root
$gh=Get-Gh -ProjectRoot $Root
Ensure-GhAuth -Gh $gh
if(-not $RunId){throw 'RunId du build requis. UPLOAD ne reconstruit jamais.'}
& $gh workflow run ios-release.yml -f mode=upload_existing -f source_run_id=$RunId
if($LASTEXITCODE -ne 0){throw 'Upload workflow trigger failed'}
Write-Host 'Upload declenche sans rebuild.' -ForegroundColor Green
