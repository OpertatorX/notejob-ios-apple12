$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'

function Step([string]$Text) {
    Write-Host ""
    Write-Host ("=== {0} ===" -f $Text) -ForegroundColor Cyan
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot
$RepoName = 'notejob-ios-apple12'
$WorkflowFile = 'ios-free-build.yml'
$ArtifactName = 'NoteJob-IPA-BUILD6'
$AppStoreId = '6814423903'

Write-Host ""
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' NOTEJOB 1.0.0 (6) - METHODE BLINK' -ForegroundColor Cyan
Write-Host ' GitHub macOS + Xcode 26.4.1 + EAS --local' -ForegroundColor Green
Write-Host ' AUCUN QUOTA EAS BUILD CLOUD' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan

foreach ($f in @('.\package.json','.\app.config.js','.\app.operatorx.json','.\eas.json',(".\.github\workflows\{0}" -f $WorkflowFile))) {
    if (-not (Test-Path $f)) { throw ("Fichier manquant: {0}" -f $f) }
}
if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) { throw 'Git for Windows introuvable.' }

Step 'GitHub CLI portable'
$GhCommand = Get-Command gh.exe -ErrorAction SilentlyContinue
if ($GhCommand) {
    $Gh = $GhCommand.Source
} else {
    $ToolsDir = Join-Path $ProjectRoot '.tools'
    New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
    $ExistingGh = Get-ChildItem $ToolsDir -Recurse -File -Filter 'gh.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ExistingGh) {
        $Gh = $ExistingGh.FullName
    } else {
        Write-Host 'Telechargement automatique de GitHub CLI...'
        $Headers = @{ 'User-Agent'='OperatorX-NoteJob-BLINK' }
        $Release = Invoke-RestMethod -Headers $Headers -Uri 'https://api.github.com/repos/cli/cli/releases/latest'
        $Asset = $Release.assets | Where-Object { $_.name -match 'windows_amd64\.zip$' } | Select-Object -First 1
        if (-not $Asset) { throw 'Archive GitHub CLI Windows x64 introuvable.' }
        $GhZip = Join-Path $env:TEMP 'notejob-gh-cli.zip'
        $GhExtract = Join-Path $ToolsDir 'gh'
        Invoke-WebRequest -Headers $Headers -Uri $Asset.browser_download_url -OutFile $GhZip
        if (Test-Path $GhExtract) { cmd.exe /d /c "rd /s /q `"$GhExtract`"" | Out-Null }
        Expand-Archive -Path $GhZip -DestinationPath $GhExtract -Force
        $Found = Get-ChildItem $GhExtract -Recurse -File -Filter 'gh.exe' | Select-Object -First 1
        if (-not $Found) { throw 'gh.exe introuvable apres extraction.' }
        $Gh = $Found.FullName
    }
}
& $Gh --version | Select-Object -First 1

Step 'Connexion GitHub'
$OldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $Gh auth status --hostname github.com 1>$null 2>$null
$GhAuthenticated = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $OldPreference
if (-not $GhAuthenticated) {
    & $Gh auth login --hostname github.com --web --git-protocol https
    if ($LASTEXITCODE -ne 0) { throw 'Connexion GitHub echouee.' }
}
$Owner = ((& $Gh api user --jq '.login') | Out-String).Trim()
$UserId = ((& $Gh api user --jq '.id') | Out-String).Trim()
if (-not $Owner) { throw 'Compte GitHub introuvable.' }
$FullRepo = "{0}/{1}" -f $Owner,$RepoName
Write-Host ("GitHub: {0}" -f $FullRepo) -ForegroundColor Green

Step 'Token Expo pour le build local'
$SecretNames = @()
$OldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$SecretNames = @(& $Gh secret list --repo $FullRepo --json name --jq '.[].name' 2>$null)
$SecretListWorked = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $OldPreference

$ExpoToken = [string]$env:EXPO_TOKEN
if ([string]::IsNullOrWhiteSpace($ExpoToken)) {
    if (-not $SecretListWorked -or $SecretNames -notcontains 'EXPO_TOKEN') {
        Write-Host 'Le meme token Expo que BLINK est necessaire une seule fois pour ce repo.' -ForegroundColor Yellow
        Start-Process 'https://expo.dev/settings/access-tokens'
        $Secure = Read-Host 'Colle ton EXPO_TOKEN' -AsSecureString
        $Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
        try { $ExpoToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr) }
        finally { if ($Ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr) } }
    }
}
if (-not [string]::IsNullOrWhiteSpace($ExpoToken)) { $env:EXPO_TOKEN = $ExpoToken }

Step 'Liaison au projet EAS NoteJob existant'
$App = Get-Content '.\app.operatorx.json' -Raw | ConvertFrom-Json
$ProjectId = ''
if ($App.eas -and $App.eas.projectId) { $ProjectId = [string]$App.eas.projectId }

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    # The GitHub runner uses the existing EXPO_TOKEN secret. Locally, reuse the
    # authenticated EAS session instead of incorrectly requiring EXPO_TOKEN in Windows.
    $OldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & npx.cmd --yes eas-cli@latest whoami 1>$null 2>$null
    $EasLoggedIn = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $OldPreference
    if (-not $EasLoggedIn) { throw 'Session Expo locale absente. Lance: npx eas-cli@latest login' }

    $Dynamic = Join-Path $ProjectRoot 'app.config.js'
    $Backup = Join-Path $ProjectRoot 'app.config.js.notejob-blink-backup'
    $Static = Join-Path $ProjectRoot 'app.json'
    if (Test-Path $Backup) { Remove-Item $Backup -Force }
    if (Test-Path $Static) { Remove-Item $Static -Force }
    Move-Item $Dynamic $Backup -Force
    try {
        $Minimal = @{
            expo = @{
                name = 'NoteJob'; slug = 'notejob'; owner = 'operatorx'; version = '1.0.0';
                ios = @{ bundleIdentifier = 'com.operatorx.notejob'; buildNumber = '6'; supportsTablet = $true }
            }
        } | ConvertTo-Json -Depth 10
        [IO.File]::WriteAllText($Static,$Minimal,[Text.UTF8Encoding]::new($false))

        $Stdout = Join-Path $env:TEMP 'notejob-eas-init-out.json'
        $Stderr = Join-Path $env:TEMP 'notejob-eas-init-err.txt'
        Remove-Item $Stdout,$Stderr -Force -ErrorAction SilentlyContinue
        $P = Start-Process -FilePath 'npx.cmd' -ArgumentList @('--yes','eas-cli@latest','init','--account','operatorx','--json','--non-interactive','--no-icon') -WorkingDirectory $ProjectRoot -RedirectStandardOutput $Stdout -RedirectStandardError $Stderr -Wait -PassThru -NoNewWindow
        $Out = if (Test-Path $Stdout) { [IO.File]::ReadAllText($Stdout) } else { '' }
        $Err = if (Test-Path $Stderr) { [IO.File]::ReadAllText($Stderr) } else { '' }
        if ($P.ExitCode -ne 0) { Write-Host $Err -ForegroundColor Yellow; throw 'EAS init NoteJob a echoue.' }
        $Init = $Out | ConvertFrom-Json
        if ([string]$Init.owner -ne 'operatorx' -or [string]$Init.slug -ne 'notejob') { throw 'EAS a retourne un autre projet.' }
        $ProjectId = [string]$Init.projectId
        if ([string]::IsNullOrWhiteSpace($ProjectId)) { throw 'projectId NoteJob introuvable.' }
    }
    finally {
        Remove-Item $Static -Force -ErrorAction SilentlyContinue
        if (Test-Path $Backup) { Move-Item $Backup $Dynamic -Force }
    }

    $App = Get-Content '.\app.operatorx.json' -Raw | ConvertFrom-Json
    if (-not $App.eas) { $App | Add-Member -NotePropertyName eas -NotePropertyValue ([pscustomobject]@{}) -Force }
    $App.eas | Add-Member -NotePropertyName owner -NotePropertyValue 'operatorx' -Force
    $App.eas | Add-Member -NotePropertyName slug -NotePropertyValue 'notejob' -Force
    $App.eas | Add-Member -NotePropertyName projectId -NotePropertyValue $ProjectId -Force
    [IO.File]::WriteAllText((Resolve-Path '.\app.operatorx.json'),(($App | ConvertTo-Json -Depth 30)+"`n"),[Text.UTF8Encoding]::new($false))
    $Factory = Get-Content '.\factory.app.json' -Raw | ConvertFrom-Json
    $Factory.eas_project_id = $ProjectId
    [IO.File]::WriteAllText((Resolve-Path '.\factory.app.json'),(($Factory | ConvertTo-Json -Depth 30)+"`n"),[Text.UTF8Encoding]::new($false))
}
$env:EAS_PROJECT_ID = $ProjectId
Write-Host ("EAS: @operatorx/notejob - {0}" -f $ProjectId) -ForegroundColor Green

Step 'Verification NoteJob avant build'
& node .\scripts\blink-method-preflight.cjs
if ($LASTEXITCODE -ne 0) { throw 'Preflight methode BLINK echoue.' }

Step 'Preparation Git comme BLINK'
if (-not (Test-Path '.git')) { & git init | Out-Null }
& git config user.name $Owner
& git config user.email ("{0}+{1}@users.noreply.github.com" -f $UserId,$Owner)
& git branch -M main

$GitIgnore = '.\.gitignore'
if (-not (Test-Path $GitIgnore)) { New-Item $GitIgnore -ItemType File | Out-Null }
$Ignore = @(Get-Content $GitIgnore -ErrorAction SilentlyContinue)
foreach ($Line in @('node_modules/','.expo/','artifacts/','.tools/','*.ipa','app.config.js.notejob-blink-backup')) {
    if ($Ignore -notcontains $Line) { Add-Content $GitIgnore $Line }
}

& git add -A
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    & git commit -m 'NoteJob 1.0.0 build 6 - final icon - Apple 1.2 - BLINK free iOS method' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'git commit echoue.' }
}

$OldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $Gh repo view $FullRepo --json name 1>$null 2>$null
$RepoExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $OldPreference

if (-not $RepoExists) {
    Write-Host 'Creation du repo GitHub prive...'
    & $Gh repo create $FullRepo --private --source '.' --remote origin --push
    if ($LASTEXITCODE -ne 0) { throw 'Creation/push repo GitHub echouee.' }
} else {
    $RemoteNames = @(& git remote)
    if ($RemoteNames -notcontains 'origin') { & git remote add origin ("https://github.com/{0}.git" -f $FullRepo) }
    else { & git remote set-url origin ("https://github.com/{0}.git" -f $FullRepo) }
    if ($LASTEXITCODE -ne 0) { throw 'Configuration origin echouee.' }
    & git push -u origin main --force
    if ($LASTEXITCODE -ne 0) { throw 'Push GitHub echoue.' }
}

if (-not [string]::IsNullOrWhiteSpace([string]$env:EXPO_TOKEN)) {
    $env:EXPO_TOKEN | & $Gh secret set EXPO_TOKEN --repo $FullRepo
    if ($LASTEXITCODE -ne 0) { throw 'Impossible d enregistrer EXPO_TOKEN.' }
} else {
    $SecretNames = @(& $Gh secret list --repo $FullRepo --json name --jq '.[].name')
    if ($SecretNames -notcontains 'EXPO_TOKEN') { throw 'EXPO_TOKEN absent du repo GitHub.' }
}
Write-Host 'Repo + EXPO_TOKEN: OK' -ForegroundColor Green

Step 'Build iOS gratuit sur Mac GitHub'
& $Gh workflow run $WorkflowFile --repo $FullRepo --ref main
if ($LASTEXITCODE -ne 0) { throw 'Lancement workflow GitHub echoue.' }
Start-Sleep -Seconds 6
$RunJson = & $Gh run list --repo $FullRepo --workflow $WorkflowFile --limit 1 --json databaseId,status,conclusion,url
$Runs = @($RunJson | ConvertFrom-Json)
if (-not $Runs -or $Runs.Count -lt 1) { throw 'Run GitHub introuvable.' }
$Run = $Runs[0]
$RunId = [string]$Run.databaseId
Write-Host ("Build: {0}" -f $Run.url) -ForegroundColor Cyan
# Ne pas confondre une coupure locale de `gh run watch` avec un echec du build.
while ($true) {
    $OldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $StateJson = & $Gh run view $RunId --repo $FullRepo --json status,conclusion,url 2>$null
    $ViewExit = $LASTEXITCODE
    $ErrorActionPreference = $OldPreference
    if ($ViewExit -ne 0 -or [string]::IsNullOrWhiteSpace([string]$StateJson)) {
        Write-Host 'Connexion GitHub temporairement indisponible; nouvelle verification dans 15 s...' -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        continue
    }
    $State = $StateJson | ConvertFrom-Json
    if ([string]$State.status -eq 'completed') {
        if ([string]$State.conclusion -ne 'success') {
            & $Gh run view $RunId --repo $FullRepo --log-failed
            throw ("Build iOS termine avec: {0}" -f $State.conclusion)
        }
        break
    }
    Write-Host ("GitHub: {0} - verification dans 15 s" -f $State.status) -ForegroundColor DarkGray
    Start-Sleep -Seconds 15
}
Write-Host 'Build GitHub: SUCCESS' -ForegroundColor Green

Step 'Telechargement IPA'
$OutDir = Join-Path $ProjectRoot 'artifacts'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$DownloadDir = Join-Path $OutDir ("run-{0}" -f $RunId)
New-Item -ItemType Directory -Force -Path $DownloadDir | Out-Null
& $Gh run download $RunId --repo $FullRepo --name $ArtifactName --dir $DownloadDir
if ($LASTEXITCODE -ne 0) { throw 'Telechargement IPA echoue.' }
$IPA = Get-ChildItem $DownloadDir -Recurse -File -Filter '*.ipa' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $IPA) { throw 'IPA introuvable.' }
Write-Host ("IPA: {0}" -f $IPA.FullName) -ForegroundColor Green

Step 'Dependances locales pour EAS Submit'
if (-not (Test-Path '.\node_modules\react-native-google-mobile-ads\package.json')) {
    & npm.cmd install --no-audit --no-fund --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { throw 'Installation npm locale echouee avant submit.' }
}
if (-not (Test-Path '.\node_modules\react-native-google-mobile-ads\package.json')) {
    throw 'react-native-google-mobile-ads absent apres npm install.'
}

Step 'Envoi App Store Connect comme BLINK'
$OldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& npx.cmd --yes eas-cli@latest submit --platform ios --profile production --path $IPA.FullName --non-interactive
$SubmitExit = $LASTEXITCODE
$ErrorActionPreference = $OldPreference
if ($SubmitExit -ne 0) {
    Write-Host 'Envoi non-interactif impossible. Passage au meme submit interactif sans reconstruire.' -ForegroundColor Yellow
    & npx.cmd --yes eas-cli@latest submit --platform ios --profile production --path $IPA.FullName
    if ($LASTEXITCODE -ne 0) { throw 'IPA construite, mais upload Apple echoue.' }
}

Write-Host ""
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' NOTEJOB 1.0.0 (6) TERMINE' -ForegroundColor Green
Write-Host ' IPA CONSTRUITE SUR GITHUB ET ENVOYEE A APP STORE CONNECT' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host ("IPA: {0}" -f $IPA.FullName) -ForegroundColor Cyan
Write-Host ("App Store Connect ID: {0}" -f $AppStoreId) -ForegroundColor Cyan
Write-Host 'Ensuite: selectionne le build 6, mets age 18+, colle les Review Notes Apple 1.2 et resoumets.' -ForegroundColor Yellow
