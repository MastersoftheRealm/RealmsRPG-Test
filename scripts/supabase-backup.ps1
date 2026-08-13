# Full Supabase Postgres backup (roles, schema, data) to backups/supabase-<timestamp>/
# Requires DATABASE_URL in .env.local or .env. Prefer DIRECT_URL for pg_dump when set.
# Does not backup Storage buckets — run `npm run storage:backup` for those.
#
# Exit codes: 0 only when all three dumps exist, are non-trivially sized and contain the
# expected SQL markers. Any other outcome exits 1, prints FAILURE, and renames the output
# directory to <name>-FAILED so a partial dump can never be mistaken for a backup.
# Tool-probe output (Supabase CLI needs Docker; pg_dump does not) is captured to
# backups/<name>/backup.log instead of the console, and the path actually used is reported.

$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

# Minimum plausible size + required marker per file. A dump that errored mid-stream still
# writes the pg_dump preamble, so size alone is not enough.
$ExpectedOutputs = @(
  @{ Name = 'roles.sql'; MinBytes = 1KB; Marker = 'CREATE ROLE|ALTER ROLE' }
  @{ Name = 'schema.sql'; MinBytes = 32KB; Marker = 'CREATE TABLE' }
  @{ Name = 'data.sql'; MinBytes = 16KB; Marker = 'COPY |INSERT INTO' }
)

$script:LogPath = $null

function Write-Log {
  param([string]$Text)
  if ($script:LogPath) { Add-Content -LiteralPath $script:LogPath -Value $Text }
}

function Stop-WithFailure {
  param([string]$Message, [string]$OutputDir)

  Write-Host ''
  if ($OutputDir -and (Test-Path -LiteralPath $OutputDir)) {
    $failedDir = "$OutputDir-FAILED"
    if (Test-Path -LiteralPath $failedDir) { Remove-Item -LiteralPath $failedDir -Recurse -Force }
    Rename-Item -LiteralPath $OutputDir -NewName (Split-Path -Leaf $failedDir)
    Write-Host "FAILURE: $Message"
    Write-Host "Partial output quarantined at: $failedDir (see backup.log)"
  } else {
    Write-Host "FAILURE: $Message"
  }
  exit 1
}

function Get-EnvFilePath {
  foreach ($name in @('.env.local', '.env')) {
    $path = Join-Path (Get-Location) $name
    if (Test-Path $path) { return $path }
  }
  return $null
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

# Runs a native tool without letting its stderr surface as a PowerShell NativeCommandError.
# Output goes to backup.log; the caller decides what (if anything) the user sees.
function Invoke-DumpTool {
  param([string]$Exe, [string[]]$DumpArgs, [string]$Label)

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    Write-Log "--- $Label"
    Write-Log "$Exe $($DumpArgs -join ' ')"
    $output = (& $Exe @DumpArgs 2>&1 | Out-String)
    $code = $LASTEXITCODE
    if ($output) { Write-Log $output.TrimEnd() }
    Write-Log "exit code: $code"
    return $code
  } catch {
    Write-Log "exception: $($_.Exception.Message)"
    return 1
  } finally {
    $ErrorActionPreference = $prevEap
  }
}

function Invoke-SupabaseDump {
  param([string]$Exe, [string]$DbUrl, [string]$OutputDir)

  $steps = @(
    @('db', 'dump', '--db-url', $DbUrl, '-f', (Join-Path $OutputDir 'roles.sql'), '--role-only')
    @('db', 'dump', '--db-url', $DbUrl, '-f', (Join-Path $OutputDir 'schema.sql'))
    @('db', 'dump', '--db-url', $DbUrl, '-f', (Join-Path $OutputDir 'data.sql'), '--use-copy', '--data-only',
      '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes')
  )

  foreach ($step in $steps) {
    if ((Invoke-DumpTool -Exe $Exe -DumpArgs $step -Label 'supabase db dump') -ne 0) { return $false }
  }
  return $true
}

function Invoke-PgDumpFallback {
  param([hashtable]$Tools, [string]$DbUrl, [string]$DirectUrl, [string]$OutputDir)

  $q = $DbUrl.IndexOf('?')
  $poolerUrl = if ($q -gt 0) { $DbUrl.Substring(0, $q) } else { $DbUrl }

  $candidates = @()
  if ($DirectUrl) { $candidates += $DirectUrl }
  $candidates += $poolerUrl

  foreach ($dumpUrl in $candidates) {
    $steps = @(
      @{ Exe = $Tools.PgDumpAll; DumpArgs = @('--dbname', $dumpUrl, '--globals-only', '--file', (Join-Path $OutputDir 'roles.sql')) }
      @{ Exe = $Tools.PgDump; DumpArgs = @('--dbname', $dumpUrl, '--schema-only', '--no-owner', '--no-acl', '--file', (Join-Path $OutputDir 'schema.sql')) }
      @{ Exe = $Tools.PgDump; DumpArgs = @('--dbname', $dumpUrl, '--data-only', '--no-owner', '--no-acl', '--file', (Join-Path $OutputDir 'data.sql')) }
    )

    $ok = $true
    foreach ($step in $steps) {
      if ((Invoke-DumpTool -Exe $step.Exe -DumpArgs $step.DumpArgs -Label 'pg_dump') -ne 0) {
        $ok = $false
        break
      }
    }
    if ($ok) { return $true }
    Write-Host "pg_dump attempt failed for one connection string; trying the next."
  }

  return $false
}

function Test-DumpOutputs {
  param([string]$OutputDir)

  $problems = @()
  foreach ($expected in $ExpectedOutputs) {
    $path = Join-Path $OutputDir $expected.Name
    if (-not (Test-Path -LiteralPath $path)) {
      $problems += "$($expected.Name) was not written"
      continue
    }
    $size = (Get-Item -LiteralPath $path).Length
    if ($size -lt $expected.MinBytes) {
      $problems += "$($expected.Name) is only $size bytes (expected at least $($expected.MinBytes))"
      continue
    }
    if (-not (Select-String -LiteralPath $path -Pattern $expected.Marker -Quiet)) {
      $problems += "$($expected.Name) contains no /$($expected.Marker)/ — the dump is not usable"
    }
  }
  return $problems
}

$outRoot = Join-Path (Get-Location) 'backups'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $outRoot ("supabase-$timestamp")
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$script:LogPath = Join-Path $outDir 'backup.log'
Write-Log "Supabase backup started $(Get-Date -Format o)"

$envFile = Get-EnvFilePath
if (-not $envFile) {
  Stop-WithFailure -OutputDir $outDir -Message 'No .env.local or .env in project root. Add DATABASE_URL (and DIRECT_URL for dumps) — see .env.example.'
}
Write-Host "Using env file: $envFile"

$dbUrl = Get-EnvVarFromFile -FilePath $envFile -Name 'DATABASE_URL'
if (-not $dbUrl) {
  Stop-WithFailure -OutputDir $outDir -Message "DATABASE_URL not found in $envFile (see .env.example)."
}
$directUrl = Get-EnvVarFromFile -FilePath $envFile -Name 'DIRECT_URL'

$supabaseExe = Resolve-SupabaseExe
$pgTools = Resolve-PgDumpTools

$usedPath = $null
if ($supabaseExe) {
  Write-Host "Probing Supabase CLI (needs Docker): $supabaseExe"
  if (Invoke-SupabaseDump -Exe $supabaseExe -DbUrl $dbUrl -OutputDir $outDir) {
    $usedPath = "Supabase CLI ($supabaseExe)"
  } else {
    Write-Host 'Supabase CLI dump did not complete (Docker is usually the reason) — falling back to pg_dump. Details in backup.log.'
  }
} else {
  Write-Host 'Supabase CLI not installed (optional) — using pg_dump.'
}

if (-not $usedPath) {
  if (-not $pgTools) {
    Stop-WithFailure -OutputDir $outDir -Message @'
No usable dump tool. The Supabase CLI path failed (or is absent) and pg_dump is not installed.
Install PostgreSQL client tools, then re-run `npm run db:backup`:
  winget install PostgreSQL.PostgreSQL.17
  (or: scoop install postgresql — https://www.postgresql.org/download/windows/)
Ensure pg_dump and pg_dumpall are on PATH.
'@
  }

  Write-Host "Using pg_dump: $($pgTools.PgDump)"
  if (-not (Invoke-PgDumpFallback -Tools $pgTools -DbUrl $dbUrl -DirectUrl $directUrl -OutputDir $outDir)) {
    Stop-WithFailure -OutputDir $outDir -Message 'pg_dump failed for every connection string (try DIRECT_URL on port 5432). See backup.log.'
  }
  $usedPath = "pg_dump ($($pgTools.PgDump))"
}

$problems = Test-DumpOutputs -OutputDir $outDir
if ($problems.Count -gt 0) {
  Write-Log ("verification problems: " + ($problems -join '; '))
  Stop-WithFailure -OutputDir $outDir -Message ("dump verification failed — " + ($problems -join '; '))
}

Write-Host ''
Write-Host "Dump path used: $usedPath"
foreach ($expected in $ExpectedOutputs) {
  $file = Get-Item -LiteralPath (Join-Path $outDir $expected.Name)
  Write-Host ("  {0,-12} {1,10:N0} bytes" -f $file.Name, $file.Length)
}
Write-Host ''
Write-Host "SUCCESS: Supabase backup verified at $outDir"
Write-Log "Supabase backup succeeded via $usedPath"
exit 0
