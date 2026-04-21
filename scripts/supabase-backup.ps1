$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

$outRoot = Join-Path (Get-Location) 'backups'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $outRoot ("supabase-$timestamp")
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$envFile = Join-Path (Get-Location) '.env'
if (-not (Test-Path $envFile)) {
  throw ".env not found at $envFile"
}

$dbLine = (Select-String -Path $envFile -Pattern '^DATABASE_URL=' | Select-Object -First 1).Line
if (-not $dbLine) {
  throw 'DATABASE_URL not found in .env'
}

$dbUrl = $dbLine.Substring($dbLine.IndexOf('=') + 1).Trim().Trim('"')
if (-not $dbUrl) {
  throw 'DATABASE_URL value was empty'
}

$directLine = (Select-String -Path $envFile -Pattern '^DIRECT_URL=' | Select-Object -First 1).Line
$directUrl = $null
if ($directLine) {
  $directUrl = $directLine.Substring($directLine.IndexOf('=') + 1).Trim().Trim('"')
}

$supabaseExe = Join-Path $env:USERPROFILE 'scoop\shims\supabase.exe'
if (-not (Test-Path $supabaseExe)) {
  $supabaseExe = 'supabase'
}

function Invoke-SupabaseDump {
  & $supabaseExe db dump --db-url $dbUrl -f (Join-Path $outDir 'roles.sql') --role-only
  if ($LASTEXITCODE -ne 0) { return $false }

  & $supabaseExe db dump --db-url $dbUrl -f (Join-Path $outDir 'schema.sql')
  if ($LASTEXITCODE -ne 0) { return $false }

  & $supabaseExe db dump --db-url $dbUrl -f (Join-Path $outDir 'data.sql') --use-copy --data-only -x 'storage.buckets_vectors' -x 'storage.vector_indexes'
  if ($LASTEXITCODE -ne 0) { return $false }

  return $true
}

function Invoke-PgDumpFallback {
  $pgBin = Join-Path $env:USERPROFILE 'scoop\apps\postgresql\current\bin'
  $pgDumpAll = Join-Path $pgBin 'pg_dumpall.exe'
  $pgDump = Join-Path $pgBin 'pg_dump.exe'

  if (-not (Test-Path $pgDumpAll) -or -not (Test-Path $pgDump)) {
    throw "Neither Docker nor pg_dump tools are available. Install Docker Desktop or install Postgres (pg_dump) and re-run."
  }

  $q = $dbUrl.IndexOf('?')
  $poolerUrl = if ($q -gt 0) { $dbUrl.Substring(0, $q) } else { $dbUrl }

  $candidates = @()
  if ($directUrl) { $candidates += $directUrl }
  $candidates += $poolerUrl

  foreach ($dumpUrl in $candidates) {
    try {
      & $pgDumpAll --dbname $dumpUrl --globals-only --file (Join-Path $outDir 'roles.sql')
      if ($LASTEXITCODE -ne 0) { throw 'pg_dumpall failed' }

      & $pgDump --dbname $dumpUrl --schema-only --no-owner --no-acl --file (Join-Path $outDir 'schema.sql')
      if ($LASTEXITCODE -ne 0) { throw 'pg_dump schema failed' }

      & $pgDump --dbname $dumpUrl --data-only --no-owner --no-acl --file (Join-Path $outDir 'data.sql')
      if ($LASTEXITCODE -ne 0) { throw 'pg_dump data failed' }

      return
    } catch {
      Write-Warning "pg_dump attempt failed for host in connection string. Trying next candidate. Error: $($_.Exception.Message)"
    }
  }

  throw 'pg_dump fallback failed for all connection strings'
}

$ok = Invoke-SupabaseDump
if (-not $ok) {
  Write-Warning 'Supabase CLI dump failed (often due to Docker not running). Falling back to pg_dump.'
  Invoke-PgDumpFallback
}

Write-Output "Backup complete: $outDir"
