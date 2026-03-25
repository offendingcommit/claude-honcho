# Install the local plugin source into Claude Code's plugin cache.
# Run from anywhere -- paths are absolute.
# After running, restart Claude Code to pick up changes.
#
# Usage:  powershell -ExecutionPolicy Bypass -File install-local.ps1

$ErrorActionPreference = "Stop"

$PluginDir = (Resolve-Path "$PSScriptRoot\..").Path
$CacheBase = Join-Path $env:USERPROFILE ".claude\plugins\cache\honcho\honcho"
$MarketplaceDir = Join-Path $env:USERPROFILE ".claude\plugins\marketplaces\honcho\plugins\honcho"
$InstalledJson = Join-Path $env:USERPROFILE ".claude\plugins\installed_plugins.json"

# ---------------------------------------------------------------------------
# Verify bun is available
# ---------------------------------------------------------------------------
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: bun is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Install it from https://bun.sh/docs/installation" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# Read version from package.json
# ---------------------------------------------------------------------------
$PkgJson = Get-Content (Join-Path $PluginDir "package.json") -Raw | ConvertFrom-Json
$Version = $PkgJson.version

# ---------------------------------------------------------------------------
# Determine cache target -- match installed version if present
# ---------------------------------------------------------------------------
$InstalledVersion = ""
if (Test-Path $InstalledJson) {
    $Installed = Get-Content $InstalledJson -Raw | ConvertFrom-Json
    $Entries = $Installed.plugins.'honcho@honcho'
    if ($Entries -and $Entries.Count -gt 0) {
        $InstalledVersion = $Entries[0].version
    }
}

if ($InstalledVersion) {
    $CacheDir = Join-Path $CacheBase $InstalledVersion
} else {
    $CacheDir = Join-Path $CacheBase $Version
}

Write-Host ""
Write-Host "  plugin source:  $PluginDir"
Write-Host "  cache target:   $CacheDir"
Write-Host "  version:        $Version"
Write-Host ""

# ---------------------------------------------------------------------------
# Ensure dependencies are installed
# ---------------------------------------------------------------------------
if (-not (Test-Path (Join-Path $PluginDir "node_modules"))) {
    Write-Host "  installing dependencies..."
    Push-Location $PluginDir
    bun install --frozen-lockfile
    Pop-Location
    Write-Host ""
}

# ---------------------------------------------------------------------------
# Sync files to cache (mirrors rsync --delete, excluding dev artifacts)
# ---------------------------------------------------------------------------
$Excludes = @(".git", "scripts", ".DS_Store")

if (Test-Path $CacheDir) {
    Remove-Item $CacheDir -Recurse -Force
}
New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null

# Copy everything, then remove excluded dirs
Copy-Item "$PluginDir\*" $CacheDir -Recurse -Force

foreach ($ex in $Excludes) {
    $target = Join-Path $CacheDir $ex
    if (Test-Path $target) {
        Remove-Item $target -Recurse -Force
    }
}

# ---------------------------------------------------------------------------
# Sync skills + plugin manifest to marketplace (if marketplace dir exists)
# ---------------------------------------------------------------------------
if (Test-Path $MarketplaceDir) {
    Write-Host "  syncing marketplace skills..."

    $SkillsDest = Join-Path $MarketplaceDir "skills"
    if (Test-Path $SkillsDest) { Remove-Item $SkillsDest -Recurse -Force }
    Copy-Item (Join-Path $PluginDir "skills") $SkillsDest -Recurse -Force

    $ManifestSrc = Join-Path $PluginDir ".claude-plugin"
    $ManifestDest = Join-Path $MarketplaceDir ".claude-plugin"
    Copy-Item "$ManifestSrc\*" $ManifestDest -Force
}

# ---------------------------------------------------------------------------
# Update installed_plugins.json if version changed
# ---------------------------------------------------------------------------
if ((Test-Path $InstalledJson) -and $InstalledVersion -and ($InstalledVersion -ne $Version)) {
    Write-Host "  updating installed_plugins.json ($InstalledVersion -> $Version)"

    $NewCache = Join-Path $CacheBase $Version
    if ($CacheDir -ne $NewCache) {
        Rename-Item $CacheDir $NewCache
        $CacheDir = $NewCache
    }

    $Installed = Get-Content $InstalledJson -Raw | ConvertFrom-Json
    $Entry = $Installed.plugins.'honcho@honcho'[0]
    $Entry.version = $Version
    $Entry.installPath = $CacheDir
    $Entry.lastUpdated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $Installed | ConvertTo-Json -Depth 10 | Set-Content $InstalledJson -Encoding UTF8
}

Write-Host ""
Write-Host "  done -- restart Claude Code to load changes" -ForegroundColor Green
