# Update Admin SDK Secrets in Google Cloud Secret Manager
#
# Usage:
#   1. Save your service account JSON to a temp file (e.g. %TEMP%\sa-key.json)
#   2. Run: gcloud auth login   (if not already logged in)
#   3. Run: .\scripts\update-admin-secrets.ps1 -KeyPath "C:\path\to\sa-key.json"
#
# After running, delete the JSON file. Then run: firebase deploy

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyPath
)

$project = "realmsrpg-test"

if (-not (Test-Path $KeyPath)) {
    Write-Error "Key file not found: $KeyPath"
    exit 1
}

Write-Host "Reading service account key from: $KeyPath" -ForegroundColor Cyan
$key = Get-Content $KeyPath -Raw | ConvertFrom-Json

$email = $key.client_email
if (-not $email) {
    Write-Error "Missing client_email in JSON"
    exit 1
}

# Private key: store with literal \n (backslash + n) per archived_docs/DEPLOYMENT_SECRETS_FIREBASE.md
$privateKey = $key.private_key -replace "`r?`n", "\n"

Write-Host "Updating secrets for: $email" -ForegroundColor Cyan

# SERVICE_ACCOUNT_EMAIL
Write-Host "`n1. Updating SERVICE_ACCOUNT_EMAIL..." -ForegroundColor Yellow
$email | gcloud secrets versions add SERVICE_ACCOUNT_EMAIL --data-file=- --project=$project 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Creating SERVICE_ACCOUNT_EMAIL secret..." -ForegroundColor Yellow
    gcloud secrets create SERVICE_ACCOUNT_EMAIL --replication-policy=automatic --project=$project 2>$null
    $email | gcloud secrets versions add SERVICE_ACCOUNT_EMAIL --data-file=- --project=$project
}
Write-Host "   Done." -ForegroundColor Green

# SERVICE_ACCOUNT_PRIVATE_KEY
Write-Host "`n2. Updating SERVICE_ACCOUNT_PRIVATE_KEY..." -ForegroundColor Yellow
$tempFile = [System.IO.Path]::GetTempFileName()
try {
    $privateKey | Set-Content -Path $tempFile -NoNewline
    gcloud secrets versions add SERVICE_ACCOUNT_PRIVATE_KEY --data-file=$tempFile --project=$project 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Creating SERVICE_ACCOUNT_PRIVATE_KEY secret..." -ForegroundColor Yellow
        gcloud secrets create SERVICE_ACCOUNT_PRIVATE_KEY --replication-policy=automatic --project=$project 2>$null
        gcloud secrets versions add SERVICE_ACCOUNT_PRIVATE_KEY --data-file=$tempFile --project=$project
    }
    Write-Host "   Done." -ForegroundColor Green
} finally {
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

Write-Host "`nSecrets updated successfully." -ForegroundColor Green
Write-Host "Run: firebase deploy" -ForegroundColor Cyan
Write-Host "Then delete your key file: $KeyPath" -ForegroundColor Yellow
