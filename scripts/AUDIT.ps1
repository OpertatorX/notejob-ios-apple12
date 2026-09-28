$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
node .\scripts\audit-app.mjs .
if($LASTEXITCODE -ne 0){throw 'AUDIT hard failure'}
