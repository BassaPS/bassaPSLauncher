param([switch]$RunUiTests)
$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location $repoRoot
try {
    $versionMatch = [regex]::Match((Get-Content 'pkg/constant/constant.go' -Raw), 'const CurrentLauncherVersion = "([^"]+)"')
    if (-not $versionMatch.Success) { throw 'Launcher version not found' }
    $version = $versionMatch.Groups[1].Value
    $releaseRoot = Join-Path $repoRoot 'bin/release'
    New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
    $stage = Join-Path $releaseRoot ('.staging-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $stage -Force | Out-Null

    npm.cmd ci --prefix frontend
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency install failed' }
    npm.cmd run lint --prefix frontend
    if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
    npm.cmd run build --prefix frontend
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build/type check failed' }
    if ($RunUiTests) {
        npm.cmd run test:ui --prefix frontend
        if ($LASTEXITCODE -ne 0) { throw 'UI tests failed' }
    }
    go test ./...
    if ($LASTEXITCODE -ne 0) { throw 'Go tests failed' }

    $wailsMatch = [regex]::Match((Get-Content 'go.mod' -Raw), 'github.com/wailsapp/wails/v3\s+(\S+)')
    if (-not $wailsMatch.Success) { throw 'Pinned Wails version not found' }
    $wailsCommand = 'github.com/wailsapp/wails/v3/cmd/wails3@' + $wailsMatch.Groups[1].Value
    go run $wailsCommand generate syso -arch amd64 -icon build/windows/icon.ico -manifest build/windows/wails.exe.manifest -info build/windows/info.json -out wails_windows_amd64.syso
    if ($LASTEXITCODE -ne 0) { throw 'Windows resource generation failed' }
    try {
        $previousGOOS = $env:GOOS; $previousGOARCH = $env:GOARCH; $previousCGO = $env:CGO_ENABLED
        $env:GOOS = 'windows'; $env:GOARCH = 'amd64'; $env:CGO_ENABLED = '0'
        go build -tags production -trimpath -buildvcs=false -ldflags '-w -s -H windowsgui' -o bin/BASSAPSLauncher.exe .
        if ($LASTEXITCODE -ne 0) { throw 'Windows production build failed' }
    } finally {
        $env:GOOS = $previousGOOS; $env:GOARCH = $previousGOARCH; $env:CGO_ENABLED = $previousCGO
        Remove-Item -LiteralPath 'wails_windows_amd64.syso' -ErrorAction SilentlyContinue
    }
    node scripts/verify-windows-build.mjs bin/BASSAPSLauncher.exe
    if ($LASTEXITCODE -ne 0) { throw 'Embedded administrator manifest check failed' }

    Copy-Item -LiteralPath 'bin/BASSAPSLauncher.exe', 'LICENSE' -Destination $stage
    New-Item -ItemType Directory -Path (Join-Path $stage 'licenses') -Force | Out-Null
    Copy-Item -LiteralPath 'frontend/public/licenses/MagicUI.txt', 'frontend/public/licenses/ObsidianUI.txt' -Destination (Join-Path $stage 'licenses')
    Copy-Item -LiteralPath 'docs/release-readme.txt' -Destination (Join-Path $stage 'README.txt')
    $commit = git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Could not identify build commit' }
    $dirty = [bool](git status --porcelain --untracked-files=normal)
    @("BASSAPS Launcher $version", 'Platform: windows-x64', "Commit: $commit", "Working tree modified: $dirty") | Set-Content (Join-Path $stage 'BUILD-INFO.txt') -Encoding utf8

    $zipName = "BASSAPSLauncher-$version-windows-x64.zip"
    $zipPath = Join-Path $releaseRoot $zipName
    Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -Force
    Copy-Item -LiteralPath 'bin/BASSAPSLauncher.exe' -Destination (Join-Path $releaseRoot 'BASSAPSLauncher.exe')
    Copy-Item -LiteralPath 'docs/release-notes.md' -Destination (Join-Path $releaseRoot 'RELEASE_NOTES.md')
    $sums = foreach ($name in @($zipName, 'BASSAPSLauncher.exe')) {
        $hash = (Get-FileHash -LiteralPath (Join-Path $releaseRoot $name) -Algorithm SHA256).Hash.ToLowerInvariant()
        "$hash  $name"
    }
    [IO.File]::WriteAllLines((Join-Path $releaseRoot 'SHA256SUMS.txt'), [string[]]$sums, [Text.UTF8Encoding]::new($false))

    # Only this invocation's verified staging directory may be removed.
    $resolvedStage = (Resolve-Path -LiteralPath $stage).Path
    if (-not $resolvedStage.StartsWith($releaseRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or -not ([IO.Path]::GetFileName($resolvedStage)).StartsWith('.staging-')) { throw 'Invalid release staging path' }
    Remove-Item -LiteralPath $resolvedStage -Recurse -Force
    Write-Host "Release assets: $releaseRoot"
    Get-ChildItem -LiteralPath $releaseRoot -File | Select-Object Name, Length
} finally { Pop-Location }
