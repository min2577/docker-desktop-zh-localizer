param(
    [string]$PatchDir = (Join-Path $PSScriptRoot '..\.local'),
    [switch]$Restore
)
$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not ([Security.Principal.WindowsPrincipal]::new($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from an Administrator PowerShell after quitting Docker Desktop.'
}
$patchRoot = [IO.Path]::GetFullPath($PatchDir)
$manifest = Get-Content -LiteralPath (Join-Path $patchRoot 'manifest.json') -Raw | ConvertFrom-Json
$dockerDir = [IO.Path]::GetFullPath($manifest.dockerDir)
$targetExe = Join-Path $dockerDir 'frontend\Docker Desktop.exe'
$targetArchive = Join-Path $dockerDir 'frontend\resources\app.asar'
$stage = 'preflight'
function Assert-Hash([string]$File, [string]$Expected) {
    if ((Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Expected) { throw "Hash mismatch: $File" }
}
try {
    if ((Get-Item -LiteralPath $targetExe).VersionInfo.ProductVersion -ne $manifest.productVersion) { throw 'Docker version changed. Refusing to replace or restore another version.' }
    $currentExe = (Get-FileHash -LiteralPath $targetExe -Algorithm SHA256).Hash.ToLowerInvariant()
    $currentArchive = (Get-FileHash -LiteralPath $targetArchive -Algorithm SHA256).Hash.ToLowerInvariant()
    $original = $currentExe -eq $manifest.originalExeSha256 -and $currentArchive -eq $manifest.originalArchiveSha256
    $patched = $currentExe -eq $manifest.patchedExeSha256 -and $currentArchive -eq $manifest.patchedArchiveSha256
    if (-not ($original -or $patched)) { throw 'Installed files do not match this patch. Refusing to overwrite an unknown modification.' }
    Assert-Hash (Join-Path $patchRoot 'backup\app.asar') $manifest.originalArchiveSha256
    Assert-Hash (Join-Path $patchRoot 'backup\Docker Desktop.exe') $manifest.originalExeSha256
    if (Get-Process -Name 'com.docker.backend','Docker Desktop' -ErrorAction SilentlyContinue) { throw 'Quit Docker Desktop completely first. This script never stops running workloads automatically.' }
    if ($Restore) {
        $sourceExe = Join-Path $patchRoot 'backup\Docker Desktop.exe'
        $sourceArchive = Join-Path $patchRoot 'backup\app.asar'
        $expectedExe = $manifest.originalExeSha256
        $expectedArchive = $manifest.originalArchiveSha256
    } else {
        $sourceExe = Join-Path $patchRoot 'Docker Desktop.zh.exe'
        $sourceArchive = Join-Path $patchRoot 'app-zh.asar'
        $expectedExe = $manifest.patchedExeSha256
        $expectedArchive = $manifest.patchedArchiveSha256
    }
    Assert-Hash $sourceExe $expectedExe
    Assert-Hash $sourceArchive $expectedArchive
    $stage = 'copy'
    Copy-Item -LiteralPath $sourceExe -Destination $targetExe -Force
    Copy-Item -LiteralPath $sourceArchive -Destination $targetArchive -Force
    Assert-Hash $targetExe $expectedExe
    Assert-Hash $targetArchive $expectedArchive
    $stage = 'completed'
    [pscustomobject]@{success=$true;restored=[bool]$Restore;timestamp=(Get-Date -Format o)} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $patchRoot 'install-result.json') -Encoding UTF8
    Write-Output 'Completed. Open Docker Desktop normally. Keep the local backup directory for restoration.'
} catch {
    $message = $_.Exception.Message
    $rolledBack = $false
    if ($stage -eq 'copy') {
        try {
            Copy-Item -LiteralPath (Join-Path $patchRoot 'backup\Docker Desktop.exe') -Destination $targetExe -Force
            Copy-Item -LiteralPath (Join-Path $patchRoot 'backup\app.asar') -Destination $targetArchive -Force
            Assert-Hash $targetExe $manifest.originalExeSha256
            Assert-Hash $targetArchive $manifest.originalArchiveSha256
            $rolledBack = $true
        } catch { $message += ' Rollback failed: ' + $_.Exception.Message }
    }
    [pscustomobject]@{success=$false;rolledBack=$rolledBack;stage=$stage;error=$message} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $patchRoot 'install-result.json') -Encoding UTF8
    throw $message
}
