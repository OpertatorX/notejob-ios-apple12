$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
& .\scripts\BUILD_AND_UPLOAD.ps1 -SkipSubmit
