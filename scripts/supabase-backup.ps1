# Full Supabase Postgres backup (roles, schema, data) to backups/supabase-<timestamp>/
# Requires DATABASE_URL in .env.local or .env. Prefer DIRECT_URL for pg_dump when set.
# Does not backup Storage buckets (portraits, profile-pictures).

$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

function Get-EnvFilePath {
  foreach ($name in @('.env.local', '.env')) {
    $path = Join-Path (Get-Location) $name
    if (Test-Path $path) { return $path }
  }
  throw 'No .env.local or .env found in project root. Add DATABASE_URL (and DIRECT_URL for dumps).'
}

function Get-EnvVarFromFile {
  param([string]$FilePath, [string]$Name)
  $line = (Select-String -Path $FilePath -Pattern "^${Name}=" | Select-Object -First 1).Line
  if (-not $line) { return $null }
  $value = $line.Substring($line.IndexOf('=') + 1).Trim().Trim('"').Trim("'")
  if ([string]::IsNullOrWhiteSpace($value)) { return $null }
  return $value
}

function Resolve-SupabaseExe {
  $candidates = @(
    (Join-Path $env:USERPROFILE 'scoop\shims\supabase.exe')
  )
  $cmd = Get-Command supabase -ErrorAction SilentlyContinue
  if ($cmd) { $candidates += $cmd.Source }

  foreach ($path in $candidates) {
    if ($path -and (Test-Path -LiteralPath $path)) { return $path }
  }
  return $null
}

function Resolve-PgDumpTools {
  $pgDump = $null
  $pgDumpAll = $null

  $cmdDump = Get-Command pg_dump -ErrorAction SilentlyContinue
  $cmdDumpAll = Get-Command pg_dumpall -ErrorAction SilentlyContinue
  if ($cmdDump -and $cmdDumpAll) {
    return @{ PgDump = $cmdDump.Source; PgDumpAll = $cmdDumpAll.Source }
  }

  $searchRoots = @(
    (Join-Path $env:USERPROFILE 'scoop\apps\postgresql\current\bin')
    'C:\Program Files\PostgreSQL'
  )

  foreach ($root in $searchRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }

    if ($root -like '*PostgreSQL') {
      $bins = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        ForEach-Object { Join-Path $_.FullName 'bin' }
    } else {
      $bins = @($root)
    }

    foreach ($bin in $bins) {
      $dump = Join-Path $bin 'pg_dump.exe'
      $dumpAll = Join-Path $bin 'pg_dumpall.exe'
      if ((Test-Path -LiteralPath $dump) -and (Test-Path -LiteralPath $dumpAll)) {
        return @{ PgDump = $dump; PgDumpAll = $dumpAll }
      }
    }
  }

  return $null
}

$outRoot = Join-Path (Get-Location) 'backups'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $outRoot ("supabase-$timestamp")
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$envFile = Get-EnvFilePath
Write-Host "Using env file: $envFile"

$dbUrl = Get-EnvVarFromFile -FilePath $envFile -Name 'DATABASE_URL'
if (-not $dbUrl) {
  throw 'DATABASE_URL not found in env file (see .env.example).'
}

$directUrl = Get-EnvVarFromFile -FilePath $envFile -Name 'DIRECT_URL'

$supabaseExe = Resolve-SupabaseExe
$pgTools = Resolve-PgDumpTools

function Invoke-SupabaseDump {
  param([string]$Exe, [string]$DbUrl, [string]$OutputDir)

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  try {
    & $Exe db dump --db-url $DbUrl -f (Join-Path $OutputDir 'roles.sql') --role-only 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { return $false }

    & $Exe db dump --db-url $DbUrl -f (Join-Path $OutputDir 'schema.sql') 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { return $false }

    & $Exe db dump --db-url $DbUrl -f (Join-Path $OutputDir 'data.sql') --use-copy --data-only `
      -x 'storage.buckets_vectors' -x 'storage.vector_indexes' 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { return $false }

    return $true
  } catch {
    Write-Warning "Supabase CLI dump error: $($_.Exception.Message)"
    return $false
  } finally {
    $ErrorActionPreference = $prevEap
  }
}

function Invoke-PgDumpFallback {
  param(
    [hashtable]$Tools,
    [string]$DbUrl,
    [string]$DirectUrl,
    [string]$OutputDir
  )

  $pgDump = $Tools.PgDump
  $pgDumpAll = $Tools.PgDumpAll

  $q = $DbUrl.IndexOf('?')
  $poolerUrl = if ($q -gt 0) { $DbUrl.Substring(0, $q) } else { $DbUrl }

  $candidates = @()
  if ($DirectUrl) { $candidates += $DirectUrl }
  $candidates += $poolerUrl

  foreach ($dumpUrl in $candidates) {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
      & $pgDumpAll --dbname $dumpUrl --globals-only --file (Join-Path $OutputDir 'roles.sql') 2>&1 | Out-Host
      if ($LASTEXITCODE -ne 0) { throw 'pg_dumpall failed' }

      & $pgDump --dbname $dumpUrl --schema-only --no-owner --no-acl --file (Join-Path $OutputDir 'schema.sql') 2>&1 | Out-Host
      if ($LASTEXITCODE -ne 0) { throw 'pg_dump schema failed' }

      & $pgDump --dbname $dumpUrl --data-only --no-owner --no-acl --file (Join-Path $OutputDir 'data.sql') 2>&1 | Out-Host
      if ($LASTEXITCODE -ne 0) { throw 'pg_dump data failed' }

      return
    } catch {
      Write-Warning "pg_dump attempt failed. Trying next connection string. Error: $($_.Exception.Message)"
    } finally {
      $ErrorActionPreference = $prevEap
    }
  }

  throw 'pg_dump failed for all connection strings (try DIRECT_URL on port 5432).'
}

$usedSupabase = $false
if ($supabaseExe) {
  Write-Host "Trying Supabase CLI: $supabaseExe"
  $usedSupabase = Invoke-SupabaseDump -Exe $supabaseExe -DbUrl $dbUrl -OutputDir $outDir
}

if (-not $usedSupabase) {
  if (-not $supabaseExe) {
    Write-Host 'Supabase CLI not installed (optional). Using pg_dump.'
  } else {
    Write-Warning 'Supabase CLI dump failed (Docker may be required). Falling back to pg_dump.'
  }

  if (-not $pgTools) {
    throw @"
pg_dump not found. Install PostgreSQL client tools, then re-run:
  winget install PostgreSQL.PostgreSQL.17
Or: https://www.postgresql.org/download/windows/
Ensure pg_dump is on PATH, or install via Scoop: scoop install postgresql
"@
  }

  Write-Host "Using pg_dump: $($pgTools.PgDump)"
  Invoke-PgDumpFallback -Tools $pgTools -DbUrl $dbUrl -DirectUrl $directUrl -OutputDir $outDir
}

Write-Output "Backup complete: $outDir"
