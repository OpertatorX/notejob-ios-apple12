param(
  [switch]$UmpPublished,
  [string]$SiteUrl = "",
  [switch]$SiteVerified,
  [string]$EasProjectId = "",
  [string]$AppStoreId = ""
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$path = Join-Path (Get-Location) "factory.app.json"
$f = Get-Content $path -Raw | ConvertFrom-Json
if ($UmpPublished) { $f.admob.ump_message_published = $true }
if ($SiteUrl) {
  $u = $SiteUrl.TrimEnd('/')
  $f.website.base_url = $u
  $f.website.domain_control_confirmed = $true
  $env:EXPO_PUBLIC_SITE_URL = $u
}
if ($SiteVerified) { $f.website.deployed = $true; $f.website.app_ads_verified = $true }
if ($EasProjectId) { $f.eas_project_id = $EasProjectId }
if ($AppStoreId) { $f.app_store_id = $AppStoreId }
$f | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
Write-Host "Release state updated." -ForegroundColor Green
