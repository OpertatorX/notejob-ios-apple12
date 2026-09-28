$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
function Run([string]$Label,[scriptblock]$Block){ Write-Host "`n[$Label]" -ForegroundColor Cyan; & $Block; if($LASTEXITCODE -ne 0){throw "$Label failed ($LASTEXITCODE)"} }
if(-not (Test-Path '.\app.operatorx.json')){throw 'app.operatorx.json missing'}
if(-not (Test-Path '.\package.json')){throw 'package.json missing'}
Run 'JSON VALIDATION' { node -e "const fs=require('fs'),path=require('path');function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git','ios','android'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())w(p);else if(p.endsWith('.json'))JSON.parse(fs.readFileSync(p,'utf8'));}}w('.')" }
if(Test-Path '.\package-lock.json'){ Run 'NPM CI' { npm ci } } else { Run 'NPM INSTALL' { npm install } }
Run 'TYPECHECK' { npm run typecheck }
Run 'EXPO DOCTOR' { npx expo-doctor }
Run 'AUDIT' { node .\scripts\audit-app.mjs . }
Write-Host "`nPREFLIGHT PASS" -ForegroundColor Green
