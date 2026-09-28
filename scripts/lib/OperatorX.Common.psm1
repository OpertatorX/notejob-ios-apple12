Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][AllowEmptyString()][string]$Content
    )
    $full = [System.IO.Path]::GetFullPath($Path)
    $parent = Split-Path -Parent $full
    if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($full, $Content, $utf8)
}

function Get-FactoryRoot {
    param([string]$ScriptDir)
    return (Split-Path -Parent $ScriptDir)
}

function Resolve-AppRoot {
    param(
        [Parameter(Mandatory=$true)][string]$FactoryRoot,
        [string]$AppPath
    )
    if ($AppPath) {
        $candidate = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $AppPath))
        if (Test-Path (Join-Path $candidate 'app.operatorx.json')) { return $candidate }
        throw "app.operatorx.json introuvable dans $candidate"
    }
    $cwd = (Get-Location).Path
    if (Test-Path (Join-Path $cwd 'app.operatorx.json')) { return $cwd }
    throw "Aucune app detectee. Lance ce script depuis une app generee ou utilise -AppPath."
}

function Invoke-Native {
    param(
        [Parameter(Mandatory=$true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments
    )
    & $FilePath @Arguments
    $code = $LASTEXITCODE
    if ($code -ne 0) { throw "$FilePath a echoue (exit $code)." }
}

function Get-Gh {
    param([Parameter(Mandatory=$true)][string]$ProjectRoot)
    $existing = Get-Command gh -ErrorAction SilentlyContinue
    if ($existing) { return $existing.Source }

    $tools = Join-Path $ProjectRoot '.factory-tools\gh'
    New-Item -ItemType Directory -Force -Path $tools | Out-Null
    $reuse = Get-ChildItem $tools -Recurse -Filter 'gh.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
    if ($reuse) { return $reuse.FullName }

    Write-Host "GitHub CLI absent : telechargement portable versionne..." -ForegroundColor Yellow
    $release = Invoke-RestMethod -Headers @{ 'User-Agent'='OperatorX-App-Factory' } -Uri 'https://api.github.com/repos/cli/cli/releases/latest'
    $asset = $release.assets | Where-Object { $_.name -match 'windows_amd64\.zip$' } | Select-Object -First 1
    if (-not $asset) { throw 'Archive GitHub CLI Windows x64 introuvable.' }
    $version = ($release.tag_name -replace '^v','')
    $versionDir = Join-Path $tools $version
    $zip = Join-Path $tools "gh-$version.zip"
    if (-not (Test-Path $zip)) { Invoke-WebRequest -Headers @{ 'User-Agent'='OperatorX-App-Factory' } -Uri $asset.browser_download_url -OutFile $zip }
    if (-not (Test-Path $versionDir)) { Expand-Archive -Path $zip -DestinationPath $versionDir }
    $found = Get-ChildItem $versionDir -Recurse -Filter 'gh.exe' | Select-Object -First 1
    if (-not $found) { throw 'gh.exe introuvable apres extraction.' }
    return $found.FullName
}

function Ensure-GhAuth {
    param([Parameter(Mandatory=$true)][string]$Gh)
    & $Gh auth status --hostname github.com *> $null
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        throw 'GitHub CLI is not authenticated. Run: gh auth login --hostname github.com --git-protocol https (or authenticate gh using your existing token), then rerun GO_LIVE.ps1.'
    }
}
Export-ModuleMember -Function *
