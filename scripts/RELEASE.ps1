$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $PSScriptRoot 'lib\OperatorX.Common.psm1') -Force
Set-Location $Root
$StatePath=Join-Path $Root 'release\STATE.json'
function Save-State($s){Write-Utf8NoBom -Path $StatePath -Content ((ConvertTo-Json $s -Depth 12)+"`n")}
function Load-State(){if(Test-Path $StatePath){return Get-Content $StatePath -Raw | ConvertFrom-Json};return [pscustomobject]@{schemaVersion=1;preflight=$false;audit=$false;sourceFrozen=$false;gitPushed=$false;buildRunId='';build=$false;ipaDownloaded=$false;upload=$false;metadata=$false;screenshots=$false;privacyChecklist=$false;review=$false}}
function Run-Checked([string]$Exe,[string[]]$Arguments){& $Exe @Arguments;$c=$LASTEXITCODE;if($c -ne 0){throw "$Exe failed (exit $c)"}}
function Trigger-And-Wait([string]$Gh,[string]$Mode,[string]$SourceRun=''){
  $branch=(git branch --show-current).Trim();if(-not $branch){throw 'Branche Git courante introuvable'}
  $sha=(git rev-parse HEAD).Trim();if(-not $sha){throw 'HEAD Git introuvable'}
  $before=[DateTimeOffset]::UtcNow.AddSeconds(-5)
  $args=@('workflow','run','ios-release.yml','--ref',$branch,'-f',"mode=$Mode")
  if($SourceRun){$args+=@('-f',"source_run_id=$SourceRun")}
  Run-Checked $Gh $args
  $id=$null
  for($i=0;$i -lt 30 -and -not $id;$i++){
    Start-Sleep -Seconds 2
    $json=& $Gh run list --workflow ios-release.yml --branch $branch --event workflow_dispatch --limit 20 --json databaseId,createdAt,headSha
    if($LASTEXITCODE -ne 0){throw 'gh run list failed'}
    $runs=$json | ConvertFrom-Json
    $match=$runs | Where-Object {$_.headSha -eq $sha -and [DateTimeOffset]::Parse($_.createdAt) -ge $before} | Sort-Object {[DateTimeOffset]::Parse($_.createdAt)} -Descending | Select-Object -First 1
    if($match){$id=[string]$match.databaseId}
  }
  if(-not $id){throw "Workflow run introuvable pour $Mode / branche=$branch / SHA=$sha"}
  & $Gh run watch $id --exit-status
  if($LASTEXITCODE -ne 0){throw "$Mode workflow FAIL (run $id)"}
  return $id
}
$s=Load-State
if(-not $s.preflight){& .\scripts\PREFLIGHT.ps1;if(-not $?){throw 'PREFLIGHT failed'};$s.preflight=$true;Save-State $s}else{Write-Host 'SKIP PREFLIGHT'}
if(-not $s.audit){& .\scripts\AUDIT.ps1;if(-not $?){throw 'AUDIT failed'};$s.audit=$true;Save-State $s}else{Write-Host 'SKIP AUDIT'}
if(-not $s.sourceFrozen){Run-Checked 'node' @('.\scripts\source-manifest.mjs','.');$s.sourceFrozen=$true;Save-State $s}else{Write-Host 'SKIP SOURCE FREEZE'}
$gh=Get-Gh -ProjectRoot $Root
Ensure-GhAuth -Gh $gh

# Bootstrap a private GitHub repository automatically when this release folder
# was extracted from a ZIP and therefore has no .git directory yet.
if(-not (Test-Path (Join-Path $Root '.git'))){
  Write-Host 'Git repository missing: initializing local repository...' -ForegroundColor Yellow
  Run-Checked 'git' @('init')
  Run-Checked 'git' @('branch','-M','main')
}

# Ensure commits can be created even on a fresh Windows machine.
$gitName=(& git config --get user.name 2>$null)
if(-not $gitName){
  $login=(& $gh api user --jq '.login').Trim()
  if($LASTEXITCODE -ne 0 -or -not $login){throw 'Unable to resolve GitHub login for local git identity.'}
  Run-Checked 'git' @('config','user.name',$login)
  Run-Checked 'git' @('config','user.email',("{0}@users.noreply.github.com" -f $login))
}

# Ensure an origin remote exists. If it does not, create/reuse a private
# repository called ox-invoice-ios in the authenticated GitHub account.
# IMPORTANT: PowerShell 5.1 turns stderr from a failed native command into a
# NativeCommandError when ErrorActionPreference is Stop. A missing repository is
# an expected probe result, so temporarily relax error handling for that probe.
$origin=''
try { $origin=(& git remote get-url origin 2>$null).Trim() } catch { $origin='' }
if(-not $origin){
  $repoName='ox-invoice-ios'
  $login=(& $gh api user --jq '.login').Trim()
  if($LASTEXITCODE -ne 0 -or -not $login){throw 'Unable to resolve authenticated GitHub login.'}
  $repoFull=("{0}/{1}" -f $login,$repoName)

  $savedEap=$ErrorActionPreference
  $ErrorActionPreference='Continue'
  $repoJson=& $gh repo view $repoFull --json nameWithOwner 2>$null
  $repoViewExit=$LASTEXITCODE
  $ErrorActionPreference=$savedEap

  if($repoViewExit -eq 0 -and $repoJson){
    $repoFull=(($repoJson | ConvertFrom-Json).nameWithOwner)
    Write-Host ("Reusing GitHub repository: {0}" -f $repoFull) -ForegroundColor Yellow
    Run-Checked 'git' @('remote','add','origin',("https://github.com/{0}.git" -f $repoFull))
  } else {
    Write-Host ("Creating private GitHub repository: {0}" -f $repoFull) -ForegroundColor Yellow
    Run-Checked $gh @('repo','create',$repoFull,'--private','--source',$Root,'--remote','origin')
  }
}

# Fail before consuming a macOS runner when required repository secrets are absent.
$requiredSecrets=@('APPLE_TEAM_ID','APPLE_CERTIFICATE_BASE64','APPLE_CERTIFICATE_PASSWORD','APPLE_PROVISIONING_PROFILE_BASE64','ASC_KEY_ID','ASC_ISSUER_ID','ASC_API_KEY_BASE64','EXPO_PUBLIC_IAPKIT_API_KEY')
$secretJson=& $gh secret list --json name
if($LASTEXITCODE -ne 0){throw 'Unable to list GitHub Actions secrets for this repository.'}
$secretNames=@(($secretJson | ConvertFrom-Json) | ForEach-Object {[string]$_.name})
$missingSecrets=@($requiredSecrets | Where-Object {$_ -notin $secretNames})
if($missingSecrets.Count -gt 0){throw ('Missing GitHub Actions secrets: ' + ($missingSecrets -join ', '))}
Write-Host 'GitHub release secrets: PASS' -ForegroundColor Green
if(-not $s.gitPushed){
  Run-Checked 'git' @('add','-A')
  & git diff --cached --quiet; $diff=$LASTEXITCODE
  if($diff -eq 1){Run-Checked 'git' @('commit','-m','release: freeze OperatorX source')}
  elseif($diff -ne 0){throw "git diff failed (exit $diff)"}
  $branch=(git branch --show-current).Trim()
  if(-not $branch){$branch='main'}
  Run-Checked 'git' @('push','-u','origin',$branch)
  $s.gitPushed=$true;Save-State $s
}
if(-not $s.build){
  $s.buildRunId=Trigger-And-Wait -Gh $gh -Mode 'build'
  $s.build=$true;Save-State $s
}else{Write-Host "SKIP BUILD run=$($s.buildRunId)"}
if(-not $s.ipaDownloaded){
  $dest=Join-Path $Root 'release\artifacts';New-Item -ItemType Directory -Force -Path $dest|Out-Null
  Run-Checked $gh @('run','download',$s.buildRunId,'-n','ios-ipa','-D',$dest)
  if(-not (Get-ChildItem $dest -Filter '*.ipa' -Recurse -ErrorAction SilentlyContinue)){throw 'IPA non telechargee'}
  $s.ipaDownloaded=$true;Save-State $s
}else{Write-Host 'SKIP IPA DOWNLOAD'}
if(-not $s.upload){
  [void](Trigger-And-Wait -Gh $gh -Mode 'upload_existing' -SourceRun $s.buildRunId)
  $s.upload=$true;Save-State $s
}else{Write-Host 'SKIP UPLOAD'}
if(-not $s.metadata){
  $fr=(Get-Content '.\apple\metadata\fr-FR\description.txt' -Raw -ErrorAction SilentlyContinue).Trim()
  $en=(Get-Content '.\apple\metadata\en-US\description.txt' -Raw -ErrorAction SilentlyContinue).Trim()
  $siteOk=$false
  try {
    $siteResp=Invoke-WebRequest -Uri 'https://operatorx-ox-invoice.vercel.app/en-US/support.html' -Method Head -UseBasicParsing -TimeoutSec 15
    $siteOk=($siteResp.StatusCode -ge 200 -and $siteResp.StatusCode -lt 400)
  } catch { $siteOk=$false }
  if($fr -and $en -and $siteOk){[void](Trigger-And-Wait -Gh $gh -Mode 'metadata');$s.metadata=$true;Save-State $s}
  elseif(-not $siteOk){Write-Warning 'METADATA skipped: legal/support site is not live yet. Build/upload is preserved.'}
  else{Write-Warning 'METADATA skipped: FR/en-US descriptions incomplete. Build/upload is preserved.'}
}else{Write-Host 'SKIP METADATA'}
if(-not $s.screenshots){
  $frShots=@(Get-ChildItem '.\apple\screenshots\fr-FR' -File -ErrorAction SilentlyContinue | Where-Object {$_.Extension -match '^\.(png|jpg|jpeg)$'})
  $enShots=@(Get-ChildItem '.\apple\screenshots\en-US' -File -ErrorAction SilentlyContinue | Where-Object {$_.Extension -match '^\.(png|jpg|jpeg)$'})
  if($frShots.Count -gt 0 -and $enShots.Count -gt 0){[void](Trigger-And-Wait -Gh $gh -Mode 'screenshots');$s.screenshots=$true;Save-State $s}
  else{Write-Warning 'SCREENSHOTS non uploades : FR/en-US manquants (WARNING, build conserve).'}
}else{Write-Host 'SKIP SCREENSHOTS'}
if(-not $s.privacyChecklist){Run-Checked 'node' @('.\scripts\generate-privacy.mjs','.');$s.privacyChecklist=$true;Save-State $s}
if(-not $s.review){
  $reviewText=(Get-Content '.\apple\review\REVIEW_NOTES.md' -Raw -ErrorAction SilentlyContinue)
  if($reviewText -and $reviewText.Trim() -and $reviewText -notmatch 'TODO_REVIEW|A completer|TODO'){
    $s.review=$true;Save-State $s
  } else {
    Write-Warning 'REVIEW NOTES incompletes : a completer avant soumission (WARNING, build conserve).'
  }
}else{Write-Host 'SKIP REVIEW NOTES PREP'}
Write-Host "`nRELEASE AUTOMATISABLE TERMINEE." -ForegroundColor Green
Write-Host 'MANUEL: verifier App Privacy, Review Notes/build selectionne, puis cliquer Envoyer pour verification.' -ForegroundColor Yellow
